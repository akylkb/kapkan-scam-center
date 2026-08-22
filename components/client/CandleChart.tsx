"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Rng } from "@/lib/prng";
import { makeCandles } from "@/lib/fixtures/market";
import { useSecond } from "@/lib/scene/SceneProvider";

/**
 * Свечной график в терминале «жертвы».
 *
 * Тренд агрессивно растущий, но с откатами и красными свечами: ровная палка
 * вверх читается как рисунок даже неподготовленным зрителем.
 */
export function CandleChart({ seed = "victim" }: { seed?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const second = useSecond();

  useEffect(() => {
    if (!box.current) return;

    const c = createChart(box.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0d1117" },
        textColor: "#71717a",
        fontFamily: "var(--font-code), monospace",
        fontSize: 11,
        // Обязательно: библиотека рисует свой логотип в углу графика,
        // а в кадре не должно быть логотипов реальных компаний
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(63,63,70,0.18)" },
        horzLines: { color: "rgba(63,63,70,0.18)" },
      },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
    });

    const s = c.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });

    // lightweight-charts ждёт брендированный тип Time — у нас это unix-секунды
    s.setData(
      makeCandles(new Rng(seed), { count: 190, start: 46_100, drift: 0.00155 }).map((c) => ({
        ...c,
        time: c.time as UTCTimestamp,
      })),
    );
    c.timeScale().fitContent();

    chart.current = c;
    series.current = s;

    const ro = new ResizeObserver(() => {
      if (box.current) c.applyOptions({ width: box.current.clientWidth, height: box.current.clientHeight });
    });
    ro.observe(box.current);

    return () => {
      ro.disconnect();
      c.remove();
      chart.current = null;
      series.current = null;
    };
  }, [seed]);

  // Последняя свеча дорисовывается в реальном времени — график «дышит» в кадре
  useEffect(() => {
    const s = series.current;
    if (!s || second === 0) return;

    const base = makeCandles(new Rng(seed), { count: 190, start: 46_100, drift: 0.00155 });
    const last = base[base.length - 1];
    const wobble = Math.sin(second / 2.3) * 0.006 + Math.sin(second / 7.1) * 0.004;
    const close = last.close * (1 + wobble + second * 0.00018);

    s.update({
      time: last.time as UTCTimestamp,
      open: last.open,
      high: Math.max(last.high, close * 1.002),
      low: Math.min(last.low, close * 0.998),
      close: Math.round(close * 100) / 100,
    });
  }, [second, seed]);

  return <div ref={box} className="h-full w-full" />;
}
