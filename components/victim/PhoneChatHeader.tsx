"use client";

import { ChevronLeft, Phone, Video } from "lucide-react";
import type { Persona } from "@/lib/fixtures/personas";
import { cx } from "@/components/shared/ui";

/**
 * Шапка переписки на телефоне.
 *
 * Имя и аватар — личины, а не оператора: жертва весь дубль разговаривает
 * с «Мариной из объявления» и никогда не узнает, кто там на самом деле.
 */
export function PhoneChatHeader({
  persona,
  typing,
  accent,
}: {
  persona: Persona;
  /** Чатер набирает реплику прямо сейчас */
  typing: boolean;
  accent: { text: string; dot: string };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-[#101013] px-2">
      <ChevronLeft className="h-6 w-6 shrink-0 text-zinc-500" strokeWidth={1.7} />

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[13px] font-medium text-zinc-200">
        {persona.initials}
      </span>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[14.5px] font-medium text-zinc-100">{persona.name}</p>
        {typing ? (
          <p className={cx("flex items-center gap-1 text-[11px]", accent.text)}>
            печатает
            <span className="flex gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cx("h-[3px] w-[3px] animate-blink rounded-full", accent.dot)}
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </span>
          </p>
        ) : (
          <p className="truncate text-[11px] text-zinc-500">в сети</p>
        )}
      </div>

      {/* Декорация: звонок на телефоне жертвы поднимает не она */}
      <Video className="h-5 w-5 shrink-0 text-zinc-600" strokeWidth={1.7} />
      <Phone className="mr-1.5 h-[18px] w-[18px] shrink-0 text-zinc-600" strokeWidth={1.7} />
    </header>
  );
}
