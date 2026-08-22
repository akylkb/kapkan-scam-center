import { Rng } from "@/lib/prng";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Свечи с заданным трендом.
 *
 * Для экрана жертвы нужен агрессивный, но не «нарисованный» рост:
 * с откатами и красными свечами, иначе график читается как фейк даже
 * неподготовленным зрителем.
 */
export function makeCandles(
  rng: Rng,
  opts: {
    count?: number;
    start?: number;
    /** Средний дрейф за свечу, в долях цены. 0.004 ≈ бодрый аптренд */
    drift?: number;
    volatility?: number;
    /** Секунд между свечами */
    step?: number;
    /** Отсечка «сейчас» — время последней свечи (unix, сек) */
    endTime?: number;
  } = {},
): Candle[] {
  const {
    count = 220,
    start = 100,
    drift = 0.0042,
    volatility = 0.011,
    step = 300,
    endTime = 1_760_000_000,
  } = opts;

  const out: Candle[] = [];
  let price = start;

  for (let i = 0; i < count; i++) {
    // Фаза отката: каждые ~30 свечей тренд ненадолго разворачивается.
    // Именно это делает график живым, а не «палкой вверх».
    const phase = Math.sin(i / 17) * 0.55 + Math.sin(i / 43) * 0.35;
    const localDrift = drift * (1 + phase);

    const open = price;
    const shock = (rng.float() - 0.5) * 2 * volatility;
    const close = open * (1 + localDrift + shock);
    const wick = volatility * (0.4 + rng.float() * 1.1);
    const high = Math.max(open, close) * (1 + wick * rng.float());
    const low = Math.min(open, close) * (1 - wick * rng.float());

    out.push({
      time: endTime - (count - 1 - i) * step,
      open: round4(open),
      high: round4(high),
      low: round4(low),
      close: round4(close),
    });
    price = close;
  }

  return out;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

export type Position = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  current: number;
  pnl: number;
  openedAgoMin: number;
};

/** Открытые позиции в терминале жертвы — почти все в плюсе, это часть обмана */
export function makePositions(
  rng: Rng,
  instruments: readonly { symbol: string; price: number; digits: number }[],
  count: number,
): Position[] {
  return rng.sample(instruments, Math.min(count, instruments.length)).map((ins, i) => {
    const side: "BUY" | "SELL" = rng.chance(0.82) ? "BUY" : "SELL";
    const winning = rng.chance(0.87);
    const move = rng.range(0.004, 0.058) * (winning ? 1 : -1) * (side === "BUY" ? 1 : -1);
    const openPrice = ins.price / (1 + move);
    const volume = Number(rng.range(0.2, 6).toFixed(2));
    return {
      id: `#${rng.int(4_000_000, 9_999_999)}`,
      symbol: ins.symbol,
      side,
      volume,
      openPrice: Number(openPrice.toFixed(ins.digits)),
      current: ins.price,
      // Прибыль считаем от процентного движения, а не от абсолютной разницы цен:
      // иначе позиция по биткоину даёт полмиллиона и ломает правдоподобие баланса
      pnl: Math.round(Math.abs(move) * (winning ? 1 : -1) * volume * 12_000),
      openedAgoMin: rng.int(12, 5000) + i,
    };
  });
}
