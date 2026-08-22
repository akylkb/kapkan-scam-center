"use client";

import { useMemo } from "react";
import { ArrowRight, Ban, Pause, Zap } from "lucide-react";
import { PAYOUT_STAGES, payoutStateAt, type Payout } from "@/lib/fixtures/payouts";
import { mmss, usd } from "@/lib/format";
import { useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";

const COLS =
  "grid grid-cols-[70px_92px_1fr_110px_128px_1.15fr_62px] gap-x-2 items-center";

/**
 * Очередь заливов.
 *
 * Тик сцены читается ОДИН раз на весь блок, а стадия каждой строки считается
 * чистой функцией payoutStateAt. Двадцать строк с собственной подпиской
 * положили бы слабую площадочную машину.
 */
export function PayoutQueue({
  payouts,
  selectedId,
  onSelect,
  failedIds,
}: {
  payouts: Payout[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Заливы, сорванные по команде режиссёра (сгорела карта) */
  failedIds: ReadonlySet<string>;
}) {
  const tick = useTick();

  // Активные заливы вверху, закрытые и сорванные уходят вниз —
  // так в кадре всегда движется верхняя, самая читаемая часть списка
  const rows = useMemo(() => {
    return payouts
      .map((p) => {
        const state = payoutStateAt(p, tick);
        const failed = state.failed || failedIds.has(p.id);
        return { p, state, failed };
      })
      .sort((a, b) => {
        const rank = (r: typeof a) => (r.failed ? 2 : r.state.done ? 3 : r.state.pending ? 1 : 0);
        return rank(a) - rank(b) || b.p.amount - a.p.amount;
      });
  }, [payouts, tick, failedIds]);

  const live = rows.filter((r) => !r.failed && !r.state.done && !r.state.pending).length;
  const volume = rows
    .filter((r) => !r.failed)
    .reduce((sum, r) => sum + r.p.amount, 0);

  return (
    <div className="flex h-[298px] shrink-0 flex-col overflow-hidden border-t border-zinc-800 bg-[#0b0b0e]">
      {/* Шапка блока */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-2.5">
        <h2 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          <Zap className="h-3 w-3 text-violet-400" strokeWidth={2} />
          Очередь заливов
        </h2>
        <span className="font-mono text-[9.5px] tracking-[0.1em] text-zinc-600">
          В РАБОТЕ <span className="text-emerald-300">{live}</span> · ОБЪЁМ{" "}
          <span className="text-emerald-300">{usd(volume)}</span>
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[9px] tracking-[0.12em] text-zinc-600">
          ПОДТВЕРЖДЕНИЕ SMS ПЕРЕХВАТЫВАЕТСЯ АВТОМАТИЧЕСКИ
        </span>
      </div>

      {/* Шапка таблицы */}
      <div
        className={cx(
          COLS,
          "shrink-0 border-b border-zinc-900 px-2.5 py-[4px] font-mono text-[8.5px] tracking-[0.12em] text-zinc-600 uppercase",
        )}
      >
        <span>Залив</span>
        <span className="text-right">Сумма</span>
        <span>Жертва · оператор</span>
        <span>Способ</span>
        <span>На дропа</span>
        <span>Стадия</span>
        <span className="text-right">Таймер</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map(({ p, state, failed }) => {
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cx(
                COLS,
                "w-full border-b border-zinc-900/70 px-2.5 py-[5px] text-left transition-colors",
                selected
                  ? "bg-violet-500/10 ring-1 ring-violet-500/40 ring-inset"
                  : failed
                    ? "bg-rose-500/10"
                    : "hover:bg-zinc-800/40",
              )}
            >
              <span className="font-mono text-[10px] text-zinc-600">{p.id}</span>

              <span
                className={cx(
                  "tnum text-right font-mono text-[12px] font-semibold",
                  failed ? "text-rose-400 line-through" : "text-emerald-300",
                )}
              >
                {usd(p.amount)}
              </span>

              <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-zinc-300">
                {p.victim}
                <span className="truncate font-mono text-[9px] text-zinc-600">
                  {p.fromAgent}
                </span>
              </span>

              <span className="truncate font-mono text-[9.5px] text-zinc-500">{p.method}</span>

              <span className="flex min-w-0 items-center gap-1 truncate text-[10.5px] text-zinc-400">
                <ArrowRight className="h-3 w-3 shrink-0 text-zinc-700" />
                <span className="truncate">{p.dropAlias}</span>
                <span className="shrink-0 font-mono text-[9px] text-zinc-700">{p.dropId}</span>
              </span>

              <StageBar state={state} failed={failed} />

              <span
                className={cx(
                  "tnum text-right font-mono text-[10.5px]",
                  failed
                    ? "text-rose-400"
                    : state.done
                      ? "text-zinc-600"
                      : state.pending
                        ? "text-zinc-500"
                        : "text-amber-300",
                )}
              >
                {failed ? "—:—" : state.done ? "готово" : mmss(state.etaSec)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Полоска стадий: шесть сегментов, пройденные закрашены */
function StageBar({
  state,
  failed,
}: {
  state: ReturnType<typeof payoutStateAt>;
  failed: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex flex-1 gap-[2px]">
        {PAYOUT_STAGES.map((_, i) => {
          const passed = i < state.stage;
          const current = i === state.stage;
          return (
            <span
              key={i}
              className="h-[4px] flex-1 overflow-hidden rounded-[1px] bg-zinc-800"
            >
              <span
                className={cx(
                  "block h-full rounded-[1px]",
                  failed
                    ? passed || current
                      ? "bg-rose-500"
                      : ""
                    : passed
                      ? "bg-emerald-500"
                      : current
                        ? "bg-amber-400"
                        : "",
                )}
                style={{
                  width: passed || failed ? "100%" : current ? `${state.pct * 100}%` : "0%",
                }}
              />
            </span>
          );
        })}
      </span>
      <span
        className={cx(
          "flex w-[74px] shrink-0 items-center gap-1 font-mono text-[9px] tracking-[0.08em]",
          failed
            ? "text-rose-400"
            : state.done
              ? "text-emerald-400"
              : state.pending
                ? "text-zinc-600"
                : "text-amber-300",
        )}
      >
        {failed && <Ban className="h-2.5 w-2.5 shrink-0" />}
        {state.pending && !failed && <Pause className="h-2.5 w-2.5 shrink-0" />}
        <span className="truncate">{failed ? "ОТКАЗ" : state.label}</span>
      </span>
    </span>
  );
}
