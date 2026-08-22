import { Rng } from "@/lib/prng";
import { usd } from "@/lib/format";
import { AGENT_ALIASES, DROP_ALIASES, pickCountry, pickName } from "@/lib/fixtures/pools";
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
  sigWithdraw: number;
  /** Экран дроповода: сгоревшая карта и ушедший залив */
  sigDropBurn: number;
  sigPayout: number;
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
    sigWithdraw: 0,
    sigDropBurn: 0,
    sigPayout: 0,
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
  private channel: BroadcastChannel | null = null;
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

  /** Запускает часы сцены и автогенерацию ленты событий */
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.state.frozen) return;
      const tick = this.state.tick + 1;
      const second = Math.floor(tick / (1000 / TICK_MS));
      const crossedSecond = second !== this.state.second;
      this.set({ tick, second });
      if (crossedSecond) this.autoFeed(second);
    }, TICK_MS);

    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel("kapkan-scene");
      this.channel.onmessage = (e: MessageEvent<{ kind: SceneEventKind }>) => {
        this.apply(e.data.kind);
      };
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.channel?.close();
    this.channel = null;
  }

  /** Событие от режиссёра: применяем локально и рассылаем в другие вкладки */
  dispatch(kind: SceneEventKind) {
    this.apply(kind);
    this.channel?.postMessage({ kind });
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
          text: `Входящий · ${name} · ${country.ru}`,
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
          text: `${country.flag} ${name} · депозит ${usd(amount)}`,
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
          text: `КИТ · ${country.flag} ${name} · ${usd(amount)}`,
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
          text: `${country.flag} ${name} · СОРВАЛСЯ · звонок прерван`,
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
          text: `${country.flag} ${name} · заявка на вывод ${usd(amount)} · ЗАБЛОКИРОВАНО`,
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
      ["deposit", 34],
      ["call", 24],
      ["join", 18],
      ["upgrade", 12],
      ["lost", 8],
      ["withdraw", 4],
    ]);

    switch (kind) {
      case "deposit": {
        const amount = rng.money(250, 6_400);
        this.set({ revenue: this.state.revenue + amount });
        this.pushFeed({
          kind,
          amount,
          text: `${country.flag} ${masked} · депозит ${usd(amount)} · ${agent}`,
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
          text: `${country.flag} ${masked} · новая регистрация · источник ADS-${rng.int(10, 99)}`,
        });
        break;
      case "upgrade":
        this.pushFeed({
          kind,
          text: `${country.flag} ${masked} · апгрейд до ${rng.pick(["SILVER", "GOLD", "PLATINUM"])}`,
        });
        break;
      case "lost":
        this.pushFeed({
          kind,
          text: `${country.flag} ${masked} · отказ · передан в RECOVERY`,
        });
        break;
      case "withdraw":
        this.pushFeed({
          kind,
          amount: rng.money(1_000, 18_000),
          text: `${country.flag} ${masked} · запрос вывода · отклонён`,
        });
        break;
    }
  }
}
