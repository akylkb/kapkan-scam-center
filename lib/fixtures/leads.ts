import { Rng } from "@/lib/prng";
import { maskPhone } from "@/lib/format";
import {
  AGENT_ALIASES,
  COUNTRIES,
  LEAD_NOTES,
  type Country,
} from "./pools";

export type LeadStatus =
  | "new"
  | "hot"
  | "deposited"
  | "whale"
  | "refused"
  | "noanswer";

export type StatusMeta = {
  label: string;
  /** Tailwind-классы: текст, фон, рамка. Цвета из палитры CLAUDE.md */
  text: string;
  bg: string;
  border: string;
  dot: string;
};

export const STATUS_META: Record<LeadStatus, StatusMeta> = {
  new: {
    label: "НОВЫЙ",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  hot: {
    label: "ГОТОВ К ОТЖИМУ",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  deposited: {
    label: "ДЕПОЗИТ",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  whale: {
    label: "VIP · КИТ",
    text: "text-fuchsia-300",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    dot: "bg-fuchsia-400",
  },
  refused: {
    label: "ОТКАЗНИК",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    dot: "bg-rose-500",
  },
  noanswer: {
    label: "НЕ ОТВЕЧАЕТ",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-600/40",
    dot: "bg-zinc-500",
  },
};

export type CallRecord = {
  id: string;
  agoMin: number;
  durationSec: number;
  agent: string;
  outcome: string;
  recorded: boolean;
};

export type Transaction = {
  id: string;
  agoMin: number;
  kind: "deposit" | "bonus" | "adjust" | "withdraw_req" | "withdraw_rej" | "fee";
  amount: number;
  method: string;
  status: "OK" | "PENDING" | "REJECTED" | "MANUAL";
};

export type Lead = {
  id: string;
  name: string;
  country: Country;
  age: number;
  phone: string;
  /** Оценка «сколько с него можно взять» */
  netWorth: number;
  deposit: number;
  status: LeadStatus;
  agent: string;
  lastContactMin: number;
  /** 0..100 — полоска «температуры» в таблице */
  temperature: number;
  online: boolean;
  note: string;
  city: string;
  bank: string;
  experience: string;
  marital: string;
  occupation: string;
  tier: "Beginner" | "Silver" | "Gold" | "Platinum";
  ip: string;
  calls: CallRecord[];
  transactions: Transaction[];
  /** Сколько раз клиенту уже отказали в выводе */
  withdrawBlocked: number;
};

const OCCUPATIONS = [
  "пенсионер", "врач", "инженер", "предприниматель", "водитель",
  "учитель", "фермер", "юрист", "бухгалтер", "прораб",
  "владелец кафе", "механик", "медсестра", "риелтор", "отставной военный",
];

const EXPERIENCE = ["нет", "нет", "нет", "минимальный", "крипта 2021", "акции, 2 года"];
const MARITAL = ["женат", "замужем", "вдовец", "вдова", "разведён", "разведена", "холост"];
const METHODS = ["VISA ****4821", "MC ****9017", "SEPA перевод", "USDT TRC-20", "PayNordic", "Wire · SWIFT"];
const OUTCOMES = [
  "депозит получен", "перезвонить", "не отвечает", "думает",
  "отказ", "запросил документы", "передан в ретеншн", "сброс",
  "согласие на апгрейд", "требует вывод",
];

function buildCalls(rng: Rng, lead: Pick<Lead, "agent">): CallRecord[] {
  const count = rng.int(2, 9);
  const calls: CallRecord[] = [];
  let ago = rng.int(4, 90);
  for (let i = 0; i < count; i++) {
    calls.push({
      id: `CL-${rng.int(100000, 999999)}`,
      agoMin: ago,
      durationSec: rng.weighted([
        [rng.int(8, 40), 3],
        [rng.int(60, 400), 5],
        [rng.int(400, 1900), 2],
      ]),
      agent: rng.chance(0.7) ? lead.agent : rng.pick(AGENT_ALIASES),
      outcome: rng.pick(OUTCOMES),
      recorded: rng.chance(0.92),
    });
    ago += rng.int(90, 3600);
  }
  return calls;
}

function buildTransactions(rng: Rng, deposit: number, status: LeadStatus): Transaction[] {
  if (deposit <= 0) return [];
  const txs: Transaction[] = [];
  let remaining = deposit;
  let ago = rng.int(60, 400);

  // Первый заход почти всегда «пробный» — как в реальных схемах
  const first = Math.min(remaining, rng.pick([250, 250, 250, 300, 500]));
  txs.push({
    id: `TX-${rng.int(100000, 999999)}`,
    agoMin: ago + rng.int(2000, 40000),
    kind: "deposit",
    amount: first,
    method: rng.pick(METHODS),
    status: "OK",
  });
  remaining -= first;

  while (remaining > 100 && txs.length < 7) {
    const part = Math.min(remaining, rng.money(400, Math.max(600, remaining)));
    txs.push({
      id: `TX-${rng.int(100000, 999999)}`,
      agoMin: ago,
      kind: rng.chance(0.15) ? "bonus" : "deposit",
      amount: part,
      method: rng.pick(METHODS),
      status: rng.chance(0.88) ? "OK" : "PENDING",
    });
    remaining -= part;
    ago = Math.max(5, ago - rng.int(300, 4000));
  }

  if (status === "whale" || rng.chance(0.35)) {
    txs.push({
      id: `TX-${rng.int(100000, 999999)}`,
      agoMin: rng.int(10, 300),
      kind: "withdraw_req",
      amount: rng.money(1000, Math.max(2000, deposit * 0.4)),
      method: "SEPA перевод",
      status: "REJECTED",
    });
  }

  return txs.sort((a, b) => a.agoMin - b.agoMin);
}

function buildIp(rng: Rng): string {
  return `${rng.int(31, 213)}.${rng.int(2, 254)}.${rng.int(2, 254)}.${rng.int(2, 254)}`;
}

/** Один лид. `index` входит в id, чтобы карточки не совпадали между машинами. */
export function makeLead(rng: Rng, index: number): Lead {
  const country = rng.pick(COUNTRIES);
  const name = `${rng.pick(country.first)} ${rng.pick(country.last)}`;

  const status = rng.weighted<LeadStatus>([
    ["hot", 22],
    ["deposited", 26],
    ["noanswer", 16],
    ["refused", 13],
    ["new", 15],
    ["whale", 8],
  ]);

  const netWorth = rng.weighted([
    [rng.money(18_000, 90_000), 45],
    [rng.money(90_000, 320_000), 35],
    [rng.money(320_000, 1_400_000), 20],
  ]);

  const deposit =
    status === "whale"
      ? rng.money(48_000, Math.max(90_000, netWorth * 0.55))
      : status === "deposited"
        ? rng.money(1_200, Math.max(3_000, netWorth * 0.14))
        : status === "hot"
          ? rng.chance(0.55)
            ? rng.money(250, 3_000)
            : 0
          : status === "refused"
            ? rng.chance(0.3)
              ? rng.money(250, 1_500)
              : 0
            : 0;

  const tier =
    deposit > 40_000 ? "Platinum" : deposit > 9_000 ? "Gold" : deposit > 900 ? "Silver" : "Beginner";

  const temperature =
    status === "whale" ? rng.int(82, 99)
      : status === "hot" ? rng.int(64, 93)
        : status === "deposited" ? rng.int(45, 80)
          : status === "new" ? rng.int(28, 60)
            : status === "noanswer" ? rng.int(8, 34)
              : rng.int(2, 20);

  const agent = rng.pick(AGENT_ALIASES);
  const lead: Lead = {
    id: `LD-${(48_000 + index * 7 + rng.int(1, 6)).toString()}`,
    name,
    country,
    age: rng.weighted([
      [rng.int(52, 78), 55],
      [rng.int(38, 52), 30],
      [rng.int(26, 38), 15],
    ]),
    // Абонентская часть добивается до 9–10 цифр, как в реальных номерах
    phone: maskPhone(
      country.cc,
      country.dial + rng.int(10 ** Math.max(2, 8 - country.dial.length), 10 ** Math.max(3, 9 - country.dial.length) - 1),
    ),
    netWorth,
    deposit,
    status,
    agent,
    lastContactMin: rng.weighted([
      [rng.int(1, 55), 40],
      [rng.int(60, 900), 40],
      [rng.int(1000, 9000), 20],
    ]),
    temperature,
    online: rng.chance(status === "whale" || status === "deposited" ? 0.42 : 0.16),
    note: rng.pick(LEAD_NOTES),
    city: rng.pick(country.cities),
    bank: rng.pick(country.banks),
    experience: rng.pick(EXPERIENCE),
    marital: rng.pick(MARITAL),
    occupation: rng.pick(OCCUPATIONS),
    tier,
    ip: buildIp(rng),
    calls: [],
    transactions: buildTransactions(rng, deposit, status),
    withdrawBlocked: status === "whale" ? rng.int(1, 4) : rng.chance(0.3) ? rng.int(1, 2) : 0,
  };
  lead.calls = buildCalls(rng, lead);
  return lead;
}

/** Пул лидов для одного рабочего места */
export function makeLeads(rng: Rng, count: number): Lead[] {
  return Array.from({ length: count }, (_, i) => makeLead(rng, i));
}
