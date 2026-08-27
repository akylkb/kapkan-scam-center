"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Pause,
  PhoneForwarded,
  PhoneOff,
  Play,
  Volume2,
  VolumeX,
  Waves,
  Check
} from "lucide-react";
import { useTick } from "@/lib/scene/SceneProvider";
import { drift } from "@/components/shared/LiveNumber";
import { BRAND } from "@/lib/brand";
import { mmss } from "@/lib/format";
import { VOICE_PRESETS } from "@/lib/fixtures/pools";
import type { Thread } from "@/lib/fixtures/threads";
import type { Persona } from "@/lib/fixtures/personas";
import { FlashCard } from "@/components/shared/EventFlash";
import { Chip, Meter, cx } from "@/components/shared/ui";

/**
 * Разговор.
 *
 * Состояние — две цифры и обе от часов сцены: тик, когда набрали номер, и
 * сколько тиков идут гудки. Всё остальное (фаза, таймер, осциллограмма)
 * выводится из них функцией. Так дубль 1 и дубль 7 совпадают посекундно,
 * а стоп-кадр (Ctrl+Alt+0) останавливает разговор вместе со всем экраном.
 */
export type Call = {
  /** Тик сцены, когда нажали «Позвонить» */
  startTick: number;
  /** Сколько тиков идут гудки. 0 — входящий: трубку уже подняли */
  ringTicks: number;
};

/** Гудки перед соединением: 5 секунд — успевает прочитаться в кадре */
export const RING_TICKS = 20;

/** Полос в осциллограмме: столько влезает в модалку без «частокола» */
const BARS = 56;

/** Сколько тиков висит плашка «ОБРАБОТАН» — те же 4 секунды, что у EventFlash */
const HANDLED_TICKS = 16;

export function CallOverlay({
  call,
  thread,
  persona,
  seat,
  onHangUp,
}: {
  call: Call;
  thread: Thread;
  persona: Persona;
  seat: number;
  onHangUp: () => void;
}) {
  const tick = useTick();

  const elapsed = Math.max(0, tick - call.startTick);
  const ringing = elapsed < call.ringTicks;
  // Таймер считает разговор, а не гудки: на монтаже он должен стартовать
  // с 00:00 ровно в тот момент, когда жертва взяла трубку
  const seconds = Math.max(0, Math.floor((elapsed - call.ringTicks) / 4));

  const [hold, setHold] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transferred, setTransferred] = useState(false);
  const [volume, setVolume] = useState(72);
  /** Тик, на котором нажали «Обработан». null — плашку ещё не показывали */
  const [handledAt, setHandledAt] = useState<number | null>(null);

  // Новый звонок начинается с чистого пульта: иначе следующий дубль
  // откроется с включённым удержанием от предыдущего
  useEffect(() => {
    setHold(false);
    setMuted(false);
    setTransferred(false);
    setVolume(72);
    setHandledAt(null);
  }, [call.startTick]);

  const preset =
    VOICE_PRESETS[
      (thread.scheme === "delivery" ? 0 : thread.scheme === "romance" ? 3 : 2) %
        VOICE_PRESETS.length
    ];

  // Уровни сигнала — функция от тика, а не Math.random(). Своя дорожка гаснет
  // при выключенном микрофоне, чужая — на удержании
  // Плашка гаснет по часам сцены, а не по setTimeout: в стоп-кадре
  // (Ctrl+Alt+0) она замирает вместе с экраном, и дубли совпадают
  const handled = handledAt !== null && tick - handledAt < HANDLED_TICKS;
  // Обработанный звонок больше не считает время: таймер сброшен на «··:··»
  // до конца этого разговора. Возвращать его нельзя — он показал бы не ноль,
  // а всё, что натикало на удержании, и «сброс» в кадре развалился бы
  const closed = handledAt !== null;

  const live = !ringing && !hold;
  const outLevel = live && !muted ? drift(62, tick, 26, `out-${seat}-${thread.id}`) : 0;
  const inLevel = live ? drift(58, tick, 30, `in-${seat}-${thread.id}`) : 0;

  return (
    /* z-30 — ниже вспышек событий (z-40) и тревоги (z-50): депозит, упавший
       посреди разговора, должен читаться поверх модалки, а не за ней */
    <div
      data-call
      className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/80 backdrop-blur-[2px]"
    >
      <section className="flex w-[560px] flex-col overflow-hidden rounded-[6px] border border-zinc-700 bg-[#0d0d10] shadow-[0_0_80px_rgb(0_0_0/0.85)]">
        {/* Шапка */}
        <header className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-3">
          <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-500 uppercase">
            {BRAND.voip.name} · линия {thread.id}
          </span>
          {ringing ? (
            <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-300">
              <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-amber-400" />
              ВЫЗОВ
            </Chip>
          ) : (
            <Chip className="border-cyan-700/50 bg-cyan-500/10 text-cyan-300">
              <span className="h-[4px] w-[4px] animate-pulse rounded-full bg-cyan-400" />
              {hold ? "УДЕРЖАНИЕ" : "В ЭФИРЕ"}
            </Chip>
          )}
        </header>

        {/* Кого набрали */}
        <div className="flex items-center gap-3 px-5 pt-5">
          <span
            className={cx(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[20px] font-light text-zinc-200",
              ringing ? "animate-throb bg-zinc-800" : "bg-zinc-800",
            )}
          >
            {thread.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-[19px] font-light text-zinc-100">
              <span>{thread.country.flag}</span>
              {thread.name}
            </p>
            <p className="truncate font-mono text-[10px] tracking-[0.08em] text-zinc-500">
              {thread.phone} · {thread.city}»
            </p>
          </div>
          <span
            className={cx(
              "tnum shrink-0 font-mono text-[34px] leading-none font-semibold",
              ringing || closed ? "text-zinc-600" : "text-cyan-300",
            )}
          >
            {ringing || closed ? "··:··" : mmss(seconds)}
          </span>
        </div>

        {/* Гудок / осциллограмма */}
        <div className="mt-4 px-5">
          {ringing ? (
            <Dialing tick={tick} />
          ) : (
            <div className="flex h-[76px] items-center gap-[2px] rounded-[4px] border border-zinc-800 bg-zinc-950/70 px-2">
              {Array.from({ length: BARS }).map((_, i) => (
                <span
                  key={i}
                  className={cx(
                    "flex-1 origin-center rounded-[1px]",
                    live ? "animate-wave bg-cyan-400/80" : "h-[2px] bg-zinc-800",
                  )}
                  style={
                    live
                      ? {
                          height: "100%",
                          animationDelay: `${(i * 61) % 900}ms`,
                          animationDuration: `${640 + ((i * 149) % 760)}ms`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Голос, которым говорим, и уровни линии */}
        <div className="mt-3 grid grid-cols-2 gap-2 px-5">
          <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              подмена голоса · {BRAND.voice.name}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-zinc-200">
              <Waves className="h-3.5 w-3.5 text-cyan-400" />
              {preset.label}
            </p>
            <p className="tnum mt-0.5 font-mono text-[9.5px] text-emerald-300">
              схожесть 94.2% · задержка 128 мс
            </p>
          </div>

          <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              уровень линии
            </p>
            <div className="mt-1.5 space-y-1.5">
              <Level label="МЫ" value={outLevel} tone="bg-cyan-500" muted={muted} />
              <Level label="ОН" value={inLevel} tone="bg-emerald-500" muted={hold} />
            </div>
          </div>
        </div>

        {/* Громкость — единственный настоящий регулятор в модалке */}
        <div className="mt-2.5 flex items-center gap-2.5 px-5">
          <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            громкость
          </span>
          <button
            onClick={() => setVolume((v) => Math.max(0, v - 10))}
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[3px] border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-cyan-800/60 hover:text-cyan-300"
          >
            {volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5" strokeWidth={1.9} />
            ) : (
              <Volume2 className="h-3.5 w-3.5" strokeWidth={1.9} />
            )}
          </button>
          <span className="min-w-0 flex-1">
            <Meter value={volume} className={volume === 0 ? "bg-zinc-600" : "bg-cyan-500"} />
          </span>
          <button
            onClick={() => setVolume((v) => Math.min(100, v + 10))}
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[3px] border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-cyan-800/60 hover:text-cyan-300"
          >
            <Volume2 className="h-3.5 w-3.5" strokeWidth={1.9} />
          </button>
          <span className="tnum w-[34px] shrink-0 text-right font-mono text-[10px] text-zinc-400">
            {volume}%
          </span>
        </div>

        {/* Служебная строка: запись, шлюз, перевод */}
        <p className="mt-2.5 flex items-center justify-between border-t border-zinc-900 px-5 py-1.5 font-mono text-[9px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-rose-500" />
            ЗАПИСЬ ОТКЛ · буфер 0 сек
          </span>
          {transferred ? (
            <span className="text-amber-300">ПЕРЕВОД · ОТДЕЛ ВЫВОДА · ждёт приёма</span>
          ) : (
            <span>шлюз {BRAND.voip.name} · прокси скрыт</span>
          )}
        </p>

        {/* Пульт разговора */}
        <div className="grid grid-cols-5 gap-1.5 border-t border-zinc-800 bg-zinc-900/40 p-2.5">
          <CallBtn
            icon={hold ? Play : Pause}
            label={hold ? "Снять" : "Удерж."}
            active={hold}
            disabled={ringing}
            onClick={() => setHold((v) => !v)}
          />
          <CallBtn
            icon={PhoneForwarded}
            label="Перевод"
            active={transferred}
            disabled={ringing}
            onClick={() => setTransferred((v) => !v)}
          />
          <CallBtn
            icon={muted ? MicOff : Mic}
            label={muted ? "Вкл. мик." : "Микрофон"}
            active={muted}
            disabled={ringing}
            onClick={() => setMuted((v) => !v)}
          />

          <CallBtn
            icon={Check}
            label="Обработан"
            active={handled}
            disabled={false}
            // Звонок закрыт: вспышка, таймер на «··:··» и линия на удержании.
            // Снять с удержания актёр по игре может, таймер — нет
            onClick={() => {
              setHandledAt(tick);
              setHold(true);
            }}
          />

          <button
            onClick={onHangUp}
            className="flex flex-col items-center justify-center gap-1 rounded-[4px] border border-rose-800/60 bg-rose-950/50 py-2 text-rose-300 transition-colors hover:bg-rose-900/50"
          >
            <PhoneOff className="h-4 w-4" strokeWidth={1.9} />
            <span className="text-[10.5px]">Сброс</span>
          </button>
        </div>
      </section>

      {/* Подтверждение действия актёра — тем же кадром, что и события
          режиссёра. Ключ по тику: повторное нажатие перезапускает вспышку */}
      {handled && (
        <FlashCard
          key={handledAt ?? 0}
          tone="done"
          title="АСАН АМАНОВ ОБРАБОТАН"
          sub={`сделка закрыта · ${thread.id}`}
        />
      )}
    </div>
  );
}

/**
 * Гудки. Три точки бегут по кругу, под ними — счётчик гудков: и то и другое
 * считается от тика, поэтому в стоп-кадре замирает.
 */
function Dialing({ tick }: { tick: number }) {
  const step = Math.floor(tick / 3) % 3;
  const beep = Math.floor(tick / 8) + 1;

  return (
    <div className="flex h-[76px] flex-col items-center justify-center gap-2 rounded-[4px] border border-zinc-800 bg-zinc-950/70">
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
      </span>
      <p className="font-mono text-[10px] tracking-[0.16em] text-amber-300/90 uppercase">
        идёт вызов · гудок {beep}
      </p>
    </div>
  );
}

/** Дорожка уровня: своя и чужая. При выключенной — серая полоска в нуле */
function Level({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: number;
  tone: string;
  muted: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[16px] shrink-0 font-mono text-[8.5px] text-zinc-600">{label}</span>
      <span className="min-w-0 flex-1">
        <Meter value={value} className={muted ? "bg-zinc-700" : tone} />
      </span>
    </div>
  );
}

function CallBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Mic;
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex flex-col items-center justify-center gap-1 rounded-[4px] border py-2 transition-colors",
        disabled
          ? "border-zinc-800 bg-zinc-900/40 text-zinc-700"
          : active
            ? "border-amber-700/60 bg-amber-950/40 text-amber-300"
            : "border-zinc-700/70 bg-zinc-800/50 text-zinc-300 hover:border-cyan-800/60 hover:text-cyan-300",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.9} />
      <span className="text-[10.5px]">{label}</span>
    </button>
  );
}

