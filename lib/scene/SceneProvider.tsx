"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SceneStore, type SceneState } from "./store";
import { DIRECTOR_KEYS } from "./events";

const SceneContext = createContext<SceneStore | null>(null);

export function SceneProvider({
  seat,
  children,
}: {
  seat: number;
  children: ReactNode;
}) {
  const [store] = useState(() => new SceneStore(seat));

  useEffect(() => {
    store.start();
    return () => store.stop();
  }, [store]);

  // Режиссёрские хоткеи: Ctrl+Alt+<клавиша>. Никакого визуального отклика —
  // на площадке нажатие не должно быть заметно в кадре.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.ctrlKey || !e.altKey) return;
      const pressed = e.key.toUpperCase();
      const match = DIRECTOR_KEYS.find((k) => k.key.toUpperCase() === pressed);
      if (!match) return;
      e.preventDefault();
      store.dispatch(match.kind);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  return <SceneContext.Provider value={store}>{children}</SceneContext.Provider>;
}

function useStore(): SceneStore {
  const store = useContext(SceneContext);
  if (!store) throw new Error("useScene* должен вызываться внутри <SceneProvider>");
  return store;
}

/**
 * Подписка на одно значение состояния.
 * Селектор обязан возвращать примитив (или стабильную ссылку), иначе
 * компонент будет перерисовываться на каждом тике — при 10 машинах это критично.
 */
export function useSceneValue<T>(selector: (s: SceneState) => T): T {
  const store = useStore();
  const get = useCallback(() => selector(store.getSnapshot()), [store, selector]);
  return useSyncExternalStore(store.subscribe, get, get);
}

/** Тик сцены (250 мс). Для всего, что плавно движется. */
export function useTick(): number {
  return useSceneValue(selectTick);
}

/** Секунды сцены. Для таймеров и часов — перерисовка раз в секунду. */
export function useSecond(): number {
  return useSceneValue(selectSecond);
}

export function useSceneDispatch() {
  const store = useStore();
  return useCallback(
    (kind: Parameters<SceneStore["dispatch"]>[0]) => store.dispatch(kind),
    [store],
  );
}

const selectTick = (s: SceneState) => s.tick;
const selectSecond = (s: SceneState) => s.second;
export const selectFeed = (s: SceneState) => s.feed;
export const selectAlarm = (s: SceneState) => s.alarm;
export const selectFrozen = (s: SceneState) => s.frozen;
export const selectEpoch = (s: SceneState) => s.epoch;
export const selectRevenue = (s: SceneState) => s.revenue;
export const selectSeat = (s: SceneState) => s.seat;
export const selectCallActive = (s: SceneState) => s.callActive;
export const selectCallStart = (s: SceneState) => s.callStartTick;
export const selectSigDeposit = (s: SceneState) => s.sigDeposit;
export const selectSigCall = (s: SceneState) => s.sigCall;
export const selectSigWhale = (s: SceneState) => s.sigWhale;
export const selectSigLost = (s: SceneState) => s.sigLost;
export const selectSigWithdraw = (s: SceneState) => s.sigWithdraw;
export const selectSigDropBurn = (s: SceneState) => s.sigDropBurn;
export const selectSigPayout = (s: SceneState) => s.sigPayout;
export const selectSigLink = (s: SceneState) => s.sigLink;
export const selectSigBan = (s: SceneState) => s.sigBan;
export const selectLastAmount = (s: SceneState) => s.lastAmount;
export const selectLastName = (s: SceneState) => s.lastName;
export const selectLastFlag = (s: SceneState) => s.lastFlag;
