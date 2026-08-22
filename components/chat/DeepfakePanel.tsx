"use client";

import { TriangleAlert, Video } from "lucide-react";
import { useTick } from "@/lib/scene/SceneProvider";
import { BRAND } from "@/lib/brand";
import { FACE_AVATARS } from "@/lib/fixtures/pools";
import type { Thread } from "@/lib/fixtures/threads";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { Chip, cx } from "@/components/shared/ui";

/**
 * Видеозвонок с подменой лица.
 *
 * Слева — то, что снимает камера оператора, справа — то, что видит жертва.
 * Между ними стрелка и цифры нагрузки: именно этот кадр объясняет зрителю,
 * что «видел своими глазами» больше ничего не значит.
 */
export function DeepfakePanel({ thread, seat }: { thread: Thread; seat: number }) {
  const tick = useTick();
  const avatar = FACE_AVATARS[(seat - 1) % FACE_AVATARS.length];

  return (
    <div className="flex h-full flex-col px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Подмена лица · {BRAND.deepfake.name}
        </span>
        <Chip className="border-fuchsia-700/50 bg-fuchsia-500/10 text-fuchsia-300">
          <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-fuchsia-400" />
          РЕНДЕР
        </Chip>
      </div>

      {/* Два превью: камера и то, что уходит в эфир */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <Preview label="КАМЕРА" caption="оператор" tone="zinc">
          <FaceMesh tick={tick} />
        </Preview>
        <span className="shrink-0 font-mono text-[13px] text-cyan-500">→</span>
        <Preview label="В ЭФИРЕ" caption={avatar.id} tone="fuchsia">
          <FaceSwap tick={tick} />
        </Preview>
      </div>

      {/* Нагрузка — цифры должны шевелиться, иначе окно выглядит скриншотом */}
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        <Stat label="FPS" seed={`fps-${seat}`} base={24} amp={2.6} suffix="" />
        <Stat label="GPU" seed={`gpu-${seat}`} base={78} amp={9} suffix="%" />
        <Stat label="ЗАДЕРЖКА" seed={`dlat-${seat}`} base={210} amp={38} suffix=" мс" />
      </div>

      {/* Ограничение технологии — деталь, которая и делает сцену достоверной */}
      <div className="mt-1.5 flex items-start gap-1.5 rounded-[3px] border border-amber-800/50 bg-amber-950/25 px-2 py-1.5">
        <TriangleAlert className="mt-[1px] h-3 w-3 shrink-0 text-amber-400" strokeWidth={2} />
        <p className="text-[10px] leading-snug text-amber-200/80">
          Не поворачивать голову больше 30° и не заводить руку перед лицом — маска
          срывается. При потере трекинга сразу ссылаться на связь.
        </p>
      </div>

      {/* Библиотека лиц: откуда взят образец */}
      <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
        <p className="pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Библиотека лиц
        </p>
        {FACE_AVATARS.map((f) => (
          <button
            key={f.id}
            className={cx(
              "mb-[3px] flex w-full items-center gap-2 rounded-[3px] border px-1.5 py-1 text-left transition-colors",
              f.id === avatar.id
                ? "border-fuchsia-700/60 bg-fuchsia-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700",
            )}
          >
            <span
              className={cx(
                "shrink-0 font-mono text-[9px] font-bold",
                f.id === avatar.id ? "text-fuchsia-300" : "text-zinc-500",
              )}
            >
              {f.id}
            </span>
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-zinc-400">
              {f.label}
            </span>
            <span className="shrink-0 font-mono text-[8.5px] text-zinc-700">{f.src}</span>
          </button>
        ))}
      </div>

      <button className="mt-1.5 flex items-center justify-center gap-1.5 rounded-[3px] border border-fuchsia-800/60 bg-fuchsia-950/40 py-1.5 text-[10.5px] text-fuchsia-300 transition-colors hover:bg-fuchsia-900/40">
        <Video className="h-3 w-3" strokeWidth={1.9} />
        Видеозвонок · {thread.name.split(" ")[0]}
      </button>
    </div>
  );
}

function Preview({
  label,
  caption,
  tone,
  children,
}: {
  label: string;
  caption: string;
  tone: "zinc" | "fuchsia";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "relative aspect-[16/10] min-w-0 flex-1 overflow-hidden rounded-[3px] border bg-zinc-950",
        tone === "fuchsia" ? "border-fuchsia-800/60" : "border-zinc-800",
      )}
    >
      {children}
      <span
        className={cx(
          "absolute top-1 left-1 rounded-[2px] px-1 font-mono text-[7.5px] font-bold tracking-[0.1em]",
          tone === "fuchsia" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-zinc-800 text-zinc-400",
        )}
      >
        {label}
      </span>
      <span className="absolute right-1 bottom-1 font-mono text-[7.5px] text-zinc-600">
        {caption}
      </span>
    </div>
  );
}

/** Сетка точек трекинга поверх «камеры» */
function FaceMesh({ tick }: { tick: number }) {
  return (
    <svg viewBox="0 0 100 62" className="h-full w-full">
      <ellipse cx="50" cy="34" rx="17" ry="21" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
      <path d="M33 58 Q50 46 67 58 L67 62 L33 62 Z" fill="#18181b" />
      {LANDMARKS.map(([x, y], i) => {
        // Дрожание точек — функция от тика сцены, без Math.random()
        const dx = Math.sin((tick + i * 7) / 9) * 0.5;
        const dy = Math.cos((tick + i * 5) / 11) * 0.4;
        return (
          <circle key={i} cx={x + dx} cy={y + dy} r="0.7" fill="#22d3ee" opacity="0.85" />
        );
      })}
      <rect
        x="30"
        y="12"
        width="40"
        height="45"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="0.5"
        strokeDasharray="3 2"
        opacity="0.6"
      />
    </svg>
  );
}

/** Подставленное лицо: то же положение, другой человек */
function FaceSwap({ tick }: { tick: number }) {
  const shift = Math.sin(tick / 13) * 0.8;
  return (
    <svg viewBox="0 0 100 62" className="h-full w-full">
      <defs>
        <linearGradient id="swap-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3244" />
          <stop offset="100%" stopColor="#241d28" />
        </linearGradient>
      </defs>
      <rect width="100" height="62" fill="#0f0d12" />
      <ellipse cx={50 + shift} cy="34" rx="17" ry="21" fill="url(#swap-skin)" />
      <ellipse cx={44 + shift} cy="30" rx="2.4" ry="1.5" fill="#0f0d12" />
      <ellipse cx={56 + shift} cy="30" rx="2.4" ry="1.5" fill="#0f0d12" />
      <path
        d={`M${44 + shift} 42 Q${50 + shift} 45 ${56 + shift} 42`}
        stroke="#0f0d12"
        strokeWidth="1"
        fill="none"
      />
      <path d={`M${33 + shift} 58 Q${50 + shift} 46 ${67 + shift} 58 L67 62 L33 62 Z`} fill="#2a2230" />
      {/* Полоса развёртки: выдаёт, что картинка синтезирована */}
      <rect
        x="0"
        y={(tick * 1.4) % 62}
        width="100"
        height="1.5"
        fill="#e879f9"
        opacity="0.12"
      />
    </svg>
  );
}

const LANDMARKS: readonly (readonly [number, number])[] = [
  [42, 24], [50, 22], [58, 24], [38, 30], [44, 30], [50, 31], [56, 30], [62, 30],
  [40, 37], [50, 38], [60, 37], [43, 44], [50, 46], [57, 44], [36, 34], [64, 34],
  [46, 50], [54, 50], [50, 15], [50, 54],
];

function Stat({
  label,
  seed,
  base,
  amp,
  suffix,
}: {
  label: string;
  seed: string;
  base: number;
  amp: number;
  suffix: string;
}) {
  return (
    <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-1.5 py-1">
      <p className="font-mono text-[7.5px] tracking-[0.12em] text-zinc-600 uppercase">{label}</p>
      <DriftNumber
        base={base}
        amplitude={amp}
        seed={seed}
        format={(v) => `${Math.round(v)}${suffix}`}
        className="font-mono text-[13px] leading-none text-zinc-200"
      />
    </div>
  );
}
