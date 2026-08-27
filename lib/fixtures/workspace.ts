import { Rng, seatRng } from "@/lib/prng";
import { DESKS } from "@/lib/brand";
import { AGENT_ALIASES, AGENT_REAL } from "./pools";
import { makeLeads, type Lead } from "./leads";
import { makeAsanLead, makeKunduzLead } from "./cast";
import { makeAgents, type Agent } from "./agents";

export type Workspace = {
  seat: number;
  /** Псевдоним, под которым оператор звонит */
  alias: string;
  real: string;
  desk: string;
  deskShort: string;
  extension: string;
  leads: Lead[];
  /** Коллеги — для лидерборда и админки */
  floor: Agent[];
  /** План смены и факт */
  target: number;
  done: number;
  shiftStartedMin: number;
};

/**
 * Всё содержимое одного рабочего места.
 *
 * Каждая из 10 машин на площадке запускается со своим ?seat=N и получает
 * свои имена, лиды и суммы. Иначе в общем плане видно 10 одинаковых экранов
 * и сцена сразу читается как декорация.
 */
export function buildWorkspace(seat: number): Workspace {
  const rng = seatRng(seat, "workspace");
  const desk = DESKS[(seat - 1) % DESKS.length];

  return {
    seat,
    alias: AGENT_ALIASES[(seat * 3 + 1) % AGENT_ALIASES.length],
    real: AGENT_REAL[(seat * 5 + 2) % AGENT_REAL.length],
    desk: desk.label,
    deskShort: desk.short,
    extension: `${1000 + seat * 7}`,
    // 140 строк — чтобы таблица гарантированно уходила за нижний край экрана.
    // Наполовину пустой список сразу читается в кадре как макет.
    // Сценарные лиды — со второй строки, а не с первой: экран открывается
    // на leads[0], и первыми они держали бы одну карточку на всех машинах.
    leads: withCast(makeLeads(seatRng(seat, "leads"), 140)),
    floor: makeAgents(seatRng(seat, "floor"), 12),
    target: rng.pick([18_000, 20_000, 24_000, 30_000]),
    done: rng.money(4_000, 17_000),
    shiftStartedMin: rng.int(180, 400),
  };
}

/** Вставка сценарных лидов со второй строки — см. комментарий в buildWorkspace */
function withCast(leads: Lead[]): Lead[] {
  return [leads[0], makeAsanLead(), makeKunduzLead(), ...leads.slice(1)];
}

/** Очереди на левой панели — считаются из реальных статусов, а не выдуманы */
export function buildQueues(leads: Lead[]) {
  const by = (fn: (l: Lead) => boolean) => leads.filter(fn).length;
  return [
    { id: "all", label: "Все лиды", count: leads.length, tone: "text-zinc-400" },
    { id: "new", label: "Свежие", count: by((l) => l.status === "new"), tone: "text-sky-300" },
    { id: "hot", label: "Дожим", count: by((l) => l.status === "hot"), tone: "text-amber-300" },
    {
      id: "deposited",
      label: "С депозитом",
      count: by((l) => l.status === "deposited"),
      tone: "text-emerald-300",
    },
    { id: "whale", label: "VIP · киты", count: by((l) => l.status === "whale"), tone: "text-fuchsia-300" },
    { id: "refused", label: "Отказники", count: by((l) => l.status === "refused"), tone: "text-rose-400" },
    {
      id: "noanswer",
      label: "Не отвечают",
      count: by((l) => l.status === "noanswer"),
      tone: "text-zinc-500",
    },
    {
      id: "withdraw",
      label: "Заявки на вывод",
      count: by((l) => l.withdrawBlocked > 0),
      tone: "text-amber-400",
    },
  ] as const;
}

export type QueueId = ReturnType<typeof buildQueues>[number]["id"];

export function filterLeads(leads: Lead[], queue: QueueId): Lead[] {
  switch (queue) {
    case "all":
      return leads;
    case "withdraw":
      return leads.filter((l) => l.withdrawBlocked > 0);
    default:
      return leads.filter((l) => l.status === queue);
  }
}

/** Почасовая выручка для столбиков на стене */
export function hourlyRevenue(rng: Rng, hours = 12): number[] {
  return Array.from({ length: hours }, (_, i) => {
    // Пик приходится на европейский вечер — так работают реальные центры
    const shape = Math.sin(((i + 1) / (hours + 1)) * Math.PI) ** 0.7;
    return Math.round(rng.range(0.55, 1.35) * shape * 34_000);
  });
}
