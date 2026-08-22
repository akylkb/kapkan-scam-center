"use client";

import { FileCheck2, Image as ImageIcon, Link2, Package, Wallet } from "lucide-react";
import type { Attach } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";

const ATTACH_META: Record<
  Attach["kind"],
  { icon: typeof FileCheck2; tone: string; caption: string }
> = {
  receipt: { icon: FileCheck2, tone: "text-emerald-300", caption: "ЧЕК · СГЕНЕРИРОВАН" },
  track: { icon: Package, tone: "text-amber-300", caption: "ТРЕК-НОМЕР" },
  balance: { icon: Wallet, tone: "text-emerald-300", caption: "СКРИНШОТ БАЛАНСА" },
  photo: { icon: ImageIcon, tone: "text-zinc-300", caption: "ФОТО ИЗ БИБЛИОТЕКИ" },
  link: { icon: Link2, tone: "text-cyan-300", caption: "ССЫЛКА · КЛОН СТРАНИЦЫ" },
};

/**
 * «Доказательство» в переписке: фейковый чек, трек-номер, скрин баланса.
 * Именно эти карточки жертва потом показывает в полиции, поэтому в кадре
 * они должны выглядеть буднично — как обычное вложение в мессенджере.
 */
export function ProofCard({ attach }: { attach: Attach }) {
  const meta = ATTACH_META[attach.kind];

  return (
    <div className="mt-1 flex items-center gap-2 rounded-[3px] border border-zinc-700/70 bg-zinc-950/60 px-2 py-1.5">
      <span
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-zinc-800 bg-zinc-900",
          meta.tone,
        )}
      >
        <meta.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cx("block truncate font-mono text-[10.5px]", meta.tone)}>
          {attach.title}
        </span>
        <span className="block truncate font-mono text-[8.5px] text-zinc-600">
          {attach.sub}
        </span>
      </span>
      <span className="ml-auto shrink-0 font-mono text-[7.5px] tracking-[0.12em] text-zinc-700 uppercase">
        {meta.caption}
      </span>
    </div>
  );
}
