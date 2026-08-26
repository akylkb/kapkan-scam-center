"use client";

import type { ReactNode } from "react";

/**
 * Корпус телефона по центру экрана.
 *
 * Размер посчитан под 1920×1080: 404×864 — телефон занимает почти всю высоту
 * кадра и держит крупный план, но сверху и снизу остаётся воздух, чтобы
 * оператор мог взять его с наклоном.
 *
 * Вокруг — не пустота, а виньетка: ровный zinc-950 во весь кадр читался бы
 * как незагрузившаяся страница.
 */
export function VictimPhone({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950">
      {/* Мягкое пятно света за телефоном */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 62% at 50% 50%, rgb(39 39 42 / 0.55), transparent 70%)",
        }}
      />

      <div className="relative h-[864px] w-[404px] shrink-0 rounded-[52px] border-[3px] border-zinc-700/70 bg-zinc-950 p-[9px] shadow-[0_0_90px_rgb(0_0_0/0.9)]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[44px] bg-[#0a0a0c]">
          {children}

          {/* Островок фронтальной камеры */}
          <div className="pointer-events-none absolute top-[9px] left-1/2 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />

          {/* Полоска жеста «домой» */}
          <div className="pointer-events-none absolute bottom-[7px] left-1/2 h-[4px] w-[128px] -translate-x-1/2 rounded-full bg-zinc-600" />
        </div>
      </div>
    </div>
  );
}
