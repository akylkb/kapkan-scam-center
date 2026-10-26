"use client";

import { Headphones, PhoneCall, ShieldQuestion } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { SceneClock } from "@/components/shared/SceneClock";
import { Chip, LiveDot } from "@/components/shared/ui";
import type { VishingDesk } from "@/lib/fixtures/vishing";

/**
 * Шапка экрана вишинга. Слева — внутренняя консоль (HOTLINE·OPS), но
 * «вывеска» звонка косит под службу поддержки оператора Q: именно ей
 * Мара представляется жертве.
 */
export function VishingTopBar({ desk }: { desk: VishingDesk }) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-4 border-b border-zinc-800 bg-[#0b0b0e] px-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-gradient-to-br from-amber-500 to-amber-700">
          <Headphones className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.6} />
        </div>
        <div className="leading-none">
          <span className="font-mono text-[13px] font-bold tracking-[0.1em] text-zinc-100">
            {BRAND.support.full}
          </span>
          <span className="ml-1.5 font-mono text-[8px] text-zinc-600">
            v{BRAND.support.version}
          </span>
        </div>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Легенда звонка: от чьего имени представляется оператор */}
      <div className="flex items-center gap-2">
        <ShieldQuestion className="h-4 w-4 text-amber-400" strokeWidth={1.8} />
        <div className="leading-tight">
          <span className="text-[12px] font-medium text-zinc-200">
            Служба поддержки · {BRAND.telco.full}
          </span>
          <div className="font-mono text-[9px] tracking-[0.1em] text-zinc-500">
            исходящая линия {desk.line} · легенда «подтверждение номера»
          </div>
        </div>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] font-bold text-zinc-300">
          {desk.alias[0]}
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-zinc-200">{desk.alias}</span>
            <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-300">
              <LiveDot className="bg-amber-400" size={4} />
              НА ЛИНИИ
            </Chip>
          </div>
          <span className="font-mono text-[9px] tracking-[0.1em] text-zinc-500">
            {desk.terminal} · SEAT-{String(desk.seat).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
          <PhoneCall className="h-3 w-3" />
          ЗАПИСЬ ЗВОНКА
        </Chip>
        <SceneClock />
      </div>
    </header>
  );
}
