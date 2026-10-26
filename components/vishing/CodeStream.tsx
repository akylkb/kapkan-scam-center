"use client";

import { KeyRound, ShieldOff } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { mmss } from "@/lib/format";
import { Chip, cx } from "@/components/shared/ui";
import type { InterceptCode } from "@/lib/fixtures/vishing";

/** Код живёт пять минут — успеть проговорить и ввести */
const TTL_SEC = 300;

/**
 * Перехват SMS-кодов — правая колонка /vishing.
 *
 * Пока живого кода нет, крупная ячейка держит состояние «ожидание»: экран
 * не пустует, но и не врёт, будто код уже пришёл. Как только жертва диктует
 * код — он вспыхивает здесь и одновременно проставляется в заявку.
 */
export function CodeStream({
  live,
  history,
  second,
}: {
  live: InterceptCode | null;
  history: InterceptCode[];
  second: number;
}) {
  const left = live ? Math.max(0, TTL_SEC - (live.agoSec + second)) : 0;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#0b0b0e] px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Перехват кодов · {BRAND.otp.name}
        </span>
        <Chip
          className={cx(
            live
              ? "border-cyan-700/50 bg-cyan-500/10 text-cyan-300"
              : "border-amber-700/50 bg-amber-500/10 text-amber-300",
          )}
        >
          <span
            className={cx(
              "h-[4px] w-[4px] animate-pulse rounded-full",
              live ? "bg-cyan-400" : "bg-amber-400",
            )}
          />
          {live ? "ПОЛУЧЕН" : "ПРИЁМ"}
        </Chip>
      </div>

      {/* Свежий код — крупно, его диктуют в трубку */}
      <div
        className={cx(
          "mt-1.5 rounded-[4px] border px-2.5 py-2.5 transition-colors",
          live ? "border-cyan-700/60 bg-cyan-500/10" : "border-dashed border-zinc-800 bg-zinc-900/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase">
            {live ? `${BRAND.telco.full} · ${live.purpose}` : "код ещё не продиктован"}
          </span>
          {live && (
            <span
              className={cx(
                "tnum font-mono text-[9.5px]",
                left > 60 ? "text-zinc-500" : left > 0 ? "text-amber-300" : "text-rose-400",
              )}
            >
              {left > 0 ? `действует ${mmss(left)}` : "истёк"}
            </span>
          )}
        </div>
        <p
          className={cx(
            "tnum mt-1 font-mono text-[34px] leading-none font-bold tracking-[0.18em]",
            live ? "text-cyan-300" : "text-zinc-700",
          )}
        >
          {live ? live.code : "— — — — — —"}
        </p>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/40 px-2 py-1">
        <ShieldOff className="h-3 w-3 shrink-0 text-zinc-600" />
        <p className="text-[9px] leading-snug text-zinc-500">
          Код запрашивается только голосом. В переписке не оставлять.
        </p>
      </div>

      {/* История перехватов — уходит за нижний край */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          История перехватов
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {history.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border-b border-zinc-900 py-[5px]">
              <KeyRound className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={2} />
              <span className="tnum shrink-0 font-mono text-[13px] tracking-[0.1em] text-zinc-400">
                {c.code}
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-600">{c.purpose}</span>
              <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-700">
                {c.agoSec < 60 ? `${c.agoSec} сек` : `${Math.floor(c.agoSec / 60)} мин`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
