"use client";

import { useRef, useState } from "react";
import { ArrowUp, Camera, Plus, Smile } from "lucide-react";
import { TYPING_THROTTLE_MS } from "@/lib/live/protocol";
import { cx } from "@/components/shared/ui";

/**
 * Поле ввода на телефоне жертвы — второе настоящее поле в проекте.
 *
 * Здесь печатает актёр (или режиссёр за кадром), и реплика в ту же секунду
 * оказывается у чатера. Кнопка отправки крупная: в кадре видно, что человек
 * именно отправляет сообщение, а не просто трогает экран.
 */
export function PhoneComposer({
  accent,
  onSend,
  onTyping,
}: {
  accent: { send: string };
  onSend: (text: string) => void;
  onTyping: () => void;
}) {
  const [draft, setDraft] = useState("");
  const typedAt = useRef(0);
  const empty = draft.trim().length === 0;

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  function signalTyping() {
    const now = Date.now();
    if (now - typedAt.current < TYPING_THROTTLE_MS) return;
    typedAt.current = now;
    onTyping();
  }

  return (
    <div className="flex h-[62px] shrink-0 items-center gap-2 border-t border-zinc-800/80 bg-[#101013] px-3">
      <Plus className="h-6 w-6 shrink-0 text-zinc-500" strokeWidth={1.7} />

      <div className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full border border-zinc-700/70 bg-zinc-800/70 px-3.5">
        {/*
          select-text обязателен: выделение отключено глобально в globals.css,
          а в поле ввода оно нужно.
        */}
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            signalTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="Сообщение"
          className="min-w-0 flex-1 select-text bg-transparent text-[14px] text-zinc-100 placeholder:text-zinc-500"
        />
        <Smile className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={1.7} />
      </div>

      {empty ? (
        <Camera className="h-6 w-6 shrink-0 text-zinc-500" strokeWidth={1.7} />
      ) : (
        <button
          onClick={send}
          className={cx(
            "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-zinc-950 transition-colors",
            accent.send,
          )}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
