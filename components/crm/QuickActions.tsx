"use client";

import {
  ArrowRightLeft,
  Ban,
  Gift,
  Snowflake,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cx } from "@/components/shared/ui";

/**
 * Нижняя панель «быстрых действий».
 *
 * Формулировки намеренно те же, что в изъятых системах: начислить бонус,
 * подкрутить сделку, отклонить вывод, заморозить счёт. Именно эти кнопки
 * объясняют зрителю механику обмана без единой реплики.
 */
const ACTIONS = [
  { icon: Gift, label: "Начислить бонус", tone: "emerald" },
  { icon: TrendingUp, label: "Нарисовать прибыль", tone: "emerald" },
  { icon: TrendingDown, label: "Свести в минус", tone: "rose" },
  { icon: Ban, label: "Отклонить вывод", tone: "rose" },
  { icon: Snowflake, label: "Заморозить счёт", tone: "sky" },
  { icon: ArrowRightLeft, label: "Передать в ретеншн", tone: "zinc" },
] as const;

const TONE: Record<string, string> = {
  emerald: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40",
  rose: "border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40",
  sky: "border-sky-800/60 bg-sky-950/40 text-sky-300 hover:bg-sky-900/40",
  zinc: "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/60",
};

export function QuickActions() {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5 border-t border-zinc-800 bg-[#0b0b0e] px-2">
      <span className="mr-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
        Действия
      </span>
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          className={cx(
            "flex h-[24px] items-center gap-1.5 rounded-[3px] border px-2 text-[10.5px] transition-colors",
            TONE[a.tone],
          )}
        >
          <a.icon className="h-3 w-3" strokeWidth={1.9} />
          {a.label}
        </button>
      ))}

      <div className="flex-1" />

      <span className="font-mono text-[9.5px] text-zinc-600">
        Все действия логируются · оператор{" "}
        <span className="text-zinc-400">не имеет прав на вывод средств</span>
      </span>
    </div>
  );
}
