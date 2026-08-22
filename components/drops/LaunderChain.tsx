"use client";

import { Banknote, Bitcoin, CreditCard, User, Vault } from "lucide-react";
import type { ChainHop } from "@/lib/fixtures/payouts";
import { pct, usd } from "@/lib/format";
import { cx } from "@/components/shared/ui";

const HOP_META: Record<
  ChainHop["kind"],
  { icon: typeof User; tone: string; ring: string; caption: string }
> = {
  victim: {
    icon: User,
    tone: "text-sky-300",
    ring: "border-sky-700/50 bg-sky-950/40",
    caption: "ИСТОЧНИК",
  },
  drop: {
    icon: CreditCard,
    tone: "text-amber-300",
    ring: "border-amber-700/50 bg-amber-950/40",
    caption: "ДРОП",
  },
  exchange: {
    icon: Bitcoin,
    tone: "text-violet-300",
    ring: "border-violet-700/50 bg-violet-950/40",
    caption: "ОБМЕННИК",
  },
  wallet: {
    icon: Vault,
    tone: "text-fuchsia-300",
    ring: "border-fuchsia-700/50 bg-fuchsia-950/40",
    caption: "КОШЕЛЁК",
  },
  cash: {
    icon: Banknote,
    tone: "text-emerald-300",
    ring: "border-emerald-700/50 bg-emerald-950/40",
    caption: "НАЛИЧНЫЕ",
  },
};

/**
 * Цепочка отмыва одного залива.
 *
 * Главное, что должно читаться на крупном плане: сумма убывает на каждом
 * шаге, а в конце от денег жертвы остаётся заметно меньше. Ради этого
 * потери выведены отдельной строкой внизу.
 */
export function LaunderChain({
  hops,
  payoutId,
  failed,
}: {
  hops: ChainHop[];
  payoutId: string;
  failed: boolean;
}) {
  const first = hops[0]?.amount ?? 0;
  const last = hops[hops.length - 1]?.amount ?? 0;
  const lost = first - last;
  // Индекс шага, на котором цепочка рвётся, если карта сгорела
  const breakAt = failed ? 1 : -1;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-zinc-800">
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-2.5">
        <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          Цепочка отмыва
        </h2>
        <span className="font-mono text-[9px] text-zinc-600">{payoutId}</span>
        <div className="flex-1" />
        {failed && (
          <span className="font-mono text-[9px] tracking-[0.12em] text-rose-400">
            ЦЕПЬ РАЗОРВАНА
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {hops.map((hop, i) => {
          const meta = HOP_META[hop.kind];
          const broken = breakAt >= 0 && i >= breakAt;
          const isLast = i === hops.length - 1;

          return (
            <div key={hop.kind}>
              <div
                className={cx(
                  "flex items-center gap-2 rounded-[3px] border px-2 py-1.5",
                  broken ? "border-rose-800/50 bg-rose-950/30" : meta.ring,
                )}
              >
                <meta.icon
                  className={cx("h-3.5 w-3.5 shrink-0", broken ? "text-rose-400" : meta.tone)}
                  strokeWidth={1.9}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] leading-tight text-zinc-200">
                    {hop.label}
                  </p>
                  <p className="truncate font-mono text-[9px] text-zinc-600">{hop.sub}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cx(
                      "tnum font-mono text-[13px] font-semibold",
                      broken ? "text-rose-400 line-through" : meta.tone,
                    )}
                  >
                    {usd(hop.amount)}
                  </p>
                  <p className="font-mono text-[8.5px] tracking-[0.1em] text-zinc-600">
                    {meta.caption}
                  </p>
                </div>
              </div>

              {/* Переход к следующему шагу с потерей на комиссии */}
              {!isLast && (
                <div className="flex items-center gap-1.5 py-[3px] pl-[9px]">
                  <span
                    className={cx(
                      "h-3 w-px",
                      broken ? "bg-rose-800/60" : "bg-zinc-700",
                    )}
                  />
                  <span className="font-mono text-[9px] text-zinc-600">
                    ▼ комиссия{" "}
                    <span className={broken ? "text-rose-400" : "text-amber-400"}>
                      {hops[i + 1].feePct}%
                    </span>
                    <span className="ml-1 text-zinc-700">
                      −{usd(hop.amount - hops[i + 1].amount)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Итог: сколько дошло от денег жертвы */}
      <div className="flex shrink-0 items-baseline justify-between border-t border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5">
        <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          Дошло до кассы
        </span>
        <span className="font-mono text-[11px]">
          <span className={cx("tnum font-semibold", failed ? "text-rose-400" : "text-emerald-300")}>
            {failed ? usd(0) : usd(last)}
          </span>
          <span className="mx-1.5 text-zinc-700">потери</span>
          <span className="tnum text-zinc-500">
            {usd(failed ? first : lost)} · {pct(failed ? 1 : lost / (first || 1), 1)}
          </span>
        </span>
      </div>
    </div>
  );
}
