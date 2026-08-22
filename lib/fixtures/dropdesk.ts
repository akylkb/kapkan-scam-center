import { seatRng } from "@/lib/prng";
import { DROP_POOLS } from "@/lib/brand";
import { AGENT_ALIASES, AGENT_REAL, CASH_CITIES, COURIERS } from "./pools";
import { makeDrops, loadPct, type Drop } from "./drops";
import { makePayouts, type Payout } from "./payouts";

/** Точка снятия наличных на региональной карте */
export type CashPoint = {
  city: string;
  lon: number;
  lat: number;
  code: string;
  atms: number;
  withdrawnToday: number;
  limit: number;
  courier: string;
  status: "ok" | "wait" | "stop";
};

export type CashDesk = {
  points: CashPoint[];
  /** Наличные, лежащие в кассе прямо сейчас */
  balanceCash: number;
  /** В пути у курьеров */
  inTransit: number;
  /** Доля дропам, % */
  dropShare: number;
  /** Доля конторы, % */
  orgShare: number;
};

export type DropDesk = {
  seat: number;
  /** Позывной дроповода — под ним он в чатах */
  alias: string;
  real: string;
  pool: string;
  poolShort: string;
  terminal: string;
  drops: Drop[];
  payouts: Payout[];
  cash: CashDesk;
  /** План вывода за смену и факт */
  targetOut: number;
  doneOut: number;
};

/**
 * Всё содержимое рабочего места дроповода.
 *
 * Как и у оператора, содержимое завязано на ?seat=N: десять машин в зале
 * показывают разные пулы, банки и суммы, но каждая воспроизводит их
 * одинаково в каждом дубле.
 */
export function buildDropDesk(seat: number): DropDesk {
  const rng = seatRng(seat, "dropdesk");
  const pool = DROP_POOLS[(seat - 1) % DROP_POOLS.length];

  // 90 строк — реестр гарантированно уходит за нижний край экрана.
  // Наполовину пустая таблица в кадре сразу читается как макет.
  const drops = makeDrops(seatRng(seat, "drops"), 90);
  const payouts = makePayouts(seatRng(seat, "payouts"), drops, 22);

  const cashRng = seatRng(seat, "cash");
  const points: CashPoint[] = CASH_CITIES.map(([lon, lat, city, code]) => {
    const limit = cashRng.pick([40_000, 60_000, 90_000, 140_000]);
    return {
      city,
      lon,
      lat,
      code,
      atms: cashRng.int(2, 14),
      withdrawnToday: cashRng.money(limit * 0.15, limit * 0.98),
      limit,
      courier: cashRng.pick(COURIERS),
      status: cashRng.weighted<CashPoint["status"]>([
        ["ok", 62],
        ["wait", 26],
        ["stop", 12],
      ]),
    };
  });

  const dropShare = rng.int(7, 11);

  return {
    seat,
    alias: `КАССА-${String(seat).padStart(2, "0")}`,
    real: AGENT_REAL[(seat * 7 + 4) % AGENT_REAL.length],
    pool: pool.label,
    poolShort: pool.short,
    terminal: `TRM-${2000 + seat * 13}`,
    drops,
    payouts,
    cash: {
      points,
      balanceCash: rng.money(24_000, 98_000),
      inTransit: rng.money(8_000, 42_000),
      dropShare,
      orgShare: 100 - dropShare - rng.int(2, 6),
    },
    targetOut: rng.pick([280_000, 340_000, 420_000, 560_000]),
    doneOut: rng.money(90_000, 260_000),
  };
}

/**
 * Фильтры слева. Счётчики считаются из реальных статусов, а не выдуманы —
 * иначе на крупном плане цифра в фильтре не сойдётся с длиной таблицы.
 */
export function buildDropQueues(drops: Drop[]) {
  const by = (fn: (d: Drop) => boolean) => drops.filter(fn).length;
  return [
    { id: "all", label: "Все дропы", count: drops.length, tone: "text-zinc-400" },
    { id: "clean", label: "Чистые", count: by((d) => d.status === "clean"), tone: "text-emerald-300" },
    { id: "warm", label: "Прогрев", count: by((d) => d.status === "warm"), tone: "text-sky-300" },
    {
      id: "loaded",
      label: "Под нагрузкой",
      count: by((d) => d.status === "loaded"),
      tone: "text-amber-300",
    },
    {
      id: "frozen",
      label: "Заморожены",
      count: by((d) => d.status === "frozen"),
      tone: "text-fuchsia-300",
    },
    { id: "burned", label: "Сгоревшие", count: by((d) => d.status === "burned"), tone: "text-rose-400" },
    {
      id: "overload",
      label: "Лимит > 90%",
      count: by((d) => loadPct(d) > 90),
      tone: "text-amber-400",
    },
    { id: "offline", label: "Нет связи", count: by((d) => !d.online), tone: "text-zinc-500" },
  ] as const;
}

export type DropQueueId = ReturnType<typeof buildDropQueues>[number]["id"];

export function filterDrops(drops: Drop[], queue: DropQueueId): Drop[] {
  switch (queue) {
    case "all":
      return drops;
    case "overload":
      return drops.filter((d) => loadPct(d) > 90);
    case "offline":
      return drops.filter((d) => !d.online);
    default:
      return drops.filter((d) => d.status === queue);
  }
}
