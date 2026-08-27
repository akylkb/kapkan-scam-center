"use client";

import {
  Banknote,
  CircleSlash,
  FileBadge,
  Flame,
  KeyRound,
  Link2,
  MessageSquarePlus,
  Phone,
  UserMinus,
  Video,
  Wallet,
} from "lucide-react";
import {
  SCHEME_META,
  STAGES,
  THREAD_STATUS_META,
  type Thread,
  type ThreadEvent,
} from "@/lib/fixtures/threads";
import type { Persona } from "@/lib/fixtures/personas";
import { agoLabel, usd } from "@/lib/format";
import { Chip, Field, Meter, cx } from "@/components/shared/ui";

const EVENT_META: Record<
  ThreadEvent["kind"],
  { icon: typeof Phone; tone: string }
> = {
  contact: { icon: MessageSquarePlus, tone: "text-zinc-400" },
  call: { icon: Phone, tone: "text-cyan-300" },
  video: { icon: Video, tone: "text-fuchsia-300" },
  link: { icon: Link2, tone: "text-sky-300" },
  otp: { icon: KeyRound, tone: "text-amber-300" },
  pay: { icon: Banknote, tone: "text-emerald-300" },
  proof: { icon: FileBadge, tone: "text-zinc-300" },
  refuse: { icon: CircleSlash, tone: "text-rose-400" },
};

export function VictimCard({ thread, persona }: { thread: Thread; persona: Persona }) {
  const status = THREAD_STATUS_META[thread.status];
  const scheme = SCHEME_META[thread.scheme];
  const left = Math.max(0, thread.askAmount - thread.paidAmount);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Шапка карточки */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-[15px] leading-tight font-semibold text-zinc-100">
              <span className="text-[13px]">{thread.country.flag}</span>
              <span className="truncate">{thread.name}</span>
              {/* <span className="shrink-0 font-mono text-[10px] font-normal text-zinc-600">
                {thread.age}
              </span> */}
            </h2>
            <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.1em] text-zinc-600">
              {thread.id} · {thread.city}, {thread.country.ru} · {thread.phone}
            </p>
          </div>
          <Chip className={cx(status.bg, status.border, status.text, "shrink-0")}>
            <span className={cx("h-[4px] w-[4px] rounded-full", status.dot)} />
            {status.label}
          </Chip>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Chip className={cx("border-zinc-700/60 bg-zinc-800/60", scheme.text)}>
            {scheme.label}
          </Chip>
          <Chip className="border-cyan-800/50 bg-cyan-500/10 text-cyan-300">
            ЭТАП · {STAGES[thread.stage]}
          </Chip>
        </div>

        {/* Две главные цифры — их и снимают крупным планом */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Платёжеспособность
            </p>
            <p className="tnum mt-0.5 font-mono text-[19px] leading-none font-semibold text-zinc-200">
              {usd(thread.wealth)}
            </p>
          </div>
          <div className="rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
            <p className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Уже отдал
            </p>
            <p
              className={cx(
                "tnum mt-0.5 font-mono text-[19px] leading-none font-semibold",
                thread.paidAmount > 0 ? "text-emerald-300" : "text-zinc-600",
              )}
            >
              {thread.paidAmount > 0 ? usd(thread.paidAmount) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
              Готовность платить
            </span>
            <span
              className={cx(
                "tnum font-mono text-[10px]",
                thread.readiness > 70
                  ? "text-emerald-300"
                  : thread.readiness > 40
                    ? "text-amber-300"
                    : "text-rose-400",
              )}
            >
              {thread.readiness}% · осталось {usd(left)}
            </span>
          </div>
          <Meter
            value={thread.readiness}
            className={
              thread.readiness > 70
                ? "bg-emerald-500"
                : thread.readiness > 40
                  ? "bg-amber-400"
                  : "bg-rose-500"
            }
          />
        </div>
      </div>

      {/* Что известно о клиенте */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-1.5">
        <Field label="Канал" value={`${thread.channel} · ${thread.handle}`} valueClass="font-mono" />
        <Field label="Ведёт личина" value={persona.handle} valueClass="font-mono text-cyan-300" />
        <Field label="Предмет" value={thread.item} />
        <Field label="Сумма сделки" value={usd(thread.askAmount)} valueClass="font-mono" />
        <Field label="Чем зацепили" value={thread.hook} />
        <Field label="Первый контакт" value={agoLabel(thread.inWorkMin)} />
      </div>

      {/* Заметка чатера */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
        <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Заметка
        </p>
        <p className="rounded-[3px] border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[11px] leading-snug text-zinc-400">
          {thread.note}
        </p>
      </div>

      {/* Журнал — уходит за нижний край, панель не пустует */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 px-3 pt-2 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Что делали с клиентом
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {thread.events.map((e) => {
            const meta = EVENT_META[e.kind];
            return (
              <div key={e.id} className="flex items-center gap-2 border-b border-zinc-900 py-[5px]">
                <meta.icon className={cx("h-3 w-3 shrink-0", meta.tone)} strokeWidth={2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] text-zinc-400">{e.text}</span>
                  <span className="block font-mono text-[9px] text-zinc-700">
                    {e.id.slice(0, 11)} · {agoLabel(e.agoMin)}
                  </span>
                </span>
                {e.amount !== undefined && (
                  <span className={cx("tnum shrink-0 font-mono text-[11px]", meta.tone)}>
                    +{usd(e.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Действия — формулировки те же, что во внутренних инструкциях */}
      <div className="flex shrink-0 gap-1.5 border-t border-zinc-800 bg-[#0b0b0e] px-2 py-1.5 leading-none">
        <ActionBtn icon={Flame} label="Дожать" tone="amber" />
        <ActionBtn icon={Wallet} label="В отдел вывода" tone="emerald" />
        <ActionBtn icon={UserMinus} label="В ЧС" tone="rose" />
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  amber: "border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40",
  emerald: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40",
  rose: "border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40",
};

function ActionBtn({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Flame;
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
