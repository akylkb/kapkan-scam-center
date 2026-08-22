import { Rng } from "@/lib/prng";
import { BRAND } from "@/lib/brand";
import { maskWallet } from "@/lib/format";
import type { Drop } from "./drops";
import {
  AGENT_ALIASES,
  EXCHANGERS,
  PAYOUT_METHODS,
  pickCountry,
  pickName,
} from "./pools";

/**
 * Залив — путь одной суммы от жертвы до наличных.
 *
 * Строки очереди не хранят состояние: стадия считается чистой функцией от
 * тика сцены (см. payoutStateAt). Поэтому очередь «живёт» в кадре, но дубль 1
 * и дубль 7 показывают ровно одно и то же, и компонент подписывается на тик
 * один раз, а не по разу на строку.
 */
export const PAYOUT_STAGES = [
  "СОЗДАН",
  "В БАНКЕ",
  "ПОДТВ. SMS",
  "ЗАЧИСЛЕНО",
  "СНЯТИЕ",
  "ЗАКРЫТ",
] as const;

export const LAST_STAGE = PAYOUT_STAGES.length - 1;

export type Payout = {
  id: string;
  amount: number;
  /** Жертва — уже в маскированном виде: «🇩🇪 Klaus B.» */
  victim: string;
  /** Оператор CRM, который выбил депозит */
  fromAgent: string;
  dropId: string;
  dropAlias: string;
  method: string;
  /** Тик сцены, на котором залив начался. Отрицательный — начался «до дубля» */
  startTick: number;
  /** Секунд на одну стадию */
  paceSec: number;
  /** Стадия, на которой залив срывается. null — пройдёт до конца */
  failAt: number | null;
};

export type PayoutState = {
  stage: number;
  label: string;
  /** Прогресс внутри текущей стадии, 0..1 */
  pct: number;
  failed: boolean;
  /** Секунд до следующей стадии */
  etaSec: number;
  done: boolean;
  /** Ещё не начался — строка ждёт своей очереди */
  pending: boolean;
};

/** Стадия залива на конкретном тике сцены. Чистая функция, без состояния. */
export function payoutStateAt(p: Payout, tick: number): PayoutState {
  const elapsed = (tick - p.startTick) / 4; // тик = 250 мс

  if (elapsed < 0) {
    return {
      stage: 0,
      label: "В ОЧЕРЕДИ",
      pct: 0,
      failed: false,
      etaSec: Math.ceil(-elapsed),
      done: false,
      pending: true,
    };
  }

  const raw = elapsed / p.paceSec;
  const stage = Math.min(LAST_STAGE, Math.floor(raw));
  const failed = p.failAt !== null && stage >= p.failAt;

  if (failed) {
    return {
      stage: p.failAt!,
      label: "ОТКАЗ",
      pct: 1,
      failed: true,
      etaSec: 0,
      done: true,
      pending: false,
    };
  }

  const done = stage >= LAST_STAGE;
  return {
    stage,
    label: PAYOUT_STAGES[stage],
    pct: done ? 1 : raw - stage,
    failed: false,
    etaSec: done ? 0 : Math.ceil((stage + 1 - raw) * p.paceSec),
    done,
    pending: false,
  };
}

/**
 * Очередь заливов.
 *
 * Стартовые тики намеренно разбросаны: часть заливов уже на середине пути,
 * часть ещё не началась. Очередь, где все строки в одной стадии, читается
 * в кадре как макет.
 */
export function makePayouts(rng: Rng, drops: Drop[], count: number): Payout[] {
  // Сгоревшие карты в очередь не ставим: на них уже никто не льёт
  const usable = drops.filter((d) => d.status !== "burned");
  const pool = usable.length > 0 ? usable : drops;

  return Array.from({ length: count }, (_, i) => {
    const drop = pool[rng.int(0, pool.length - 1)];
    const country = pickCountry(rng);
    const name = pickName(rng, country);
    const parts = name.split(" ");
    const paceSec = rng.int(18, 64);

    return {
      id: `PO-${38_000 + i * 11 + rng.int(1, 9)}`,
      amount: rng.money(1_200, 14_000),
      victim: `${country.flag} ${parts[0]} ${parts[1][0]}.`,
      fromAgent: rng.pick(AGENT_ALIASES),
      dropId: drop.id,
      dropAlias: drop.alias,
      method: rng.pick(PAYOUT_METHODS),
      // От «начался пять стадий назад» до «стартует через минуту»
      startTick: rng.int(-paceSec * 5, 60) * 4,
      paceSec,
      // Каждый пятый залив срывается — без отказов очередь выглядит стерильной
      failAt: rng.chance(0.22) ? rng.int(1, 4) : null,
    };
  });
}

/** Один шаг цепочки отмыва */
export type ChainHop = {
  kind: "victim" | "drop" | "exchange" | "wallet" | "cash";
  label: string;
  sub: string;
  amount: number;
  /** Комиссия, которая осталась на этом шаге, % */
  feePct: number;
};

/**
 * Цепочка отмыва одного залива: жертва → дроп → обменник → кошелёк → нал.
 *
 * Суммы по цепочке убывают на комиссиях. Это самая читаемая деталь
 * на крупном плане: зашло 840 000, до кассы дошло 690 000.
 */
export function makeChain(rng: Rng, payout: Payout, drop: Drop): ChainHop[] {
  const hops: ChainHop[] = [];
  let amount = payout.amount;

  hops.push({
    kind: "victim",
    label: payout.victim,
    sub: `${payout.method} · оператор ${payout.fromAgent}`,
    amount,
    feePct: 0,
  });

  amount = Math.round((amount * (1 - drop.feePct / 100)) / 10) * 10;
  hops.push({
    kind: "drop",
    label: `${drop.alias} · ${drop.id}`,
    sub: `${drop.bank} · ${drop.city} · ${drop.card}`,
    amount,
    feePct: drop.feePct,
  });

  const exFee = rng.int(3, 7);
  amount = Math.round((amount * (1 - exFee / 100)) / 10) * 10;
  hops.push({
    kind: "exchange",
    label: rng.pick(EXCHANGERS),
    sub: `обмен в USDT · спред ${rng.range(1.8, 4.2).toFixed(1)}%`,
    amount,
    feePct: exFee,
  });

  const netFee = rng.int(1, 3);
  amount = Math.round((amount * (1 - netFee / 100)) / 10) * 10;
  hops.push({
    kind: "wallet",
    label: `${BRAND.vault.name} · накопитель`,
    sub: maskWallet(
      rng.pick(["TQm4", "TXk9", "TB7r", "TNs2"]),
      rng.int(1000, 9999).toString(),
    ),
    amount,
    feePct: netFee,
  });

  const cashFee = rng.int(2, 5);
  amount = Math.round((amount * (1 - cashFee / 100)) / 10) * 10;
  hops.push({
    kind: "cash",
    label: `Касса · ${drop.city}`,
    sub: `${drop.courier} · выдача наличными`,
    amount,
    feePct: cashFee,
  });

  return hops;
}
