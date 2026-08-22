/**
 * Детерминированный генератор случайных чисел.
 *
 * Зачем: на площадке 10 машин. Если контент генерировать через Math.random(),
 * то (а) экраны будут перерисовываться по-разному между дублями и монтаж не
 * склеится, (б) при SSR будет hydration mismatch.
 *
 * Здесь: один и тот же seed → всегда одна и та же последовательность.
 * Номер рабочего места (seat) входит в seed, поэтому каждая машина
 * показывает свои данные, но воспроизводит их одинаково в каждом дубле.
 */

/** mulberry32 — быстрый PRNG с равномерным распределением */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Строка → 32-битный seed (FNV-1a) */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Генератор с удобными хелперами поверх mulberry32 */
export class Rng {
  private next: () => number;

  constructor(seed: string | number) {
    this.next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);
  }

  /** [0, 1) */
  float(): number {
    return this.next();
  }

  /** [min, max) — вещественное */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** [min, max] — целое включительно */
  int(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  /** Случайный элемент массива */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** N различных элементов (без повторов) */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      out.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0]);
    }
    return out;
  }

  /** true с заданной вероятностью */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Взвешенный выбор: [[значение, вес], ...] */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return entries[entries.length - 1][0];
  }


  /**
   * Сумма, округлённая «как в жизни»: крупные — до сотен, мелкие — до десятков.
   * Ровные $2000 выглядят фальшиво, $2 480 — правдоподобно.
   */
  money(min: number, max: number): number {
    const raw = this.range(min, max);
    const step = raw > 50000 ? 500 : raw > 10000 ? 100 : raw > 1000 ? 20 : 5;
    return Math.round(raw / step) * step;
  }
}

/** Хелпер: создать генератор для конкретного места и подсистемы */
export function seatRng(seat: number, namespace: string): Rng {
  return new Rng(`seat-${seat}::${namespace}`);
}
