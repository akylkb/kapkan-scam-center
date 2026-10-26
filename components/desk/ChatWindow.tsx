"use client";

import type { LucideIcon } from "lucide-react";
import { Check, CheckCheck } from "lucide-react";
import { clock } from "@/lib/format";
import { SCENE_START_MINUTES } from "@/lib/scene/store";
import { useSecond } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";
import { WindowFrame } from "./WindowFrame";
import type { ChatItem } from "@/lib/fixtures/desktop";

export type ConvoLine = { from: "them" | "me"; text: string };

/**
 * Окно мессенджера для рабочего стола: слева список диалогов, справа один
 * открытый разговор. Параметризовано темой, чтобы WhatsApp Web и Telegram
 * были узнаваемо разными, но не дублировали вёрстку.
 *
 * Разговор статичный (это декорация общего плана, а не живой чат /chat).
 * Часы в шапке идут от времени сцены — окно не выглядит стоп-кадром.
 */
export function ChatWindow({
  title,
  icon: Icon,
  accent,
  dot,
  iconCls,
  selfBubble,
  theirBubble,
  chats,
  convo,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  dot: string;
  /** Цвет логотипа мессенджера — литералом, чтобы Tailwind его собрал */
  iconCls: string;
  selfBubble: string;
  theirBubble: string;
  chats: ChatItem[];
  convo: ConvoLine[];
}) {
  const second = useSecond();
  const open = chats[0];

  return (
    <WindowFrame
      title={title}
      accent={accent}
      right={
        <span className="tnum font-mono text-[10px] text-zinc-500">{clock(SCENE_START_MINUTES + second / 60)}</span>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-[150px_1fr]">
        {/* Список диалогов */}
        <div className="flex min-h-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950/40">
          {chats.map((c, i) => (
            <div
              key={c.id}
              className={cx(
                "flex items-center gap-1.5 border-b border-zinc-900/80 px-2 py-1.5",
                i === 0 && "bg-zinc-800/40",
              )}
            >
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] text-zinc-400">
                {c.name.replace("@", "")[0].toUpperCase()}
                {c.online && (
                  <span className={cx("absolute right-0 bottom-0 h-[6px] w-[6px] rounded-full ring-1 ring-zinc-950", dot)} />
                )}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[10.5px] text-zinc-300">{c.name}</p>
                <p className="truncate font-mono text-[8.5px] text-zinc-600">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <span className={cx("tnum flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[8.5px] font-bold text-zinc-950", dot)}>
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Открытый разговор */}
        <div className="flex min-h-0 flex-col">
          <header className="flex shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] text-zinc-400">
              {open.name.replace("@", "")[0].toUpperCase()}
            </span>
            <div className="leading-tight">
              <p className="text-[11px] text-zinc-200">{open.name}</p>
              <p className="font-mono text-[8.5px] text-zinc-600">
                {open.online ? "в сети" : `был(а) ${open.agoMin} мин назад`}
              </p>
            </div>
            <Icon className={cx("ml-auto h-3.5 w-3.5 opacity-40", iconCls)} strokeWidth={1.8} />
          </header>

          <div className="flex min-h-0 flex-1 flex-col-reverse gap-1.5 overflow-y-auto px-3 py-2">
            {/* col-reverse: новые снизу, как в любом мессенджере */}
            {[...convo].reverse().map((line, i) => {
              const me = line.from === "me";
              return (
                <div key={i} className={cx("flex", me ? "justify-end" : "justify-start")}>
                  <div
                    className={cx(
                      "max-w-[78%] rounded-[8px] px-2.5 py-1.5 text-[11px] leading-snug",
                      me ? selfBubble : theirBubble,
                    )}
                  >
                    {line.text}
                    {me && (
                      <span className="ml-1 inline-flex translate-y-[2px]">
                        {i === 0 ? (
                          <CheckCheck className="h-3 w-3 text-sky-300" strokeWidth={2.4} />
                        ) : (
                          <Check className="h-3 w-3 opacity-60" strokeWidth={2.4} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
