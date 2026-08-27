"use client";

import { useEffect, useRef, useState } from "react";
import {
  selectLastAmount,
  selectLastFlag,
  selectLastName,
  selectSigBan,
  selectSigDeposit,
  selectSigDropBurn,
  selectSigLink,
  selectSigLost,
  selectSigPayout,
  selectSigWhale,
  selectSigWithdraw,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { usd } from "@/lib/format";
import { cx } from "./ui";

/**
 * Тон плашки. «done» — не событие режиссёра, а подтверждение действия
 * актёра в кадре (кнопка «Обработан» на пульте разговора).
 */
export type FlashTone =
  | "deposit"
  | "whale"
  | "lost"
  | "withdraw"
  | "payout"
  | "burn"
  | "link"
  | "ban"
  | "done";

type Flash = {
  key: number;
  tone: FlashTone;
  title: string;
  sub: string;
};

const TONE: Record<FlashTone, { box: string; title: string; glow: string }> = {
  deposit: {
    box: "border-emerald-500/60 bg-emerald-950/85",
    title: "text-emerald-300",
    glow: "shadow-[0_0_60px_rgba(16,185,129,0.35)]",
  },
  whale: {
    box: "border-fuchsia-500/60 bg-fuchsia-950/85",
    title: "text-fuchsia-300",
    glow: "shadow-[0_0_70px_rgba(217,70,239,0.4)]",
  },
  lost: {
    box: "border-rose-500/60 bg-rose-950/85",
    title: "text-rose-300",
    glow: "shadow-[0_0_60px_rgba(244,63,94,0.35)]",
  },
  withdraw: {
    box: "border-amber-500/60 bg-amber-950/85",
    title: "text-amber-300",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.35)]",
  },
  payout: {
    box: "border-emerald-500/60 bg-emerald-950/85",
    title: "text-emerald-300",
    glow: "shadow-[0_0_70px_rgba(16,185,129,0.4)]",
  },
  burn: {
    box: "border-rose-500/60 bg-rose-950/85",
    title: "text-rose-300",
    glow: "shadow-[0_0_70px_rgba(244,63,94,0.4)]",
  },
  link: {
    box: "border-cyan-500/60 bg-cyan-950/85",
    title: "text-cyan-300",
    glow: "shadow-[0_0_70px_rgba(34,211,238,0.4)]",
  },
  ban: {
    box: "border-rose-500/60 bg-zinc-950/90",
    title: "text-rose-300",
    glow: "shadow-[0_0_60px_rgba(244,63,94,0.3)]",
  },
  done: {
    box: "border-emerald-500/60 bg-emerald-950/85",
    title: "text-emerald-300",
    glow: "shadow-[0_0_70px_rgba(16,185,129,0.4)]",
  },
};

/**
 * Сама плашка. Вынесена из EventFlash, потому что её показывают не только
 * события режиссёра: пульт разговора подтверждает ею нажатие «Обработан».
 * Кто и когда её гасит — дело вызывающего; здесь только вид.
 *
 * Ключ (`key`) на элементе перезапускает анимацию: без него повторная
 * вспышка подряд не проигрывается, а просто висит на экране.
 */
export function FlashCard({
  tone,
  title,
  sub,
}: {
  tone: FlashTone;
  title: string;
  sub: string;
}) {
  const t = TONE[tone];

  return (
    <div
      className={cx(
        "animate-flash-in pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 px-10 py-6 backdrop-blur-[2px]",
        t.box,
        t.glow,
      )}
    >
      <p
        className={cx(
          "text-center font-mono text-[46px] leading-none font-bold tracking-tight",
          t.title,
        )}
      >
        {title}
      </p>
      <p className="mt-2 text-center font-mono text-[14px] tracking-[0.14em] text-zinc-300 uppercase">
        {sub}
      </p>
    </div>
  );
}

/**
 * Всплывающая плашка на событие режиссёра.
 *
 * Держится 4 секунды — этого хватает, чтобы камера успела на неё наехать,
 * и мало, чтобы она не мешала следующему плану.
 */
export function EventFlash() {
  const [flash, setFlash] = useState<Flash | null>(null);

  const dep = useSceneValue(selectSigDeposit);
  const whale = useSceneValue(selectSigWhale);
  const lost = useSceneValue(selectSigLost);
  const wd = useSceneValue(selectSigWithdraw);
  const burn = useSceneValue(selectSigDropBurn);
  const payout = useSceneValue(selectSigPayout);
  const link = useSceneValue(selectSigLink);
  const ban = useSceneValue(selectSigBan);
  const amount = useSceneValue(selectLastAmount);
  const name = useSceneValue(selectLastName);
  const flag = useSceneValue(selectLastFlag);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Предыдущие значения сигналов: сравниваем, чтобы понять, какое событие пришло
  const prev = useRef({ dep, whale, lost, wd, burn, payout, link, ban });

  useEffect(() => {
    const was = prev.current;
    prev.current = { dep, whale, lost, wd, burn, payout, link, ban };

    const tone: Flash["tone"] | null =
      whale !== was.whale
        ? "whale"
        : burn !== was.burn
          ? "burn"
          : ban !== was.ban
            ? "ban"
            : payout !== was.payout
              ? "payout"
              : link !== was.link
                ? "link"
                : lost !== was.lost
                  ? "lost"
                  : wd !== was.wd
                    ? "withdraw"
                    : dep !== was.dep
                      ? "deposit"
                      : null;

    // null означает первый рендер или сброс дубля — плашку не показываем
    if (!tone) return;

    setFlash({
      key:
        was.dep + was.whale + was.lost + was.wd + was.burn + was.payout +
        was.link + was.ban + 1,
      tone,
      ...copyFor(tone, amount, name, flag),
    });

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // amount/name/flag читаются в момент события и не должны сами его вызывать
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep, whale, lost, wd, burn, payout, link, ban]);

  if (!flash) return null;

  return <FlashCard key={flash.key} tone={flash.tone} title={flash.title} sub={flash.sub} />;
}

function copyFor(
  tone: FlashTone,
  amount: number,
  name: string,
  flag: string,
): { title: string; sub: string } {
  switch (tone) {
    case "whale":
      return { title: `+${usd(amount)}`, sub: `КИТ` };
    case "lost":
      return { title: "КЛИЕНТ СОРВАЛСЯ", sub: `звонок прерван` };
    case "withdraw":
      return { title: `ВЫВОД ${usd(amount)}`, sub: `заявка заблокирована` };
    case "burn":
      // Здесь lastName — это кличка дропа, а не имя жертвы
      return { title: "ДРОП СГОРЕЛ", sub: `карта заблокирована · ${usd(amount)} завис` };
    case "payout":
      return { title: `ЗАЛИВ ${usd(amount)}`, sub: `цепочка закрыта · нал в кассе` };
    case "link":
      return { title: `ДЕНЬГИ СПИСАНЫ`, sub: `задание выполнено` };
    case "ban":
      // Здесь lastName — хэндл личины, а не имя жертвы
      return { title: "АККАУНТ ЗАБАНЕН", sub: `переписка оборвана` };
    default:
      return { title: `+${usd(amount)}`, sub: `депозит` };
  }
}
