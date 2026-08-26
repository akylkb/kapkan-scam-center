"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import type { Persona } from "@/lib/fixtures/personas";
import { useSecond } from "@/lib/scene/SceneProvider";
import { SCENE_START_MINUTES } from "@/lib/scene/store";
import { clock } from "@/lib/format";
import { cx } from "@/components/shared/ui";

/**
 * Входящий звонок поверх экрана телефона — Ctrl+Alt+1 у режиссёра.
 *
 * Голос по ту сторону подменён (панель VOXSHIFT у чатера), но жертва видит
 * обычный входящий от «Марины». Кадр, ради которого стоит держать оверлей:
 * телефон звонит именно в тот момент, когда чатер нажимает «позвонить».
 */
export function IncomingCall({
  persona,
  onDismiss,
}: {
  persona: Persona;
  onDismiss: () => void;
}) {
  const second = useSecond();

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between bg-zinc-950/97 px-8 py-16 backdrop-blur-[2px]">
      <div className="flex flex-col items-center">
        <p className="text-[12px] tracking-[0.18em] text-zinc-500 uppercase">
          входящий вызов
        </p>
        <span className="mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 text-[34px] font-light text-zinc-200">
          {persona.initials}
        </span>
        <p className="mt-5 text-[26px] font-light text-zinc-100">{persona.name}</p>
        <p className="mt-1 text-[13px] text-zinc-500">мобильный · {persona.sim}</p>
        <p className="tnum mt-6 text-[12px] text-zinc-600">
          {clock(SCENE_START_MINUTES + second / 60)}
        </p>
      </div>

      <div className="flex w-full items-end justify-between px-4">
        <CallButton
          icon={PhoneOff}
          label="Отклонить"
          className="bg-rose-600"
          onClick={onDismiss}
        />
        <CallButton icon={Video} label="Видео" className="bg-zinc-700" onClick={onDismiss} />
        {/* Кнопка «Ответить» подрагивает — глаз находит её первой */}
        <CallButton
          icon={Phone}
          label="Ответить"
          className="animate-throb bg-emerald-500"
          onClick={onDismiss}
        />
      </div>
    </div>
  );
}

function CallButton({
  icon: Icon,
  label,
  className,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cx(
          "flex h-[62px] w-[62px] items-center justify-center rounded-full text-zinc-950",
          className,
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2} />
      </span>
      <span className="text-[11px] text-zinc-400">{label}</span>
    </button>
  );
}
