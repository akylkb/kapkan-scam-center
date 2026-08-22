"use client";

import {
  ChevronRight,
  Link2,
  MessagesSquare,
  Send,
  ShieldAlert,
  UserSquare2,
  FileBadge,
} from "lucide-react";
import {
  buildChannelCounts,
  buildChatQueues,
  type ChatQueueId,
} from "@/lib/fixtures/chatdesk";
import { CHANNEL_META, type Thread } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";

type Section = { icon: typeof MessagesSquare; label: string; active?: boolean };

const SECTIONS: Section[] = [
  { icon: MessagesSquare, label: "Диалоги", active: true },
  { icon: Send, label: "Рассылка" },
  { icon: UserSquare2, label: "Личины" },
  { icon: Link2, label: "Ссылки" },
  { icon: FileBadge, label: "Доказательства" },
  { icon: ShieldAlert, label: "Чёрный список" },
];

export function ChatFilters({
  threads,
  queue,
  onQueue,
  children,
}: {
  threads: Thread[];
  queue: ChatQueueId;
  onQueue: (q: ChatQueueId) => void;
  /** Нижний блок колонки — личины и рассылка */
  children: React.ReactNode;
}) {
  const queues = buildChatQueues(threads);
  const channels = buildChannelCounts(threads);

  return (
    <nav className="flex w-[232px] shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-[#0b0b0e]">
      <div className="shrink-0 border-b border-zinc-900 p-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.label}
            className={cx(
              "flex w-full items-center gap-2 rounded-[3px] px-2 py-[5px] text-left text-[11.5px] transition-colors",
              s.active
                ? "bg-zinc-800/70 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
            )}
          >
            <s.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Воронка: цифры должны читаться боковым зрением */}
      <div className="shrink-0 p-1.5">
        <p className="px-2 pt-1 pb-1.5 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Этап работы
        </p>
        {queues.map((q) => (
          <button
            key={q.id}
            onClick={() => onQueue(q.id)}
            className={cx(
              "flex w-full items-center justify-between gap-2 rounded-[3px] px-2 py-[4px] text-left text-[11.5px] transition-colors",
              queue === q.id
                ? "bg-zinc-800/70 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              {queue === q.id && <ChevronRight className="h-3 w-3 shrink-0 text-cyan-400" />}
              <span className="truncate">{q.label}</span>
            </span>
            <span
              className={cx(
                "tnum rounded-[2px] bg-zinc-900 px-1.5 py-[1px] font-mono text-[10px] font-semibold",
                q.tone,
              )}
            >
              {q.count}
            </span>
          </button>
        ))}

        {/* Каналы — по ним фильтруют не реже, чем по этапу */}
        <p className="px-2 pt-2.5 pb-1.5 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Каналы
        </p>
        <div className="flex gap-1 px-1">
          {channels.map((c) => {
            const meta = CHANNEL_META[c.id];
            return (
              <div
                key={c.id}
                className={cx(
                  "flex flex-1 flex-col items-center rounded-[3px] border py-1",
                  meta.border,
                  meta.bg,
                )}
              >
                <span className={cx("font-mono text-[9px] font-bold", meta.text)}>
                  {meta.short}
                </span>
                <span className="tnum font-mono text-[12px] text-zinc-300">{c.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Личины и рассылка занимают низ колонки до самого края */}
      <div className="mt-auto flex min-h-0 flex-1 flex-col border-t border-zinc-900">
        {children}
      </div>
    </nav>
  );
}
