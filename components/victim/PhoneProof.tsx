"use client";

import { FileCheck2, Image as ImageIcon, Link2, Package, Wallet } from "lucide-react";
import type { Attach } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";

/**
 * Вложение глазами жертвы.
 *
 * У чатера та же карточка подписана честно — «ЧЕК · СГЕНЕРИРОВАН», «ССЫЛКА ·
 * КЛОН СТРАНИЦЫ». Здесь этих подписей нет: жертва видит обычное вложение
 * в мессенджере, и весь смысл сцены в том, что отличить его невозможно.
 */
const ATTACH_META: Record<Attach["kind"], { icon: typeof FileCheck2; tone: string }> = {
  receipt: { icon: FileCheck2, tone: "text-emerald-300" },
  track: { icon: Package, tone: "text-amber-300" },
  balance: { icon: Wallet, tone: "text-emerald-300" },
  photo: { icon: ImageIcon, tone: "text-zinc-300" },
  link: { icon: Link2, tone: "text-sky-300" },
};

export function PhoneProof({
  attach,
  visited,
  onLinkTap,
}: {
  attach: Attach;
  /** По ссылке уже перешли: в кадре должно быть видно, что тап сработал */
  visited: boolean;
  /** Тап по ссылке — тот самый момент, ради которого писалась вся переписка */
  onLinkTap: () => void;
}) {
  const meta = ATTACH_META[attach.kind];
  const tappable = attach.kind === "link";

  return (
    <button
      disabled={!tappable}
      onClick={tappable ? onLinkTap : undefined}
      className={cx(
        "mt-1.5 flex w-full items-center gap-2 rounded-[8px] border bg-zinc-900/70 px-2 py-1.5 text-left transition-colors",
        visited ? "border-sky-500/60 bg-sky-950/40" : "border-zinc-600/50",
        tappable && !visited && "hover:border-sky-500/60 hover:bg-sky-950/40",
      )}
    >
      <span
        className={cx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-zinc-800",
          meta.tone,
        )}
      >
        <meta.icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cx(
            "block truncate text-[11.5px]",
            tappable ? "text-sky-300 underline decoration-sky-500/50" : "text-zinc-200",
          )}
        >
          {attach.title}
        </span>
        <span className="block truncate text-[9.5px] text-zinc-500">
          {visited ? "страница открыта" : attach.sub}
        </span>
      </span>
    </button>
  );
}
