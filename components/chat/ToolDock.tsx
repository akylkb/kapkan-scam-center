"use client";

import { KeyRound, Link2, Mic, Video } from "lucide-react";
import type { ChatDesk, OtpCode } from "@/lib/fixtures/chatdesk";
import type { Thread } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";
import { VoicePanel } from "./VoicePanel";
import { DeepfakePanel } from "./DeepfakePanel";
import { LinkPanel } from "./LinkPanel";
import { OtpPanel } from "./OtpPanel";

export type ToolId = "voice" | "video" | "link" | "otp";

const TABS: { id: ToolId; label: string; icon: typeof Mic }[] = [
  { id: "voice", label: "ГОЛОС", icon: Mic },
  { id: "video", label: "ВИДЕО", icon: Video },
  { id: "link", label: "ССЫЛКА", icon: Link2 },
  { id: "otp", label: "КОДЫ", icon: KeyRound },
];

/**
 * Док инструментов.
 *
 * Четыре инструмента в одном окне: одновременно они в кадре не нужны,
 * а переключение вкладки — понятный жест актёра, который читается
 * даже на общем плане.
 */
export function ToolDock({
  desk,
  thread,
  tool,
  onTool,
  extraOtp,
  extraHits,
  callStart,
  onCall,
  onHangUp,
}: {
  desk: ChatDesk;
  thread: Thread;
  tool: ToolId;
  onTool: (t: ToolId) => void;
  /** Коды, прилетевшие по команде режиссёра */
  extraOtp: OtpCode[];
  /** Переходы по ссылке, добавленные режиссёром */
  extraHits: number;
  /**
   * Разговор живёт выше дока: иначе переключение вкладки размонтирует
   * панель голоса и звонок оборвётся сам собой.
   */
  callStart: number | null;
  onCall: (tick: number) => void;
  onHangUp: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-zinc-800">
      <div className="flex h-7 shrink-0 items-stretch border-b border-zinc-800 bg-zinc-900/50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTool(t.id)}
            className={cx(
              "flex flex-1 items-center justify-center gap-1 font-mono text-[9px] tracking-[0.12em] transition-colors",
              tool === t.id
                ? "border-b-2 border-cyan-500 bg-cyan-500/5 text-cyan-300"
                : "text-zinc-600 hover:text-zinc-400",
            )}
          >
            <t.icon className="h-3 w-3" strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tool === "voice" && (
          <VoicePanel
            thread={thread}
            seat={desk.seat}
            callStart={callStart}
            onCall={onCall}
            onHangUp={onHangUp}
          />
        )}
        {tool === "video" && <DeepfakePanel thread={thread} seat={desk.seat} />}
        {tool === "link" && <LinkPanel link={desk.link} extraHits={extraHits} />}
        {tool === "otp" && <OtpPanel codes={[...extraOtp, ...desk.otp]} />}
      </div>
    </div>
  );
}
