import { Rng } from "@/lib/prng";
import { maskCard, maskPhone } from "@/lib/format";
import type { StatusMeta } from "./leads";
import {
  COURIERS,
  DROP_ALIASES,
  DROP_NOTES,
  pickLocalCountry,
  type Country,
} from "./pools";

/**
 * Дроп — подставное лицо, на карту которого заливают деньги жертвы.
 *
 * Статус дропа — главный источник напряжения на экране: «чист» и «прогрев»
 * ничего не значат, а «горит» и «сгорел» означают, что деньги застряли,
 * и по игре актёру есть на что реагировать.
 */
export type DropStatus = "clean" | "warm" | "loaded" | "frozen" | "burned";

/** Цвета из палитры CLAUDE.md: прибыль emerald, давление amber, отказ rose */
export const DROP_STATUS_META: Record<DropStatus, StatusMeta> = {
  clean: {
    label: "ЧИСТ",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  warm: {
    label: "ПРОГРЕВ",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  loaded: {
    label: "ПОД НАГРУЗКОЙ",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  frozen: {
    label: "ЗАМОРОЖЕН",
    text: "text-fuchsia-300",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    dot: "bg-fuchsia-400",
  },
  burned: {
    label: "СГОРЕЛ",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    dot: "bg-rose-500",
  },
};

/** Строка истории в карточке дропа */
export type DropOp = {
  id: string;
  agoMin: number;
  kind: "in" | "out" | "cash" | "reject" | "hold";
  amount: number;
  note: string;
};

export type Drop = {
  id: string;
  /** Кличка — единственное имя, которое видно в реестре */
  alias: string;
  initials: string;
  country: Country;
  city: string;
  bank: string;
  card: string;
  phone: string;
  status: DropStatus;
  /** Суточный лимит карты */
  limitDay: number;
  /** Залито сегодня — вместе с лимитом даёт полоску загрузки */
  loadedToday: number;
  /** Сколько минут держит деньги до снятия */
  holdMin: number;
  /** Процент дропа с залива */
  feePct: number;
  /** 0..100 — риск, что карта уйдёт под блокировку */
  risk: number;
  lastOpMin: number;
  online: boolean;
  courier: string;
  note: string;
  ops: DropOp[];
};

const OP_NOTES: Record<DropOp["kind"], readonly string[]> = {
  in: ["залив принят", "зачисление подтверждено", "перевод прошёл", "поступление · межбанк"],
  out: ["переведено дальше", "ушло на обменник", "вывод в крипту", "передано в кассу"],
  cash: ["снято в банкомате", "снятие в кассе отделения", "нал передан курьеру"],
  reject: ["отказ банка", "перевод отклонён", "лимит превышен", "запрос об источнике средств"],
  hold: ["удержание банком", "проверка службы безопасности", "деньги на удержании"],
};

function buildOps(rng: Rng, status: DropStatus, loadedToday: number): DropOp[] {
  const count = rng.int(4, 11);
  const ops: DropOp[] = [];
  let ago = rng.int(3, 40);

  for (let i = 0; i < count; i++) {
    // Первая строка сверху почти всегда «свежий залив» — карточка должна
    // читаться как работающая прямо сейчас, а не как архив
    const kind =
      i === 0 && status !== "burned"
        ? "in"
        : rng.weighted<DropOp["kind"]>([
            ["in", 34],
            ["out", 26],
            ["cash", 20],
            ["reject", 12],
            ["hold", 8],
          ]);

    ops.push({
      id: `OP-${rng.int(100000, 999999)}`,
      agoMin: ago,
      kind,
      amount: rng.money(400, Math.max(1_200, loadedToday * 0.7)),
      note: rng.pick(OP_NOTES[kind]),
    });
    ago += rng.int(18, 260);
  }

  // Сгоревшему дропу дописываем финальный отказ — иначе непонятно, почему сгорел
  if (status === "burned" || status === "frozen") {
    ops.unshift({
      id: `OP-${rng.int(100000, 999999)}`,
      agoMin: rng.int(1, 12),
      kind: "reject",
      amount: rng.money(800, 9_000),
      note: status === "burned" ? "карта заблокирована банком" : "операции приостановлены",
    });
  }

  return ops;
}

/**
 * Кличка для строки реестра.
 *
 * Кличек меньше, чем дропов, поэтому повторы неизбежны — но две одинаковые
 * «Фары» в одном списке на крупном плане читаются как баг. Со второго раза
 * добавляем номер, как в настоящих реестрах: «Фара-2».
 *
 * `offset` свой у каждого рабочего места: без него колонка кличек читалась бы
 * одинаково на всех десяти мониторах, даже когда банки и суммы разные.
 */
function pickAlias(index: number, offset: number): string {
  const base = DROP_ALIASES[(index + offset) % DROP_ALIASES.length];
  // Номер считается от позиции в реестре, а не от смещения: иначе на экране
  // появляется «Крот-2», у которого нигде нет первого «Крота»
  const round = Math.floor(index / DROP_ALIASES.length);
  return round === 0 ? base : `${base}-${round + 1}`;
}

/** Один дроп. `index` входит в id, чтобы реестры разных мест не совпадали. */
export function makeDrop(rng: Rng, index: number, aliasOffset = 0): Drop {
  const country = pickLocalCountry(rng);

  const status = rng.weighted<DropStatus>([
    ["clean", 26],
    ["warm", 18],
    ["loaded", 30],
    ["frozen", 12],
    ["burned", 14],
  ]);

  // Все экраны проекта считают в долларах — иначе связка «депозит у оператора
  // → залив у дроповода» не сходится по цифрам в одном монтажном стыке
  const limitDay = rng.pick([3_000, 5_000, 8_000, 12_000, 20_000]);

  // Загрузка зависит от статуса: под нагрузкой — почти под потолок,
  // и именно эти строки в кадре светятся тревожным янтарём
  const loadShare =
    status === "loaded"
      ? rng.range(0.82, 1.04)
      : status === "clean"
        ? rng.range(0.02, 0.22)
        : status === "warm"
          ? rng.range(0.18, 0.48)
          : status === "frozen"
            ? rng.range(0.55, 0.95)
            : rng.range(0.6, 1.0);

  const loadedToday = Math.round((limitDay * loadShare) / 10) * 10;

  const risk =
    status === "burned" ? rng.int(88, 100)
      : status === "frozen" ? rng.int(72, 94)
        : status === "loaded" ? rng.int(48, 82)
          : status === "warm" ? rng.int(18, 46)
            : rng.int(4, 24);

  return {
    id: `DR-${7000 + index * 3 + rng.int(1, 2)}`,
    alias: pickAlias(index, aliasOffset),
    initials: `${rng.pick(RU_LETTERS)}. ${rng.pick(RU_LETTERS)}.`,
    country,
    city: rng.pick(country.cities),
    bank: rng.pick(country.banks),
    card: maskCard(rng.int(1000, 9999).toString()),
    phone: maskPhone(country.cc, country.dial + rng.int(100000, 999999)),
    status,
    limitDay,
    loadedToday,
    holdMin: rng.weighted([
      [rng.int(15, 45), 45],
      [rng.int(45, 120), 35],
      [rng.int(120, 480), 20],
    ]),
    feePct: rng.int(6, 12),
    risk,
    lastOpMin: rng.weighted([
      [rng.int(1, 40), 50],
      [rng.int(40, 300), 35],
      [rng.int(300, 2600), 15],
    ]),
    online: rng.chance(status === "burned" || status === "frozen" ? 0.12 : 0.55),
    courier: rng.pick(COURIERS),
    note: rng.pick(DROP_NOTES),
    ops: buildOps(rng, status, loadedToday),
  };
}

const RU_LETTERS = [
  "А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "К", "Л",
  "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х",
] as const;

/** Реестр дропов одного рабочего места */
export function makeDrops(rng: Rng, count: number): Drop[] {
  // Смещение по списку кличек берётся один раз на весь реестр: внутри списка
  // клички остаются уникальными, но у каждого места свой порядок
  const aliasOffset = rng.int(0, DROP_ALIASES.length - 1);
  return Array.from({ length: count }, (_, i) => makeDrop(rng, i, aliasOffset));
}

/** Доля использованного лимита, 0..100 — для полоски загрузки */
export function loadPct(drop: Drop): number {
  return Math.min(100, Math.round((drop.loadedToday / drop.limitDay) * 100));
}
