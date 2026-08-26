"use client";

import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/fixtures/threads";
import { agoLabel } from "@/lib/format";
import { cx } from "@/components/shared/ui";
import { ProofCard } from "./ProofCard";

/**
 * Реплика в переписке.
 *
 * Стоп-слова жертвы подсвечиваются прямо в пузыре: на крупном плане должно
 * быть видно не только, что клиент занервничал, но и на каком именно слове.
 */
export function MessageBubble({ msg }: { msg: Message }) {
  if (msg.from === "system") {
    return (
      <div className="my-1 flex items-center gap-2 px-4">
        <span className="h-px flex-1 bg-zinc-900" />
        <span className="shrink-0 font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          {msg.text}
        </span>
        <span className="h-px flex-1 bg-zinc-900" />
      </div>
    );
  }

  const out = msg.from === "operator";

  // Две галочки = реплика дошла. У живой реплики это подтверждает мост
  // (эхо от сервера), у фикстурной — возраст: свежую «ещё не прочли»
  const read = msg.live ? msg.delivered === true : msg.agoMin > 30;

  return (
    <div className={cx("flex px-4 py-[3px]", out ? "justify-end" : "justify-start")}>
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
    </div>
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
