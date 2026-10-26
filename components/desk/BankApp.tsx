"use client";

import { ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { som, signedPct } from "@/lib/format";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { Chip, cx } from "@/components/shared/ui";
import { WindowFrame } from "./WindowFrame";
import type { BankAccount, Transfer } from "@/lib/fixtures/desktop";

/**
 * Окно банк-клиента: счета подставных карт и лента переводов. Баланс
 * верхнего счёта слегка «дышит» (DriftNumber) — окно не выглядит стоп-кадром.
 */
const STATUS: Record<Transfer["status"], { label: string; cls: string }> = {
  ok: { label: "проведён", cls: "text-emerald-400/80" },
  hold: { label: "в проверке", cls: "text-amber-300" },
  fail: { label: "отклонён", cls: "text-rose-400" },
};

export function BankApp({
  accounts,
  transfers,
}: {
  accounts: BankAccount[];
  transfers: Transfer[];
}) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <WindowFrame
      title={`${BRAND.bankfake.short} · Бизнес-кабинет`}
      accent="bg-violet-500"
      badge={
        <Chip className="border-violet-700/50 bg-violet-500/10 text-violet-300">
          <Landmark className="h-3 w-3" />
          {accounts.length} счёта
        </Chip>
      }
      right={
        <span className="tnum font-mono text-[11px] text-zinc-300">
          <DriftNumber base={total} amplitude={14_000} seed="bank-total" format={som} />
        </span>
      }
    >
      {/* Карточки счетов */}
      <div className="grid shrink-0 grid-cols-2 gap-1.5 p-2">
        {accounts.map((a, i) => (
          <div
            key={a.id}
            className="rounded-[4px] border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[11px] text-zinc-300">«{a.holder}»</span>
              <span className={cx("tnum font-mono text-[9px]", a.delta >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>
                {signedPct(a.delta / Math.max(1, a.balance) * 100, 1)}
              </span>
            </div>
            <p className="tnum mt-0.5 font-mono text-[9.5px] tracking-[0.1em] text-zinc-600">{a.card}</p>
            <p className="tnum mt-0.5 font-mono text-[15px] leading-none font-semibold text-zinc-100">
              {i === 0 ? (
                <DriftNumber base={a.balance} amplitude={6_000} seed={a.id} format={som} />
              ) : (
                som(a.balance)
              )}
            </p>
            <p className="truncate font-mono text-[8.5px] text-zinc-600">{a.bank}</p>
          </div>
        ))}
      </div>

      {/* Лента переводов — уходит за нижний край окна */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-800">
        <p className="shrink-0 px-2.5 py-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Операции
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {transfers.map((t) => {
            const st = STATUS[t.status];
            const inbound = t.dir === "in";
            return (
              <div key={t.id} className="flex items-center gap-2 border-b border-zinc-900/80 px-2.5 py-[5px]">
                {inbound ? (
                  <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} />
                )}
                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">«{t.counterparty}»</span>
                <span className={cx("font-mono text-[8.5px] tracking-[0.06em] uppercase", st.cls)}>{st.label}</span>
                <span
                  className={cx(
                    "tnum shrink-0 font-mono text-[11px]",
                    inbound ? "text-emerald-300" : "text-zinc-300",
                  )}
                >
                  {inbound ? "+" : "−"}
                  {som(t.amount)}
                </span>
                <span className="tnum shrink-0 font-mono text-[8px] text-zinc-700">{t.agoMin}м</span>
              </div>
            );
          })}
        </div>
      </div>
    </WindowFrame>
  );
}
