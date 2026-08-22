import { Rng } from "@/lib/prng";
import { DESKS } from "@/lib/brand";
import { AGENT_ALIASES, AGENT_REAL, COUNTRIES } from "./pools";

const DESK_LABELS = DESKS.map((d) => d.label);

export type AgentState = "call" | "dialing" | "idle" | "break" | "offline";

export const AGENT_STATE_META: Record<AgentState, { label: string; text: string; dot: string }> = {
  call: { label: "В РАЗГОВОРЕ", text: "text-emerald-300", dot: "bg-emerald-400" },
  dialing: { label: "НАБОР", text: "text-sky-300", dot: "bg-sky-400" },
  idle: { label: "ОЖИДАНИЕ", text: "text-amber-300", dot: "bg-amber-400" },
  break: { label: "ПЕРЕРЫВ", text: "text-zinc-400", dot: "bg-zinc-500" },
  offline: { label: "НЕ В СЕТИ", text: "text-zinc-600", dot: "bg-zinc-700" },
};

export type Agent = {
  seat: number;
  alias: string;
  real: string;
  desk: string;
  state: AgentState;
  /** Секунд в текущем состоянии — таймер тикает от этого значения */
  stateSince: number;
  today: number;
  month: number;
  calls: number;
  talkMin: number;
  conversion: number;
  /** Страна текущего собеседника */
  onCallWith: string;
  onCallFlag: string;
};

export function makeAgents(rng: Rng, count: number): Agent[] {
  const aliases = rng.sample(AGENT_ALIASES, count);
  const reals = rng.sample(AGENT_REAL, count);

  return Array.from({ length: count }, (_, i) => {
    const state = rng.weighted<AgentState>([
      ["call", 46],
      ["dialing", 20],
      ["idle", 16],
      ["break", 12],
      ["offline", 6],
    ]);
    const country = rng.pick(COUNTRIES);
    return {
      seat: i + 1,
      alias: aliases[i],
      real: reals[i],
      desk: rng.pick(DESK_LABELS),
      state,
      stateSince: state === "call" ? rng.int(20, 1400) : rng.int(5, 400),
      today: rng.money(0, 26_000),
      month: rng.money(40_000, 480_000),
      calls: rng.int(18, 132),
      talkMin: rng.int(40, 380),
      conversion: rng.range(0.04, 0.31),
      onCallWith: `${rng.pick(country.first)} ${rng.pick(country.last)}`,
      onCallFlag: country.flag,
    };
  });
}

