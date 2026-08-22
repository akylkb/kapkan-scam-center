"use client";

import { Filter, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { DROP_STATUS_META, loadPct, type Drop } from "@/lib/fixtures/drops";
import { agoLabel, usd } from "@/lib/format";
import { Chip, cx } from "@/components/shared/ui";

const COLS =
  "grid grid-cols-[26px_62px_98px_1fr_142px_74px_78px_92px_128px_38px_58px_78px_50px] gap-x-2 items-center";

export function DropsTable({
  drops,
  selectedId,
  onSelect,
  burnedId,
}: {
  drops: Drop[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Дроп, сгоревший по команде режиссёра — строка краснеет */
  burnedId: string | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r border-zinc-800">
      <Toolbar count={drops.length} />

      {/* Шапка таблицы */}
      <div
        className={cx(
          COLS,
          "shrink-0 border-b border-zinc-800 bg-zinc-900/60 px-2 py-[5px] font-mono text-[8.5px] tracking-[0.12em] text-zinc-500 uppercase",
        )}
      >
        <span />
        <span>ID</span>
        <span>Кличка</span>
        <span>Банк · город</span>
        <span>Карта</span>
        <span className="text-right">Лимит</span>
        <span className="text-right">Залито</span>
        <span>Загрузка</span>
        <span>Статус</span>
        <span className="text-right">%</span>
        <span className="text-right">Держит</span>
        <span>Операция</span>
        <span className="text-right">Риск</span>
      </div>

      {/* Строки */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {drops.map((drop, i) => {
          const burned = drop.id === burnedId;
          // Сгоревший по хоткею перекрашивается на лету, не переписывая фикстуру
          const meta = DROP_STATUS_META[burned ? "burned" : drop.status];
          const selected = drop.id === selectedId;
          const load = loadPct(drop);

          return (
            <button
              key={drop.id}
              onClick={() => onSelect(drop.id)}
              className={cx(
                COLS,
                "w-full border-b border-zinc-900/70 px-2 py-[4px] text-left transition-colors",
                selected
                  ? "bg-violet-500/10 ring-1 ring-violet-500/40 ring-inset"
                  : burned
                    ? "bg-rose-500/15"
                    : i % 2
                      ? "bg-zinc-900/25 hover:bg-zinc-800/40"
                      : "hover:bg-zinc-800/40",
              )}
            >
              {/* Дроп на связи прямо сейчас */}
              <span className="flex items-center justify-center">
                {drop.online && !burned ? (
                  <span className="relative flex h-[5px] w-[5px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-emerald-400" />
                  </span>
                ) : (
                  <span className="h-[5px] w-[5px] rounded-full bg-zinc-800" />
                )}
              </span>

              <span className="font-mono text-[10px] text-zinc-600">{drop.id}</span>

              <span className="flex min-w-0 items-center gap-1.5">
                <span className="text-[11px] leading-none">{drop.country.flag}</span>
                <span
                  className={cx(
                    "truncate text-[11.5px]",
                    selected ? "text-zinc-100" : "text-zinc-300",
                    burned && "text-rose-300 line-through",
                  )}
                >
                  {drop.alias}
                </span>
              </span>

              <span className="min-w-0 truncate text-[10.5px] text-zinc-500">
                {drop.bank}
                <span className="ml-1 text-zinc-700">· {drop.city}</span>
              </span>

              <span className="tnum font-mono text-[10.5px] text-zinc-500">{drop.card}</span>

              <span className="tnum text-right font-mono text-[10.5px] text-zinc-400">
                {usd(drop.limitDay)}
              </span>

              <span
                className={cx(
                  "tnum text-right font-mono text-[11px] font-semibold",
                  drop.loadedToday > 0 ? "text-emerald-300" : "text-zinc-700",
                )}
              >
                {drop.loadedToday > 0 ? usd(drop.loadedToday) : "—"}
              </span>

              {/* Загрузка лимита — то, из-за чего дроп «горит» */}
              <span className="flex items-center gap-1">
                <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className={cx(
                      "block h-full rounded-full",
                      load > 90 ? "bg-rose-500" : load > 60 ? "bg-amber-400" : "bg-emerald-500",
                    )}
                    style={{ width: `${load}%` }}
                  />
                </span>
                <span className="tnum w-[24px] text-right font-mono text-[9px] text-zinc-600">
                  {load}%
                </span>
              </span>

              <span className="min-w-0">
                <Chip className={cx(meta.bg, meta.border, meta.text, "max-w-full")}>
                  <span className={cx("h-[4px] w-[4px] shrink-0 rounded-full", meta.dot)} />
                  <span className="truncate">{meta.label}</span>
                </Chip>
              </span>

              <span className="tnum text-right font-mono text-[10.5px] text-zinc-400">
                {drop.feePct}
              </span>

              <span className="tnum text-right font-mono text-[10px] text-zinc-500">
                {drop.holdMin} мин
              </span>

              <span className="font-mono text-[9.5px] text-zinc-600">
                {agoLabel(drop.lastOpMin)}
              </span>

              {/* Риск блокировки карты */}
              <span className="flex items-center justify-end gap-1">
                <span className="h-[3px] w-6 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className={cx(
                      "block h-full rounded-full",
                      drop.risk > 70
                        ? "bg-rose-500"
                        : drop.risk > 40
                          ? "bg-amber-400"
                          : "bg-sky-500",
                    )}
                    style={{ width: `${drop.risk}%` }}
                  />
                </span>
                <span className="tnum w-[16px] text-right font-mono text-[9px] text-zinc-600">
                  {drop.risk}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toolbar({ count }: { count: number }) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-zinc-800 bg-[#0b0b0e] px-2">
      <div className="flex h-[22px] w-[230px] items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/70 px-2">
        <Search className="h-3 w-3 text-zinc-600" />
        <span className="font-mono text-[10.5px] text-zinc-600">
          поиск: кличка, ID, карта, банк
        </span>
      </div>

      {[
        { icon: Filter, label: "Банк: ВСЕ" },
        { icon: SlidersHorizontal, label: "Загрузка: < 100%" },
      ].map((f) => (
        <button
          key={f.label}
          className="flex h-[22px] items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/70 px-2 font-mono text-[10px] text-zinc-400 hover:border-zinc-700"
        >
          <f.icon className="h-3 w-3 text-zinc-600" />
          {f.label}
        </button>
      ))}

      <div className="flex-1" />

      <span className="font-mono text-[10px] text-zinc-600">
        карт в пуле <span className="text-zinc-300">{count}</span> · выделено{" "}
        <span className="text-zinc-300">1</span>
      </span>
      <button className="flex h-[22px] items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/70 px-2 font-mono text-[10px] text-zinc-400">
        <RefreshCw className="h-3 w-3 text-emerald-500" />
        АВТО 15с
      </button>
    </div>
  );
}
