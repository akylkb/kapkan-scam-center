"use client";

import { useState } from "react";
import {
  FileCheck2,
  Image as ImageIcon,
  Languages,
  Link2,
  Package,
  Paperclip,
  SendHorizontal,
  Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { Persona, PersonaStatus } from "@/lib/fixtures/personas";
import type { Thread } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";

/**
 * Поле ввода.
 *
 * Слева — генератор доказательств: чек, трек, скрин баланса, фото товара.
 * Одно нажатие, и в переписке появляется «подтверждение», которого нет.
 */
const PROOFS = [
  { icon: FileCheck2, label: "Чек" },
  { icon: Package, label: "Трек" },
  { icon: Wallet, label: "Баланс" },
  { icon: ImageIcon, label: "Фото" },
  { icon: Link2, label: "Ссылка" },
];

export function Composer({
  thread,
  persona,
  bannedStatus,
  onSend,
}: {
  thread: Thread;
  persona: Persona;
  /** Личина в бане — писать нечем, поле блокируется */
  bannedStatus: PersonaStatus;
  /** Отправить реплику в ленту чата */
  onSend: (text: string) => void;
}) {
  const banned = bannedStatus === "banned";

  // Черновик живёт в компоненте: при переключении диалога Composer
  // перемонтируется вместе с ChatThread, и поле само очищается
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text || banned) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div
      className={cx(
        "flex h-[92px] shrink-0 flex-col justify-center gap-1.5 border-t bg-[#0b0b0e] px-3",
        banned ? "border-rose-800/60" : "border-zinc-800",
      )}
    >
      <div className="flex items-center gap-1">
        {PROOFS.map((p) => (
          <button
            key={p.label}
            disabled={banned}
            className={cx(
              "flex items-center gap-1 rounded-[3px] border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.06em] transition-colors",
              banned
                ? "border-zinc-900 bg-zinc-900/40 text-zinc-700"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-cyan-800/60 hover:text-cyan-300",
            )}
          >
            <p.icon className="h-3 w-3" strokeWidth={1.8} />
            {p.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] text-zinc-600">
          <Languages className="h-3 w-3" />
          язык RU · орфография проверена
        </span>
      </div>

      <div
        className={cx(
          "flex h-[34px] items-center gap-2 rounded-[4px] border px-2.5",
          banned ? "border-rose-900/60 bg-rose-950/20" : "border-zinc-800 bg-zinc-900/60",
        )}
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
        {banned ? (
          <span className="flex-1 text-[12px] text-rose-300">
            Аккаунт {persona.handle} заблокирован — переписка недоступна
          </span>
        ) : (
          /*
            Настоящее поле: актёр печатает реплику прямо в кадре и отправляет
            её в ленту. select-text — потому что выделение отключено глобально,
            а в поле ввода оно нужно.
          */
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            placeholder="Не переживайте, всё оформлено официально"
            className="flex-1 select-text bg-transparent text-[12.5px] text-zinc-200 placeholder:text-zinc-600"
          />
        )}
        <button
          onClick={send}
          disabled={banned || draft.trim().length === 0}
          className={cx(
            "flex h-[24px] w-[26px] shrink-0 items-center justify-center rounded-[3px] transition-colors",
            banned || draft.trim().length === 0
              ? "bg-zinc-800 text-zinc-600"
              : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
          )}
        >
          <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>

      <p className="flex items-center justify-between font-mono text-[8.5px] text-zinc-600">
        <span>
          пишем от {persona.handle} · {persona.legend}
        </span>
        <span>
          шаблон «{BRAND.chat.name}-{thread.scheme.toUpperCase()}» ·{" "}
          {banned ? "отправка заблокирована" : "Enter — отправить"}
        </span>
      </p>
    </div>
  );
}
