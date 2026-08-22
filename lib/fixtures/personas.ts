import { Rng } from "@/lib/prng";
import { maskPhone } from "@/lib/format";
import type { StatusMeta } from "./leads";
import type { ChatChannel } from "./threads";
import {
  HANDLE_WORDS,
  PERSONA_LEGENDS,
  PROXY_NODES,
  pickLocalCountry,
  pickName,
} from "./pools";

/**
 * Личина — фейковый аккаунт, под которым чатер пишет жертве.
 *
 * Личина живёт недолго: аккаунт банят, номер сгорает, и всё, что на нём
 * висело, обрывается на полуслове. Поэтому в кадре важны три числа —
 * возраст аккаунта, прогрев и риск бана.
 */
export type PersonaStatus = "live" | "warming" | "flagged" | "banned";

export const PERSONA_STATUS_META: Record<PersonaStatus, StatusMeta> = {
  live: {
    label: "В РАБОТЕ",
    text: "text-cyan-300",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    dot: "bg-cyan-400",
  },
  warming: {
    label: "ПРОГРЕВ",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  flagged: {
    label: "ЖАЛОБЫ",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  banned: {
    label: "БАН",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    dot: "bg-rose-500",
  },
};

export type Persona = {
  id: string;
  /** Имя, которое видит жертва */
  name: string;
  initials: string;
  handle: string;
  channel: ChatChannel;
  legend: string;
  /** Возраст аккаунта в днях: старый банят реже, и он дороже */
  ageDays: number;
  /** Прогрев 0..100 — сколько «живой» активности накручено */
  warmth: number;
  /** Риск бана 0..100 */
  banRisk: number;
  activeThreads: number;
  sim: string;
  proxy: string;
  status: PersonaStatus;
};

/**
 * Шесть личин на рабочее место — столько влезает в левую колонку без скролла
 * до края. Первая всегда рабочая: с неё оператор пишет прямо сейчас.
 */
export function makePersonas(rng: Rng, count: number): Persona[] {
  return Array.from({ length: count }, (_, i) => {
    const country = pickLocalCountry(rng);
    const full = pickName(rng, country);
    const [first, last] = full.split(" ");

    const status: PersonaStatus =
      i === 0
        ? "live"
        : rng.weighted<PersonaStatus>([
            ["live", 34],
            ["warming", 30],
            ["flagged", 22],
            ["banned", 14],
          ]);

    const ageDays =
      status === "warming" ? rng.int(1, 9) : rng.int(12, 240);

    const banRisk =
      status === "banned"
        ? rng.int(92, 100)
        : status === "flagged"
          ? rng.int(58, 88)
          : status === "warming"
            ? rng.int(24, 52)
            : rng.int(6, 38);

    return {
      id: `AC-${1000 + i * 37 + rng.int(1, 30)}`,
      name: first,
      initials: `${first[0]}${last[0]}`,
      handle: `@${rng.pick(HANDLE_WORDS)}_${rng.int(70, 99)}`,
      channel: rng.weighted<ChatChannel>([
        ["whatsapp", 44],
        ["telegram", 38],
        ["instagram", 18],
      ]),
      legend: rng.pick(PERSONA_LEGENDS),
      ageDays,
      // Прогрев падает вместе с возрастом: свежий аккаунт ещё «пустой»
      warmth:
        status === "banned"
          ? rng.int(0, 12)
          : Math.min(98, rng.int(30, 74) + Math.min(24, ageDays)),
      banRisk,
      activeThreads: status === "banned" ? 0 : rng.int(3, 17),
      sim: maskPhone(country.cc, country.dial + rng.int(100000, 999999)),
      proxy: rng.pick(PROXY_NODES),
      status,
    };
  });
}

/** Сколько личин ушло в бан за смену — строка под рейкой личин */
export function bannedToday(personas: Persona[]): number {
  return personas.filter((p) => p.status === "banned").length;
}
