"use client";

import {
  ArrowLeftRight,
  ChevronRight,
  CreditCard,
  Landmark,
  Truck,
  Users2,
  Wallet,
} from "lucide-react";
import { buildDropQueues, type DropQueueId } from "@/lib/fixtures/dropdesk";
import type { Drop } from "@/lib/fixtures/drops";
import { cx } from "@/components/shared/ui";

type Section = { icon: typeof CreditCard; label: string; active?: boolean };

const SECTIONS: Section[] = [
  { icon: CreditCard, label: "Реестр дропов", active: true },
  { icon: ArrowLeftRight, label: "Заливы" },
  { icon: Wallet, label: "Кошельки" },
  { icon: Truck, label: "Курьеры" },
  { icon: Landmark, label: "Точки снятия" },
  { icon: Users2, label: "Вербовка" },
];

export function DropFilters({
  drops,
  queue,
  onQueue,
  children,
}: {
  drops: Drop[];
  queue: DropQueueId;
  onQueue: (q: DropQueueId) => void;
  /** Нижний блок колонки — касса и карта снятий */
  children: React.ReactNode;
}) {
  const queues = buildDropQueues(drops);

  return (
    <nav className="flex w-[228px] shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0b0b0e]">
      <div className="shrink-0 border-b border-zinc-900 p-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.label}
            className={cx(
              "flex w-full items-center gap-2 rounded-[3px] px-2 py-[5px] text-left text-[11.5px] transition-colors",
              s.active
                ? "bg-zinc-800/70 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
            )}
          >
            <s.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Фильтры по состоянию карт — цифры должны читаться боковым зрением */}
      <div className="shrink-0 p-1.5">
        <p className="px-2 pt-1 pb-1.5 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Состояние карт
        </p>
        {queues.map((q) => (
          <button
            key={q.id}
            onClick={() => onQueue(q.id)}
            className={cx(
              "flex w-full items-center justify-between gap-2 rounded-[3px] px-2 py-[5px] text-left text-[11.5px] transition-colors",
              queue === q.id
                ? "bg-zinc-800/70 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              {queue === q.id && <ChevronRight className="h-3 w-3 shrink-0 text-violet-500" />}
              <span className="truncate">{q.label}</span>
            </span>
            <span
              className={cx(
                "tnum rounded-[2px] bg-zinc-900 px-1.5 py-[1px] font-mono text-[10px] font-semibold",
                q.tone,
              )}
            >
              {q.count}
            </span>
          </button>
        ))}
      </div>

      {/* Касса и география снятий занимают низ колонки до самого края */}
      <div className="mt-auto flex min-h-0 flex-1 flex-col border-t border-zinc-900">
        {children}
      </div>
    </nav>
  );
}
