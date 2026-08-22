"use client";

import { Activity, Radio, ShieldCheck, Wifi } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { usd, pct } from "@/lib/format";
import { SceneClock } from "@/components/shared/SceneClock";
import { Chip, LiveDot, Meter } from "@/components/shared/ui";
import { GrowingNumber } from "@/components/shared/LiveNumber";
import type { Workspace } from "@/lib/fixtures/workspace";

export function TopBar({ ws }: { ws: Workspace }) {
  const progress = Math.min(100, (ws.done / ws.target) * 100);

  return (
    <header className="flex h-11 shrink-0 items-center gap-4 border-b border-zinc-800 bg-[#0b0b0e] px-3">
      {/* Логотип CRM */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-gradient-to-br from-emerald-500 to-emerald-700">
          <Activity className="h-3.5 w-3.5 text-zinc-950" strokeWidth={3} />
        </div>
        <div className="leading-none">
          <span className="font-mono text-[13px] font-bold tracking-[0.1em] text-zinc-100">
            {BRAND.crm.full}
          </span>
          <span className="ml-1.5 font-mono text-[8px] text-zinc-600">
            v{BRAND.crm.version}
          </span>
        </div>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      {/* Кто сидит за машиной: псевдоним + деск + внутренний номер */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] font-bold text-zinc-300">
          {ws.alias.split(" ").map((p) => p[0]).join("")}
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-zinc-200">{ws.alias}</span>
            <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
              <LiveDot className="bg-emerald-400" size={4} />
              ONLINE
            </Chip>
          </div>
          <span className="font-mono text-[9px] tracking-[0.1em] text-zinc-500">
            {ws.desk} · EXT {ws.extension} · SEAT-{String(ws.seat).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* План смены — постоянно тикающая полоска, читается даже боковым зрением */}
      <div className="ml-2 w-[190px]">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            План смены
          </span>
          <span className="tnum font-mono text-[10px] text-zinc-400">
            <GrowingNumber
              base={ws.done}
              perSecond={9}
              seed={`plan-${ws.seat}`}
              format={usd}
              className="text-emerald-300"
            />
            <span className="mx-1 text-zinc-700">/</span>
            {usd(ws.target)}
          </span>
        </div>
        <Meter value={progress} className="bg-gradient-to-r from-emerald-600 to-emerald-400" />
      </div>

      <div className="flex-1" />

      {/* Технические индикаторы: без них верхняя панель выглядит пустой */}
      <div className="flex items-center gap-3 font-mono text-[9.5px] tracking-[0.1em] text-zinc-500">
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3 text-emerald-500" />
          SIP · {BRAND.voip.name}
        </span>
        <span className="flex items-center gap-1">
          <Wifi className="h-3 w-3 text-emerald-500" />
          VPN NL-04
        </span>
        <span className="flex items-center gap-1 text-amber-500/80">
          <ShieldCheck className="h-3 w-3" />
          ЗАПИСЬ ВКЛ
        </span>
        <span className="text-zinc-600">
          КОНВ <span className="text-zinc-400">{pct(0.124)}</span>
        </span>
      </div>

      <div className="h-5 w-px bg-zinc-800" />
      <SceneClock />
    </header>
  );
}
