"use client";

import { memo } from "react";
import { CALL_ORIGINS } from "@/lib/fixtures/pools";
import { useTick } from "@/lib/scene/SceneProvider";
import { WORLD_DOTS } from "./world-dots";

/**
 * Точечная карта мира.
 *
 * Рисуется программно из массива координат, а не картинкой: растровая карта
 * на плазме в 2 метра рассыпается в пиксели, а точки остаются чёткими.
 * Плюс никаких внешних ассетов — на площадке может не быть сети.
 */
const W = 360;
const H = 180;

/** Равнопромежуточная проекция: долгота/широта → координаты SVG */
function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
}

/**
 * Полторы тысячи точек суши не должны перерисовываться четыре раза в секунду
 * вместе с анимацией. memo без пропсов рендерит их ровно один раз.
 */
const LandDots = memo(function LandDots() {
  return (
    <g>
      {WORLD_DOTS.map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return <circle key={i} cx={x} cy={y} r={0.62} fill="#27272a" />;
      })}
    </g>
  );
});

export function WorldMap() {
  const tick = useTick();
  const t = tick / 4;
  const hub = project(76.9, 43.2); // условный «наш» офис

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      <LandDots />

      {/* Дуги «офис → жертва»: видно, что звонки идут по всему миру */}
      {CALL_ORIGINS.map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        const mx = (hub[0] + x) / 2;
        const my = (hub[1] + y) / 2 - Math.abs(hub[0] - x) * 0.22;
        const phase = (t * 0.35 + i * 0.37) % 1;
        return (
          <g key={`arc-${i}`}>
            <path
              d={`M ${hub[0]} ${hub[1]} Q ${mx} ${my} ${x} ${y}`}
              fill="none"
              stroke="rgba(52,211,153,0.16)"
              strokeWidth={0.4}
            />
            <path
              d={`M ${hub[0]} ${hub[1]} Q ${mx} ${my} ${x} ${y}`}
              fill="none"
              stroke="rgba(52,211,153,0.85)"
              strokeWidth={0.7}
              strokeDasharray="6 200"
              strokeDashoffset={-phase * 206}
            />
          </g>
        );
      })}

      {/* Активные звонки */}
      {CALL_ORIGINS.map(([lon, lat, code], i) => {
        const [x, y] = project(lon, lat);
        const pulse = 1.4 + Math.abs(Math.sin(t * 0.9 + i)) * 2.6;
        const live = Math.sin(t * 0.6 + i * 1.7) > -0.2;
        return (
          <g key={`pt-${code}-${i}`}>
            {live && (
              <circle cx={x} cy={y} r={pulse} fill="rgba(52,211,153,0.18)" />
            )}
            <circle cx={x} cy={y} r={1.25} fill={live ? "#34d399" : "#52525b"} />
          </g>
        );
      })}

      {/* Наш офис */}
      <circle cx={hub[0]} cy={hub[1]} r={3.2} fill="rgba(244,63,94,0.2)" />
      <circle cx={hub[0]} cy={hub[1]} r={1.7} fill="#f43f5e" />
    </svg>
  );
}
