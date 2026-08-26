"use client";

import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/fixtures/threads";
import { agoLabel } from "@/lib/format";
import { cx } from "@/components/shared/ui";
import { PhoneProof } from "./PhoneProof";

/**
 * Реплика на телефоне жертвы — зеркало пузыря у чатера.
 *
 * Что жертва видеть не должна и чего здесь поэтому нет:
 * — служебные строки (from: "system") отсекаются выше, в ленте;
 * — подсветка стоп-слов (msg.flags): это детектор «палева» у чатера,
 *   на телефоне жертвы её быть не может по определению.
 */
export function PhoneBubble({
  msg,
  accent,
  visited,
  onLinkTap,
}: {
  msg: Message;
  /** Цвет мессенджера: своя реплика красится в него */
  accent: { bubble: string; border: string; check: string };
  visited: boolean;
  onLinkTap: () => void;
}) {
  // Своё — то, что написала жертва. У чатера всё наоборот
  const out = msg.from === "victim";
  const read = msg.live ? msg.delivered === true : msg.agoMin > 30;

  return (
    <div className={cx("flex px-3 py-[3px]", out ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[78%] min-w-0 rounded-[14px] border px-3 py-1.5",
          out
            ? cx(accent.bubble, accent.border, "rounded-br-[4px]")
            : "rounded-bl-[4px] border-zinc-700/60 bg-zinc-800",
        )}
      >
        <p className="text-[14px] leading-[1.35] break-words text-zinc-100">{msg.text}</p>

        {msg.attach && (
          <PhoneProof attach={msg.attach} visited={visited} onLinkTap={onLinkTap} />
        )}

        <p
          className={cx(
            "mt-0.5 flex items-center gap-1 text-[9.5px] text-zinc-400/80",
            out ? "justify-end" : "justify-start",
          )}
        >
          {agoLabel(msg.agoMin)}
          {out &&
            (read ? (
              <CheckCheck className={cx("h-3 w-3", accent.check)} />
            ) : (
              <Check className="h-3 w-3 text-zinc-500" />
            ))}
        </p>
      </div>
    </div>
  );
}
