"use client";

import { useSecond } from "@/lib/scene/SceneProvider";
import { SCENE_START_MINUTES } from "@/lib/scene/store";
import { clock } from "@/lib/format";

/**
 * Строка состояния телефона: время, сеть, батарея.
 *
 * Время идёт от часов сцены, а не от системных: иначе на крупном плане
 * телефон покажет «02:47» ночной смены, а по сюжету идёт рабочий день.
 */
export function PhoneStatusBar() {
  const second = useSecond();

  return (
    <div className="flex h-11 shrink-0 items-end justify-between px-7 pb-1">
      <span className="tnum text-[14px] font-semibold text-zinc-100">
        {clock(SCENE_START_MINUTES + second / 60)}
      </span>

      <div className="flex items-center gap-1.5">
        {/* Уровень сигнала: четыре растущих штриха, последний приглушён */}
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h, i) => (
            <span
              key={h}
              className={i === 3 ? "w-[3px] rounded-[1px] bg-zinc-600" : "w-[3px] rounded-[1px] bg-zinc-100"}
              style={{ height: h }}
            />
          ))}
        </span>

        <WifiGlyph />

        {/* Батарея: 68% — не полная и не тревожная, просто живой телефон */}
        <span className="flex items-center gap-[2px]">
          <span className="relative h-[11px] w-[22px] rounded-[3px] border border-zinc-400/80 p-[1.5px]">
            <span className="block h-full w-[68%] rounded-[1px] bg-zinc-100" />
          </span>
          <span className="h-[4px] w-[1.5px] rounded-r-[1px] bg-zinc-400/80" />
        </span>
      </div>
    </div>
  );
}

function WifiGlyph() {
  return (
    <svg viewBox="0 0 16 12" className="h-[11px] w-[15px] fill-zinc-100">
      <path d="M8 11.2 5.9 8.6a3.3 3.3 0 0 1 4.2 0L8 11.2Z" />
      <path
        d="M3.9 6.3a6.2 6.2 0 0 1 8.2 0"
        fill="none"
        stroke="currentColor"
        className="stroke-zinc-100"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M1.8 3.9a9.4 9.4 0 0 1 12.4 0"
        fill="none"
        stroke="currentColor"
        className="stroke-zinc-100"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
