"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import {
  CHANNEL_META,
  LAST_STAGE,
  THREAD_STATUS_META,
  lastLine,
  type Thread,
} from "@/lib/fixtures/threads";
import { agoLabel, usd } from "@/lib/format";
import { cx } from "@/components/shared/ui";

export function ThreadList({
  threads,
  selectedId,
  onSelect,
}: {
  threads: Thread[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const unread = threads.reduce((sum, t) => sum + (t.unread > 0 ? 1 : 0), 0);

  return (
    <div className="flex w-[318px] shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0b0b0e]">
      {/* Панель поиска — нерабочая, но без неё колонка выглядит недоделанной */}
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-zinc-800 px-2">
        <div className="flex h-[22px] flex-1 items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/60 px-2">
          <Search className="h-3 w-3 shrink-0 text-zinc-600" />
          <span className="truncate text-[10.5px] text-zinc-600">
            поиск по имени, номеру, тексту
          </span>
        </div>
        <button className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] border border-zinc-800 bg-zinc-900/60 text-zinc-500">
          <SlidersHorizontal className="h-3 w-3" />
        </button>
      </div>

      <div className="flex h-[18px] shrink-0 items-center justify-between border-b border-zinc-900 px-2 font-mono text-[8.5px] tracking-[0.12em] text-zinc-600 uppercase">
        <span>
          диалогов <span className="tnum text-zinc-400">{threads.length}</span>
        </span>
        <span>
          непрочитано <span className="tnum text-cyan-400">{unread}</span>
        </span>
      </div>

      {/* Список уходит за нижний край — так и должно быть в кадре */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {threads.map((t, i) => {
          const meta = THREAD_STATUS_META[t.status];
          const ch = CHANNEL_META[t.channel];
          const line = lastLine(t);
          const selected = t.id === selectedId;

          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cx(
                "flex w-full items-start gap-2 border-b border-zinc-900/80 px-2 py-[7px] text-left transition-colors",
                selected
                  ? "bg-cyan-500/10 ring-1 ring-cyan-500/40 ring-inset"
                  : i % 2
                    ? "bg-zinc-900/25 hover:bg-zinc-900/60"
                    : "hover:bg-zinc-900/60",
              )}
            >
              {/* Аватар с меткой канала */}
              <span className="relative shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[11px] text-zinc-300">
                  {t.name[0]}
                </span>
                <span
                  className={cx(
                    "absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-950 font-mono text-[6.5px] font-bold",
                    ch.bg,
                    ch.text,
                  )}
                >
                  {ch.short}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="flex-1 truncate text-[12px] text-zinc-200">
                    <span className="mr-1">{t.country.flag}</span>
                    {t.name}
                  </span>
                  <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-600">
                    {agoLabel(t.lastMsgMin)}
                  </span>
                </span>

                <span className="mt-[1px] flex items-center gap-1.5">
                  <span
                    className={cx(
                      "min-w-0 flex-1 truncate text-[10.5px]",
                      t.typing
                        ? "animate-blink text-cyan-400"
                        : line?.from === "victim"
                          ? "text-zinc-400"
                          : "text-zinc-600",
                    )}
                  >
                    {t.typing
                      ? "печатает…"
                      : line
                        ? `${line.from === "operator" ? "вы: " : ""}${line.text}`
                        : "—"}
                  </span>
                  {t.unread > 0 && (
                    <span className="tnum shrink-0 rounded-full bg-cyan-500 px-1.5 font-mono text-[8.5px] font-bold text-zinc-950">
                      {t.unread}
                    </span>
                  )}
                </span>

                {/* Этап воронки: пять сегментов, читаются с двух метров */}
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="flex flex-1 gap-[2px]">
                    {Array.from({ length: LAST_STAGE + 1 }).map((_, s) => (
                      <span
                        key={s}
                        className={cx(
                          "h-[3px] flex-1 rounded-[1px]",
                          s > t.stage
                            ? "bg-zinc-800"
                            : t.status === "suspicious" || t.status === "dead"
                              ? "bg-rose-500/70"
                              : t.status === "paid"
                                ? "bg-emerald-500"
                                : "bg-cyan-500",
                        )}
                      />
                    ))}
                  </span>
                  <span className={cx("shrink-0 font-mono text-[8px] tracking-[0.06em]", meta.text)}>
                    {meta.label}
                  </span>
                  <span className="tnum shrink-0 font-mono text-[9.5px] text-zinc-500">
                    {usd(t.askAmount)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
