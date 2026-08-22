"use client";

import { Link2, Phone, Timer, Video } from "lucide-react";
import {
  CHANNEL_META,
  STAGES,
  THREAD_STATUS_META,
  type Message,
  type Thread,
} from "@/lib/fixtures/threads";
import { SCHEME_META } from "@/lib/fixtures/threads";
import type { Persona } from "@/lib/fixtures/personas";
import { Chip, LiveDot, cx } from "@/components/shared/ui";
import { MessageBubble } from "./MessageBubble";
import { SuggestBar } from "./SuggestBar";
import { Composer } from "./Composer";
import type { ToolId } from "./ToolDock";

export function ChatThread({
  thread,
  messages,
  persona,
  personaBanned,
  blown,
  onTool,
}: {
  thread: Thread;
  /** Новые сверху: лента рисуется flex-col-reverse и упирается в низ */
  messages: Message[];
  persona: Persona;
  personaBanned: boolean;
  blown: boolean;
  onTool: (tool: ToolId) => void;
}) {
  const ch = CHANNEL_META[thread.channel];
  const status = THREAD_STATUS_META[thread.status];
  const scheme = SCHEME_META[thread.scheme];

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Шапка переписки */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#0b0b0e] px-3">
        <span className="relative shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[12px] text-zinc-300">
            {thread.name[0]}
          </span>
          {thread.online && (
            <span className="absolute -right-0.5 -bottom-0.5">
              <LiveDot className="bg-emerald-400" size={6} />
            </span>
          )}
        </span>

        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1.5 truncate text-[13px] text-zinc-100">
            <span>{thread.country.flag}</span>
            {thread.name}
            <span className={cx("font-mono text-[9px]", ch.text)}>
              {ch.label} {thread.handle}
            </span>
          </p>
          <p className="truncate font-mono text-[9px] tracking-[0.08em] text-zinc-600">
            {thread.id} · {thread.city} · {thread.phone} · личина {persona.handle}
          </p>
        </div>

        <Chip className={cx(status.bg, status.border, status.text, "shrink-0")}>
          <span className={cx("h-[4px] w-[4px] rounded-full", status.dot)} />
          {status.label}
        </Chip>

        <Chip className="shrink-0 border-zinc-700/60 bg-zinc-800/60 text-zinc-400">
          {scheme.short}
        </Chip>

        <span className="flex shrink-0 items-center gap-1 font-mono text-[9.5px] text-zinc-500">
          <Timer className="h-3 w-3" />в работе {inWork(thread.inWorkMin)}
        </span>

        {/* Степпер воронки — по нему видно, насколько клиент «дожат» */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          {STAGES.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className={cx(
                  "rounded-[2px] border px-1.5 py-[1px] font-mono text-[8.5px] tracking-[0.08em]",
                  i < thread.stage
                    ? "border-cyan-900/60 bg-cyan-950/40 text-cyan-500"
                    : i === thread.stage
                      ? "border-cyan-600/70 bg-cyan-500/15 text-cyan-200"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-700",
                )}
              >
                {s}
              </span>
              {i < STAGES.length - 1 && (
                <span
                  className={cx("h-px w-2", i < thread.stage ? "bg-cyan-800" : "bg-zinc-800")}
                />
              )}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 gap-1">
          <HeadBtn icon={Phone} label="Звонок" onClick={() => onTool("voice")} />
          <HeadBtn icon={Video} label="Видео" onClick={() => onTool("video")} />
          <HeadBtn icon={Link2} label="Ссылка" onClick={() => onTool("link")} />
        </div>
      </header>

      {/*
        flex-col-reverse: переписка сама упирается в нижний край и открывается
        на свежих репликах. Скроллить наверх её можно, но JS для этого не нужен.
      */}
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto py-2">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        {/* Начало переписки — чтобы лента не обрывалась в пустоту */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="h-px flex-1 bg-zinc-900" />
          <span className="shrink-0 font-mono text-[8.5px] tracking-[0.14em] text-zinc-700 uppercase">
            начало диалога · источник: рассылка · {scheme.label}
          </span>
          <span className="h-px flex-1 bg-zinc-900" />
        </div>
      </div>

      <SuggestBar thread={thread} blown={blown} onTool={onTool} />
      <Composer
        thread={thread}
        persona={persona}
        bannedStatus={personaBanned ? "banned" : persona.status}
      />
    </div>
  );
}

function HeadBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-[3px] border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10.5px] text-zinc-400 transition-colors hover:border-cyan-800/60 hover:text-cyan-300"
    >
      <Icon className="h-3 w-3" strokeWidth={1.9} />
      {label}
    </button>
  );
}

/** «2 ч 14 м» — сокращения вместо склонений, как и везде в проекте */
function inWork(minutes: number): string {
  if (minutes < 60) return `${minutes} м`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h} ч ${minutes % 60} м`;
  return `${Math.floor(h / 24)} дн ${h % 24} ч`;
}
