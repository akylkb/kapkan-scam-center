"use client";

import { MessageSquare, Radio, ShieldOff, Fingerprint } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { usd } from "@/lib/format";
import { SceneClock } from "@/components/shared/SceneClock";
import { Chip, LiveDot, Meter } from "@/components/shared/ui";
import { GrowingNumber } from "@/components/shared/LiveNumber";
import type { ChatDesk } from "@/lib/fixtures/chatdesk";

export function ChatTopBar({
  desk,
  bannedId,
}: {
  desk: ChatDesk;
  /** Личина, которую забанил режиссёр (Ctrl+Alt+B) */
  bannedId: string | null;
}) {
  const progress = Math.min(100, (desk.done / desk.target) * 100);
  const live = desk.personas.filter(
    (p) => p.status !== "banned" && p.id !== bannedId,
  ).length;

  return (
    <header className="flex h-11 shrink-0 items-center gap-4 border-b border-zinc-800 bg-[#0b0b0e] px-3">
      {/* Логотип панели мессенджеров */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-gradient-to-br from-cyan-400 to-sky-600">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.6} />
        </div>
        <div className="leading-none">
          <span className="font-mono text-[13px] font-bold tracking-[0.1em] text-zinc-100">
            {BRAND.chat.full}
          </span>
          <span className="ml-1.5 font-mono text-[8px] text-zinc-600">
            v{BRAND.chat.version}
          </span>
        </div>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Кто сидит за машиной */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] font-bold text-zinc-300">
          {String(desk.seat).padStart(2, "0")}
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-zinc-200">{desk.alias}</span>
            <Chip className="border-cyan-700/50 bg-cyan-500/10 text-cyan-300">
              <LiveDot className="bg-cyan-400" size={4} />
              СМЕНА
            </Chip>
          </div>
          <span className="font-mono text-[9px] tracking-[0.1em] text-zinc-500">
            {desk.pool} · {desk.terminal} · {desk.real}
          </span>
        </div>
      </div>

      {/* План по деньгам за смену */}
      <div className="ml-2 w-[200px]">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            Снято за смену
          </span>
          <span className="tnum font-mono text-[10px] text-zinc-400">
            <GrowingNumber
              base={desk.done}
              perSecond={7}
              seed={`chat-${desk.seat}`}
              format={usd}
              className="text-emerald-300"
            />
            <span className="mx-1 text-zinc-700">/</span>
            {usd(desk.target)}
          </span>
        </div>
        <Meter value={progress} className="bg-gradient-to-r from-cyan-500 to-emerald-400" />
      </div>

      <div className="flex-1" />

      {/* Технические индикаторы отдела */}
      <div className="flex items-center gap-3 font-mono text-[9.5px] tracking-[0.1em] text-zinc-500">
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3 text-emerald-500" />
          ПРОКСИ {desk.proxy}
        </span>
        <span className="flex items-center gap-1">
          <Fingerprint className="h-3 w-3 text-emerald-500" />
          АНТИДЕТЕКТ ВКЛ
        </span>
        <span className="flex items-center gap-1 text-amber-500/80">
          <ShieldOff className="h-3 w-3" />
          ЛОГИ ОТКЛ
        </span>
        <span className="text-zinc-600">
          СЕССИЙ <span className="tnum text-zinc-400">{live}</span>
        </span>
        <span className="text-zinc-600">
          БАН <span className="tnum text-rose-400">{desk.personas.length - live}</span>
        </span>
      </div>

      <div className="h-5 w-px bg-zinc-800" />
      <SceneClock />
    </header>
  );
}
