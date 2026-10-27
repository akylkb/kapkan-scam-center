"use client";

import { useEffect } from "react";

/**
 * Гасит браузерное перетаскивание: случайно «подхваченная» картинка или
 * ссылка в дубле тянется за курсором полупрозрачным призраком.
 * Контекстное меню не трогаем — правый клик работает как обычно.
 */
export function NoDrag() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
