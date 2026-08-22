"use client";

import { useMemo } from "react";
import { Globe2, PhoneCall, Target, TrendingUp, Users2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Rng } from "@/lib/prng";
import { buildWorkspace, hourlyRevenue } from "@/lib/fixtures/workspace";
import { COUNTRIES } from "@/lib/fixtures/pools";
import { compact, pct, usd } from "@/lib/format";
import { BigClock } from "@/components/shared/SceneClock";
import { Ticker } from "@/components/shared/Ticker";
import { EventFlash } from "@/components/shared/EventFlash";
import { DriftNumber, GrowingNumber } from "@/components/shared/LiveNumber";
import { Panel, cx } from "@/components/shared/ui";
import { WorldMap } from "./WorldMap";
import { Leaderboard } from "./Leaderboard";
import { selectRevenue, useSceneValue } from "@/lib/scene/SceneProvider";

/**
 * Экран на стену — общий план сцены.
 *
 * Всё крупно: цифры должны читаться с пяти метров и оставаться разборчивыми,
 * когда камера снимает зал целиком и экран занимает четверть кадра.
 */
export function WallScreen() {
  const ws = useMemo(() => buildWorkspace(1), []);
  const hours = useMemo(() => hourlyRevenue(new Rng("wall-hours"), 13), []);
  const countries = useMemo(() => {
    const rng = new Rng("wall-countries");
    return rng
      .sample(COUNTRIES, 7)
      .map((c) => ({ c, value: rng.money(9_000, 76_000) }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const revenue = useSceneValue(selectRevenue);
  const maxHour = Math.max(...hours);
  const totalCountries = countries.reduce((s, x) => s + x.value, 0);

  return (
    <div className="grid-bg flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Шапка */}
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-zinc-800 bg-[#0b0b0e] px-5">
        <span className="font-mono text-[17px] font-bold tracking-[0.22em] text-zinc-100">
          {BRAND.org.name}
        </span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-600">
          {BRAND.org.office} · СМЕНА B · ОПЕРАЦИОННЫЙ ЗАЛ
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </span>
        <BigClock />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr_0.95fr] gap-2 p-2">
        {/* ЛЕВАЯ КОЛОНКА: главная цифра + метрики + почасовой график */}
        <div className="flex min-h-0 flex-col gap-2">
          <Panel title="Депозиты за смену" className="shrink-0">
            <div className="px-4 py-3">
              <GrowingNumber
                base={revenue}
                perSecond={64}
                seed="wall-total"
                format={usd}
                className="block font-mono text-[62px] leading-none font-bold tracking-tight text-emerald-400 [text-shadow:0_0_36px_rgba(16,185,129,0.35)]"
              />
              <div className="mt-2 flex items-center gap-4 font-mono text-[12px] tracking-wide">
                <span className="text-emerald-400">
                  ▲ <DriftNumber base={31.4} amplitude={2.4} seed="wall-dyn" format={(v) => `${v.toFixed(1)}%`} />
                  <span className="ml-1 text-zinc-600">к вчера</span>
                </span>
                <span className="text-zinc-500">
                  ПЛАН МЕСЯЦА <span className="text-zinc-300">{usd(4_200_000)}</span>
                </span>
              </div>
            </div>
          </Panel>

          <div className="grid shrink-0 grid-cols-2 gap-2">
            <Stat icon={PhoneCall} label="Активных звонков" base={34} amplitude={5} seed="calls" format={(v) => Math.round(v).toString()} tone="text-sky-300" />
            <Stat icon={Users2} label="Жертв онлайн" base={118} amplitude={14} seed="online" format={(v) => Math.round(v).toString()} tone="text-emerald-300" />
            <Stat icon={Target} label="Конверсия" base={0.124} amplitude={0.011} seed="conv" format={(v) => pct(v)} tone="text-amber-300" />
            <Stat icon={TrendingUp} label="Средний чек" base={2180} amplitude={140} seed="avg" format={(v) => usd(v)} tone="text-fuchsia-300" />
          </div>

          <Panel title="Поступления по часам" className="min-h-0 flex-1">
            {/* items-stretch обязателен: столбик задан процентом от высоты
                колонки, а она получает определённую высоту только при растяжении */}
            <div className="flex min-h-0 flex-1 items-stretch gap-1.5 px-3 pt-3 pb-2">
              {hours.map((h, i) => {
                const last = i === hours.length - 1;
                return (
                  <div
                    key={i}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="font-mono text-[10px] text-zinc-500">{compact(h)}</span>
                    <div
                      className={cx(
                        "w-full rounded-t-[2px] transition-[height] duration-700",
                        last
                          ? "bg-gradient-to-t from-emerald-700 to-emerald-400"
                          : "bg-gradient-to-t from-emerald-900 to-emerald-600/70",
                      )}
                      style={{ height: `${(h / maxHour) * 88}%` }}
                    />
                    <span className="font-mono text-[10px] text-zinc-600">
                      {String(8 + i).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* ЦЕНТР: карта мира + разбивка по странам */}
        <div className="flex min-h-0 flex-col gap-2">
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-3 w-3" />
                География активных звонков
              </span>
            }
            className="shrink-0"
          >
            {/* Карта в пропорции 2:1 — иначе панель растягивается, а сама карта
                остаётся маленькой в середине пустого прямоугольника */}
            <div className="aspect-[2/1] w-full p-2">
              <WorldMap />
            </div>
          </Panel>

          <Panel title="Выручка по странам" className="min-h-0 flex-1">
            <div className="flex min-h-0 flex-1 flex-col justify-around px-3 py-2">
              {countries.map(({ c, value }) => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-[13px]">{c.flag}</span>
                  <span className="w-[86px] shrink-0 truncate text-[12px] text-zinc-400">
                    {c.ru}
                  </span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800/70">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400"
                      style={{ width: `${(value / countries[0].value) * 100}%` }}
                    />
                  </span>
                  <span className="tnum w-[74px] shrink-0 text-right font-mono text-[13px] text-emerald-300">
                    {usd(value)}
                  </span>
                  <span className="tnum w-[42px] shrink-0 text-right font-mono text-[11px] text-zinc-600">
                    {pct(value / totalCountries, 0)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ПРАВАЯ КОЛОНКА: лидерборд */}
        <Panel
          title="Лидерборд смены"
          right={
            <span className="font-mono text-[9px] tracking-[0.14em] text-zinc-600">
              ОБНОВЛЕНИЕ 5с
            </span>
          }
          className="min-h-0"
        >
          <Leaderboard agents={ws.floor} />
        </Panel>
      </div>

      <Ticker speed="fast" />
      <EventFlash />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  base,
  amplitude,
  seed,
  format,
  tone,
}: {
  icon: typeof PhoneCall;
  label: string;
  base: number;
  amplitude: number;
  seed: string;
  format: (v: number) => string;
  tone: string;
}) {
  return (
    <div className="rounded-sm border border-zinc-800/80 bg-[#0d0d10] px-3 py-2">
      <p className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
        <Icon className="h-3 w-3" strokeWidth={1.8} />
        {label}
      </p>
      <DriftNumber
        base={base}
        amplitude={amplitude}
        seed={seed}
        format={format}
        className={cx("mt-1 block font-mono text-[28px] leading-none font-semibold", tone)}
      />
    </div>
  );
}
