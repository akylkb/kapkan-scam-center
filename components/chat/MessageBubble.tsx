"use client";

import { Check, CheckCheck, Trash2 } from "lucide-react";
import type { Message } from "@/lib/fixtures/threads";
import { agoLabel } from "@/lib/format";
import { cx } from "@/components/shared/ui";
import { ProofCard } from "./ProofCard";

/**
 * Реплика в переписке.
 *
 * Стоп-слова жертвы подсвечиваются прямо в пузыре: на крупном плане должно
 * быть видно не только, что клиент занервничал, но и на каком именно слове.
 *
 * Корзина всплывает только под курсором: в кадре у переписки не должно быть
 * лишних кнопок, но актёру нужен способ стереть реплику по игре. Место под
 * неё зарезервировано всегда (гасим прозрачностью, а не display), иначе
 * пузырь дёргался бы вбок в момент наведения.
 */
export function MessageBubble({ msg, onDelete }: { msg: Message; onDelete: () => void }) {
  if (msg.from === "system") {
    return (
      <div className="group my-1 flex items-center gap-2 px-4">
        <span className="h-px flex-1 bg-zinc-900" />
        <span className="shrink-0 font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          {msg.text}
        </span>
        <DeleteBtn onClick={onDelete} />
        <span className="h-px flex-1 bg-zinc-900" />
      </div>
    );
  }

  const out = msg.from === "operator";

  // Две галочки = реплика дошла. У живой реплики это подтверждает мост
  // (эхо от сервера), у фикстурной — возраст: свежую «ещё не прочли»
  const read = msg.live ? msg.delivered === true : msg.agoMin > 30;

  return (
    <div
      className={cx(
        "group flex items-center gap-1 px-4 py-[3px]",
        out ? "justify-end" : "justify-start",
      )}
    >
      {out && <DeleteBtn onClick={onDelete} />}

      <div
        className={cx(
          "max-w-[62%] min-w-0 rounded-[6px] border px-2.5 py-1.5",
          out
            ? "border-cyan-800/50 bg-cyan-500/12"
            : "border-zinc-800 bg-zinc-800/60",
        )}
      >
        <p className="text-[12.5px] leading-snug break-words text-zinc-200">
          {highlight(msg.text, msg.flags)}
        </p>

        {msg.attach && <ProofCard attach={msg.attach} />}

        <p
          className={cx(
            "mt-0.5 flex items-center gap-1 font-mono text-[8.5px] text-zinc-600",
            out ? "justify-end" : "justify-start",
          )}
        >
          {agoLabel(msg.agoMin)}
          {out &&
            (read ? (
              <CheckCheck className="h-2.5 w-2.5 text-cyan-500" />
            ) : (
              <Check className="h-2.5 w-2.5 text-zinc-600" />
            ))}
        </p>
      </div>

      {!out && <DeleteBtn onClick={onDelete} />}
    </div>
  );
}

/** Стереть реплику — сразу с обоих экранов, и у чатера, и у жертвы */
function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Удалить у обоих"
      className="shrink-0 p-1 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
    >
      <Trash2 className="h-3 w-3" strokeWidth={1.9} />
    </button>
  );
}

/** Разбивает реплику на куски, подсвечивая стоп-слова */
function highlight(text: string, flags?: string[]) {
  if (!flags || flags.length === 0) return text;

  const pattern = new RegExp(`(${flags.map(escapeRe).join("|")})`, "gi");
  return text.split(pattern).map((part, i) =>
    flags.some((f) => f.toLowerCase() === part.toLowerCase()) ? (
      <span
        key={i}
        className="rounded-[2px] bg-rose-500/20 font-semibold text-rose-300 underline decoration-rose-500/60"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
