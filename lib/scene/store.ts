import { Rng } from "@/lib/prng";
import { usd } from "@/lib/format";
import {
  AGENT_ALIASES,
  DROP_ALIASES,
  HANDLE_WORDS,
  pickCountry,
  pickName,
} from "@/lib/fixtures/pools";
import type { LiveBus } from "@/lib/live/bus";
import type { FeedItem, SceneEventKind } from "./events";

/** Условное «время сцены» на старте: 16:42. Часы в шапке тикают от него. */
export const SCENE_START_MINUTES = 16 * 60 + 42;

/** Один тик = 250 мс. Достаточно плавно для счётчиков, дёшево для 10 машин. */
export const TICK_MS = 250;

export type SceneState = {
  seat: number;
  /** Тики по 250 мс с начала дубля */
  tick: number;
  /** Целые секунды — для таймеров и часов */
  second: number;
  frozen: boolean;
  alarm: boolean;
  /** Растёт при сбросе: компоненты с key={epoch} перемонтируются */
  epoch: number;
  feed: FeedItem[];
  /** Счётчики-сигналы: растут при событии, компоненты реагируют на изменение */
  sigDeposit: number;
  sigWhale: number;
  sigLost: number;
  sigCall: number;
  /** Клиент звонит сам: у чатера модалка входящего вызова до разговора */
  sigRing: number;
  sigWithdraw: number;
  /** Экран дроповода: сгоревшая карта и ушедший залив */
  sigDropBurn: number;
  sigPayout: number;
  /** Экран чатера: жертва открыла ссылку и забаненная личина */
  sigLink: number;
  sigBan: number;
  /** Последний зачисленный депозит — для вспышек и всплывающих плашек */
  lastAmount: number;
  lastName: string;
  lastFlag: string;
  /** Идёт ли разговор и с какого тика */
  callActive: boolean;
  callStartTick: number;
  /** Накопленная выручка смены — общая для всех виджетов */
  revenue: number;
};

function initialState(seat: number): SceneState {
  const rng = new Rng(`revenue-${seat}`);
  return {
    seat,
    tick: 0,
    second: 0,
    frozen: false,
    alarm: false,
    epoch: 0,
    feed: [],
    sigDeposit: 0,
    sigWhale: 0,
    sigLost: 0,
    sigCall: 0,
    sigRing: 0,
    sigWithdraw: 0,
    sigDropBurn: 0,
    sigPayout: 0,
    sigLink: 0,
    sigBan: 0,
    lastAmount: 0,
    lastName: "",
    lastFlag: "",
    callActive: true,
    callStartTick: -rng.int(200, 1400) * 4,
    revenue: 184_320,
  };
}

export class SceneStore {
  state: SceneState;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private bus: LiveBus | null = null;
  private unsubscribe: (() => void) | null = null;
  private feedId = 1;
  private readonly seat: number;

  constructor(seat: number) {
    this.seat = seat;
    this.state = initialState(seat);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SceneState => this.state;

  private emit() {
    for (const l of this.listeners) l();
  }

  private set(patch: Partial<SceneState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  /**
   * Запускает часы сцены и автогенерацию ленты событий.
   *
   * Шина — общая с живым чатом (lib/live/bus.ts): раньше события ходили по
   * отдельному BroadcastChannel и не выходили за пределы машины. Теперь
   * Ctrl+Alt+R на машине чатера сбрасывает и телефон жертвы на соседней —
   * без этого дубли не склеятся.
   *
   * Тики при этом по-прежнему у каждой вкладки свои: синхронизировать часы
   * незачем, а трафик четыре раза в секунду на десять машин — незачем тем более.
   */
  start(bus: LiveBus | null) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.state.frozen) return;
      const tick = this.state.tick + 1;
      const second = Math.floor(tick / (1000 / TICK_MS));
      const crossedSecond = second !== this.state.second;
      this.set({ tick, second });
      if (crossedSecond) this.autoFeed(second);
    }, TICK_MS);

    this.bus = bus;
    this.unsubscribe =
      bus?.subscribe((msg, meta) => {
        // Своё эхо уже применено в dispatch — второй раз событие не играем
        if (msg.t !== "scene" || meta.own) return;
        this.apply(msg.kind);
      }) ?? null;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.bus = null;
  }

  /** Событие от режиссёра: применяем локально и рассылаем на другие экраны */
  dispatch(kind: SceneEventKind) {
    this.apply(kind);
    this.bus?.send({ t: "scene", kind });
  }

  private apply(kind: SceneEventKind) {
    const rng = new Rng(`evt-${this.seat}-${kind}-${this.state.tick}`);
    const country = pickCountry(rng);
    const name = pickName(rng, country);

    switch (kind) {
      case "call.incoming":
        this.set({
          callActive: true,
          callStartTick: this.state.tick,
          sigCall: this.state.sigCall + 1,
          lastName: name,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "call",
          text: `Входящий · ${country.ru}`,
        });
        break;

      // Клиент звонит сам: трубку ещё не подняли — экран чатера покажет
      // модалку входящего, а разговор начнётся только с «Принять вызов».
      // Тик вызова кладём в тот же callStartTick, что и у прочих звонков:
      // экрану не нужно подписываться на тик, чтобы поймать начало
      case "call.ringing":
        this.set({
          callStartTick: this.state.tick,
          sigRing: this.state.sigRing + 1,
          lastName: name,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "call",
          text: `Входящий вызов · ${country.ru} · ждёт ответа`,
        });
        break;

      case "deposit": {
        const amount = rng.money(1_500, 9_800);
        this.set({
          sigDeposit: this.state.sigDeposit + 1,
          lastAmount: amount,
          lastName: name,
          lastFlag: country.flag,
          revenue: this.state.revenue + amount,
        });
        this.pushFeed({
          kind: "deposit",
          amount,
          text: `депозит ${usd(amount)}`,
        });
        break;
      }

      case "whale": {
        const amount = rng.money(48_000, 190_000);
        this.set({
          sigWhale: this.state.sigWhale + 1,
          lastAmount: amount,
          lastName: name,
          lastFlag: country.flag,
          revenue: this.state.revenue + amount,
        });
        this.pushFeed({
          kind: "deposit",
          amount,
          text: `КИТ · ${usd(amount)}`,
        });
        break;
      }

      case "client.lost":
        this.set({
          sigLost: this.state.sigLost + 1,
          callActive: false,
          lastName: name,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "lost",
          text: `СОРВАЛСЯ · звонок прерван`,
        });
        break;

      case "withdraw.request": {
        const amount = rng.money(3_000, 42_000);
        this.set({
          sigWithdraw: this.state.sigWithdraw + 1,
          lastAmount: amount,
          lastName: name,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "withdraw",
          amount,
          text: `заявка на вывод ${usd(amount)} · ЗАБЛОКИРОВАНО`,
        });
        break;
      }

      case "drop.burned": {
        const alias = rng.pick(DROP_ALIASES);
        const amount = rng.money(1_200, 9_400);
        this.set({
          sigDropBurn: this.state.sigDropBurn + 1,
          lastAmount: amount,
          lastName: alias,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "burn",
          amount,
          text: `ДРОП «${alias}» · КАРТА ЗАБЛОКИРОВАНА · залив ${usd(amount)} завис`,
        });
        break;
      }

      case "payout.sent": {
        const alias = rng.pick(DROP_ALIASES);
        const amount = rng.money(2_400, 13_800);
        this.set({
          sigPayout: this.state.sigPayout + 1,
          lastAmount: amount,
          lastName: alias,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "payout",
          amount,
          text: `ЗАЛИВ ${usd(amount)} · «${alias}» → обменник → касса · ЗАКРЫТ`,
        });
        break;
      }

      case "link.opened": {
        // Жертва перешла по ссылке и ввела карту — деньги списываются сразу,
        // поэтому событие пополняет ту же общую выручку, что и депозит
        const amount = rng.money(180, 5_200);
        this.set({
          sigLink: this.state.sigLink + 1,
          lastAmount: amount,
          lastName: name,
          lastFlag: country.flag,
          revenue: this.state.revenue + amount,
        });
        this.pushFeed({
          kind: "link",
          amount,
          text: `ссылка открыта · карта введена · списано ${usd(amount)}`,
        });
        break;
      }

      case "account.banned": {
        const handle = `@${rng.pick(HANDLE_WORDS)}_${rng.int(70, 99)}`;
        this.set({
          sigBan: this.state.sigBan + 1,
          lastName: handle,
          lastFlag: country.flag,
        });
        this.pushFeed({
          kind: "ban",
          text: `АККАУНТ ${handle} · ЗАБЛОКИРОВАН · переписка оборвана`,
        });
        break;
      }

      case "alarm":
        this.set({ alarm: !this.state.alarm });
        if (!this.state.alarm) break;
        this.pushFeed({
          kind: "alarm",
          text: "ВНИМАНИЕ · ДОМЕН ЗАБЛОКИРОВАН · РАЗРЫВ СЕССИЙ",
        });
        break;

      case "freeze":
        this.set({ frozen: !this.state.frozen });
        break;

      case "reset":
        this.feedId = 1;
        this.state = { ...initialState(this.seat), epoch: this.state.epoch + 1 };
        this.emit();
        break;
    }
  }

  private pushFeed(item: Omit<FeedItem, "id" | "at">) {
    const next: FeedItem = { ...item, id: this.feedId++, at: this.state.tick };
    // Держим короткую ленту: длинная не читается в кадре и жрёт память в долгом дубле
    this.set({ feed: [next, ...this.state.feed].slice(0, 40) });
  }

  /** Фоновая жизнь ленты — без неё экран «стоит» между командами режиссёра */
  private autoFeed(second: number) {
    const rng = new Rng(`auto-${this.seat}-${second}`);
    if (!rng.chance(0.28)) return;

    const country = pickCountry(rng);
    const name = pickName(rng, country);
    const masked = `${name.split(" ")[0]} ${name.split(" ")[1][0]}.`;
    const agent = rng.pick(AGENT_ALIASES);

    const kind = rng.weighted<FeedItem["kind"]>([
      ["deposit", 30],
      ["call", 21],
      ["join", 16],
      ["upgrade", 10],
      ["link", 9],
      ["lost", 7],
      ["ban", 3],
      ["withdraw", 4],
    ]);

    switch (kind) {
      case "deposit": {
        const amount = rng.money(250, 6_400);
        this.set({ revenue: this.state.revenue + amount });
        this.pushFeed({
          kind,
          amount,
          text: `депозит ${usd(amount)} · ${agent}`,
        });
        break;
      }
      case "call":
        this.pushFeed({
          kind,
          text: `${agent} · дозвон ${country.ru} · ${rng.int(1, 9)} мин`,
        });
        break;
      case "join":
        this.pushFeed({
          kind,
          text: `новая регистрация · источник ADS-${rng.int(10, 99)}`,
        });
        break;
      case "upgrade":
        this.pushFeed({
          kind,
          text: `апгрейд до ${rng.pick(["SILVER", "GOLD", "PLATINUM"])}`,
        });
        break;
      case "lost":
        this.pushFeed({
          kind,
          text: `отказ · передан в RECOVERY`,
        });
        break;
      case "withdraw":
        this.pushFeed({
          kind,
          amount: rng.money(1_000, 18_000),
          text: ` запрос вывода · отклонён`,
        });
        break;
      case "link": {
        const amount = rng.money(120, 3_800);
        this.set({ revenue: this.state.revenue + amount });
        this.pushFeed({
          kind,
          amount,
          text: `переход по ссылке · списано ${usd(amount)}`,
        });
        break;
      }
      case "ban":
        this.pushFeed({
          kind,
          text: `@${rng.pick(HANDLE_WORDS)}_${rng.int(70, 99)} · аккаунт заблокирован · ${rng.int(2, 9)} диалогов потеряно`,
        });
        break;
    }
  }
}
