"use client";

import { RotateCw, Unplug } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * Финал сцены: Руслан открывает сайт платформы, а его больше нет.
 *
 * Страница статична и после F5 показывает ровно то же — в этом и смысл
 * кадра. «Загрузка» перед ошибкой сделана CSS-анимацией: каждое обновление
 * сначала секунду «пытается» открыть сайт, и нажатие читается на экране.
 * Оформление нейтральное: чужих логотипов и узнаваемой страницы ошибки
 * конкретного браузера в кадре быть не должно.
 */
export function OptionsDown() {
  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-zinc-950">
      <div className="animate-page-load absolute top-0 left-0 h-[3px] bg-sky-500" />

      <div className="animate-page-fail flex w-[640px] flex-col items-start">
        <Unplug className="h-16 w-16 text-zinc-600" strokeWidth={1.3} />
        <h1 className="mt-7 text-[40px] leading-tight font-semibold tracking-wide text-zinc-100 uppercase">
          Страница недоступна
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-zinc-400">
          Не удаётся получить доступ к сайту{" "}
          <span className="font-semibold text-zinc-200">{BRAND.options.domain}</span>.
          Сервер не отвечает: возможно, сайт удалён или перемещён на другой адрес.
        </p>
        <p className="mt-5 font-mono text-[12.5px] tracking-wide text-zinc-600">
          ERR_SITE_NOT_FOUND · {BRAND.options.domain}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-9 flex items-center gap-2.5 rounded-[5px] bg-sky-600 px-6 py-3 text-[14px] font-semibold text-white hover:bg-sky-500"
        >
          <RotateCw className="h-4 w-4" />
          Обновить
        </button>
      </div>
    </div>
  );
}
