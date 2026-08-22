"use client";

import { Filter, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { STATUS_META, type Lead } from "@/lib/fixtures/leads";
import { agoLabel, usd } from "@/lib/format";
import { Chip, cx } from "@/components/shared/ui";

const COLS =
  "grid grid-cols-[26px_66px_1fr_136px_34px_92px_88px_136px_112px_86px_54px] gap-x-2 items-center";

export function LeadsTable({
  leads,
  selectedId,
  onSelect,
  lostId,
}: {
  leads: Lead[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Лид, который «сорвался» по команде режиссёра — подсвечивается красным */
  lostId: string | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r border-zinc-800">
      <Toolbar count={leads.length} />

      {/* Шапка таблицы */}
      <div
        className={cx(
          COLS,
          "shrink-0 border-b border-zinc-800 bg-zinc-900/60 px-2 py-[5px] font-mono text-[8.5px] tracking-[0.12em] text-zinc-500 uppercase",
        )}
      >
        <span />
        <span>ID</span>
        <span>Клиент</span>
        <span>Телефон</span>
        <span>Возр</span>
        <span className="text-right">Капитал</span>
        <span className="text-right">Депозит</span>
        <span>Статус</span>
        <span>Оператор</span>
        <span>Контакт</span>
        <span className="text-right">Темп</span>
      </div>

      {/* Строки */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {leads.map((lead, i) => {
          const meta = STATUS_META[lead.status];
          const selected = lead.id === selectedId;
          const lost = lead.id === lostId;

          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className={cx(
                COLS,
                "w-full border-b border-zinc-900/70 px-2 py-[4px] text-left transition-colors",
                selected
                  ? "bg-emerald-500/10 ring-1 ring-emerald-500/40 ring-inset"
                  : lost
                    ? "bg-rose-500/15"
                    : i % 2
                      ? "bg-zinc-900/25 hover:bg-zinc-800/40"
                      : "hover:bg-zinc-800/40",
              )}
            >
              {/* Индикатор «клиент сейчас в терминале» */}
              <span className="flex items-center justify-center">
                {lead.online ? (
                  <span className="relative flex h-[5px] w-[5px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-emerald-400" />
                  </span>
                ) : (
                  <span className="h-[5px] w-[5px] rounded-full bg-zinc-800" />
                )}
              </span>

              <span className="font-mono text-[10px] text-zinc-600">{lead.id}</span>

              <span className="flex min-w-0 items-center gap-1.5">
                <span className="text-[11px] leading-none">{lead.country.flag}</span>
                <span
                  className={cx(
                    "truncate text-[11.5px]",
                    selected ? "text-zinc-100" : "text-zinc-300",
                    lost && "text-rose-300 line-through",
                  )}
                >
                  {lead.name}
                </span>
                <span className="shrink-0 font-mono text-[9px] text-zinc-700">
                  {lead.country.code}
                </span>
              </span>

              <span className="tnum font-mono text-[10.5px] text-zinc-500">{lead.phone}</span>
              <span className="tnum font-mono text-[10.5px] text-zinc-500">{lead.age}</span>

              <span className="tnum text-right font-mono text-[10.5px] text-zinc-400">
                {usd(lead.netWorth)}
              </span>

              <span
                className={cx(
                  "tnum text-right font-mono text-[11px] font-semibold",
                  lead.deposit > 0 ? "text-emerald-300" : "text-zinc-700",
                )}
              >
                {lead.deposit > 0 ? usd(lead.deposit) : "—"}
              </span>

              <span className="min-w-0">
                <Chip className={cx(meta.bg, meta.border, meta.text, "max-w-full")}>
                  <span className={cx("h-[4px] w-[4px] shrink-0 rounded-full", meta.dot)} />
                  <span className="truncate">
                    {lead.status === "deposited" ? `ДЕПОЗИТ ${usd(lead.deposit)}` : meta.label}
                  </span>
                </Chip>
              </span>

              <span className="truncate font-mono text-[10px] text-zinc-500">{lead.agent}</span>

              <span className="font-mono text-[9.5px] text-zinc-600">
                {agoLabel(lead.lastContactMin)}
              </span>

              {/* «Температура» — насколько клиент готов платить */}
              <span className="flex items-center justify-end gap-1">
                <span className="h-[3px] w-7 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className={cx(
                      "block h-full rounded-full",
                      lead.temperature > 70
                        ? "bg-rose-500"
                        : lead.temperature > 40
                          ? "bg-amber-400"
                          : "bg-sky-500",
                    )}
                    style={{ width: `${lead.temperature}%` }}
                  />
                </span>
                <span className="tnum w-[16px] text-right font-mono text-[9px] text-zinc-600">
                  {lead.temperature}
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
      <div className="flex h-[22px] w-[240px] items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/70 px-2">
        <Search className="h-3 w-3 text-zinc-600" />
        <span className="font-mono text-[10.5px] text-zinc-600">
          поиск: имя, ID, телефон, e-mail
        </span>
      </div>

      {[
        { icon: Filter, label: "Страна: ВСЕ" },
        { icon: SlidersHorizontal, label: "Депозит: > $0" },
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
        показано <span className="text-zinc-300">{count}</span> · выделено{" "}
        <span className="text-zinc-300">1</span>
      </span>
      <button className="flex h-[22px] items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/70 px-2 font-mono text-[10px] text-zinc-400">
        <RefreshCw className="h-3 w-3 text-emerald-500" />
        АВТО 30с
      </button>
    </div>
  );
}
