/**
 * Живая шина между экранами. Единственное место в проекте, где есть сеть.
 *
 * Работает сразу по двум каналам и склеивает их дедупликацией по id конверта:
 *
 *   BroadcastChannel — всегда. Вкладки и окна одной машины, работает и в
 *                      `npm run dev`, где никакого сервера с мостом нет.
 *   SSE + POST       — когда `npm start` отвечает на /live. Разные машины
 *                      съёмочной локалки.
 *
 * Если мост недоступен (dev-режим), EventSource это обнаруживает за пару
 * секунд, закрывается и больше не мешает: шина молча остаётся на вкладках.
 *
 * Офлайн не нарушен: /live — тот же процесс, что раздаёт страницы, и тот же
 * origin. Наружу не ходит ничего.
 */
import {
  LIVE_CHANNEL,
  LIVE_PATH,
  roomFor,
  type LiveEnvelope,
  type LiveMessage,
  type LiveStatus,
} from "./protocol";

/**
 * `own` — это эхо нашей же реплики, вернувшееся от сервера. Не дубль:
 * именно оно означает «сообщение дошло до журнала» и зажигает вторую галочку.
 */
export type LiveListener = (msg: LiveMessage, meta: { id: string; own: boolean }) => void;

/** Сколько id держим для отсечения дублей: две ленты по 100 реплик с запасом */
const SEEN_LIMIT = 300;

/**
 * Сколько раз EventSource может не открыться, прежде чем признаем, что моста
 * нет. Браузер ретраит примерно раз в 3 секунды — то есть решение принимается
 * за ~6 секунд, и на площадке это незаметно.
 */
const MAX_COLD_FAILURES = 2;

export class LiveBus {
  private readonly seat: number;
  private readonly sender: string;

  private listeners = new Set<LiveListener>();
  private statusListeners = new Set<(status: LiveStatus) => void>();

  private channel: BroadcastChannel | null = null;
  private source: EventSource | null = null;

  /** Кольцо просмотренных id: Set для проверки, массив — для вытеснения */
  private seen = new Set<string>();
  private seenOrder: string[] = [];

  /** id, отправленные нами: их эхо — подтверждение, а не новое сообщение */
  private mine = new Set<string>();

  private lastSeq = 0;
  private everOpened = false;
  private coldFailures = 0;
  private status: LiveStatus = "off";

  /**
   * Мост признан отсутствующим — POST-ы больше не шлём.
   * Отдельный флаг, а не проверка status === "net": первые доли секунды после
   * запуска поток ещё не открылся, но отправлять уже можно и нужно.
   */
  private netDown = false;

  /** Метка запуска вкладки: делает id уникальным между машинами без random */
  private stamp = 0;
  private counter = 0;
  private started = false;

  /** POST-ы идут цепочкой: так порядок в журнале совпадает с порядком отправки */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(seat: number, sender: string) {
    this.seat = seat;
    this.sender = sender;
  }

  /**
   * Идемпотентен и может быть вызван из send(): эффекты дочерних компонентов
   * в React выполняются раньше эффекта провайдера, поэтому первый focus от
   * экрана чатера успевает уйти до того, как провайдер поднимет шину.
   */
  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    // Date.now() — не случайность и не рендер: просто метка вкладки в id
    this.stamp = Date.now();

    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(LIVE_CHANNEL);
      this.channel.onmessage = (e: MessageEvent<LiveEnvelope>) => {
        this.receive(e.data);
      };
      this.setStatus("tabs");
    }

    this.openStream();
  }

  stop() {
    this.started = false;
    this.channel?.close();
    this.channel = null;
    this.source?.close();
    this.source = null;
    // Подписчиков не трогаем: каждый отписывается сам в своём useEffect.
    // Сбросить их здесь — значит осиротить экран после двойного монтирования
    // в StrictMode, где start/stop/start идут подряд.
  }

  subscribe = (listener: LiveListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  subscribeStatus = (listener: (status: LiveStatus) => void): (() => void) => {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  };

  getStatus = (): LiveStatus => this.status;

  /**
   * Отправить сообщение. Возвращает id — по нему отправитель узнаёт своё эхо
   * и помечает реплику доставленной.
   *
   * Локально сообщение не применяется: экран рисует свою реплику сам,
   * оптимистично, ещё до того как шина о ней узнала.
   */
  send(msg: LiveMessage): string {
    this.start();
    const id = `${this.sender}-${this.seat}-${this.stamp.toString(36)}-${++this.counter}`;
    const envelope: LiveEnvelope = { id, room: roomFor(msg, this.seat), msg };

    // Своё эхо помечаем заранее: ответ сервера может обогнать этот код
    this.mine.add(id);
    this.remember(id);

    this.channel?.postMessage(envelope);

    if (this.netDown) {
      // Моста нет — подтверждать доставку некому. Отвечаем себе сами, иначе
      // отправленная реплика навсегда осталась бы с одной серой галочкой,
      // хотя в соседней вкладке она уже лежит.
      queueMicrotask(() => this.receive(envelope));
    } else {
      this.post(envelope);
    }

    return id;
  }

  // --- сеть -----------------------------------------------------------------

  private openStream() {
    if (typeof EventSource === "undefined") return;

    // rooms: своё место + общая комната режиссёрских команд. Раньше события
    // сцены ходили по отдельному каналу без номера места — Ctrl+Alt+2 на
    // /chat/3 должен вспыхивать и на /wall, поэтому комнаты именно две.
    const url = `${LIVE_PATH}?rooms=scene,seat-${this.seat}&after=${this.lastSeq}`;
    const source = new EventSource(url);
    this.source = source;

    source.onopen = () => {
      this.everOpened = true;
      this.coldFailures = 0;
      this.netDown = false;
      this.setStatus("net");
    };

    source.onmessage = (e: MessageEvent<string>) => {
      let envelope: LiveEnvelope;
      try {
        envelope = JSON.parse(e.data) as LiveEnvelope;
      } catch {
        return; // мусор в потоке не должен ронять экран посреди дубля
      }
      if (typeof envelope.seq === "number") this.lastSeq = envelope.seq;
      this.receive(envelope);
    };

    source.onerror = () => {
      // Соединение уже работало — это обрыв, EventSource переподключится сам
      if (this.everOpened) return;

      this.coldFailures += 1;
      if (this.coldFailures < MAX_COLD_FAILURES) return;

      // Моста нет (скорее всего `npm run dev`): закрываемся и не шумим больше
      source.close();
      this.source = null;
      this.netDown = true;
      this.setStatus(this.channel ? "tabs" : "off");
    };
  }

  private post(envelope: LiveEnvelope) {
    this.queue = this.queue
      .then(() =>
        fetch(LIVE_PATH, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(envelope),
        }),
      )
      .then((res) => {
        // 404 в dev-режиме fetch не считает ошибкой — проверяем код сами,
        // иначе экран будет молча стучаться в несуществующий мост всю смену
        if (!res.ok) this.dropNet();
      })
      .catch(() => {
        // Сервер пропал посреди смены: остаёмся на вкладках, экран не падает
        this.dropNet();
      });
  }

  /** Мост отвалился: дальше живём на вкладках, пока поток не откроется снова */
  private dropNet() {
    this.netDown = true;
    this.setStatus(this.channel ? "tabs" : "off");
  }

  // --- приём ----------------------------------------------------------------

  private receive(envelope: LiveEnvelope) {
    if (!envelope || typeof envelope.id !== "string" || !envelope.msg) return;

    const own = this.mine.has(envelope.id);

    // Своё эхо от сервера — подтверждение доставки, его пропускаем дальше
    // ровно один раз; всё остальное, что уже видели, отбрасываем.
    if (this.seen.has(envelope.id) && !own) return;
    if (own) this.mine.delete(envelope.id);
    this.remember(envelope.id);

    for (const listener of this.listeners) {
      listener(envelope.msg, { id: envelope.id, own });
    }
  }

  private remember(id: string) {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > SEEN_LIMIT) {
      const dropped = this.seenOrder.shift();
      if (dropped) this.seen.delete(dropped);
    }
  }

  private setStatus(status: LiveStatus) {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}
