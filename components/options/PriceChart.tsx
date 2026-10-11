"use client";

import {
  OPTION_VOL,
  optionPrice,
  sceneClock,
  type OptionAsset,
  type OptionNudge,
} from "@/lib/fixtures/options";
import { useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";

/** Минута истории слева; запас справа — чтобы 30-секундная экспирация была видна сразу */
const WINDOW = 240;
const AHEAD = 124;
const W = 1000;
const H = 400;

export type ChartTrade = { dir: 1 | -1; t0: number; t1: number; entry: number };

/**
 * Тиковый график опционной платформы.
 *
 * Свой SVG, а не lightweight-charts: линия должна ехать вместе с тиком сцены
 * и слушаться подкрутки под сделку, а цена — быть чистой функцией от тика.
 * Подписи лежат HTML-слоем поверх: SVG растянут без сохранения пропорций,
 * и текст внутри него поплыл бы.
 */
export function PriceChart({
  asset,
  nudges,
  trade,
}: {
  asset: OptionAsset;
  nudges: readonly OptionNudge[];
  trade: ChartTrade | null;
}) {
  const tick = useTick();
  const from = tick - WINDOW;
  const span = WINDOW + AHEAD;

  const prices: number[] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = from; k <= tick; k++) {
    const p = optionPrice(asset, k, nudges);
    prices.push(p);
    if (p < lo) lo = p;
    if (p > hi) hi = p;
  }
  if (trade) {
    lo = Math.min(lo, trade.entry);
    hi = Math.max(hi, trade.entry);
  }
  // Границы шкалы привязаны к сетке: иначе график пересчитывает масштаб
  // на каждом тике и мелко дрожит
  const step = asset.price * OPTION_VOL * 0.5;
  lo = (Math.floor(lo / step) - 1) * step;
  hi = (Math.ceil(hi / step) + 1) * step;

  const x = (k: number) => ((k - from) / span) * W;
  const y = (p: number) => ((hi - p) / (hi - lo)) * H;
  const pctX = (k: number) => `${((k - from) / span) * 100}%`;
  const pctY = (p: number) => `${((hi - p) / (hi - lo)) * 100}%`;

  const line = prices.map((p, i) => `${x(from + i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const last = prices[prices.length - 1];
  const rising = last >= prices[Math.max(0, prices.length - 9)];

  const levels: number[] = [];
  for (let p = lo + step; p < hi - step / 2; p += step) levels.push(p);
  const stride = levels.length > 9 ? 2 : 1;

  const times: number[] = [];
  for (let k = Math.ceil(from / 40) * 40; k <= tick + AHEAD; k += 40) times.push(k);

  const up = trade?.dir === 1;
  const tone = up ? "#34d399" : "#fb7185";
  const winning = trade ? (last - trade.entry) * trade.dir > 0 : false;

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 right-[84px] bottom-6 overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="opt-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {levels.map((p) => (
            <line key={p} x1={0} x2={W} y1={y(p)} y2={y(p)} stroke="rgba(63,63,70,0.28)" vectorEffect="non-scaling-stroke" />
          ))}
          {times.map((k) => (
            <line key={k} x1={x(k)} x2={x(k)} y1={0} y2={H} stroke="rgba(63,63,70,0.22)" vectorEffect="non-scaling-stroke" />
          ))}

          {/* Зона выигрыша: выше цены входа для «ВВЕРХ», ниже — для «ВНИЗ» */}
          {trade && (
            <>
              <rect
                x={Math.max(0, x(trade.t0))}
                width={W}
                y={up ? 0 : y(trade.entry)}
                height={up ? y(trade.entry) : H - y(trade.entry)}
                fill={tone}
                opacity={0.07}
              />
              <line x1={0} x2={W} y1={y(trade.entry)} y2={y(trade.entry)} stroke={tone} strokeDasharray="6 5" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
              {trade.t0 >= from && (
                <line x1={x(trade.t0)} x2={x(trade.t0)} y1={0} y2={H} stroke={tone} strokeWidth={1} opacity={0.6} vectorEffect="non-scaling-stroke" />
              )}
              {trade.t1 <= tick + AHEAD && (
                <line x1={x(trade.t1)} x2={x(trade.t1)} y1={0} y2={H} stroke="#fbbf24" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              )}
            </>
          )}

          <polygon points={`0,${H} ${line} ${x(tick).toFixed(1)},${H}`} fill="url(#opt-area)" />
          <polyline points={line} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <line x1={x(tick)} x2={W} y1={y(last)} y2={y(last)} stroke="#38bdf8" strokeDasharray="2 4" opacity={0.7} vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Текущая точка */}
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.9)]"
          style={{ left: pctX(tick), top: pctY(last) }}
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-sky-400" />
        </span>

        {trade && (
          <>
            <span
              className={cx(
                "tnum absolute left-2 -translate-y-1/2 rounded-[3px] px-1.5 py-[2px] font-mono text-[10.5px] font-semibold text-zinc-950",
                up ? "bg-emerald-400" : "bg-rose-400",
              )}
              style={{ top: pctY(trade.entry) }}
            >
              {up ? "▲ ВВЕРХ" : "▼ ВНИЗ"} · {trade.entry.toFixed(asset.digits)}
            </span>
            {trade.t1 <= tick + AHEAD && (
              <span
                className="absolute top-1.5 -translate-x-1/2 rounded-[3px] bg-amber-400 px-1.5 py-[2px] font-mono text-[9.5px] font-bold tracking-wider text-zinc-950"
                style={{ left: pctX(trade.t1) }}
              >
                ЭКСПИРАЦИЯ
              </span>
            )}
          </>
        )}
      </div>

      {/* Шкала цены */}
      <div className="absolute top-0 right-0 bottom-6 w-[84px] border-l border-zinc-800/80">
        {levels.map(
          (p, i) =>
            i % stride === 0 && (
              <span
                key={p}
                className="tnum absolute left-2 -translate-y-1/2 font-mono text-[10.5px] text-zinc-600"
                style={{ top: pctY(p) }}
              >
                {p.toFixed(asset.digits)}
              </span>
            ),
        )}
        <span
          className={cx(
            "tnum absolute right-0 left-0 -translate-y-1/2 px-2 py-[3px] font-mono text-[11.5px] font-bold text-zinc-950",
            trade ? (winning ? "bg-emerald-400" : "bg-rose-400") : rising ? "bg-sky-400" : "bg-sky-500",
          )}
          style={{ top: pctY(last) }}
        >
          {last.toFixed(asset.digits)}
        </span>
      </div>

      {/* Шкала времени */}
      <div className="absolute right-[84px] bottom-0 left-0 h-6 overflow-hidden border-t border-zinc-800/80">
        {times.map((k) => (
          <span
            key={k}
            className="tnum absolute top-1 -translate-x-1/2 font-mono text-[10px] text-zinc-600"
            style={{ left: pctX(k) }}
          >
            {sceneClock(k / 4)}
          </span>
        ))}
      </div>
    </div>
  );
}
