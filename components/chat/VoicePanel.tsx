"use client";

import { Mic, PhoneOff, Waves } from "lucide-react";
import { useTick } from "@/lib/scene/SceneProvider";
import { mmss } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { VOICE_PRESETS } from "@/lib/fixtures/pools";
import type { Thread } from "@/lib/fixtures/threads";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { Chip, Meter, cx } from "@/components/shared/ui";

const BARS = 34;

/**
 * Подмена голоса.
 *
 * По умолчанию панель в покое: ни таймера, ни осциллограммы. Разговор
 * начинается по кнопке (или по Ctrl+Alt+1) и всегда с 00:00 — иначе на
 * монтаже таймер не состыкуется между дублями.
 *
 * Осциллограмма собрана из CSS-анимаций с задержкой от индекса — один
 * общий тикер сцены вместо трёх десятков таймеров, и стоп-кадр
 * (Ctrl+Alt+0) гасит её вместе со всем остальным.
 */
export function VoicePanel({
  thread,
  seat,
  callStart,
  onCall,
  onHangUp,
}: {
  thread: Thread;
  seat: number;
  /** Тик начала разговора; null — трубка не поднята */
  callStart: number | null;
  onCall: (tick: number) => void;
  onHangUp: () => void;
}) {
  const tick = useTick();
  const active = callStart !== null;
  const seconds = active ? Math.max(0, Math.floor((tick - callStart) / 4)) : 0;

  // Пресет зависит от схемы: «служба безопасности» звучит не так, как курьер
  const preset =
    VOICE_PRESETS[
      (thread.scheme === "delivery" ? 0 : thread.scheme === "romance" ? 3 : 2) %
        VOICE_PRESETS.length
    ];

  return (
    <div className="flex h-full flex-col px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Подмена голоса · {BRAND.voice.name}
        </span>
        {active ? (
          <Chip className="border-cyan-700/50 bg-cyan-500/10 text-cyan-300">
            <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-cyan-400" />
            В ЭФИРЕ
          </Chip>
        ) : (
          <Chip className="border-zinc-700/60 bg-zinc-800/60 text-zinc-500">ГОТОВ</Chip>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] text-zinc-200">
            {thread.country.flag} {thread.name}
          </p>
          <p className="truncate font-mono text-[9px] text-zinc-600">{thread.phone}</p>
        </div>
        <span
          className={cx(
            "tnum font-mono text-[22px] leading-none font-semibold",
            active ? "text-cyan-300" : "text-zinc-700",
          )}
        >
          {mmss(seconds)}
        </span>
      </div>

      {/* Осциллограмма — главный «живой» элемент на крупном плане */}
      <div className="my-2 flex h-9 items-center gap-[2px] rounded-[3px] border border-zinc-800 bg-zinc-950/70 px-1.5">
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            className={cx(
              "flex-1 origin-center rounded-[1px]",
              active ? "animate-wave bg-cyan-400/80" : "h-[2px] bg-zinc-800",
            )}
            style={
              active
                ? {
                    height: "100%",
                    animationDelay: `${(i * 61) % 900}ms`,
                    animationDuration: `${640 + ((i * 149) % 760)}ms`,
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Пресет и его параметры */}
      <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11.5px] text-zinc-200">
            <Waves className="h-3 w-3 text-cyan-400" />
            {preset.label}
          </span>
          <span className="tnum font-mono text-[9.5px] text-emerald-300">
            схожесть{" "}
            <DriftNumber
              base={94}
              amplitude={2.4}
              seed={`voice-${seat}-${thread.id}`}
              format={(v) => `${v.toFixed(1)}%`}
            />
          </span>
        </div>

        <div className="mt-1.5 space-y-1">
          <Slider label="Высота" value={50 + preset.pitch * 6} caption={`${preset.pitch > 0 ? "+" : ""}${preset.pitch} пт`} />
          <Slider label="Темп" value={preset.pace - 40} caption={`${preset.pace}%`} />
          <Slider label="Шум линии" value={28} caption="GSM 8 кГц" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between font-mono text-[9px] text-zinc-600">
        {active ? (
          <>
            <span className="flex items-center gap-1">
              <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-rose-500" />
              ЗАПИСЬ ОТКЛ · буфер 0 сек
            </span>
            <span className="tnum">
              задержка{" "}
              <DriftNumber
                base={128}
                amplitude={22}
                seed={`lat-${seat}`}
                format={(v) => `${Math.round(v)} мс`}
                className="text-zinc-400"
              />
            </span>
          </>
        ) : (
          <>
            <span>ЛИНИЯ СВОБОДНА · ЗАПИСЬ ОТКЛ</span>
            <span>шлюз {BRAND.voip.name}</span>
          </>
        )}
      </div>

      {/*
        Активна всегда одна кнопка из двух: на крупном плане должно быть
        видно, что именно актёр сейчас нажимает.
      */}
      <div className="mt-1.5 grid grid-cols-2 gap-1">
        <button
          onClick={() => onCall(tick)}
          disabled={active}
          className={cx(
            "flex items-center justify-center gap-1.5 rounded-[3px] border py-1.5 text-[10.5px] transition-colors",
            active
              ? "border-zinc-800 bg-zinc-900/50 text-zinc-600"
              : "border-cyan-800/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40",
          )}
        >
          <Mic className="h-3 w-3" strokeWidth={1.9} />
          Позвонить с подменой
        </button>
        <button
          onClick={onHangUp}
          disabled={!active}
          className={cx(
            "flex items-center justify-center gap-1.5 rounded-[3px] border py-1.5 text-[10.5px] transition-colors",
            active
              ? "border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-600",
          )}
        >
          <PhoneOff className="h-3 w-3" strokeWidth={1.9} />
          Сбросить
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[62px] shrink-0 font-mono text-[8.5px] tracking-[0.1em] text-zinc-600 uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1">
        <Meter value={value} className="bg-cyan-500" />
      </span>
      <span className="tnum w-[54px] shrink-0 text-right font-mono text-[9px] text-zinc-500">
        {caption}
      </span>
    </div>
  );
}
