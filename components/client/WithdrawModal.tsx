"use client";

import { AlertTriangle, Lock, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { usdCents } from "@/lib/format";

/**
 * Модалка вывода средств.
 *
 * Ключевой момент схемы: жертве показывают огромную «прибыль», но чтобы
 * её получить, требуют сначала перевести налог. Деньги, разумеется,
 * не приходят никогда — приходит следующее требование.
 */
export function WithdrawModal({ balance, onClose }: { balance: number; onClose: () => void }) {
  const tax = balance * 0.1;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/80 backdrop-blur-[2px]">
      <div className="animate-flash-in w-[520px] overflow-hidden rounded-[6px] border border-zinc-700 bg-[#12161d] shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <h2 className="text-[14px] font-semibold text-zinc-100">Вывод средств</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <span className="text-[12px] text-zinc-500">Доступно к выводу</span>
            <span className="tnum font-mono text-[24px] font-semibold text-emerald-400">
              {usdCents(balance)}
            </span>
          </div>

          {/* Собственно требование «налога» */}
          <div className="mt-4 rounded-[4px] border border-amber-600/50 bg-amber-500/10 p-3.5">
            <p className="flex items-center gap-2 text-[12px] font-semibold tracking-wide text-amber-300 uppercase">
              <AlertTriangle className="h-4 w-4" />
              Требуется оплата налога на прибыль
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-300">
              В соответствии с регламентом{" "}
              <span className="text-amber-300">{BRAND.broker.license}</span> перед выводом
              средств удерживается налог на инвестиционный доход в размере{" "}
              <span className="font-semibold text-amber-300">10%</span>. Налог не может быть
              удержан с суммы вывода и оплачивается отдельным платежом.
            </p>

            <div className="mt-3 flex items-baseline justify-between rounded-[3px] border border-amber-600/40 bg-amber-500/10 px-3 py-2">
              <span className="text-[12px] text-amber-200/80">К оплате</span>
              <span className="tnum font-mono text-[26px] font-bold text-amber-300">
                {usdCents(tax)}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 font-mono text-[11px]">
            <Row label="Статус верификации" value="ДОКУМЕНТЫ НА ПРОВЕРКЕ" tone="text-amber-400" />
            <Row label="Срок зачисления" value="1–3 банковских дня" tone="text-zinc-400" />
            <Row label="Способ" value={`${BRAND.psp.name} · SEPA`} tone="text-zinc-400" />
            <Row label="Персональный менеджер" value="Hans Söller" tone="text-zinc-400" />
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-[4px] bg-amber-500 py-2.5 font-mono text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase hover:bg-amber-400">
              Оплатить налог {usdCents(tax)}
            </button>
            <button
              onClick={onClose}
              className="rounded-[4px] border border-zinc-700 px-4 font-mono text-[12px] tracking-[0.1em] text-zinc-400 uppercase hover:text-zinc-200"
            >
              Позже
            </button>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-zinc-600">
            <Lock className="h-3 w-3" />
            Соединение защищено · {BRAND.broker.domain}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-zinc-900 pb-1">
      <span className="text-zinc-600">{label}</span>
      <span className={tone}>{value}</span>
    </div>
  );
}
