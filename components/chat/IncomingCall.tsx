"use client";

import { PhoneIncoming, PhoneOff, ShieldAlert } from "lucide-react";
import { useTick } from "@/lib/scene/SceneProvider";
import { BRAND } from "@/lib/brand";
import { mmss } from "@/lib/format";
import type { Thread } from "@/lib/fixtures/threads";
import { Chip, cx } from "@/components/shared/ui";

/**
 * Входящий вызов от клиента — то, что видно до разговора.
 *
 * Кадр строится вокруг одного объекта: номера. Имени нет намеренно — клиент
 * звонит сам, в справочнике конторы его нет, и на крупном плане это читается
 * как «неизвестный номер», а не как контакт из адресной книги.
 *
 * Состояние — одна цифра, тик прихода вызова: и таймер, и бегущие точки
 * считаются от него функцией, поэтому дубль 1 и дубль 7 совпадают посекундно,
 * а стоп-кадр (Ctrl+Alt+0) замораживает вызов вместе со всем экраном.
 *
 * «Принять» отдаёт разговор [CallOverlay](./CallOverlay.tsx) — сюда он больше
 * не возвращается; «Отклонить» просто гасит модалку.
 */
export function IncomingCall({
  thread,
  startTick,
  onAccept,
  onReject,
}: {
  thread: Thread;
  /** Тик сцены, когда пошёл вызов */
  startTick: number;
  /** Отдаёт текущий тик: с него разговор начинает считать время */
  onAccept: (tick: number) => void;
  onReject: () => void;
}) {
  const tick = useTick();

  const elapsed = Math.max(0, tick - startTick);
  const seconds = Math.floor(elapsed / 4);
  // Точки и «гудок N» — та же арифметика, что в модалке разговора: движение
  // в кадре должно быть одинаковым, откуда бы звонок ни пришёл
  const step = Math.floor(tick / 3) % 3;
  const beep = Math.floor(elapsed / 8) + 1;

  return (
    /* z-30 — как у разговора: депозит и тревога должны ложиться поверх */
    <div
      data-incoming-call
      className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/85 backdrop-blur-[2px]"
    >
      <section className="flex w-[560px] flex-col overflow-hidden rounded-[6px] border border-zinc-700 bg-[#0d0d10] shadow-[0_0_80px_rgb(0_0_0/0.85)]">
        {/* Шапка */}
        <header className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-3">
          <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-500 uppercase">
            {BRAND.voip.name} · линия {thread.id}
          </span>
          <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-300">
            <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-amber-400" />
            ВХОДЯЩИЙ
          </Chip>
        </header>

        {/* Кто звонит: только номер */}
        <div className="flex flex-col items-center px-5 pt-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-cyan-300 animate-throb">
            <PhoneIncoming className="h-6 w-6" strokeWidth={1.7} />
          </span>

          <p className="tnum mt-4 font-mono text-[42px] leading-none font-semibold tracking-[0.02em] text-zinc-100">
            {/* {thread.phone} */}
            +996 100 237 592
          </p>

          <p className="mt-2.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-zinc-500 uppercase">
            <span className="text-[13px]">{thread.country.flag}</span>
            {thread.country.ru} · {thread.city}
          </p>

          <p className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-amber-300/90 uppercase">
            <ShieldAlert className="h-3 w-3" strokeWidth={1.9} />
            номера нет в справочнике · имя не определено
          </p>
        </div>

        {/* Вызов идёт: точки и таймер ожидания */}
        <div className="mx-5 mt-5 flex h-[64px] items-center justify-between rounded-[4px] border border-zinc-800 bg-zinc-950/70 px-4">
          <span className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cx(
                  "h-[7px] w-[7px] rounded-full transition-colors",
                  i === step ? "bg-amber-400" : "bg-zinc-700",
                )}
              />
            ))}
            <span className="ml-1.5 font-mono text-[10px] tracking-[0.16em] text-amber-300/90 uppercase">
              идёт вызов · гудок {beep}
            </span>
          </span>
          <span className="tnum font-mono text-[22px] leading-none font-semibold text-zinc-500">
            {mmss(seconds)}
          </span>
        </div>

        {/* Служебная строка — та же, что в разговоре */}
        <p className="mt-2.5 flex items-center justify-between border-t border-zinc-900 px-5 py-1.5 font-mono text-[9px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-rose-500" />
            ЗАПИСЬ ОТКЛ · буфер 0 сек
          </span>
          <span>шлюз {BRAND.voip.name} · прокси скрыт</span>
        </p>

        {/* Две крупные кнопки: на общем плане должно читаться, что именно нажал актёр */}
        <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 bg-zinc-900/40 p-2.5">
          <button
            onClick={onReject}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[4px] border border-rose-800/60 bg-rose-950/50 text-[14px] font-medium text-rose-300 transition-colors hover:bg-rose-900/50"
          >
            <PhoneOff className="h-[18px] w-[18px]" strokeWidth={1.9} />
            Отклонить вызов
          </button>
          <button
            onClick={() => onAccept(tick)}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[4px] border border-emerald-600/70 bg-emerald-500/15 text-[14px] font-medium text-emerald-200 transition-colors hover:bg-emerald-500/25"
          >
            <PhoneIncoming className="h-[18px] w-[18px]" strokeWidth={1.9} />
            Принять вызов
          </button>
        </div>
      </section>
    </div>
  );
}
