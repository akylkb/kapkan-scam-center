"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bitcoin, CheckCircle2, CreditCard, Loader2, Lock, Wallet, X, XCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { groupDigits, maskCard, somCents } from "@/lib/format";
import { OPTION_CARD_LAST4, OPTION_WITHDRAW_LIMIT } from "@/lib/fixtures/options";
import { useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";

type Phase = "form" | "wait" | "done";

/**
 * Ожидание операции считается в тиках сцены, а не таймером: стоп-кадр
 * (Ctrl+Alt+0) замораживает и его, а длительность одинакова в каждом дубле.
 */
function useOperation(waitTicks: number, onDone: () => void) {
  const tick = useTick();
  const [phase, setPhase] = useState<Phase>("form");
  const [since, setSince] = useState(0);

  useEffect(() => {
    if (phase !== "wait" || tick - since < waitTicks) return;
    setPhase("done");
    onDone();
  }, [phase, tick, since, waitTicks, onDone]);

  return {
    phase,
    progress: phase === "wait" ? Math.min(1, (tick - since) / waitTicks) : 0,
    run: () => {
      setSince(tick);
      setPhase("wait");
    },
  };
}

/** Зачисление на баланс — первый шаг Руслана */
export function DepositModal({
  onDone,
  onClose,
}: {
  onDone: (amount: number) => void;
  onClose: () => void;
}) {
  // Сумму актёр набирает сам; в состоянии только цифры, пробелы разрядов
  // дорисовываются при выводе
  const [draft, setDraft] = useState("5000");
  const amount = Number(draft) || 0;
  const [method, setMethod] = useState(0);
  const op = useOperation(7, () => onDone(amount));
  const submit = amount > 0 ? op.run : undefined;

  return (
    <Frame title="Пополнение счёта" onClose={onClose}>
      {op.phase === "form" && (
        <>
          <Label>Сумма пополнения</Label>
          {/* Настоящее поле, как у чатера: select-text — потому что выделение
              отключено глобально, а в поле ввода оно нужно */}
          <label className="mb-2 flex items-baseline gap-2 rounded-[4px] border border-zinc-700 bg-zinc-900/70 px-3 py-2.5 focus-within:border-sky-500/70">
            <input
              value={draft ? groupDigits(amount) : ""}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 8))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit?.();
              }}
              autoFocus
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
              placeholder="0"
              className="tnum min-w-0 flex-1 bg-transparent font-mono text-[28px] font-semibold text-zinc-100 caret-sky-400 select-text placeholder:text-zinc-700"
            />
            <span className="font-mono text-[18px] text-zinc-500">сом</span>
          </label>
          <div className="mb-4 grid grid-cols-5 gap-1.5">
            {[1_000, 2_500, 5_000, 10_000, 25_000].map((v) => (
              <Chip key={v} active={v === amount} onClick={() => setDraft(String(v))}>
                {groupDigits(v)}
              </Chip>
            ))}
          </div>

          <Label>Способ оплаты</Label>
          <div className="mb-4 space-y-1.5">
            {METHODS.map((m, i) => (
              <button
                key={m.title}
                onClick={() => setMethod(i)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-[4px] border px-3 py-2 text-left",
                  i === method
                    ? "border-sky-500/70 bg-sky-500/10"
                    : "border-zinc-800 bg-zinc-900/40",
                )}
              >
                <m.icon className={cx("h-4 w-4", i === method ? "text-sky-300" : "text-zinc-500")} />
                <span className="flex-1 text-[12.5px] text-zinc-200">{m.title}</span>
                <span className="font-mono text-[10.5px] text-zinc-500">{m.note}</span>
              </button>
            ))}
          </div>

          <div className="mb-4 space-y-1.5 font-mono text-[11px]">
            <Row label="Комиссия" value="0%" tone="text-emerald-400" />
            <Row label="Зачисление" value="мгновенно" />
          </div>

          <button
            onClick={submit}
            className={cx(
              "w-full rounded-[4px] py-3 font-mono text-[13px] font-bold tracking-[0.1em] uppercase",
              amount > 0
                ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                : "bg-zinc-800 text-zinc-600",
            )}
          >
            Зачислить {somCents(amount)}
          </button>
        </>
      )}

      {op.phase === "wait" && <Waiting progress={op.progress} text="Ожидание подтверждения платежа…" />}

      {op.phase === "done" && (
        <Result
          tone="ok"
          title="Средства зачислены"
          amount={`+${somCents(amount)}`}
          rows={[
            ["Способ", METHODS[method].title],
            ["Номер операции", "DP-771204"],
            ["Статус", "ЗАЧИСЛЕНО"],
          ]}
        >
          <MainButton onClick={onClose}>Начать торговлю</MainButton>
        </Result>
      )}
    </Frame>
  );
}

const METHODS = [
  { icon: CreditCard, title: `Банковская карта ${maskCard(OPTION_CARD_LAST4)}`, note: "мгновенно" },
  { icon: Bitcoin, title: "Криптовалюта · USDT", note: "до 10 мин" },
  { icon: Wallet, title: "Электронный кошелёк", note: "мгновенно" },
];

/**
 * Вывод средств. Исход решает баланс на момент открытия окна: до порога
 * OPTION_WITHDRAW_LIMIT включительно вывод проходит, чтобы жертва поверила,
 * выше — отклоняется, сколько ни повторяй.
 */
export function WithdrawModal({
  balance,
  confirmLabel,
  onDone,
  onClose,
}: {
  balance: number;
  confirmLabel: string;
  onDone: (amount: number) => void;
  onClose: () => void;
}) {
  const [share, setShare] = useState(1);
  // Сумма фиксируется в момент открытия: после списания баланс в шапке
  // меняется, а в квитанции должна остаться выведенная сумма
  const [available] = useState(balance);
  const amount = Math.round(available * share * 100) / 100;
  const ok = available <= OPTION_WITHDRAW_LIMIT;
  const op = useOperation(ok ? 9 : 12, () => {
    if (ok) onDone(amount);
  });

  return (
    <Frame title="Вывод средств" onClose={onClose}>
      {op.phase === "form" && (
        <>
          <div className="mb-4 flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <span className="text-[12px] text-zinc-500">Доступно к выводу</span>
            <span className="tnum font-mono text-[24px] font-semibold text-emerald-400">
              {somCents(available)}
            </span>
          </div>

          <Label>Сумма вывода</Label>
          <p className="tnum mb-2 rounded-[4px] border border-zinc-700 bg-zinc-900/70 px-3 py-2.5 font-mono text-[28px] font-semibold text-zinc-100">
            {somCents(amount)}
          </p>
          <div className="mb-4 grid grid-cols-3 gap-1.5">
            {[0.25, 0.5, 1].map((v) => (
              <Chip key={v} active={v === share} onClick={() => setShare(v)}>
                {v === 1 ? "Всё" : `${v * 100}%`}
              </Chip>
            ))}
          </div>

          <div className="mb-4 space-y-1.5 font-mono text-[11px]">
            <Row label="Получатель" value={`Карта ${maskCard(OPTION_CARD_LAST4)}`} />
            <Row label="Комиссия" value="0%" tone="text-emerald-400" />
            <Row label="Срок зачисления" value="до 15 минут" />
          </div>

          <button
            onClick={amount > 0 ? op.run : undefined}
            className={cx(
              "w-full rounded-[4px] py-3 font-mono text-[13px] font-bold tracking-[0.1em] uppercase",
              amount > 0
                ? "bg-sky-500 text-zinc-950 hover:bg-sky-400"
                : "bg-zinc-800 text-zinc-600",
            )}
          >
            {confirmLabel}
          </button>
        </>
      )}

      {op.phase === "wait" && <Waiting progress={op.progress} text="Обработка заявки на вывод…" />}

      {op.phase === "done" && ok && (
        <Result
          tone="ok"
          title="Заявка исполнена"
          amount={somCents(amount)}
          rows={[
            ["Получатель", `Карта ${maskCard(OPTION_CARD_LAST4)}`],
            ["Номер операции", "WD-208841"],
            ["Статус", "ОТПРАВЛЕНО · до 15 минут"],
          ]}
        >
          <MainButton onClick={onClose}>Готово</MainButton>
        </Result>
      )}

      {op.phase === "done" && !ok && (
        <Result
          tone="fail"
          title="Операция отклонена"
          amount={somCents(amount)}
          rows={[
            ["Код отказа", "WD-4031"],
            ["Причина", "ПРОВЕРКА СЛУЖБОЙ БЕЗОПАСНОСТИ"],
            ["Статус счёта", "ВЫВОД ОГРАНИЧЕН"],
          ]}
        >
          <p className="mb-3 text-center text-[12px] leading-relaxed text-zinc-400">
            Вывод средств с вашего счёта временно недоступен. Обратитесь в службу
            поддержки: {BRAND.options.support}
          </p>
          <div className="flex gap-2">
            <button
              onClick={op.run}
              className="flex-1 rounded-[4px] border border-rose-500/60 bg-rose-500/10 py-2.5 font-mono text-[12px] font-bold tracking-[0.1em] text-rose-300 uppercase hover:bg-rose-500/20"
            >
              Повторить
            </button>
            <button
              onClick={onClose}
              className="rounded-[4px] border border-zinc-700 px-5 font-mono text-[12px] tracking-[0.1em] text-zinc-400 uppercase hover:text-zinc-200"
            >
              Закрыть
            </button>
          </div>
        </Result>
      )}
    </Frame>
  );
}

function Frame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/80 backdrop-blur-[2px]">
      <div className="animate-flash-in w-[520px] overflow-hidden rounded-[8px] border border-zinc-700 bg-[#10141c] shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-5 py-3">
          <h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-5 py-4">
          {children}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-zinc-600">
            <Lock className="h-3 w-3" />
            Соединение защищено · {BRAND.options.domain}
          </p>
        </div>
      </div>
    </div>
  );
}

function Waiting({ progress, text }: { progress: number; text: string }) {
  return (
    <div className="flex flex-col items-center py-10">
      <Loader2 className="h-12 w-12 animate-spin text-sky-400" strokeWidth={1.6} />
      <p className="mt-5 text-[14px] text-zinc-300">{text}</p>
      <div className="mt-4 h-1 w-[260px] overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-sky-400 transition-[width] duration-300 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function Result({
  tone,
  title,
  amount,
  rows,
  children,
}: {
  tone: "ok" | "fail";
  title: string;
  amount: string;
  rows: [string, string][];
  children: ReactNode;
}) {
  const ok = tone === "ok";
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="animate-flash-in">
      <div
        className={cx(
          "mb-4 flex flex-col items-center rounded-[6px] border px-4 py-5",
          ok ? "border-emerald-600/50 bg-emerald-500/10" : "border-rose-600/60 bg-rose-500/10",
        )}
      >
        <Icon className={cx("h-14 w-14", ok ? "text-emerald-400" : "text-rose-500")} strokeWidth={1.5} />
        <p
          className={cx(
            "mt-3 font-mono text-[24px] font-bold tracking-[0.1em] uppercase",
            ok ? "text-emerald-300" : "text-rose-400",
          )}
        >
          {title}
        </p>
        <p className={cx("tnum mt-1 font-mono text-[20px]", ok ? "text-zinc-100" : "text-zinc-400")}>
          {amount}
        </p>
      </div>
      <div className="mb-4 space-y-1.5 font-mono text-[11px]">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} tone={ok ? undefined : "text-rose-300"} />
        ))}
      </div>
      {children}
    </div>
  );
}

function MainButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[4px] bg-sky-500 py-3 font-mono text-[13px] font-bold tracking-[0.1em] text-zinc-950 uppercase hover:bg-sky-400"
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "tnum rounded-[3px] border py-1.5 font-mono text-[12px]",
        active
          ? "border-sky-500/70 bg-sky-500/15 text-sky-200"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-zinc-900 pb-1">
      <span className="text-zinc-600">{label}</span>
      <span className={tone ?? "text-zinc-300"}>{value}</span>
    </div>
  );
}
