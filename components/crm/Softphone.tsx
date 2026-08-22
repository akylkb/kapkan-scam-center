"use client";

import {
  Mic,
  MicOff,
  Pause,
  PhoneForwarded,
  PhoneOff,
  Volume2,
} from "lucide-react";
import {
  selectCallActive,
  selectCallStart,
  selectLastFlag,
  selectLastName,
  useSceneValue,
  useTick,
} from "@/lib/scene/SceneProvider";
import { mmss } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Chip, cx } from "@/components/shared/ui";
import type { Lead } from "@/lib/fixtures/leads";

const BARS = 26;

export function Softphone({ lead }: { lead: Lead }) {
  const tick = useTick();
  const active = useSceneValue(selectCallActive);
  const start = useSceneValue(selectCallStart);
  const overrideName = useSceneValue(selectLastName);
  const overrideFlag = useSceneValue(selectLastFlag);

  const seconds = Math.max(0, Math.floor((tick - start) / 4));
  const name = overrideName || lead.name;
  const flag = overrideFlag || lead.country.flag;

  return (
    <div
      className={cx(
        "shrink-0 border-t bg-[#0b0b0e] px-2.5 py-2 transition-colors",
        active ? "border-emerald-800/60" : "border-rose-900/60",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Софтфон · {BRAND.voip.name}
        </span>
        {active ? (
          <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
            <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-emerald-400" />
            РАЗГОВОР
          </Chip>
        ) : (
          <Chip className="border-rose-700/50 bg-rose-500/10 text-rose-300">ЗВОНОК ЗАВЕРШЁН</Chip>
        )}
      </div>

      {/* Кто на линии + таймер */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[12px] text-zinc-200">
            <span>{flag}</span>
            {name}
          </p>
          <p className="font-mono text-[9.5px] text-zinc-600">
            {lead.phone} · линия {BRAND.voip.name}-{lead.country.code}
          </p>
        </div>
        <span
          className={cx(
            "tnum font-mono text-[24px] leading-none font-semibold",
            active ? "text-emerald-300" : "text-zinc-600",
          )}
        >
          {mmss(active ? seconds : 0)}
        </span>
      </div>

      {/* Звуковая волна: главный «живой» элемент на крупном плане */}
      <div className="my-2 flex h-8 items-center gap-[2px] rounded-[3px] border border-zinc-800 bg-zinc-950/70 px-1.5">
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            className={cx(
              "flex-1 origin-center rounded-[1px]",
              active ? "animate-wave bg-emerald-400/80" : "h-[2px] bg-zinc-800",
            )}
            style={
              active
                ? {
                    height: "100%",
                    animationDelay: `${(i * 73) % 900}ms`,
                    animationDuration: `${700 + ((i * 137) % 700)}ms`,
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Индикатор записи + уровень входа */}
      <div className="mb-2 flex items-center justify-between font-mono text-[9px] text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-rose-500" />
          ЗАПИСЬ · REC-{String(4820 + (lead.age % 90)).padStart(4, "0")}
        </span>
        <span className="flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          <span className="flex gap-[2px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={cx(
                  "h-2 w-[3px] rounded-[1px]",
                  active && i < 6 ? "bg-emerald-500" : "bg-zinc-800",
                )}
              />
            ))}
          </span>
        </span>
      </div>

      {/* Кнопки управления вызовом */}
      <div className="grid grid-cols-4 gap-1">
        <CallButton icon={Pause} label="УДЕРЖ" />
        <CallButton icon={PhoneForwarded} label="ПЕРЕВОД" />
        <CallButton icon={active ? Mic : MicOff} label="МИКРОФОН" />
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
