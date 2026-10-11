"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  ChevronDown,
  Lock,
  Minus,
  Plus,
  Search,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { groupDigits, mmss, signedPct, som, somCents } from "@/lib/format";
import {
  OPTION_ACTS,
  OPTION_ASSETS,
  makeOptionFeed,
  makeOptionHistory,
  optionPrice,
  planNudge,
  sceneClock,
  type OptionAct,
  type OptionActId,
  type OptionDeal,
  type OptionNudge,
} from "@/lib/fixtures/options";
import { DriftNumber } from "@/components/shared/LiveNumber";
import { Sparkline, trendSeries } from "@/components/shared/Sparkline";
import { selectEpoch, useSceneValue, useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";
import { PriceChart } from "./PriceChart";
import { DepositModal, WithdrawModal } from "./CashModals";

const STAKES = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000];
const EXPIRIES = [
  { sec: 30, label: "30 сек" },
  { sec: 60, label: "1 мин" },
  { sec: 300, label: "5 мин" },
];

type Trade = {
  symbol: string;
  digits: number;
  dir: 1 | -1;
  stake: number;
  t0: number;
  t1: number;
  entry: number;
};

/**
 * Платформа бинарных опционов на ноутбуке Руслана.
 *
 * Экран играется вживую: актёр сам пополняет счёт, открывает сделки и жмёт
 * вывод. Этап сцены (адрес /options/N/) задаёт только стартовое состояние;
 * пройдёт ли вывод, решает баланс (OPTION_WITHDRAW_LIMIT). Ctrl+Alt+R возвращает этап в исходное состояние.
 */
export function OptionsScreen({ actId }: { actId: OptionActId }) {
  const epoch = useSceneValue(selectEpoch);
  return <Terminal key={epoch} actId={actId} act={OPTION_ACTS[actId]} />;
}

function Terminal({ actId, act }: { actId: OptionActId; act: OptionAct }) {
  const tick = useTick();
  const [balance, setBalance] = useState<number>(act.balance);
  const [symbol, setSymbol] = useState(OPTION_ASSETS[0].symbol);
  const [stake, setStake] = useState<number>(act.stake);
  const [expiry, setExpiry] = useState(EXPIRIES[0].sec);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [nudges, setNudges] = useState<OptionNudge[]>([]);
  const [deals, setDeals] = useState<OptionDeal[]>(() => makeOptionHistory(actId));
  const [modal, setModal] = useState<"deposit" | "withdraw" | null>(null);
  /** Итог последней сделки — плашка в правой панели */
  const [won, setWon] = useState<{ profit: number; at: number } | null>(null);

  const feed = useMemo(() => makeOptionFeed(), []);
  const asset = OPTION_ASSETS.find((a) => a.symbol === symbol) ?? OPTION_ASSETS[0];
  const price = optionPrice(asset, tick, nudges);
  const before = optionPrice(asset, tick - 8, nudges);
  const canTrade = !trade && balance >= stake;

  function open(dir: 1 | -1) {
    if (!canTrade) return;
    const t1 = tick + expiry * 4;
    setNudges((n) => [...n, planNudge(asset, tick, t1, dir)]);
    setTrade({ symbol, digits: asset.digits, dir, stake, t0: tick, t1, entry: price });
    setBalance((b) => b - stake);
    setWon(null);
  }

  // Экспирация: сделка закрывается по цене на тике t1 и уходит в историю
  useEffect(() => {
    if (!trade || tick < trade.t1) return;
    const a = OPTION_ASSETS.find((x) => x.symbol === trade.symbol) ?? OPTION_ASSETS[0];
    const close = optionPrice(a, trade.t1, nudges);
    const win = (close - trade.entry) * trade.dir > 0;
    const profit = win ? (trade.stake * a.payout) / 100 : -trade.stake;
    if (win) setBalance((b) => b + trade.stake + profit);
    setDeals((d) => [
      {
        id: `#${8_400_100 + (d.length - 14) * 13}`,
        time: sceneClock(trade.t0 / 4),
        symbol: a.symbol,
        digits: a.digits,
        dir: trade.dir,
        stake: trade.stake,
        entry: trade.entry,
        close,
        profit,
        demo: false,
      },
      ...d,
    ]);
    setWon({ profit, at: tick });
    setTrade(null);
  }, [tick, trade, nudges]);

  const stakeIdx = STAKES.indexOf(stake);
  const payout = (stake * asset.payout) / 100;
  const feedShift = Math.floor(tick / 10) % feed.length;
  const sentiment = 58 + Math.round(Math.sin(tick / 37 + asset.phase) * 9);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0a0d13] text-zinc-200">
      {/* Шапка */}
      <header className="flex h-14 shrink-0 items-center gap-5 border-b border-zinc-800 bg-[#0e121a] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 overflow-hidden">
            <picture>
              <img src="/tulpar.png" alt="" />
            </picture>
          </div>
          <div className="leading-tight">
            <p className="font-mono text-[16px] font-bold tracking-[0.16em] text-zinc-50">
              {BRAND.options.name}
            </p>
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600">
              LIC. {BRAND.options.license}
            </p>
          </div>
        </div>

        {/* <nav className="flex items-center gap-1">
          {["Торговля", "Турниры", "Сигналы", "Обучение", "Бонусы"].map((n, i) => (
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
        </nav> */}

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-[5px] border border-zinc-800 bg-zinc-900/60 py-1 pr-3 pl-2.5">
            <span className="rounded-[3px] bg-emerald-500/15 px-1.5 py-[2px] font-mono text-[9px] tracking-[0.12em] text-emerald-300">
              РЕАЛЬНЫЙ СЧЁТ
            </span>
            <div className="leading-tight">
              <p className="font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
                Баланс
              </p>
              {/* key перезапускает вспышку при каждом изменении баланса */}
              <p
                key={balance}
                className="tnum animate-flash-in font-mono text-[21px] leading-none font-bold text-emerald-400 [text-shadow:0_0_22px_rgba(16,185,129,0.35)]"
              >
                {somCents(balance)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setModal("deposit")}
            className="rounded-[4px] bg-emerald-500 px-4 py-2.5 font-mono text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase hover:bg-emerald-400"
          >
            Пополнить
          </button>
          <button
            onClick={() => setModal("withdraw")}
            className="rounded-[4px] border border-sky-500/60 bg-sky-500/10 px-4 py-2.5 font-mono text-[12px] font-bold tracking-[0.1em] text-sky-300 uppercase hover:bg-sky-500/20"
          >
            {act.withdrawLabel}
          </button>

          <span className="relative ml-1 text-zinc-500">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 font-mono text-[7px] font-bold text-white">
              2
            </span>
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-zinc-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px]">
              Р
            </span>
            Руслан
            <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
            <ChevronDown className="h-3 w-3 text-zinc-600" />
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[272px_1fr_348px]">
        {/* АКТИВЫ */}
        <aside className="flex flex-col overflow-hidden border-r border-zinc-800 bg-[#0e121a]">
          <div className="shrink-0 border-b border-zinc-800 px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-[4px] border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-[11.5px] text-zinc-600">Поиск актива</span>
            </div>
            <div className="mt-2 flex gap-1 font-mono text-[10px]">
              {["Крипто", "Валюты", "Акции", "Сырьё"].map((t, i) => (
                <span
                  key={t}
                  className={cx(
                    "rounded-[2px] px-2 py-[3px]",
                    i === 0 ? "bg-sky-500/15 text-sky-300" : "text-zinc-600",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {OPTION_ASSETS.map((a, i) => {
              const down = i % 4 === 2;
              return (
                <button
                  key={a.symbol}
                  onClick={() => setSymbol(a.symbol)}
                  className={cx(
                    "flex h-[57px] w-full items-center gap-2 border-b border-zinc-900 px-3 text-left",
                    a.symbol === symbol
                      ? "bg-sky-500/10 shadow-[inset_2px_0_0_#38bdf8]"
                      : "hover:bg-zinc-900/60",
                  )}
                >
                  <span className="w-[78px] shrink-0 leading-tight">
                    <span className="block font-mono text-[12.5px] font-semibold text-zinc-100">
                      {a.symbol}
                    </span>
                    <span className="block text-[10px] text-zinc-600">{a.name}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <Sparkline
                      values={trendSeries(a.phase + 9, 36, down ? -0.5 : 0.7)}
                      height={22}
                      stroke={down ? "#fb7185" : "#34d399"}
                      fill="transparent"
                    />
                  </span>
                  <span className="w-[74px] shrink-0 text-right leading-tight">
                    <span className="tnum block font-mono text-[11.5px] text-zinc-200">
                      {optionPrice(a, tick, nudges).toFixed(a.digits)}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-sky-300">
                      {a.payout}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ГРАФИК + СДЕЛКИ */}
        <div className="flex min-w-0 flex-col">
          <div className="flex h-[58px] shrink-0 items-center gap-5 border-b border-zinc-800 px-5">
            <div className="leading-tight">
              <p className="font-mono text-[17px] font-bold text-zinc-50">{asset.symbol}</p>
              <p className="text-[10.5px] text-zinc-600">{asset.name} · опцион</p>
            </div>
            <span
              className={cx(
                "tnum font-mono text-[26px] font-bold",
                price >= before ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {price.toFixed(asset.digits)}
            </span>
            <span className="font-mono text-[12px] text-emerald-400">
              <DriftNumber base={3.4} amplitude={0.5} seed={`opt-${asset.symbol}`} format={signedPct} />
              <span className="ml-1 text-zinc-600">24ч</span>
            </span>
            <span className="rounded-[4px] border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 font-mono text-[11px] text-sky-300">
              ДОХОДНОСТЬ <span className="text-[14px] font-bold">{asset.payout}%</span>
            </span>
            <div className="flex-1" />
            <div className="flex gap-1">
              {["Тики", "5с", "15с", "1м", "5м"].map((tf, i) => (
                <span
                  key={tf}
                  className={cx(
                    "rounded-[2px] px-2 py-[3px] font-mono text-[10px]",
                    i === 0 ? "bg-zinc-700 text-zinc-100" : "text-zinc-600",
                  )}
                >
                  {tf}
                </span>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <PriceChart
              asset={asset}
              nudges={nudges}
              trade={trade && trade.symbol === symbol ? trade : null}
            />
          </div>

          {/* Сделки: открытая сверху, под ней история. Высота фиксирована —
              последняя строка не должна уезжать за нижний край экрана */}
          <div className="h-[238px] shrink-0 overflow-hidden border-t border-zinc-800 bg-[#0e121a]">
            <div className="flex items-center gap-3 border-b border-zinc-800/70 px-5 py-1.5">
              <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase">
                Мои сделки
              </span>
              <span className="rounded-[2px] bg-sky-500/15 px-1.5 py-[1px] font-mono text-[9.5px] text-sky-300">
                {trade ? "1 открыта" : "нет открытых"}
              </span>
            </div>
            <div className={cx(DEAL_GRID, "border-b border-zinc-800/70 py-1 text-[9px] tracking-[0.1em] text-zinc-600 uppercase")}>
              <span>Время</span>
              <span>Сделка</span>
              <span>Актив</span>
              <span>Прогноз</span>
              <span className="text-right">Сумма</span>
              <span className="text-right">Вход</span>
              <span className="text-right">Закрытие</span>
              <span className="text-right">Результат</span>
            </div>
            {trade && (
              <div className={cx(DEAL_GRID, "border-b border-sky-900/50 bg-sky-500/10 py-[5px] text-[11.5px]")}>
                <span className="tnum text-zinc-400">{sceneClock(trade.t0 / 4)}</span>
                <span className="text-sky-300">ОТКРЫТА</span>
                <span className="text-zinc-200">{trade.symbol}</span>
                <Dir dir={trade.dir} />
                <span className="tnum text-right text-zinc-300">{som(trade.stake)}</span>
                <span className="tnum text-right text-zinc-400">{trade.entry.toFixed(trade.digits)}</span>
                <span className="tnum text-right text-zinc-500">—</span>
                <span className="tnum text-right font-semibold text-amber-300">
                  {mmss((trade.t1 - tick) / 4)}
                </span>
              </div>
            )}
            {deals.map((d) => (
              <div key={d.id} className={cx(DEAL_GRID, "border-b border-zinc-900/70 py-[5px] text-[11.5px]")}>
                <span className="tnum text-zinc-500">{d.time}</span>
                <span className="text-zinc-600">
                  {d.id}
                  {d.demo && <span className="ml-1.5 text-amber-400/80">ДЕМО</span>}
                </span>
                <span className="text-zinc-200">{d.symbol}</span>
                <Dir dir={d.dir} />
                <span className="tnum text-right text-zinc-400">{som(d.stake)}</span>
                <span className="tnum text-right text-zinc-400">{d.entry.toFixed(d.digits)}</span>
                <span className="tnum text-right text-zinc-300">{d.close.toFixed(d.digits)}</span>
                <span
                  className={cx(
                    "tnum text-right font-semibold",
                    d.profit >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {d.profit >= 0 ? "+" : "−"}
                  {somCents(Math.abs(d.profit))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ПАНЕЛЬ СДЕЛКИ */}
        <aside className="flex flex-col overflow-hidden border-l border-zinc-800 bg-[#0e121a]">
          <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
            <FieldLabel>Сумма сделки</FieldLabel>
            <div className="flex items-center gap-1.5">
              <StepButton onClick={() => setStake(STAKES[Math.max(0, stakeIdx - 1)])}>
                <Minus className="h-4 w-4" />
              </StepButton>
              <p className="tnum flex-1 rounded-[4px] border border-zinc-700 bg-zinc-900/70 py-2 text-center font-mono text-[24px] font-semibold text-zinc-50">
                {som(stake)}
              </p>
              <StepButton onClick={() => setStake(STAKES[Math.min(STAKES.length - 1, stakeIdx + 1)])}>
                <Plus className="h-4 w-4" />
              </StepButton>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {[500, 1_000, 5_000, 10_000].map((v) => (
                <Pill key={v} active={v === stake} onClick={() => setStake(v)}>
                  {groupDigits(v)}
                </Pill>
              ))}
            </div>

            <FieldLabel className="mt-3">
              <Timer className="mr-1 inline h-3 w-3" />
              Время экспирации
            </FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPIRIES.map((e) => (
                <Pill key={e.sec} active={e.sec === expiry} onClick={() => setExpiry(e.sec)}>
                  {e.label}
                </Pill>
              ))}
            </div>

            <div className="mt-3 flex items-baseline justify-between rounded-[4px] border border-emerald-800/50 bg-emerald-500/10 px-3 py-2">
              <span className="text-[11.5px] text-emerald-200/80">Возможная выплата</span>
              <span className="tnum font-mono text-[17px] font-bold text-emerald-300">
                {somCents(stake + payout)}
              </span>
            </div>

            <div className={cx("mt-3 grid grid-cols-2 gap-2", !canTrade && "opacity-40")}>
              <button
                onClick={() => open(1)}
                className="flex flex-col items-center rounded-[5px] bg-emerald-500 py-3.5 text-zinc-950 hover:bg-emerald-400"
              >
                <TrendingUp className="h-7 w-7" strokeWidth={2.6} />
                <span className="mt-0.5 font-mono text-[15px] font-black tracking-[0.12em]">ВВЕРХ</span>
              </button>
              <button
                onClick={() => open(-1)}
                className="flex flex-col items-center rounded-[5px] bg-rose-500 py-3.5 text-zinc-950 hover:bg-rose-400"
              >
                <TrendingDown className="h-7 w-7" strokeWidth={2.6} />
                <span className="mt-0.5 font-mono text-[15px] font-black tracking-[0.12em]">ВНИЗ</span>
              </button>
            </div>

            {/* Одна строка состояния под кнопками: высота панели не прыгает */}
            <div className="mt-2.5 flex h-[46px] items-center justify-center rounded-[4px] border border-zinc-800 bg-zinc-900/50 px-3 text-center">
              {trade ? (
                <p className="font-mono text-[12px] text-zinc-300">
                  Сделка открыта · до экспирации{" "}
                  <span className="tnum text-[16px] font-bold text-amber-300">
                    {mmss((trade.t1 - tick) / 4)}
                  </span>
                </p>
              ) : won ? (
                <p
                  className={cx(
                    "animate-flash-in font-mono text-[12px] font-semibold tracking-wide uppercase",
                    won.profit >= 0 ? "text-emerald-300" : "text-rose-300",
                  )}
                >
                  {won.profit >= 0 ? "Прогноз верный" : "Прогноз неверный"} ·{" "}
                  <span className="tnum text-[16px]">
                    {won.profit >= 0 ? "+" : "−"}
                    {somCents(Math.abs(won.profit))}
                  </span>
                </p>
              ) : balance < stake ? (
                <p className="text-[11.5px] text-amber-300">
                  Недостаточно средств — пополните счёт
                </p>
              ) : (
                <p className="text-[11.5px] text-zinc-500">
                  Выберите направление: цена через {EXPIRIES.find((e) => e.sec === expiry)?.label}{" "}
                  будет выше или ниже
                </p>
              )}
            </div>
          </div>

          {/* Настроение трейдеров */}
          <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px]">
              <span className="tnum text-emerald-400">▲ {sentiment}%</span>
              <span className="tracking-[0.14em] text-zinc-600 uppercase">Настроение трейдеров</span>
              <span className="tnum text-rose-400">{100 - sentiment}% ▼</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-rose-500/70">
              <div
                className="h-full bg-emerald-400 transition-[width] duration-500"
                style={{ width: `${sentiment}%` }}
              />
            </div>
          </div>

          {/* Чужие выигрыши — «социальное доказательство», как в /client */}
          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
            <p className="mb-2 flex shrink-0 items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-zinc-600 uppercase">
              <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-emerald-400" />
              Выплаты трейдерам · сейчас
            </p>
            <div className="min-h-0 flex-1 space-y-[3px] overflow-hidden">
              {Array.from({ length: 14 }, (_, i) => {
                const f = feed[(feedShift + feed.length - i) % feed.length];
                return (
                  <div
                    key={(feedShift + feed.length - i) % feed.length}
                    className="flex items-center gap-2 rounded-[3px] border border-zinc-800/70 bg-zinc-900/40 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{f.who}</span>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-600">{f.symbol}</span>
                    <span className="tnum w-[92px] shrink-0 text-right font-mono text-[11px] text-emerald-400">
                      +{som(f.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-zinc-800 py-2 font-mono text-[9.5px] text-zinc-600">
            <Lock className="h-3 w-3" />
            {BRAND.options.domain} · соединение защищено
          </div>
        </aside>
      </div>

      {modal === "deposit" && (
        <DepositModal
          onDone={(amount) => setBalance((b) => b + amount)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "withdraw" && (
        <WithdrawModal
          balance={balance}
          confirmLabel={act.withdrawLabel}
          onDone={(amount) => setBalance((b) => Math.round((b - amount) * 100) / 100)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const DEAL_GRID =
  "grid grid-cols-[76px_138px_92px_84px_1fr_1fr_1fr_120px] gap-x-3 px-5 font-mono";

function Dir({ dir }: { dir: 1 | -1 }) {
  return dir === 1 ? (
    <span className="flex items-center gap-1 text-emerald-400">
      <ArrowUpRight className="h-3 w-3" />
      ВВЕРХ
    </span>
  ) : (
    <span className="flex items-center gap-1 text-rose-400">
      <ArrowDownRight className="h-3 w-3" />
      ВНИЗ
    </span>
  );
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cx("mb-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-500 uppercase", className)}>
      {children}
    </p>
  );
}

function StepButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[46px] w-10 items-center justify-center rounded-[4px] border border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "tnum rounded-[3px] border py-1.5 font-mono text-[11.5px]",
        active
          ? "border-sky-500/70 bg-sky-500/15 text-sky-200"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
