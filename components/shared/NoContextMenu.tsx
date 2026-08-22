"use client";

import { useEffect } from "react";

/**
 * Гасит браузерное контекстное меню и перетаскивание.
 * Если актёр случайно кликнет правой кнопкой в дубле — в кадре не должно
 * появиться меню Chrome с пунктом «Просмотреть код».
 */
export function NoContextMenu() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
