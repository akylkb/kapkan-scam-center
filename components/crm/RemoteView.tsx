"use client";

import { Eye, Minus, MousePointer2, Square, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { usdCents } from "@/lib/format";
import { Sparkline, trendSeries } from "@/components/shared/Sparkline";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";
import type { Lead } from "@/lib/fixtures/leads";

/**
 * Плавающее окно «вижу экран клиента».
 *
 * Самая говорящая деталь из материалов расследований: оператор держит
 * удалённый доступ открытым сбоку и наблюдает за жертвой в реальном времени,
 * пока разговаривает с ней по телефону.
 */
export function RemoteView({ lead }: { lead: Lead }) {
  const tick = useTick();
  const series = trendSeries(lead.age, 54, 1.1);

  // Курсор жертвы медленно ползает по окну — это сразу читается как «живой экран»
  const t = tick / 4;
  const cursorX = 50 + Math.sin(t / 3.7) * 32 + Math.sin(t / 1.3) * 6;
  const cursorY = 50 + Math.cos(t / 4.9) * 26 + Math.sin(t / 2.1) * 5;

  return (
    // Окно висит над таблицей, а не над правой колонкой: софтфон и карточка
    // клиента должны оставаться открытыми — по ним играет актёр.
    <div className="pointer-events-none absolute right-[378px] bottom-[46px] z-30 w-[286px] overflow-hidden rounded-[4px] border border-zinc-700 bg-[#0a0a0c] shadow-[0_18px_48px_rgba(0,0,0,0.75)]">
      {/* Заголовок окна */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-2 py-1">
        <Eye className="h-3 w-3 shrink-0 text-emerald-400" />
        <span className="truncate font-mono text-[9px] tracking-wide text-zinc-300">
          {BRAND.rat.name} · {lead.name} · {lead.ip}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-zinc-600">
          <Minus className="h-2.5 w-2.5" />
          <Square className="h-2 w-2" />
          <X className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* Содержимое: миниатюра терминала жертвы */}
      <div className="relative">
        <div className="flex items-center justify-between border-b border-zinc-900 bg-[#0d1117] px-2 py-1">
          <span className="font-mono text-[8px] tracking-[0.16em] text-amber-400/90">
            {BRAND.broker.short}
          </span>
          <span className="tnum font-mono text-[10px] font-semibold text-emerald-400">
            <DriftNumber
              base={Math.max(1200, lead.deposit * 2.4 + 8400)}
              amplitude={180}
              seed={`rv-${lead.id}`}
              format={usdCents}
            />
          </span>
        </div>

        <div className="bg-[#0d1117] px-1 pt-1">
          <Sparkline values={series} height={62} />
        </div>

        <div className="flex gap-1 bg-[#0d1117] px-2 pt-1 pb-2">
          <span className="flex-1 rounded-[2px] bg-emerald-600/80 py-[3px] text-center font-mono text-[8px] font-bold text-zinc-950">
            BUY
          </span>
          <span className="flex-1 rounded-[2px] bg-rose-600/80 py-[3px] text-center font-mono text-[8px] font-bold text-zinc-950">
            SELL
          </span>
          <span className="flex-1 rounded-[2px] border border-zinc-700 py-[3px] text-center font-mono text-[8px] text-zinc-400">
            ВЫВОД
          </span>
        </div>

        {/* Курсор жертвы */}
        <MousePointer2
          className="absolute h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] transition-none"
          style={{ left: `${cursorX}%`, top: `${cursorY}%` }}
          fill="white"
        />
      </div>

      {/* Статусная строка */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-2 py-[3px]">
        <span className="flex items-center gap-1 font-mono text-[8px] text-emerald-400">
          <span className={cx("h-[4px] w-[4px] animate-pulse rounded-full bg-emerald-400")} />
          УПРАВЛЕНИЕ РАЗРЕШЕНО
        </span>
        <span className="tnum font-mono text-[8px] text-zinc-600">
          {12 + (tick % 7)} FPS · 34 ms
        </span>
      </div>
    </div>
  );
}
