"use client";

import { useTick } from "@/lib/scene/SceneProvider";
import { cx } from "./ui";

/**
 * Лёгкий SVG-график для мелких мест (превью экрана жертвы, виджеты на стене).
 * Тяжёлую библиотеку графиков тянем только на большой терминал жертвы —
 * десять её экземпляров на слабой площадочной машине не нужны.
 */
export function Sparkline({
  values,
  className,
  stroke = "#34d399",
  fill = "rgba(52,211,153,0.12)",
  /** Сдвигать ли график во времени вместе с тиком сцены */
  live = true,
  height = 48,
}: {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: string;
  live?: boolean;
  height?: number;
}) {
  const tick = useTick();
  const shift = live ? Math.floor(tick / 8) % Math.max(1, values.length) : 0;
  const series = live ? [...values.slice(shift), ...values.slice(0, shift)] : values;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const w = 100;
  const step = w / Math.max(1, series.length - 1);

  const points = series.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cx("w-full", className)}
      style={{ height }}
    >
      <polygon points={`0,${height} ${points.join(" ")} ${w},${height}`} fill={fill} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Детерминированный ряд для спарклайна — без Math.random(), см. lib/prng */
export function trendSeries(seed: number, count = 60, drift = 0.9): number[] {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < count; i++) {
    const wave =
      Math.sin((i + seed) / 4.3) * 2.4 +
      Math.sin((i + seed) / 11.7) * 4.1 +
      Math.sin((i + seed) / 2.1) * 1.2;
    v += drift + wave * 0.35;
    out.push(v);
  }
  return out;
}
