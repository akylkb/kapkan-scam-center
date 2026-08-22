"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleSlash,
  Snowflake,
  TriangleAlert,
  UserMinus,
} from "lucide-react";
import { DROP_STATUS_META, loadPct, type Drop, type DropOp } from "@/lib/fixtures/drops";
import { agoLabel, usd } from "@/lib/format";
import { Chip, Field, Meter, cx } from "@/components/shared/ui";

const OP_META: Record<DropOp["kind"], { icon: typeof ArrowDownLeft; tone: string; label: string }> = {
  in: { icon: ArrowDownLeft, tone: "text-emerald-300", label: "ЗАЛИВ" },
  out: { icon: ArrowUpRight, tone: "text-sky-300", label: "ПЕРЕВОД" },
  cash: { icon: Banknote, tone: "text-zinc-300", label: "СНЯТИЕ" },
  reject: { icon: CircleSlash, tone: "text-rose-400", label: "ОТКАЗ" },
  hold: { icon: TriangleAlert, tone: "text-amber-300", label: "УДЕРЖАНИЕ" },
};

export function DropCard({ drop, burned }: { drop: Drop; burned: boolean }) {
  const status = burned ? "burned" : drop.status;
  const meta = DROP_STATUS_META[status];
  const load = loadPct(drop);
  const free = Math.max(0, drop.limitDay - drop.loadedToday);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Шапка карточки */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-[15px] leading-tight font-semibold text-zinc-100">
              <span className="text-[13px]">{drop.country.flag}</span>
              <span className="truncate">{drop.alias}</span>
              <span className="shrink-0 font-mono text-[10px] font-normal text-zinc-600">
                {drop.initials}
              </span>
            </h2>
            <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.1em] text-zinc-600">
              {drop.id} · {drop.city} · {drop.phone}
            </p>
          </div>
          <Chip className={cx(meta.bg, meta.border, meta.text, "shrink-0")}>
            <span className={cx("h-[4px] w-[4px] rounded-full", meta.dot)} />
            {meta.label}
          </Chip>
        </div>

        {/* Две главные цифры — их и снимают крупным планом */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Залито сегодня
            </p>
            <p className="tnum mt-0.5 font-mono text-[19px] leading-none font-semibold text-emerald-300">
              {usd(drop.loadedToday)}
            </p>
          </div>
          <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Свободно до лимита
            </p>
            <p
              className={cx(
                "tnum mt-0.5 font-mono text-[19px] leading-none font-semibold",
                free > 0 ? "text-zinc-200" : "text-rose-400",
              )}
            >
              {usd(free)}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Загрузка карты
            </span>
            <span
              className={cx(
                "tnum font-mono text-[10px]",
                load > 90 ? "text-rose-400" : load > 60 ? "text-amber-300" : "text-emerald-300",
              )}
            >
              {load}% · лимит {usd(drop.limitDay)}
            </span>
          </div>
          <Meter
            value={load}
            className={
              load > 90 ? "bg-rose-500" : load > 60 ? "bg-amber-400" : "bg-emerald-500"
            }
          />
        </div>
      </div>

      {/* Реквизиты */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-1.5">
        <Field label="Банк" value={drop.bank} />
        <Field label="Карта" value={drop.card} valueClass="font-mono" />
        <Field label="Держит деньги" value={`${drop.holdMin} мин`} />
        <Field
          label="Процент дропа"
          value={`${drop.feePct}%`}
          valueClass="text-amber-300 font-mono"
        />
        <Field label="Курьер" value={drop.courier} />
        <Field
          label="Риск блокировки"
          value={`${drop.risk} / 100`}
          valueClass={cx(
            "font-mono",
            drop.risk > 70 ? "text-rose-400" : drop.risk > 40 ? "text-amber-300" : "text-zinc-300",
          )}
        />
        <Field label="Последняя операция" value={agoLabel(drop.lastOpMin)} />
      </div>

      {/* Заметка дроповода */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
        <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Заметка
        </p>
        <p className="rounded-[3px] border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[11px] leading-snug text-zinc-400">
          {drop.note}
        </p>
      </div>

      {/* История операций — уходит за нижний край, панель не пустует */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 px-3 pt-2 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          История по карте
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {drop.ops.map((op) => {
            const om = OP_META[op.kind];
            return (
              <div
                key={op.id}
                className="flex items-center gap-2 border-b border-zinc-900 py-[5px]"
              >
                <om.icon className={cx("h-3 w-3 shrink-0", om.tone)} strokeWidth={2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] text-zinc-400">{op.note}</span>
                  <span className="block font-mono text-[9px] text-zinc-700">
                    {op.id} · {agoLabel(op.agoMin)}
                  </span>
                </span>
                <span className={cx("tnum shrink-0 font-mono text-[11px]", om.tone)}>
                  {op.kind === "in" ? "+" : op.kind === "out" || op.kind === "cash" ? "−" : ""}
                  {usd(op.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Действия — формулировки те же, что во внутренних инструкциях */}
      <div className="flex shrink-0 gap-1.5 border-t border-zinc-800 bg-[#0b0b0e] px-2 py-1.5 leading-none">
        <ActionBtn icon={ArrowDownLeft} label="Назначить залив" tone="emerald" />
        <ActionBtn icon={Snowflake} label="Заморозить" tone="sky" />
        <ActionBtn icon={UserMinus} label="Вывести из схемы" tone="rose" />
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  emerald: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40",
  sky: "border-sky-800/60 bg-sky-950/40 text-sky-300 hover:bg-sky-900/40",
  rose: "border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40",
};

function ActionBtn({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof ArrowDownLeft;
  label: string;
  tone: keyof typeof TONE;
}) {
  return (
    <button
      className={cx(
        "flex h-[24px] flex-1 items-center justify-center gap-1.5 rounded-[3px] border text-[10.5px] transition-colors",
        TONE[tone],
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.9} />
      {label}
    </button>
  );
}
