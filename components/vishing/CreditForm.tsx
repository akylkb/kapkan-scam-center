"use client";

import { BadgeCheck, Banknote, FileSignature, Loader2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { som, pct } from "@/lib/format";
import { Chip, Field, cx } from "@/components/shared/ui";
import type { LoanDraft, Target } from "@/lib/fixtures/vishing";

/**
 * Заявка на кредит, которую оператор оформляет на жертву.
 *
 * До прихода кода (Ctrl+Alt+9) форма висит в состоянии «ожидание кода»:
 * ячейки кода пустые, кнопка оформления заблокирована. Как только код
 * перехвачен — он проставляется в ячейки, а заявка перескакивает в
 * «кредит одобрен». Это та же шина link.opened, что роняет код чатеру.
 */
const CELLS = 6;

export function CreditForm({
  victim,
  loan,
  code,
  approved,
}: {
  victim: Target;
  loan: LoanDraft;
  code: string | null;
  approved: boolean;
}) {
  const digits = (code ?? "").padEnd(CELLS, " ").slice(0, CELLS).split("");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          <FileSignature className="h-3.5 w-3.5 text-amber-400" strokeWidth={1.8} />
          Заявка на кредит · {BRAND.bankfake.short}
        </span>
        <span className="tnum font-mono text-[9.5px] text-zinc-600">
          № {BRAND.bankfake.short}-{loan.amount.toString().slice(0, 3)}
          {victim.id.replace(/\D/g, "").slice(-4)}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        {/* Левая половина — реквизиты заёмщика и условия */}
        <div className="flex flex-col gap-2">
          <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
              Заёмщик
            </p>
            <Field label="ФИО" value={victim.name} valueClass="text-zinc-200" />
            <Field label="Телефон" value={victim.phone} valueClass="tnum font-mono" />
            <Field label="Город" value={victim.city} />
            <Field label="Документ" value={victim.doc} valueClass="tnum font-mono" />
          </div>

          <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
              Условия
            </p>
            <Field label="Срок" value={`${loan.term} мес`} valueClass="tnum" />
            <Field label="Ставка" value={pct(loan.rate, 0) + " годовых"} valueClass="tnum" />
            <Field label="Платёж / мес" value={som(loan.monthly)} valueClass="tnum font-mono text-zinc-200" />
            <Field label="Зачисление" value={loan.payout} />
          </div>
        </div>

        {/* Правая половина — сумма, код подтверждения и оформление */}
        <div className="flex flex-col gap-2">
          <div className="rounded-[4px] border border-amber-800/50 bg-amber-950/20 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.16em] text-amber-300/80 uppercase">
                <Banknote className="h-3.5 w-3.5" strokeWidth={1.8} />
                Сумма кредита
              </span>
              <span className="tnum font-mono text-[9px] text-zinc-600">одобрено банком</span>
            </div>
            <p className="tnum mt-1 font-mono text-[30px] leading-none font-bold text-amber-300">
              {som(loan.amount)}
            </p>
          </div>

          {/* Код подтверждения личности */}
          <div
            className={cx(
              "rounded-[4px] border px-3 py-2.5 transition-colors",
              approved ? "border-emerald-700/60 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900/40",
            )}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.16em] text-zinc-500 uppercase">
                Код подтверждения
              </span>
              {approved ? (
                <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
                  <BadgeCheck className="h-3 w-3" />
                  ЛИЧНОСТЬ ПОДТВЕРЖДЕНА
                </Chip>
              ) : (
                <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  ОЖИДАНИЕ КОДА
                </Chip>
              )}
            </div>
            <div className="flex gap-1.5">
              {digits.map((d, i) => (
                <div
                  key={i}
                  className={cx(
                    "tnum flex h-10 flex-1 items-center justify-center rounded-[3px] border font-mono text-[22px] font-bold",
                    approved
                      ? "border-emerald-700/50 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-600",
                    !approved && i === 0 && "animate-blink border-amber-600/50",
                  )}
                >
                  {d.trim() ? d : approved ? d : "•"}
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[8.5px] text-zinc-600">
              продиктован клиентом в разговоре · номер подменён на наш шлюз
            </p>
          </div>

          {/* Кнопка оформления */}
          <button
            className={cx(
              "mt-auto flex h-11 items-center justify-center gap-2 rounded-[4px] border font-mono text-[13px] font-bold tracking-[0.1em] uppercase transition-colors",
              approved
                ? "border-emerald-600/60 bg-emerald-600/20 text-emerald-300"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-500",
            )}
          >
            {approved ? (
              <>
                <BadgeCheck className="h-4 w-4" strokeWidth={2.2} />
                Кредит оформлен · {som(loan.amount)}
              </>
            ) : (
              "Оформить кредит"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
