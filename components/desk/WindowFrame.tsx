"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/shared/ui";

/**
 * Рамка окна «приложения» на рабочем столе. Три кнопки-кружка и заголовок —
 * ровно столько хрома, сколько нужно, чтобы прямоугольник читался в кадре
 * как отдельное окно ОС, а не как панель внутри одного приложения.
 */
export function WindowFrame({
  title,
  badge,
  accent = "bg-zinc-500",
  right,
  children,
  className,
}: {
  title: ReactNode;
  badge?: ReactNode;
  accent?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[6px] border border-zinc-800 bg-[#0d0d10] shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      <header className="flex h-7 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-2.5">
        <span className="flex gap-1.5">
          <span className="h-[9px] w-[9px] rounded-full bg-rose-500/70" />
          <span className="h-[9px] w-[9px] rounded-full bg-amber-500/70" />
          <span className="h-[9px] w-[9px] rounded-full bg-emerald-500/70" />
        </span>
        <span className={cx("ml-1 h-[7px] w-[7px] shrink-0 rounded-[2px]", accent)} />
        <span className="truncate font-mono text-[10px] font-medium tracking-[0.08em] text-zinc-300">
          {title}
        </span>
        {badge}
        {right && <span className="ml-auto">{right}</span>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  );
}
