"use client";

import {
  BarChart3,
  BookText,
  ChevronRight,
  CreditCard,
  Database,
  Headphones,
  Users,
} from "lucide-react";
import { SCRIPTS } from "@/lib/fixtures/pools";
import { buildQueues, type QueueId } from "@/lib/fixtures/workspace";
import type { Lead } from "@/lib/fixtures/leads";
import { cx } from "@/components/shared/ui";

type Section = { icon: typeof Database; label: string; active?: boolean };

const SECTIONS: Section[] = [
  { icon: Database, label: "Лиды", active: true },
  { icon: Users, label: "Мои клиенты" },
  { icon: CreditCard, label: "Транзакции" },
  { icon: Headphones, label: "Записи звонков" },
  { icon: BookText, label: "Скрипты" },
  { icon: BarChart3, label: "Аналитика" },
];

export function SideNav({
  leads,
  queue,
  onQueue,
}: {
  leads: Lead[];
  queue: QueueId;
  onQueue: (q: QueueId) => void;
}) {
  const queues = buildQueues(leads);

  return (
    <nav className="flex w-[212px] shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0b0b0e]">
      {/* Разделы */}
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

      {/* Очереди — главный элемент панели, цифры должны быть видны издалека */}
      <div className="shrink-0 p-1.5">
        <p className="px-2 pt-1 pb-1.5 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Очереди
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
              {queue === q.id && <ChevronRight className="h-3 w-3 shrink-0 text-emerald-500" />}
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

      <div className="mt-auto min-h-0 shrink-0 border-t border-zinc-900 p-1.5">
        <p className="px-2 pt-1 pb-1.5 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Скрипты разговора
        </p>
        <div className="space-y-[1px]">
          {SCRIPTS.map((s, i) => (
            <button
              key={s}
              className="flex w-full items-center gap-1.5 rounded-[3px] px-2 py-[3px] text-left text-[10.5px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            >
              <span className="font-mono text-[9px] text-zinc-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
