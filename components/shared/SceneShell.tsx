"use client";

import type { ReactNode } from "react";
import {
  SceneProvider,
  selectAlarm,
  selectFrozen,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { LiveProvider } from "@/lib/live/LiveProvider";
import { BRAND } from "@/lib/brand";
import { cx } from "./ui";

/**
 * Обёртка любого экрана: живая шина, часы сцены, хоткеи режиссёра,
 * стоп-кадр и тревога.
 *
 * LiveProvider стоит выше SceneProvider намеренно: движок сцены рассылает
 * команды режиссёра через ту же шину, что и переписка.
 */
export function SceneShell({
  seat,
  sender = "screen",
  children,
}: {
  seat: number;
  /** Метка экрана в id сообщений — видно, кто написал реплику */
  sender?: string;
  children: ReactNode;
}) {
  return (
    <LiveProvider seat={seat} sender={sender}>
      <SceneProvider seat={seat}>
        <SceneBody>{children}</SceneBody>
      </SceneProvider>
    </LiveProvider>
  );
}

function SceneBody({ children }: { children: ReactNode }) {
  const frozen = useSceneValue(selectFrozen);
  const alarm = useSceneValue(selectAlarm);

  return (
    <div className={cx("relative h-screen w-screen overflow-hidden", frozen && "scene-frozen")}>
      {children}
      {alarm && <AlarmOverlay />}
    </div>
  );
}

/** Ctrl+Alt+6 — для сцены рейда: всё краснеет и рвутся сессии */
function AlarmOverlay() {
  // Обратный отсчёт идёт от часов сцены, а не от Math.random():
  // между дублями он должен вести себя одинаково.
  const second = useSceneValue((s) => s.second);
  const countdown = 9 - (second % 10);

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div className="absolute inset-0 animate-alarm" />
      <div className="absolute inset-0 border-[3px] border-rose-600/70" />
      <div className="absolute top-0 right-0 left-0 flex items-center justify-center bg-rose-950/85 py-1.5 backdrop-blur-[1px]">
        <p className="animate-throb font-mono text-[13px] font-bold tracking-[0.28em] text-rose-300 uppercase">
          ⚠ SECURITY BREACH · ДОМЕН {BRAND.broker.domain} ЗАБЛОКИРОВАН · РАЗРЫВ ВСЕХ СЕССИЙ
        </p>
      </div>
      <div className="absolute right-0 bottom-0 left-0 bg-rose-950/85 px-4 py-1.5">
        <p className="font-mono text-[11px] tracking-[0.16em] text-rose-300/90 uppercase">
          Принудительный выход через 00:0{countdown} · сохранение данных недоступно
        </p>
      </div>
    </div>
  );
}
