"use client";

import { useMemo } from "react";
import { Crown } from "lucide-react";
import { type Agent } from "@/lib/fixtures/agents";
import { usd } from "@/lib/format";
import { drift } from "@/components/shared/LiveNumber";
import { selectSigWhale, useSceneValue, useTick } from "@/lib/scene/SceneProvider";
import { cx } from "@/components/shared/ui";

/**
 * Лидерборд операторов.
 *
 * Суммы плавают, поэтому места реально меняются местами прямо в кадре —
 * это то, ради чего такой экран вешают на стену в подобных конторах.
 */
export function Leaderboard({ agents }: { agents: Agent[] }) {
  const tick = useTick();
  const whale = useSceneValue(selectSigWhale);

  const rows = useMemo(
    () =>
      agents
        .map((a) => ({
          ...a,
          // Ctrl+Alt+4 добавляет крупную сумму — таблица заметно перестраивается в кадре
          live:
            drift(a.today, tick, 2600, `lb-${a.seat}`) + (whale > 0 && a.seat === 3 ? 96_000 : 0),
        }))
        // Сортировка именно по «живой» сумме, иначе места не совпадают с цифрами
        .sort((a, b) => b.live - a.live)
        .slice(0, 10),
    [agents, tick, whale],
  );

  const top = rows[0]?.live ?? 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[3px] overflow-hidden p-2">
      {rows.map((a, i) => (
        <div
          key={a.seat}
          className={cx(
            // flex-1 растягивает десять строк на всю высоту панели: на стене
            // не должно оставаться пустой трети экрана
            "relative flex flex-1 items-center gap-2.5 overflow-hidden rounded-[3px] border px-2.5 transition-all duration-500",
            i === 0
              ? "border-amber-600/50 bg-amber-500/10"
              : i < 3
                ? "border-zinc-700/60 bg-zinc-800/30"
                : "border-transparent bg-zinc-900/30",
          )}
        >
          {/* Полоса-заливка по доле от лидера. Градиент, а не сплошная плашка:
              резкий край на тёмном фоне читается в кадре как артефакт */}
          <div
            className={cx(
              "absolute inset-y-0 left-0 bg-gradient-to-r to-transparent transition-[width] duration-700",
              i === 0 ? "from-amber-500/20" : "from-emerald-500/12",
            )}
            style={{ width: `${(a.live / top) * 100}%` }}
          />

          <span
            className={cx(
              "tnum relative z-10 w-6 shrink-0 text-center font-mono text-[15px] font-bold",
              i === 0 ? "text-amber-300" : i < 3 ? "text-zinc-300" : "text-zinc-600",
            )}
          >
            {i + 1}
          </span>

          {i === 0 && <Crown className="relative z-10 h-4 w-4 shrink-0 text-amber-400" />}

          <div className="relative z-10 min-w-0 flex-1">
            <p className="truncate text-[14px] leading-tight text-zinc-100">{a.alias}</p>
            <p className="truncate font-mono text-[9.5px] tracking-wide text-zinc-500">
              {a.desk} · {a.calls} звонков
            </p>
          </div>

          <span
            className={cx(
              "tnum relative z-10 shrink-0 font-mono text-[17px] font-semibold",
              i === 0 ? "text-amber-300" : "text-emerald-300",
            )}
          >
            {usd(a.live)}
          </span>
        </div>
      ))}
    </div>
  );
}
