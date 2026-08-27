"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  Headset,
  Lock,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Rng } from "@/lib/prng";
import { INSTRUMENTS } from "@/lib/fixtures/pools";
import { ASAN_NAME, KUNDUZ_BAIT, KUNDUZ_SHORT } from "@/lib/fixtures/cast";
import { makePositions } from "@/lib/fixtures/market";
import { signedPct, usd, usdCents } from "@/lib/format";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { Sparkline, trendSeries } from "@/components/shared/Sparkline";
import {
  selectEpoch,
  selectSigWithdraw,
  useSceneValue,
  useTick,
} from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";
import { CandleChart } from "./CandleChart";
import { WithdrawModal } from "./WithdrawModal";

const BALANCE = 124_580.4;

/**
 * Экран жертвы: личный кабинет «брокера».
 *
 * Визуально противоположен CRM — светлее, «дороже», с золотом и зеленью.
 * Именно эту разницу зритель считывает, когда камера переходит от оператора
 * к человеку на другом конце провода.
 */
export function ClientScreen() {
  const tick = useTick();
  const epoch = useSceneValue(selectEpoch);
  const sigWithdraw = useSceneValue(selectSigWithdraw);
  const [modal, setModal] = useState(false);

  const positions = useMemo(
    () => makePositions(new Rng("victim-positions"), INSTRUMENTS, 5),
    [],
  );

  // Ctrl+Alt+5 — открыть требование «налога», Ctrl+Alt+R — закрыть перед дублем
  useEffect(() => {
    if (sigWithdraw > 0) setModal(true);
  }, [sigWithdraw]);
  useEffect(() => {
    if (epoch > 0) setModal(false);
  }, [epoch]);

  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0d1117] text-zinc-200">
      {/* Шапка кабинета */}
      <header className="flex h-14 shrink-0 items-center gap-5 border-b border-zinc-800 bg-[#11161f] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-[15px] font-black text-zinc-900">
            A
          </div>
          <div className="leading-tight">
            <p className="font-mono text-[15px] font-bold tracking-[0.14em] text-amber-300">
              {BRAND.broker.name}
            </p>
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600">
              LIC. {BRAND.broker.license}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {["Портфель", "Рынки", "Аналитика", "История", "Документы"].map((n, i) => (
            <span
              key={n}
              className={cx(
                "rounded-[3px] px-3 py-1.5 text-[12.5px]",
                i === 0 ? "bg-zinc-800/70 text-zinc-100" : "text-zinc-500",
              )}
            >
              {n}
            </span>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <span className="relative text-zinc-500">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 font-mono text-[7px] font-bold text-white">
              3
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-[3px] border border-emerald-800/60 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] tracking-wider text-emerald-300">
            <BadgeCheck className="h-3 w-3" />
            GOLD ACCOUNT
          </span>
          {/* Владелец кабинета — сценарный Асан: этот же экран супервайзер
              смотрит через RAT в /admin, а его «прибыль» выбивают в /chat.
              Имя берём из фикстуры, чтобы три экрана не разъехались. */}
          <span className="flex items-center gap-2 text-[12.5px] text-zinc-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px]">
              АА
            </span>
            {ASAN_NAME}
            <ChevronDown className="h-3 w-3 text-zinc-600" />
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        {/* ЛЕВАЯ ЧАСТЬ: баланс, график, позиции */}
        <div className="flex min-w-0 flex-col">
          {/* Баланс — самая крупная цифра на экране */}
          <div className="flex shrink-0 items-end gap-8 border-b border-zinc-800 bg-[#11161f] px-5 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
                Баланс счёта
              </p>
              <DriftNumber
                base={BALANCE}
                amplitude={340}
                seed="victim-balance"
                format={usdCents}
                className="block font-mono text-[42px] leading-none font-bold text-emerald-400 [text-shadow:0_0_28px_rgba(16,185,129,0.3)]"
              />
            </div>

            <div className="pb-1">
              <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
                Прибыль сегодня
              </p>
              <p className="font-mono text-[26px] leading-none font-semibold text-emerald-400">
                +{usd(totalPnl)}
                <span className="ml-2 text-[16px] text-emerald-500/80">
                  <DriftNumber
                    base={18.4}
                    amplitude={1.6}
                    seed="victim-daypct"
                    format={(v) => signedPct(v)}
                  />
                </span>
              </p>
            </div>

            <div className="pb-1">
              <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
                Свободная маржа
              </p>
              <p className="font-mono text-[26px] leading-none font-semibold text-zinc-300">
                <DriftNumber
                  base={41_820}
                  amplitude={620}
                  seed="victim-margin"
                  format={usd}
                />
              </p>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => setModal(true)}
              className="rounded-[4px] border border-amber-500/60 bg-amber-500/15 px-5 py-2.5 font-mono text-[12px] font-bold tracking-[0.12em] text-amber-300 uppercase hover:bg-amber-500/25"
            >
              <Wallet className="mr-2 inline h-3.5 w-3.5" />
              Вывести средства
            </button>
          </div>

          {/* График */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800/70 px-5 py-2">
              <span className="font-mono text-[15px] font-semibold text-zinc-100">BTC/USD</span>
              <span className="font-mono text-[15px] font-semibold text-emerald-400">
                <DriftNumber
                  base={71_420}
                  amplitude={210}
                  seed="btc"
                  format={(v) => v.toFixed(2)}
                />
              </span>
              <span className="font-mono text-[12px] text-emerald-400">
                <DriftNumber base={4.82} amplitude={0.4} seed="btcpct" format={signedPct} />
              </span>
              <div className="flex gap-1">
                {["1м", "5м", "15м", "1ч", "1д"].map((tf, i) => (
                  <span
                    key={tf}
                    className={cx(
                      "rounded-[2px] px-2 py-[3px] font-mono text-[10px]",
                      i === 1 ? "bg-zinc-700 text-zinc-100" : "text-zinc-600",
                    )}
                  >
                    {tf}
                  </span>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <CandleChart />
            </div>
          </div>

          {/* Открытые позиции */}
          {/* Фиксированная высота + overflow-hidden: последняя строка не должна
              уезжать за нижний край экрана */}
          <div className="h-[212px] shrink-0 overflow-hidden border-t border-zinc-800">
            <div className="flex items-center gap-3 border-b border-zinc-800/70 px-5 py-1.5">
              <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                Открытые позиции
              </span>
              <span className="rounded-[2px] bg-emerald-500/15 px-1.5 py-[1px] font-mono text-[9.5px] text-emerald-300">
                {positions.length} активных
              </span>
            </div>
            <div className="grid grid-cols-[70px_86px_60px_1fr_1fr_1fr_110px] gap-x-3 border-b border-zinc-800/70 px-5 py-1 font-mono text-[9px] tracking-[0.1em] text-zinc-600 uppercase">
              <span>Тикет</span>
              <span>Инструмент</span>
              <span>Тип</span>
              <span className="text-right">Объём</span>
              <span className="text-right">Открытие</span>
              <span className="text-right">Текущая</span>
              <span className="text-right">Прибыль</span>
            </div>
            {positions.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-[70px_86px_60px_1fr_1fr_1fr_110px] gap-x-3 border-b border-zinc-900/70 px-5 py-[5px] font-mono text-[11.5px]"
              >
                <span className="text-zinc-600">{p.id}</span>
                <span className="text-zinc-200">{p.symbol}</span>
                <span className={p.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                  {p.side}
                </span>
                <span className="tnum text-right text-zinc-400">{p.volume.toFixed(2)}</span>
                <span className="tnum text-right text-zinc-400">{p.openPrice}</span>
                <span className="tnum text-right text-zinc-300">
                  <DriftNumber
                    base={p.current}
                    amplitude={p.current * 0.0022}
                    seed={`pos-${i}`}
                    format={(v) => v.toFixed(p.current > 1000 ? 1 : 4)}
                  />
                </span>
                <span
                  className={cx(
                    "tnum text-right font-semibold",
                    p.pnl >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  <DriftNumber
                    base={p.pnl}
                    amplitude={Math.abs(p.pnl) * 0.06 + 12}
                    seed={`pnl-${i}`}
                    format={(v) => `${v >= 0 ? "+" : "−"}$${Math.abs(Math.round(v))}`}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: торговый ордер + «менеджер» */}
        <aside className="flex flex-col overflow-hidden border-l border-zinc-800 bg-[#11161f]">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="mb-3 flex gap-1.5">
              <button className="flex-1 rounded-[4px] bg-emerald-600 py-3 font-mono text-[15px] font-bold tracking-[0.1em] text-zinc-950 hover:bg-emerald-500">
                BUY
                <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                  {(71_420 + Math.sin(tick / 9) * 6).toFixed(1)}
                </span>
              </button>
              <button className="flex-1 rounded-[4px] bg-rose-600 py-3 font-mono text-[15px] font-bold tracking-[0.1em] text-zinc-950 hover:bg-rose-500">
                SELL
                <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                  {(71_408 + Math.sin(tick / 9) * 6).toFixed(1)}
                </span>
              </button>
            </div>

            <OrderField label="Объём (лот)" value="2.50" />
            <OrderField label="Кредитное плечо" value="1:500" tone="text-amber-300" />
            <OrderField label="Stop Loss" value="не задан" tone="text-zinc-600" />
            <OrderField label="Take Profit" value="78 400.00" />
            <OrderField label="Требуемая маржа" value={usd(3_412)} />
          </div>

          {/* Прогресс уровня — «ещё немного, и вы Platinum» */}
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
                Уровень счёта
              </span>
              <span className="font-mono text-[10px] text-amber-300">GOLD → PLATINUM</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-amber-600 to-amber-300" />
            </div>
            <p className="mt-1.5 text-[10.5px] leading-snug text-zinc-500">
              До статуса <span className="text-amber-300">PLATINUM</span> осталось{" "}
              <span className="text-zinc-200">{usd(48_000)}</span>. Персональная стратегия и
              приоритетный вывод средств.
            </p>
          </div>

          {/* «Персональный менеджер» */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
              <Headset className="h-3 w-3" />
              Персональный менеджер
            </p>
            <div className="flex items-center gap-2.5 rounded-[4px] border border-zinc-800 bg-zinc-900/50 p-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 font-mono text-[11px] text-zinc-300">
                HS
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] text-zinc-200">Hans Söller</p>
                <p className="flex items-center gap-1 font-mono text-[9.5px] text-emerald-400">
                  <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-emerald-400" />
                  на линии
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              <Message
                text="Рынок сейчас идёт ровно по нашей стратегии. Не закрывайте позиции."
                ago="14:22"
              />
              <Message
                text="По выводу: бухгалтерия запросила подтверждение налога. Формальность."
                ago="15:58"
              />
            </div>

            <div className="mt-2 flex items-center gap-1.5 rounded-[4px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-600" />
              <span className="font-mono text-[10.5px] text-zinc-600">Написать сообщение…</span>
            </div>

            {/*
              «Социальное доказательство» — обязательный блок таких кабинетов:
              жертве показывают чужие успешные выводы, чтобы она не сомневалась
              в своём. Первой строкой — сценарная Кундуз, и это самый злой стык
              всего реквизита: здесь она «вывела деньги», а в CRM оператора
              (/crm) на ней висят 38 400 и три отклонённые заявки.
            */}
            <p className="mt-4 mb-2 font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Выплаты клиентам
            </p>
            <div className="space-y-[3px]">
              {PAYOUT_PROOF.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 rounded-[3px] border border-zinc-800/70 bg-zinc-900/40 px-2 py-1.5"
                >
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-emerald-400" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                    {p.name}
                  </span>
                  <span className="tnum shrink-0 font-mono text-[11px] text-emerald-400">
                    {usd(p.amount)}
                  </span>
                  <span className="w-[52px] shrink-0 text-right font-mono text-[9.5px] text-zinc-600">
                    {p.ago}
                  </span>
                </div>
              ))}
            </div>

            {/* Список котировок: без него нижняя треть панели пустует,
                а в реальном кабинете брокера такой блок есть всегда */}
            <p className="mt-4 mb-2 font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Рынки
            </p>
            <div className="space-y-[3px]">
              {INSTRUMENTS.slice(0, 6).map((ins, i) => (
                <div
                  key={ins.symbol}
                  className="flex items-center gap-2 rounded-[3px] border border-zinc-800/70 bg-zinc-900/40 px-2 py-1.5"
                >
                  <span className="w-[62px] shrink-0 font-mono text-[11px] text-zinc-300">
                    {ins.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Sparkline
                      values={trendSeries(i * 17 + 5, 32, i % 3 === 2 ? -0.4 : 0.8)}
                      height={16}
                      stroke={i % 3 === 2 ? "#f43f5e" : "#34d399"}
                      fill="transparent"
                    />
                  </span>
                  <span className="tnum w-[64px] shrink-0 text-right font-mono text-[11px] text-zinc-300">
                    <DriftNumber
                      base={ins.price}
                      amplitude={ins.price * 0.002}
                      seed={`wl-${ins.symbol}`}
                      format={(v) => v.toFixed(ins.digits)}
                    />
                  </span>
                  <span
                    className={cx(
                      "tnum w-[42px] shrink-0 text-right font-mono text-[10px]",
                      i % 3 === 2 ? "text-rose-400" : "text-emerald-400",
                    )}
                  >
                    <DriftNumber
                      base={i % 3 === 2 ? -1.4 : 2.6}
                      amplitude={0.5}
                      seed={`wlp-${ins.symbol}`}
                      format={(v) => signedPct(v)}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-zinc-800 py-2 font-mono text-[9.5px] text-zinc-600">
            <Lock className="h-3 w-3" />
            {BRAND.broker.domain} · соединение защищено
          </div>
        </aside>
      </div>

      {modal && <WithdrawModal balance={BALANCE} onClose={() => setModal(false)} />}
    </div>
  );
}

/** Чужие «успешные выводы» для правой панели — приманка, а не операции */
const PAYOUT_PROOF = [
  { name: KUNDUZ_SHORT, amount: KUNDUZ_BAIT, ago: "6 мин" },
  { name: "🇰🇿 Ержан С.", amount: 5_800, ago: "24 мин" },
  { name: "🇷🇺 Тамара Ж.", amount: 1_150, ago: "1 ч" },
];

function OrderField({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
      <span className="font-mono text-[10px] tracking-wide text-zinc-600 uppercase">{label}</span>
      <span className={cx("font-mono text-[12px] text-zinc-200", tone)}>{value}</span>
    </div>
  );
}

function Message({ text, ago }: { text: string; ago: string }) {
  return (
    <div className="rounded-[4px] rounded-tl-none border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5">
      <p className="text-[11px] leading-snug text-zinc-300">{text}</p>
      <p className="mt-0.5 text-right font-mono text-[9px] text-zinc-600">{ago}</p>
    </div>
  );
}
