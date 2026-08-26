"use client";

import { useEffect } from "react";
import { parseSeat } from "@/lib/seat";

/**
 * Совместимость со старыми адресами: ярлыки на машинах и печатные
 * инструкции могут содержать /crm?seat=7. Сборка статическая, query до
 * страницы места не доедет — поэтому /crm сразу уводит на /crm/7/.
 * Экран чёрный: в кадр эта страница не попадает, висит доли секунды.
 */
export function SeatRedirect({ screen }: { screen: "crm" | "drops" | "chat" | "victim" }) {
  useEffect(() => {
    const seat = parseSeat(new URLSearchParams(window.location.search).get("seat") ?? undefined);
    window.location.replace(`/${screen}/${seat}/`);
  }, [screen]);

  return <div className="h-screen w-screen bg-zinc-950" />;
}
