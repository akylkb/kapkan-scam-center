"use client";

import { Mic, Pause, PhoneOff, Volume2 } from "lucide-react";
import {
  selectCallActive,
  selectCallStart,
  useSceneValue,
  useTick,
} from "@/lib/scene/SceneProvider";
import { mmss } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Chip, cx } from "@/components/shared/ui";
import type { Target } from "@/lib/fixtures/vishing";

const BARS = 30;

/**
 * Софтфон активного звонка жертве. Таймер идёт от тика сцены, как на /crm,
 * чтобы дубли стыковались. Под волной — реплики скрипта, читаемые с крупного
 * плана: именно они объясняют зрителю, что происходит в трубке.
 */
const SCRIPT = [
  "«Вас беспокоят из службы поддержки оператора. Удобно говорить?»",
  "«Для подтверждения личности на номер придёт код — продиктуйте его.»",
  "«Код никому не передавайте, кроме сотрудника. Это служебная проверка.»",
] as const;

export function CallPanel({ victim }: { victim: Target }) {
  const tick = useTick();
  const active = useSceneValue(selectCallActive);
  const start = useSceneValue(selectCallStart);
  const seconds = Math.max(0, Math.floor((tick - start) / 4));

  return (
    <div
      className={cx(
        "flex shrink-0 flex-col border-b bg-[#0b0b0e] px-3 py-2.5 transition-colors",
        active ? "border-emerald-800/60" : "border-rose-900/60",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Исходящий вызов · {BRAND.voip.name}
        </span>
        {active ? (
          <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
            <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-emerald-400" />
            РАЗГОВОР
          </Chip>
        ) : (
          <Chip className="border-rose-700/50 bg-rose-500/10 text-rose-300">ОЖИДАНИЕ</Chip>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] text-zinc-100">{victim.name}</p>
          <p className="tnum font-mono text-[10px] text-zinc-500">
            {victim.phone} · {victim.city}
          </p>
        </div>
        <span
          className={cx(
            "tnum font-mono text-[26px] leading-none font-semibold",
            active ? "text-emerald-300" : "text-zinc-600",
          )}
        >
          {mmss(active ? seconds : 0)}
        </span>
      </div>

      {/* Звуковая волна — главный «живой» элемент на крупном плане */}
      <div className="my-2 flex h-8 items-center gap-[2px] rounded-[3px] border border-zinc-800 bg-zinc-950/70 px-1.5">
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            className={cx(
              "flex-1 origin-center rounded-[1px]",
              active ? "animate-wave bg-amber-400/80" : "h-[2px] bg-zinc-800",
            )}
            style={
              active
                ? {
                    height: "100%",
                    animationDelay: `${(i * 71) % 900}ms`,
                    animationDuration: `${680 + ((i * 131) % 720)}ms`,
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Скрипт разговора */}
      <div className="mb-2 space-y-[3px]">
        {SCRIPT.map((line, i) => (
          <p
            key={i}
            className={cx(
              "border-l-2 pl-2 text-[11px] leading-snug",
              i === 1 ? "border-amber-500/70 text-amber-200" : "border-zinc-800 text-zinc-500",
            )}
          >
            {line}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between font-mono text-[9px] text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-rose-500" />
          ЗАПИСЬ · REC-{String(5100 + (victim.lastMin % 90)).padStart(4, "0")}
        </span>
        <span className="flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          <span className="flex gap-[2px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={cx("h-2 w-[3px] rounded-[1px]", active && i < 6 ? "bg-emerald-500" : "bg-zinc-800")}
              />
            ))}
          </span>
        </span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        <CallButton icon={Pause} label="УДЕРЖ" />
        <CallButton icon={Mic} label="МИКРОФОН" />
        <CallButton icon={PhoneOff} label="СБРОС" danger />
      </div>
    </div>
  );
}

function CallButton({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof Mic;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={cx(
        "flex flex-col items-center gap-1 rounded-[3px] border py-1.5 transition-colors",
        danger
          ? "border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40"
          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      <span className="font-mono text-[8px] tracking-[0.1em]">{label}</span>
    </button>
  );
}
