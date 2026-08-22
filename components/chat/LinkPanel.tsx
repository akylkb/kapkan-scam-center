"use client";

import { useMemo } from "react";
import { Copy, Link2, MousePointerClick, RefreshCw } from "lucide-react";
import { Rng } from "@/lib/prng";
import { BRAND } from "@/lib/brand";
import { PHISH_TEMPLATES } from "@/lib/fixtures/pools";
import type { LinkEvent, PhishLink } from "@/lib/fixtures/chatdesk";
import { groupDigits } from "@/lib/format";
import { Meter, cx } from "@/components/shared/ui";

const EVENT_TONE: Record<LinkEvent["kind"], string> = {
  open: "text-sky-300",
  form: "text-cyan-300",
  card: "text-emerald-300",
  sms: "text-amber-300",
  drop: "text-zinc-600",
};

/**
 * Конструктор ссылки-клона.
 *
 * Домены косят под вымышленные бренды из lib/brand.ts. Настоящих адресов
 * в кадре нет: на стоп-кадре зритель не должен прочитать работающую ссылку.
 */
export function LinkPanel({ link, extraHits }: { link: PhishLink; extraHits: number }) {
  const clicks = link.clicks + extraHits;
  const entered = link.entered + extraHits;
  const conv = Math.min(100, (entered / clicks) * 100);

  // QR детерминирован по id ссылки: в каждом дубле рисуется один и тот же
  const qr = useMemo(() => {
    const rng = new Rng(`qr-${link.id}`);
    return Array.from({ length: 21 * 21 }, () => rng.chance(0.46));
  }, [link.id]);

  return (
    <div className="flex h-full flex-col px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Ссылка-клон · {BRAND.phish.name}
        </span>
        <button className="flex items-center gap-1 font-mono text-[8.5px] text-zinc-600 transition-colors hover:text-cyan-300">
          <RefreshCw className="h-2.5 w-2.5" />
          НОВЫЙ ДОМЕН
        </button>
      </div>

      {/* Шаблон страницы */}
      <div className="mt-1.5 grid grid-cols-2 gap-1">
        {PHISH_TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={cx(
              "truncate rounded-[3px] border px-1.5 py-1 text-left text-[9.5px] transition-colors",
              t.id === link.template
                ? "border-cyan-700/60 bg-cyan-500/10 text-cyan-300"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-950/70 px-2 py-1.5">
            <Link2 className="h-3 w-3 shrink-0 text-cyan-400" />
            <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-cyan-300">
              {link.url}
            </span>
            <Copy className="h-3 w-3 shrink-0 text-zinc-600" />
          </div>
          <p className="mt-1 truncate font-mono text-[8.5px] text-zinc-600">
            клон {link.domain} · сертификат выпущен 3 ч назад
          </p>

          {/* Счётчики: ради этих цифр ссылку и делали */}
          <div className="mt-1.5 space-y-[3px]">
            <Counter label="Переходов" value={clicks} tone="text-zinc-200" />
            <Counter label="Введено карт" value={entered} tone="text-emerald-300" />
            <Counter label="Ушли без ввода" value={link.dropped} tone="text-zinc-600" />
          </div>

          <div className="mt-1.5">
            <div className="mb-1 flex items-baseline justify-between font-mono text-[8.5px] text-zinc-600">
              <span className="tracking-[0.14em] uppercase">Конверсия</span>
              <span className="tnum text-emerald-300">{conv.toFixed(1)}%</span>
            </div>
            <Meter value={conv} className="bg-emerald-500" />
          </div>
        </div>

        {/* QR — для тех, кому ссылку кидают в мессенджер картинкой */}
        <div className="shrink-0">
          <div className="grid h-[92px] w-[92px] grid-cols-21 gap-0 rounded-[2px] border border-zinc-800 bg-zinc-200 p-1">
            {qr.map((on, i) => (
              <span key={i} className={on ? "bg-zinc-900" : "bg-transparent"} />
            ))}
          </div>
          <p className="mt-1 text-center font-mono text-[7.5px] text-zinc-600">QR · {link.id}</p>
        </div>
      </div>

      {/* Лог: что жертвы делают на странице прямо сейчас */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 pb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
          Что происходит на странице
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {link.events.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-1.5 border-b border-zinc-900 py-[3px]"
            >
              <MousePointerClick
                className={cx("h-2.5 w-2.5 shrink-0", EVENT_TONE[e.kind])}
                strokeWidth={2}
              />
              <span className={cx("min-w-0 flex-1 truncate text-[10px]", EVENT_TONE[e.kind])}>
                {e.text}
              </span>
              <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-700">
                {e.agoSec < 60 ? `${e.agoSec} сек` : `${Math.floor(e.agoSec / 60)} мин`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-[8.5px] tracking-[0.12em] text-zinc-600 uppercase">
        {label}
      </span>
      <span className={cx("tnum font-mono text-[13px] leading-none", tone)}>
        {groupDigits(value)}
      </span>
    </div>
  );
}
