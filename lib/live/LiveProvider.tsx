"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LiveBus, type LiveListener } from "./bus";
import type { LiveMessage, LiveStatus } from "./protocol";

const LiveContext = createContext<LiveBus | null>(null);

/**
 * Оборачивает экран в живую шину. Стоит выше SceneProvider: движок сцены
 * тоже ходит через неё, чтобы режиссёрские хоткеи долетали до соседней машины.
 *
 * `sender` попадает в id сообщений — по нему в devtools сразу видно,
 * кто написал реплику: чатер или телефон жертвы.
 */
export function LiveProvider({
  seat,
  sender,
  children,
}: {
  seat: number;
  sender: string;
  children: ReactNode;
}) {
  const [bus] = useState(() => new LiveBus(seat, sender));

  useEffect(() => {
    bus.start();
    return () => bus.stop();
  }, [bus]);

  return <LiveContext.Provider value={bus}>{children}</LiveContext.Provider>;
}

/** Шина текущего экрана. null — если экран не обёрнут в LiveProvider */
export function useLiveBus(): LiveBus | null {
  return useContext(LiveContext);
}

/** Отправка. Возвращает id — по нему узнаётся эхо-подтверждение доставки */
export function useLiveSend(): (msg: LiveMessage) => string | null {
  const bus = useContext(LiveContext);
  return useCallback((msg: LiveMessage) => bus?.send(msg) ?? null, [bus]);
}

/** Состояние моста для тусклой служебной строки вне кадра */
export function useLiveStatus(): LiveStatus {
  const bus = useContext(LiveContext);

  const subscribe = useCallback(
    (fn: () => void) => bus?.subscribeStatus(fn) ?? (() => {}),
    [bus],
  );
  const get = useCallback(() => bus?.getStatus() ?? "off", [bus]);

  // На сервере статуса нет: до гидрации мост заведомо не поднят
  return useSyncExternalStore(subscribe, get, () => "off" as LiveStatus);
}

/**
 * Подписка на входящие сообщения.
 *
 * Обработчик держим в ref: иначе каждая перерисовка экрана пересоздавала бы
 * подписку, а на площадке экран перерисовывается четыре раза в секунду.
 */
export function useLiveMessages(handler: LiveListener) {
  const bus = useContext(LiveContext);
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!bus) return;
    return bus.subscribe((msg, meta) => ref.current(msg, meta));
  }, [bus]);
}
