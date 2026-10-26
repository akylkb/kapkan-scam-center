"use client";

import { cx } from "@/components/shared/ui";
import { agoLabel } from "@/lib/format";
import type { Target, TargetStatus } from "@/lib/fixtures/vishing";

/**
 * База целей — то, что на мониторе напарника: имена и номера людей.
 * Выбранная строка (жертва в работе) подсвечена; остальные уходят за
 * нижний край, чтобы список не читался как макет.
 */
const STATUS: Record<TargetStatus, { label: string; cls: string }> = {
  active: { label: "В РАБОТЕ", cls: "text-amber-300" },
  queue: { label: "в очереди", cls: "text-zinc-500" },
  done: { label: "обработан", cls: "text-emerald-400/80" },
  noanswer: { label: "не ответил", cls: "text-rose-400/80" },
};

export function TargetList({
  targets,
  selectedId,
  onSelect,
}: {
  targets: Target[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0b0b0e]">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          База · цели
        </span>
        <span className="tnum font-mono text-[9.5px] text-zinc-600">{targets.length} записей</span>
      </header>

      <div className="grid grid-cols-[1fr_auto] gap-x-2 border-b border-zinc-900 px-2.5 py-1 font-mono text-[8.5px] tracking-[0.12em] text-zinc-600 uppercase">
        <span>Имя · номер</span>
        <span>Статус</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {targets.map((t) => {
          const st = STATUS[t.status];
          const sel = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cx(
                "grid w-full grid-cols-[1fr_auto] items-center gap-x-2 border-b border-zinc-900/80 px-2.5 py-[6px] text-left transition-colors",
                sel ? "bg-amber-500/10" : "hover:bg-zinc-900/50",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {sel && <span className="h-[5px] w-[5px] shrink-0 animate-pulse rounded-full bg-amber-400" />}
                  <span className={cx("truncate text-[12px]", sel ? "text-amber-200" : "text-zinc-300")}>
                    {t.name}
                  </span>
                </div>
                <span className="tnum font-mono text-[10px] text-zinc-500">{t.phone}</span>
              </div>
              <div className="text-right leading-tight">
                <span className={cx("font-mono text-[9px] tracking-[0.08em] uppercase", st.cls)}>
                  {st.label}
                </span>
                <div className="tnum font-mono text-[8.5px] text-zinc-700">{agoLabel(t.lastMin)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
