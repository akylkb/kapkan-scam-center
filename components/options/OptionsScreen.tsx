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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br to-orange-400 to-orange-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlSpace="preserve"
              width="40"
              height="40"
              viewBox="0 0 512 512"
            >
              <circle
                cx="256"
                cy="256"
                r="250"
                fill="none"
                stroke="var(--color-accent)"
                strokeOpacity="0.4"
              ></circle>
              <g fill="currentColor">
                <path d="M195.868 389.98c-3.228-3.6 7.2-13.8 9.774-16.692 3.498-3.516 7.608-6.546 12.396-8.016a49 49 0 0 0 14.274-6.072c5.55-3.87 12.81-6 16.704-11.76 6.642-12.9 11.232-27.492 10.41-42.138-.156-1.716-.282-3.258-1.692-4.398a97.2 97.2 0 0 0-22.512-14.4c-12.096-5.91-14.154-6.978-1.752 2.034 5.64 4.2 11.052 8.664 15.264 14.364 5.4 7.8-.6 20.844-3.75 28.8-7.8 12.414-23.1 16.494-35.4 23.04-31.086 14.262-51.48 13.05-72.564-15.858-2.946-4.464-4.83-9.6-6.468-14.688-.192-1.122-1.8-3.966.33-3.702C141.436 323.2 151.984 327.196 163 328c11.094 1.35 21.708-2.484 32.4-4.722-.516-.672-1.524-.552-2.28-.654-7.95-1.086-15.984-1.956-23.724-4.14-15.888-4.962-31.704-13.014-42.156-26.316-16.872-21.93-20.4-50.94-8.316-75.966 2.172-4.038 2.844 1.41 3.042 3.132 5.772 30.162 31.2 59.442 62.298 64.086-12.6-6-23.742-14.58-32.364-25.602-9.456-9.996-17.562-21.48-21.654-34.752-2.862-9.294-7.038-29.958-.6-37.86 2.334-1.992 1.134 2.772 1.062 3.798a90 90 0 0 0 .252 11.292c.072.936-.156 2.46.756 3 .414-26.946 10.488-40.902 30-58.398.768-.498 1.302-1.71 2.268-.888s-.39 3.288-.444 4.428c-2.07 9.084-2.742 18.48-2.928 27.774-.72 37.836 23.856 75.78 61.242 85.68 15.426 4.644 31.8 3.084 47.598 4.548-7.95-4.626-17.748-5.658-26.598-8.034-17.178-2.97-33.528-10.014-46.5-21.822-13.14-11.004-23.634-25.92-25.47-43.314-2.1-18.3-.324-38.4 10.734-53.748 16.446-25.002 48.228-31.08 76.182-32.424-3.876 4.092-7.8 8.22-11.658 12.3.108.81 3.108-1.968 3.66-2.202 10.956-7.518 16.116-11.526 29.778-8.07-.396 1.2-2.106 1.104-3.126 1.548-4.332 1.284-8.712 2.466-12.822 4.374-18 9.816-40.548 33.336-42.996 54.354-3.498 18.408 3.894 37.62 16.752 50.844 17.58 15.87 39.828 26.4 63.042 30.828 10.614 1.944 22.02 6.642 27.6 16.404 2.904 5.274 4.698 11.436 3.048 17.4-1.158 5.046-3.156 10.536-8.166 12.882-4.344 2.286-10.008 2.772-14.07-.39-4.674-3.432-6.6-12.414-.69-15.6 1.89-.768 4.002-.126 5.826.546.414.15.522.21.888 0 1.518-.75.516-2.202-.288-3.096-3.144-3.486-8.952-1.8-12.288.6-7.8 6.054-3.9 18.372 3.342 23.112 11.34 7.65 27.246.78 31.8-11.532 7.968-23.676-10.428-39.372-31.548-45-9.252-2.934-18.912-4.518-27.798-8.52-8.112-3.27-16.464-6.444-23.172-12.234-2.652-2.4-9.378-8.958-8.79-12.516 3.852-4.692 8.4-8.892 11.718-14.034 6.63-10.296 11.802-21.54 19.158-31.434 16.32-24.468 31.38-32.4 57.504-43.836a84.6 84.6 0 0 1 17.928-6.228 3.47 3.47 0 0 1 2.31.108c.39.21.156 0 .186.288-.924 4.446-2.76 8.76-3.504 13.26 8.28-.738 16.884 1.914 21.648 9.108 5.844 7.902 7.014 17.028-1.164 23.676-1.38-1.434-1.23-3.75-2.178-5.46-1.008-1.95-2.112-4.356-4.128-5.4 1.626 6.126 3.108 12.414 1.8 18.774 3.876-1.386 6.888-4.572 9.162-7.908a2.4 2.4 0 0 1 .3-.408 23.4 23.4 0 0 1 2.736 2.25 111.5 111.5 0 0 1 20.28 35.778c.99 2.886-.6 5.592-1.446 8.292a5.61 5.61 0 0 1-4.284 4.398c-2.958.876-5.934 1.704-8.904 2.556-2.646 1.2-5.178.144-7.11-1.8-5.874-4.8-12.99-13.368-21.312-11.916-9.102.99-21.918-.294-27.6-8.37-4.2-5.964-3.144-11.832-3-18.498-3.072 5.268-6.798 11.4-5.322 17.754 1.128 6.384 6.564 9.354 12 11.688C343 210.85 353.2 215.8 362.95 221.53c6.036 3.372 11.628 7.65 15.6 13.38 2.034 2.76 3.054 6.072 4.2 9.27a406 406 0 0 1 13.2 44.4c2.172 8.244 3.804 13.668 1.986 22.32-3.942 13.944-12.822 25.962-21.6 37.29-26.658 34.2-69.168 55.026-112.338 56.706a163 163 0 0 1-34.164-3.6c-5.508-1.152-10.734-3.204-15.954-5.256-1.8-.666-2.514-1.764-.6-3.252 11.664-10.458 27.252-6.672 40.902-11.154-3.948-.882-8.136-.63-12.162-1.068-8.136-.468-16.35-1.602-24.468-.318-7.788 1.464-15.684 4.584-21.684 9.732M353.8 168.472a20.8 20.8 0 0 0-8.688-10.578c-1.596 7.212 1.728 10.11 8.688 10.578"></path>
                <path d="M228.262 173.974c2.214 8.61 10.2 10.2 16.62 4.614 6.78-6.6 12.234-14.4 18.042-21.852 2.97-3.774 6-7.536 9.246-11.058 10.734-11.046 24.03-22.278 40.086-23.172 2.556-.354 4.8.876 6.894 2.214a2.1 2.1 0 0 1 .696 1.032c.162.354.186.294-.102.498-3 1.308-6.312 2.028-9.408 3.186-12.6 4.944-22.578 15-31.59 24.804-12.168 14.76-20.76 33.138-33.93 46.95-13.62 9.09-22.488-11.322-18.81-22.434.45-1.644.324-4.104 2.256-4.782"></path>
              </g>
            </svg>
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
