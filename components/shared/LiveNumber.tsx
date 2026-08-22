"use client";

import { useTick } from "@/lib/scene/SceneProvider";
import { hashSeed } from "@/lib/prng";
import { cx } from "./ui";

/**
 * «Живые» числа на экранах.
 *
 * Значение выводится детерминированной функцией от тика сцены (сумма синусов),
 * а не из Math.random(). Так число непрерывно шевелится в кадре, но дубль 1
 * и дубль 7 показывают ровно одно и то же — иначе монтаж не склеить.
 */
export function drift(base: number, tick: number, amplitude: number, seed: string): number {
  const p = hashSeed(seed) % 1000;
  const t = tick / 4; // тик = 250 мс → t в секундах
  const wave =
    Math.sin((t + p) / 3.1) * 0.55 +
    Math.sin((t + p) / 7.7) * 0.3 +
    Math.sin((t + p) / 1.3) * 0.15;
  return base + wave * amplitude;
}

export function useDrift(base: number, amplitude: number, seed: string): number {
  return drift(base, useTick(), amplitude, seed);
}

/** Число, которое непрерывно колеблется вокруг базового значения */
export function DriftNumber({
  base,
  amplitude,
  seed,
  format,
  className,
}: {
  base: number;
  amplitude: number;
  seed: string;
  format: (v: number) => string;
  className?: string;
}) {
  const value = useDrift(base, amplitude, seed);
  return <span className={cx("tnum", className)}>{format(value)}</span>;
}

/** Монотонно растущий счётчик — «депозиты за смену» */
export function GrowingNumber({
  base,
  perSecond,
  seed,
  format,
  className,
}: {
  base: number;
  perSecond: number;
  seed: string;
  format: (v: number) => string;
  className?: string;
}) {
  const tick = useTick();
  const t = tick / 4;
  // Рост неравномерный: ступеньками, как реальные поступления
  const jitter = Math.sin((t + (hashSeed(seed) % 100)) / 2.6) * perSecond * 3;
  return (
    <span className={cx("tnum", className)}>{format(base + t * perSecond + jitter)}</span>
  );
}
