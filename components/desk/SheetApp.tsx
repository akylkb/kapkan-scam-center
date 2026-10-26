"use client";

import { Table2 } from "lucide-react";
import { som } from "@/lib/format";
import { Chip, cx } from "@/components/shared/ui";
import { WindowFrame } from "./WindowFrame";
import type { SheetRow } from "@/lib/fixtures/desktop";

/**
 * Окно таблицы — «база» с именами и номерами, открытая в редакторе таблиц.
 * Нумерованные строки и буквенная шапка делают прямоугольник узнаваемой
 * таблицей на общем плане, без единого реального контакта в кадре.
 */
const COLS = ["A", "B", "C", "D", "E", "F"] as const;
const HEAD = ["Имя", "Телефон", "Город", "Банк", "Сумма", "Статус"] as const;

const STATUS_CLS: Record<string, string> = {
  оплатил: "text-emerald-400",
  "в работе": "text-amber-300",
  отказ: "text-rose-400",
  "не берёт": "text-zinc-500",
  перезвон: "text-sky-300",
  дозвон: "text-zinc-400",
};

export function SheetApp({ rows }: { rows: SheetRow[] }) {
  const grid = "grid-cols-[28px_1.4fr_1fr_0.8fr_1.1fr_0.8fr_0.7fr]";

  return (
    <WindowFrame
      title="база_клиентов.xlsx"
      accent="bg-emerald-500"
      badge={
        <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
          <Table2 className="h-3 w-3" />
          {rows.length} строк
        </Chip>
      }
    >
      {/* Буквенная шапка столбцов */}
      <div className={cx("grid shrink-0 border-b border-zinc-800 bg-zinc-900/60", grid)}>
        <span className="border-r border-zinc-800 py-[2px] text-center font-mono text-[8px] text-zinc-600" />
        {COLS.map((c) => (
          <span
            key={c}
            className="border-r border-zinc-800 py-[2px] text-center font-mono text-[8px] text-zinc-600"
          >
            {c}
          </span>
        ))}
      </div>

      {/* Строка заголовков базы */}
      <div className={cx("grid shrink-0 border-b border-zinc-800 bg-zinc-900/30", grid)}>
        <span className="border-r border-zinc-800 py-1 text-center font-mono text-[8px] text-zinc-600">1</span>
        {HEAD.map((h) => (
          <span
            key={h}
            className="truncate border-r border-zinc-800 px-1.5 py-1 font-mono text-[9px] font-semibold tracking-[0.06em] text-zinc-400 uppercase"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Данные — уходят за нижний край */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((r, i) => (
          <div
            key={`${r.phone}-${i}`}
            className={cx("grid border-b border-zinc-900/80", grid, i % 2 === 1 && "bg-zinc-900/20")}
          >
            <span className="border-r border-zinc-800/60 py-[5px] text-center font-mono text-[8px] text-zinc-700">
              {i + 2}
            </span>
            <span className="truncate border-r border-zinc-800/40 px-1.5 py-[5px] text-[10.5px] text-zinc-300">
              {r.name}
            </span>
            <span className="tnum truncate border-r border-zinc-800/40 px-1.5 py-[5px] font-mono text-[10px] text-zinc-400">
              {r.phone}
            </span>
            <span className="truncate border-r border-zinc-800/40 px-1.5 py-[5px] text-[10px] text-zinc-500">
              {r.city}
            </span>
            <span className="truncate border-r border-zinc-800/40 px-1.5 py-[5px] text-[10px] text-zinc-500">
              {r.bank}
            </span>
            <span className="tnum truncate border-r border-zinc-800/40 px-1.5 py-[5px] text-right font-mono text-[10px] text-zinc-300">
              {som(r.amount)}
            </span>
            <span
              className={cx(
                "truncate px-1.5 py-[5px] font-mono text-[9px] tracking-[0.04em]",
                STATUS_CLS[r.status] ?? "text-zinc-500",
              )}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </WindowFrame>
  );
}
