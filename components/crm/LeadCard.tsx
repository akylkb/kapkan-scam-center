"use client";

import { useState } from "react";
import { AlertTriangle, Lock, MonitorSmartphone } from "lucide-react";
import type { Lead } from "@/lib/fixtures/leads";
import { STATUS_META } from "@/lib/fixtures/leads";
import { agoLabel, mmss, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Chip, Field, Meter, cx } from "@/components/shared/ui";

const TABS = ["Профиль", "Звонки", "Транзакции", "Заметки"] as const;
type Tab = (typeof TABS)[number];

const TIER_STYLE: Record<Lead["tier"], string> = {
  Beginner: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
  Silver: "border-slate-500/50 bg-slate-400/10 text-slate-300",
  Gold: "border-amber-500/50 bg-amber-400/10 text-amber-300",
  Platinum: "border-fuchsia-500/50 bg-fuchsia-400/10 text-fuchsia-300",
};

export function LeadCard({ lead }: { lead: Lead }) {
  const [tab, setTab] = useState<Tab>("Профиль");
  const meta = STATUS_META[lead.status];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Шапка карточки */}
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/40 px-2.5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px]">{lead.country.flag}</span>
              <h2 className="truncate text-[14px] font-semibold text-zinc-100">{lead.name}</h2>
            </div>
            <p className="mt-0.5 font-mono text-[9.5px] tracking-wide text-zinc-500">
              {lead.id} · {lead.city}, {lead.country.ru} · {lead.age} лет
            </p>
          </div>
          <Chip className={TIER_STYLE[lead.tier]}>{lead.tier}</Chip>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <Chip className={cx(meta.bg, meta.border, meta.text)}>
            <span className={cx("h-[4px] w-[4px] rounded-full", meta.dot)} />
            {meta.label}
          </Chip>
          {lead.online && (
            <Chip className="border-emerald-700/50 bg-emerald-500/10 text-emerald-300">
              <MonitorSmartphone className="h-2.5 w-2.5" />В ТЕРМИНАЛЕ
            </Chip>
          )}
          {lead.withdrawBlocked > 0 && (
            <Chip className="border-rose-700/50 bg-rose-500/10 text-rose-300">
              <Lock className="h-2.5 w-2.5" />
              ВЫВОД ×{lead.withdrawBlocked}
            </Chip>
          )}
        </div>

        {/* Две ключевые цифры — крупно, чтобы читались на крупном плане */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Metric label="Внесено" value={usd(lead.deposit)} tone="text-emerald-300" />
          <Metric label="Оценка капитала" value={usd(lead.netWorth)} tone="text-zinc-200" />
        </div>

        <div className="mt-2">
          <div className="mb-1 flex justify-between font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
            <span>Готовность</span>
            <span className="text-zinc-400">{lead.temperature}%</span>
          </div>
          <Meter
            value={lead.temperature}
            className={
              lead.temperature > 70
                ? "bg-rose-500"
                : lead.temperature > 40
                  ? "bg-amber-400"
                  : "bg-sky-500"
            }
          />
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex shrink-0 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "flex-1 py-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase transition-colors",
              tab === t
                ? "border-b-2 border-emerald-500 text-zinc-100"
                : "border-b-2 border-transparent text-zinc-600 hover:text-zinc-400",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {tab === "Профиль" && <ProfileTab lead={lead} />}
        {tab === "Звонки" && <CallsTab lead={lead} />}
        {tab === "Транзакции" && <TxTab lead={lead} />}
        {tab === "Заметки" && <NotesTab lead={lead} />}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
      <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">{label}</p>
      <p className={cx("tnum mt-0.5 font-mono text-[15px] font-semibold", tone)}>{value}</p>
    </div>
  );
}

/**
 * Поля карточки повторяют то, что реально заполняли операторы в изъятых CRM:
 * возраст, гражданство, опыт инвестирования, банк, семейное положение.
 */
function ProfileTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-0.5">
      <Field label="Телефон" value={lead.phone} valueClass="font-mono" />
      <Field label="Гражданство" value={`${lead.country.flag} ${lead.country.ru}`} />
      <Field label="Город" value={lead.city} />
      <Field label="Возраст" value={`${lead.age}`} valueClass="font-mono" />
      <Field label="Занятость" value={lead.occupation} />
      <Field label="Сем. положение" value={lead.marital} />
      <Field label="Опыт инвестиций" value={lead.experience} />
      <Field label="Банк" value={lead.bank} />
      <Field label="Верификация" value="документы на проверке" valueClass="text-amber-300" />
      <Field label="Уровень счёта" value={lead.tier} />
      <Field label="Источник" value={`ADS-${lead.id.slice(-2)} · landing #4`} valueClass="font-mono" />
      <Field label="IP клиента" value={lead.ip} valueClass="font-mono text-zinc-500" />
      <Field
        label={BRAND.rat.name}
        value={lead.online ? "доступ активен" : "не подключён"}
        valueClass={lead.online ? "text-emerald-300" : "text-zinc-600"}
      />
      <Field label="Ответственный" value={lead.agent} />

      <ActivityLog lead={lead} />
    </div>
  );
}

/**
 * Лог активности клиента.
 *
 * Нужен не только для достоверности: без него нижняя треть правой колонки
 * остаётся пустой, и на крупном плане это сразу видно.
 */
function ActivityLog({ lead }: { lead: Lead }) {
  const entries = [
    { t: 2, text: `вход в терминал · ${lead.ip}`, tone: "text-zinc-400" },
    { t: 6, text: "открыл раздел «Вывод средств»", tone: "text-amber-300" },
    { t: 14, text: "просмотр документа «Лицензия»", tone: "text-zinc-400" },
    { t: 31, text: `загрузил скан паспорта · ${lead.country.code}`, tone: "text-sky-300" },
    { t: 58, text: "сессия удалённого доступа принята", tone: "text-emerald-300" },
    { t: 96, text: "3 неудачных ввода пароля", tone: "text-rose-400" },
    { t: 142, text: "письмо «Подтверждение сделки» доставлено", tone: "text-zinc-400" },
    { t: 210, text: `звонок принят · ${lead.agent}`, tone: "text-zinc-400" },
  ];

  return (
    <div className="mt-3">
      <p className="mb-1.5 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
        Активность клиента
      </p>
      <div className="space-y-[3px] border-l border-zinc-800 pl-2">
        {entries.map((e) => (
          <div key={e.t} className="flex items-baseline gap-2">
            <span className="tnum shrink-0 font-mono text-[9px] text-zinc-700">
              −{e.t}м
            </span>
            <span className={cx("truncate font-mono text-[9.5px]", e.tone)}>{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CallsTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-1">
      {lead.calls.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-2 rounded-[3px] border border-zinc-900 bg-zinc-900/40 px-2 py-1"
        >
          <div className="min-w-0">
            <p className="truncate text-[10.5px] text-zinc-300">{c.outcome}</p>
            <p className="font-mono text-[9px] text-zinc-600">
              {c.agent} · {agoLabel(c.agoMin)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {c.recorded && (
              <span className="font-mono text-[8.5px] tracking-wider text-rose-400/70">REC</span>
            )}
            <span className="tnum font-mono text-[10.5px] text-zinc-400">
              {mmss(c.durationSec)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const TX_LABEL: Record<string, string> = {
  deposit: "Депозит",
  bonus: "Бонус начислен",
  adjust: "Корректировка",
  withdraw_req: "Заявка на вывод",
  withdraw_rej: "Вывод отклонён",
  fee: "Комиссия",
};

function TxTab({ lead }: { lead: Lead }) {
  if (lead.transactions.length === 0) {
    return (
      <p className="py-6 text-center font-mono text-[10px] text-zinc-700">Транзакций нет</p>
    );
  }
  return (
    <div className="space-y-1">
      {lead.transactions.map((t) => {
        const negative = t.kind === "withdraw_req" || t.kind === "withdraw_rej";
        return (
          <div
            key={t.id}
            className="flex items-center justify-between gap-2 rounded-[3px] border border-zinc-900 bg-zinc-900/40 px-2 py-1"
          >
            <div className="min-w-0">
              <p className="truncate text-[10.5px] text-zinc-300">{TX_LABEL[t.kind]}</p>
              <p className="truncate font-mono text-[9px] text-zinc-600">
                {t.method} · {agoLabel(t.agoMin)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cx(
                  "tnum font-mono text-[11px] font-semibold",
                  negative ? "text-rose-400" : "text-emerald-300",
                )}
              >
                {negative ? "−" : "+"}
                {usd(t.amount)}
              </p>
              <p
                className={cx(
                  "font-mono text-[8.5px] tracking-wider",
                  t.status === "OK"
                    ? "text-emerald-600"
                    : t.status === "REJECTED"
                      ? "text-rose-500"
                      : "text-amber-500",
                )}
              >
                {t.status}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-2">
      <div className="rounded-[3px] border border-amber-900/40 bg-amber-500/5 p-2">
        <p className="mb-1 flex items-center gap-1 font-mono text-[8.5px] tracking-[0.14em] text-amber-500/80 uppercase">
          <AlertTriangle className="h-2.5 w-2.5" />
          Заметка предыдущего оператора
        </p>
        <p className="text-[11px] leading-snug text-zinc-300">{lead.note}</p>
        <p className="mt-1.5 font-mono text-[9px] text-zinc-600">
          {lead.agent} · {agoLabel(lead.lastContactMin)}
        </p>
      </div>

      <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/40 p-2">
        <p className="mb-1 font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          Новая заметка
        </p>
        <div className="h-[52px] rounded-[2px] border border-zinc-800 bg-zinc-950/60 p-1.5">
          <span className="font-mono text-[10px] text-zinc-700">
            начните печатать
            <span className="animate-blink ml-px text-emerald-500">▌</span>
          </span>
        </div>
      </div>
    </div>
  );
}
