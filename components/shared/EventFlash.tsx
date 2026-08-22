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

type Flash = {
  key: number;
  tone: "deposit" | "whale" | "lost" | "withdraw" | "payout" | "burn" | "link" | "ban";
  title: string;
  sub: string;
};

const TONE: Record<Flash["tone"], { box: string; title: string; glow: string }> = {
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
};

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
  const tone = TONE[flash.tone];

  return (
    <div
      key={flash.key}
      className={cx(
        "animate-flash-in pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 px-10 py-6 backdrop-blur-[2px]",
        tone.box,
        tone.glow,
      )}
    >
      <p
        className={cx(
          "text-center font-mono text-[46px] leading-none font-bold tracking-tight",
          tone.title,
        )}
      >
        {flash.title}
      </p>
      <p className="mt-2 text-center font-mono text-[14px] tracking-[0.14em] text-zinc-300 uppercase">
        {flash.sub}
      </p>
    </div>
  );
}

function copyFor(
  tone: Flash["tone"],
  amount: number,
  name: string,
  flag: string,
): { title: string; sub: string } {
  switch (tone) {
    case "whale":
      return { title: `+${usd(amount)}`, sub: `КИТ · ${flag} ${name}` };
    case "lost":
      return { title: "КЛИЕНТ СОРВАЛСЯ", sub: `${flag} ${name} · звонок прерван` };
    case "withdraw":
      return { title: `ВЫВОД ${usd(amount)}`, sub: `${flag} ${name} · заявка заблокирована` };
    case "burn":
      // Здесь lastName — это кличка дропа, а не имя жертвы
      return { title: "ДРОП СГОРЕЛ", sub: `«${name}» · карта заблокирована · ${usd(amount)} завис` };
    case "payout":
      return { title: `ЗАЛИВ ${usd(amount)}`, sub: `«${name}» · цепочка закрыта · нал в кассе` };
    case "link":
      return { title: `СПИСАНО ${usd(amount)}`, sub: `${flag} ${name} · ссылка открыта · карта введена` };
    case "ban":
      // Здесь lastName — хэндл личины, а не имя жертвы
      return { title: "АККАУНТ ЗАБАНЕН", sub: `${name} · переписка оборвана` };
    default:
      return { title: `+${usd(amount)}`, sub: `депозит · ${flag} ${name}` };
  }
}
