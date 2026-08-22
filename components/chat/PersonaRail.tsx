"use client";

import { PERSONA_STATUS_META, type Persona } from "@/lib/fixtures/personas";
import { CHANNEL_META } from "@/lib/fixtures/threads";
import { Meter, cx } from "@/components/shared/ui";
import type { BlastStats } from "@/lib/fixtures/chatdesk";
import { BRAND } from "@/lib/brand";
import { groupDigits } from "@/lib/format";

/**
 * Личины оператора. Переключение личины — самый читаемый жест на экране:
 * актёру достаточно ткнуть в другую карточку, и в кадре меняется, «кем»
 * он пишет жертве.
 */
export function PersonaRail({
  personas,
  activeId,
  bannedId,
  onSelect,
  blast,
}: {
  personas: Persona[];
  activeId: string;
  bannedId: string | null;
  onSelect: (id: string) => void;
  blast: BlastStats;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="shrink-0 px-2.5 pt-2 pb-1 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
        Личины · аккаунты
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1">
        {personas.map((p) => {
          const banned = p.status === "banned" || p.id === bannedId;
          const meta = PERSONA_STATUS_META[banned ? "banned" : p.status];
          const ch = CHANNEL_META[p.channel];
          const active = p.id === activeId;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cx(
                "mb-1 w-full rounded-[3px] border px-1.5 py-1.5 text-left transition-colors",
                banned
                  ? "border-rose-800/60 bg-rose-950/30"
                  : active
                    ? "border-cyan-600/60 bg-cyan-500/10"
                    : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold",
                    banned ? "bg-rose-950 text-rose-400" : "bg-zinc-800 text-zinc-300",
                  )}
                >
                  {p.initials}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="flex items-center gap-1">
                    <span
                      className={cx(
                        "truncate text-[11.5px]",
                        banned ? "text-zinc-500 line-through" : "text-zinc-200",
                      )}
                    >
                      {p.handle}
                    </span>
                    <span className={cx("shrink-0 font-mono text-[8px]", ch.text)}>
                      {ch.short}
                    </span>
                  </span>
                  <span className="block truncate font-mono text-[8.5px] text-zinc-600">
                    {p.legend}
                  </span>
                </span>
                <span
                  className={cx(
                    "shrink-0 rounded-[2px] border px-1 py-[1px] font-mono text-[7.5px] font-semibold tracking-[0.06em] uppercase",
                    meta.bg,
                    meta.border,
                    meta.text,
                  )}
                >
                  {meta.label}
                </span>
              </div>

              {/* Прогрев и риск бана — два числа, по которым личину и выбирают */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex-1">
                  <Meter
                    value={banned ? 0 : p.warmth}
                    className={banned ? "bg-zinc-700" : "bg-cyan-500"}
                  />
                </span>
                <span className="tnum shrink-0 font-mono text-[8.5px] text-zinc-600">
                  {p.ageDays} дн
                </span>
                <span
                  className={cx(
                    "tnum shrink-0 font-mono text-[8.5px]",
                    p.banRisk > 70
                      ? "text-rose-400"
                      : p.banRisk > 45
                        ? "text-amber-300"
                        : "text-zinc-500",
                  )}
                >
                  риск {p.banRisk}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Масштаб рассылки: цифра, ради которой всё это и делается */}
      <div className="shrink-0 border-t border-zinc-900 px-2.5 py-1.5">
        <p className="mb-1 font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
          Рассылка · {BRAND.blast.name}
        </p>
        <div className="flex items-baseline justify-between font-mono">
          <span className="tnum text-[15px] leading-none font-semibold text-zinc-200">
            {groupDigits(blast.sent)}
          </span>
          <span className="tnum text-[10px] text-cyan-300">
            ответ {groupDigits(blast.replied)}
          </span>
          <span className="tnum text-[10px] text-emerald-300">{blast.convPct}%</span>
        </div>
        <div className="mt-1">
          {blast.templates.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5 py-[1px]">
              <span className="min-w-0 flex-1 truncate text-[9.5px] text-zinc-500">
                {t.label}
              </span>
              <span className="tnum shrink-0 font-mono text-[9px] text-zinc-600">
                {groupDigits(t.sent)}
              </span>
              <span className="tnum shrink-0 font-mono text-[9px] text-cyan-400">
                {t.reply}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
