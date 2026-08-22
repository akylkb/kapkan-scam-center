"use client";

import { useSecond } from "@/lib/scene/SceneProvider";
import { SCENE_START_MINUTES } from "@/lib/scene/store";
import { clock } from "@/lib/format";

/**
 * Часы нескольких столиц — деталь, которая мгновенно читается как
 * «международная контора». Идут от условного времени сцены (16:42),
 * а не от системных часов: иначе дубли не будут стыковаться по монтажу.
 */
const ZONES = [
  { label: "BISHKEK", offset: 0 },
  { label: "BERLIN", offset: -4 },
  { label: "LONDON", offset: -5 },
  { label: "TORONTO", offset: -10 },
] as const;

export function SceneClock() {
  const second = useSecond();
  const minutes = SCENE_START_MINUTES + second / 60;

  return (
    <div className="flex items-center gap-3.5">
      {ZONES.map((z) => (
        <div key={z.label} className="flex flex-col items-end leading-none">
          <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-600">{z.label}</span>
          <span className="tnum font-mono text-[12px] text-zinc-300">
            {clock(minutes, z.offset)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Одиночные крупные часы для экрана на стену */
export function BigClock() {
  const second = useSecond();
  const minutes = SCENE_START_MINUTES + second / 60;
  return (
    <span className="tnum font-mono text-[26px] leading-none font-semibold text-zinc-300">
      {clock(minutes)}
      <span className="ml-1 text-[15px] text-zinc-600">:{String(second % 60).padStart(2, "0")}</span>
    </span>
  );
}
