"use client";

import { selectFeed, useSceneValue } from "@/lib/scene/SceneProvider";
import type { FeedItem } from "@/lib/scene/events";
import { cx } from "./ui";

const KIND_STYLE: Record<FeedItem["kind"], string> = {
  deposit: "text-emerald-300",
  lost: "text-rose-400",
  join: "text-sky-300",
  call: "text-zinc-400",
  withdraw: "text-amber-300",
  upgrade: "text-fuchsia-300",
  alarm: "text-rose-300 font-bold",
};

const KIND_MARK: Record<FeedItem["kind"], string> = {
  deposit: "▲",
  lost: "▼",
  join: "＋",
  call: "◎",
  withdraw: "⛔",
  upgrade: "★",
  alarm: "⚠",
};

/**
 * Бегущая строка событий.
 *
 * Лента дублируется дважды, а анимация сдвигает контейнер ровно на -50% —
 * так строка идёт бесшовно, без пустот в кадре.
 */
export function Ticker({ speed = "normal" }: { speed?: "normal" | "fast" }) {
  const feed = useSceneValue(selectFeed);
  const items = feed.length >= 8 ? feed : [...feed, ...PLACEHOLDER];
  const row = [...items, ...items];

  return (
    <div className="relative flex h-7 shrink-0 items-center overflow-hidden border-t border-zinc-800/80 bg-zinc-900/50">
      <div
        className={cx(
          "flex w-max shrink-0 items-center gap-7 pl-4 whitespace-nowrap",
          speed === "fast" ? "animate-marquee-fast" : "animate-marquee",
        )}
      >
        {row.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className={cx("font-mono text-[11px] tracking-wide", KIND_STYLE[item.kind])}
          >
            <span className="mr-1.5 opacity-70">{KIND_MARK[item.kind]}</span>
            {item.text}
          </span>
        ))}
      </div>
      {/* Мягкие края: строка «втекает» и «вытекает», а не обрубается */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-zinc-950 to-transparent" />
    </div>
  );
}

/** Пока лента не набралась, показываем заготовку — пустой тикер выдаёт макет */
const PLACEHOLDER: FeedItem[] = [
  { id: -1, kind: "deposit", at: 0, text: "🇩🇪 Klaus B. · депозит $2 480 · Hans Söller" },
  { id: -2, kind: "join", at: 0, text: "🇬🇧 Margaret W. · новая регистрация · источник ADS-41" },
  { id: -3, kind: "call", at: 0, text: "Mary Roberts · дозвон Великобритания · 6 мин" },
  { id: -4, kind: "upgrade", at: 0, text: "🇪🇸 Rafael O. · апгрейд до GOLD" },
  { id: -5, kind: "deposit", at: 0, text: "🇨🇦 Douglas H. · депозит $5 200 · Daniel Kruger" },
  { id: -6, kind: "withdraw", at: 0, text: "🇮🇹 Franca Z. · запрос вывода · отклонён" },
  { id: -7, kind: "deposit", at: 0, text: "🇳🇱 Willem de R. · депозит $850 · Sophie Laurent" },
  { id: -8, kind: "lost", at: 0, text: "🇫🇷 Monique F. · отказ · передан в RECOVERY" },
];
