"use client";

import { KeyRound, ShieldOff } from "lucide-react";
import { useSecond } from "@/lib/scene/SceneProvider";
import { BRAND } from "@/lib/brand";
import type { OtpCode } from "@/lib/fixtures/chatdesk";
import { mmss, usd } from "@/lib/format";
import { Chip, cx } from "@/components/shared/ui";

/** Код живёт пять минут — этого хватает, чтобы жертву успели уговорить */
const TTL_SEC = 300;

/**
 * Перехваченные SMS-коды.
 *
 * Самый сильный кадр экрана: жертва диктует код «сотруднику банка», и он
 * появляется здесь раньше, чем она успевает договорить.
 */
export function OtpPanel({ codes }: { codes: OtpCode[] }) {
  const second = useSecond();
  const [fresh, ...rest] = codes;
  const left = Math.max(0, TTL_SEC - (fresh.agoSec + second));

  return (
    <div className="flex h-full flex-col px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Перехват кодов · {BRAND.otp.name}
        </span>
        <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-300">
          <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-amber-400" />
          ПРИЁМ
        </Chip>
      </div>

      {/* Свежий код — крупно, его диктуют в трубку */}
      <div
        className={cx(
          "mt-1.5 rounded-[4px] border px-2.5 py-2",
          left > 0
            ? "border-cyan-700/60 bg-cyan-500/10"
            : "border-zinc-800 bg-zinc-900/50",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase">
            {fresh.issuer} · {fresh.purpose}
          </span>
          <span
            className={cx(
              "tnum font-mono text-[9.5px]",
              left > 60 ? "text-zinc-500" : left > 0 ? "text-amber-300" : "text-rose-400",
            )}
          >
            {left > 0 ? `действует ${mmss(left)}` : "истёк"}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span
            className={cx(
              "tnum font-mono text-[30px] leading-none font-bold tracking-[0.16em]",
              left > 0 ? "text-cyan-300" : "text-zinc-600",
            )}
          >
            {fresh.code}
          </span>
          <span className="tnum font-mono text-[12px] text-zinc-300">{usd(fresh.amount)}</span>
        </div>
        <p className="mt-1 font-mono text-[8.5px] text-zinc-600">
          диалог {fresh.usedFor} · номер жертвы подменён на наш шлюз
        </p>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/40 px-2 py-1">
        <ShieldOff className="h-3 w-3 shrink-0 text-zinc-600" />
        <p className="text-[9.5px] leading-snug text-zinc-500">
          Код диктуется только голосом. В переписке коды не оставлять — переписку жертва
          покажет в банке.
        </p>
      </div>

      {/* История перехватов — уходит за нижний край */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          История перехватов
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rest.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border-b border-zinc-900 py-[4px]">
              <KeyRound className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={2} />
              <span className="tnum shrink-0 font-mono text-[12px] tracking-[0.1em] text-zinc-400">
                {c.code}
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-600">
                {c.issuer} · {c.purpose}
              </span>
              <span className="tnum shrink-0 font-mono text-[9.5px] text-zinc-500">
                {usd(c.amount)}
              </span>
              <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-700">
                {c.agoSec < 60 ? `${c.agoSec} сек` : `${Math.floor(c.agoSec / 60)} мин`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
