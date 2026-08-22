"use client";

import { memo } from "react";
import { WORLD_DOTS } from "@/components/wall/world-dots";
import { useTick } from "@/lib/scene/SceneProvider";
import type { CashPoint } from "@/lib/fixtures/dropdesk";

/**
 * Карта точек снятия наличных.
 *
 * Та же точечная техника, что на стене, но с кропом по региону: сюда ездят
 * курьеры, и мировая карта здесь была бы враньём. Точки суши берутся из
 * общего массива — новых ассетов не заводим, офлайн сохраняется.
 */
const LON_MIN = 44;
const LON_MAX = 90;
const LAT_MIN = 36;
const LAT_MAX = 58;

const W = 200;
const H = 100;

/** Округление до сотых: без него в разметку уходят 15-значные координаты */
function project(lon: number, lat: number): [number, number] {
  return [
    Math.round(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W * 100) / 100,
    Math.round(((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H * 100) / 100,
  ];
}

/** Точки суши региона рисуются один раз: memo без пропсов */
const RegionDots = memo(function RegionDots() {
  return (
    <g>
      {WORLD_DOTS.filter(
        ([lon, lat]) =>
          lon >= LON_MIN && lon <= LON_MAX && lat >= LAT_MIN && lat <= LAT_MAX,
      ).map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return <circle key={i} cx={x} cy={y} r={0.9} fill="#27272a" />;
      })}
    </g>
  );
});

export function CashGeo({ points }: { points: CashPoint[] }) {
  const tick = useTick();
  const t = tick / 4;
  // Офис конторы — тот же город, что в шапке админки
  const hub = project(74.6, 42.87);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      <RegionDots />

      {/* Маршруты курьеров от точек снятия в офис */}
      {points.map((p, i) => {
        const [x, y] = project(p.lon, p.lat);
        const mx = (hub[0] + x) / 2;
        const my = (hub[1] + y) / 2 - Math.abs(hub[0] - x) * 0.28;
        const phase = (t * 0.3 + i * 0.41) % 1;
        const dead = p.status === "stop";
        return (
          <g key={`route-${p.city}`}>
            <path
              d={`M ${x} ${y} Q ${mx} ${my} ${hub[0]} ${hub[1]}`}
              fill="none"
              stroke={dead ? "rgba(244,63,94,0.16)" : "rgba(167,139,250,0.16)"}
              strokeWidth={0.4}
            />
            {!dead && (
              <path
                d={`M ${x} ${y} Q ${mx} ${my} ${hub[0]} ${hub[1]}`}
                fill="none"
                stroke="rgba(52,211,153,0.85)"
                strokeWidth={0.7}
                strokeDasharray="4 120"
                strokeDashoffset={-phase * 124}
              />
            )}
          </g>
        );
      })}

      {/* Сами точки снятия */}
      {points.map((p, i) => {
        const [x, y] = project(p.lon, p.lat);
        const pulse = 1.2 + Math.abs(Math.sin(t * 0.8 + i)) * 2.2;
        const color =
          p.status === "stop" ? "#f43f5e" : p.status === "wait" ? "#fbbf24" : "#34d399";
        return (
          <g key={`pt-${p.city}`}>
            {p.status === "ok" && (
              <circle cx={x} cy={y} r={pulse} fill="rgba(52,211,153,0.18)" />
            )}
            <circle cx={x} cy={y} r={1.3} fill={color} />
            <text
              x={x + 2.4}
              y={y + 1.4}
              fill="#52525b"
              fontSize={3}
              fontFamily="monospace"
            >
              {p.city}
            </text>
          </g>
        );
      })}

      {/* Офис */}
      <circle cx={hub[0]} cy={hub[1]} r={3} fill="rgba(167,139,250,0.22)" />
      <circle cx={hub[0]} cy={hub[1]} r={1.7} fill="#a78bfa" />
    </svg>
  );
}
