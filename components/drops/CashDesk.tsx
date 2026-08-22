"use client";

import { Banknote, Truck } from "lucide-react";
import type { CashDesk as CashDeskData } from "@/lib/fixtures/dropdesk";
import { usd } from "@/lib/format";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { cx } from "@/components/shared/ui";
import { CashGeo } from "./CashGeo";

const POINT_STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  ok: { label: "РАБОТАЕТ", tone: "text-emerald-300", dot: "bg-emerald-400" },
  wait: { label: "ЖДЁТ КУРЬЕРА", tone: "text-amber-300", dot: "bg-amber-400" },
  stop: { label: "ОСТАНОВЛЕНА", tone: "text-rose-400", dot: "bg-rose-500" },
};

/**
 * Касса и география снятий — низ левой колонки.
 * Карта сверху, список точек снизу: список уходит за нижний край, поэтому
 * колонка не заканчивается пустотой.
 */
export function CashDesk({ cash, seat }: { cash: CashDeskData; seat: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Две главные цифры кассы */}
      <div className="shrink-0 border-b border-zinc-900 px-2 py-2">
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-1 font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            <Banknote className="h-3 w-3" strokeWidth={1.8} />
            Нал в кассе
          </span>
          <DriftNumber
            base={cash.balanceCash}
            amplitude={900}
            seed={`cash-${seat}`}
            format={usd}
            className="font-mono text-[15px] font-semibold text-emerald-300"
          />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="flex items-center gap-1 font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            <Truck className="h-3 w-3" strokeWidth={1.8} />
            В пути у курьеров
          </span>
          <span className="tnum font-mono text-[12px] text-amber-300">
            {usd(cash.inTransit)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="font-mono text-[8.5px] tracking-[0.12em] text-zinc-600 uppercase">
            Разбивка
          </span>
          <span className="flex h-[5px] flex-1 overflow-hidden rounded-full bg-zinc-800">
            <span className="h-full bg-amber-500" style={{ width: `${cash.dropShare}%` }} />
            <span className="h-full bg-violet-500" style={{ width: `${cash.orgShare}%` }} />
          </span>
          <span className="tnum font-mono text-[9px] text-zinc-500">
            <span className="text-amber-400">{cash.dropShare}%</span>
            <span className="mx-0.5 text-zinc-700">/</span>
            <span className="text-violet-400">{cash.orgShare}%</span>
          </span>
        </div>
      </div>

      {/* Карта региона в пропорции 2:1 — иначе панель тянется, а карта нет */}
      <div className="aspect-[2/1] w-full shrink-0 border-b border-zinc-900 p-1">
        <CashGeo points={cash.points} />
      </div>

      {/* Точки снятия */}
      <p className="shrink-0 px-2 pt-1.5 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
        Точки снятия
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1.5">
        {cash.points.map((p) => {
          const st = POINT_STATUS[p.status];
          const used = Math.min(100, Math.round((p.withdrawnToday / p.limit) * 100));
          return (
            <div key={p.city} className="border-b border-zinc-900 py-[5px]">
              <div className="flex items-center gap-1.5">
                <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", st.dot)} />
                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                  {p.city}
                </span>
                <span className="tnum shrink-0 font-mono text-[10.5px] text-emerald-300">
                  {usd(p.withdrawnToday)}
                </span>
              </div>
              <div className="mt-[3px] flex items-center gap-1.5 pl-3">
                <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className={cx(
                      "block h-full rounded-full",
                      used > 90 ? "bg-rose-500" : used > 60 ? "bg-amber-400" : "bg-emerald-500",
                    )}
                    style={{ width: `${used}%` }}
                  />
                </span>
                <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-600">
                  {p.atms} б/м
                </span>
                <span className={cx("shrink-0 font-mono text-[8.5px] tracking-[0.08em]", st.tone)}>
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
