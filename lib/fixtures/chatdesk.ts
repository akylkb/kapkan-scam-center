import { seatRng, type Rng } from "@/lib/prng";
import { BRAND, CHAT_POOLS } from "@/lib/brand";
import {
  AGENT_ALIASES,
  AGENT_REAL,
  BLAST_TEMPLATES,
  OTP_PURPOSES,
  PHISH_TEMPLATES,
  PROXY_NODES,
} from "./pools";
import { makePersonas, type Persona } from "./personas";
import { makeThreads, type Scheme, type Thread } from "./threads";
import { makeAsanThread, makeAzharThread, makeKunduzThread, makeMamaThread } from "./cast";

/** Событие в логе фишинговой ссылки */
export type LinkEvent = {
  id: string;
  agoSec: number;
  kind: "open" | "form" | "card" | "sms" | "drop";
  text: string;
};

/**
 * Фишинговая ссылка — страница-клон, на которую чатер уводит жертву.
 * Косит под вымышленные бренды из lib/brand.ts: настоящих доменов
 * в кадре нет ни на стоп-кадре, ни в логе.
 */
export type PhishLink = {
  id: string;
  template: (typeof PHISH_TEMPLATES)[number]["id"];
  label: string;
  domain: string;
  url: string;
  clicks: number;
  entered: number;
  dropped: number;
  events: LinkEvent[];
};

/** Перехваченный SMS-код «от банка» */
export type OtpCode = {
  id: string;
  agoSec: number;
  issuer: string;
  code: string;
  purpose: string;
  amount: number;
  /** Кому диктовали код */
  usedFor: string;
};

export type BlastStats = {
  sent: number;
  replied: number;
  convPct: number;
  templates: { label: string; sent: number; reply: number }[];
};

export type ChatDesk = {
  seat: number;
  alias: string;
  real: string;
  pool: string;
  poolShort: string;
  /** Схема, под которую заточено это рабочее место */
  bias: Scheme;
  terminal: string;
  proxy: string;
  personas: Persona[];
  threads: Thread[];
  link: PhishLink;
  otp: OtpCode[];
  blast: BlastStats;
  /** План по деньгам за смену и факт */
  target: number;
  done: number;
};

/** Пул рабочего места → на какую схему перекошен список диалогов */
const POOL_SCHEME: Record<string, Scheme> = {
  goods: "goods",
  delivery: "delivery",
  bank: "delivery",
  romance: "romance",
  crypto: "crypto",
};

function makeLink(rng: Rng, template: (typeof PHISH_TEMPLATES)[number]): PhishLink {
  const clicks = rng.int(120, 940);
  const entered = Math.round(clicks * rng.range(0.06, 0.19));

  const host =
    template.id === "bank"
      ? BRAND.bankfake.domain
      : template.id === "track"
        ? BRAND.delivery.domain
        : template.id === "exchange"
          ? BRAND.exchange.domain
          : BRAND.market.domain;

  const events: LinkEvent[] = [];
  let ago = rng.int(4, 40);
  for (let i = 0; i < 14; i++) {
    const kind = rng.weighted<LinkEvent["kind"]>([
      ["open", 34],
      ["form", 24],
      ["card", 18],
      ["sms", 14],
      ["drop", 10],
    ]);
    events.push({
      id: `LE-${rng.int(100000, 999999)}`,
      agoSec: ago,
      kind,
      text: LINK_EVENT_TEXT[kind],
    });
    ago += rng.int(12, 260);
  }

  return {
    id: `LN-${rng.int(1000, 9999)}`,
    template: template.id,
    label: template.label,
    domain: host,
    // Короткая ссылка: длинный адрес в кадре не читается
    url: `${template.host}.${BRAND.phish.name.toLowerCase()}-${rng.int(100, 999)}.link`,
    clicks,
    entered,
    dropped: clicks - entered - rng.int(10, 60),
    events,
  };
}

const LINK_EVENT_TEXT: Record<LinkEvent["kind"], string> = {
  open: "страница открыта · мобильный браузер",
  form: "начат ввод формы",
  card: "введены данные карты",
  sms: "запрошен код подтверждения",
  drop: "уход со страницы без ввода",
};

function makeOtp(rng: Rng, count: number): OtpCode[] {
  const out: OtpCode[] = [];
  let ago = rng.int(6, 50);
  for (let i = 0; i < count; i++) {
    out.push({
      id: `SM-${rng.int(100000, 999999)}`,
      agoSec: ago,
      issuer: rng.chance(0.72) ? BRAND.bankfake.short : BRAND.psp.name,
      code: String(rng.int(1000, 9999)),
      purpose: rng.pick(OTP_PURPOSES),
      amount: rng.money(60, 4_800),
      usedFor: `TH-${rng.int(4000, 4130)}`,
    });
    ago += rng.int(20, 400);
  }
  return out;
}

/**
 * Всё содержимое рабочего места чатера.
 *
 * Как у оператора и дроповода, содержимое завязано на ?seat=N: десять машин
 * показывают разные схемы, личины и суммы, но каждая воспроизводит их
 * одинаково в каждом дубле.
 */
export function buildChatDesk(seat: number): ChatDesk {
  const rng = seatRng(seat, "chatdesk");
  const pool = CHAT_POOLS[(seat - 1) % CHAT_POOLS.length];
  const bias = POOL_SCHEME[pool.id];

  const personas = makePersonas(seatRng(seat, "personas"), 6);

  // 42 диалога — список гарантированно уходит за нижний край.
  // Наполовину пустая колонка в кадре читается как макет.
  // Сценарные диалоги стоят первыми строками на всех местах: их играют
  // по имени, и они должны открываться в один клик с любой машины.
  const threads = [
    makeMamaThread(personas),
    makeAzharThread(personas),
    makeAsanThread(personas),
    makeKunduzThread(personas),
    ...makeThreads(seatRng(seat, "threads"), personas, 42, bias),
  ];

  const phishRng = seatRng(seat, "phish");
  const template = PHISH_TEMPLATES[(seat - 1) % PHISH_TEMPLATES.length];

  const blastRng = seatRng(seat, "blast");
  const sent = blastRng.int(6_400, 21_000);
  const replied = Math.round(sent * blastRng.range(0.014, 0.041));

  return {
    seat,
    alias: AGENT_ALIASES[(seat * 5 + 2) % AGENT_ALIASES.length],
    real: AGENT_REAL[(seat * 3 + 6) % AGENT_REAL.length],
    pool: pool.label,
    poolShort: pool.short,
    bias,
    terminal: `MP-${1400 + seat * 17}`,
    proxy: PROXY_NODES[(seat - 1) % PROXY_NODES.length],
    personas,
    threads,
    link: makeLink(phishRng, template),
    otp: makeOtp(seatRng(seat, "otp"), 14),
    blast: {
      sent,
      replied,
      convPct: Math.round((replied / sent) * 1000) / 10,
      templates: BLAST_TEMPLATES.slice(0, 3).map((label) => {
        const s = blastRng.int(900, 7_400);
        return { label, sent: s, reply: Math.round(s * blastRng.range(0.01, 0.05)) };
      }),
    },
    target: rng.pick([18_000, 24_000, 32_000, 46_000]),
    done: rng.money(6_000, 19_000),
  };
}

/**
 * Диалог, на котором экран открывается в начале дубля.
 *
 * Первый кадр должен быть полным, поэтому берём диалог, уже дошедший до денег,
 * а не свежее «здравствуйте, товар актуален?». «Слив» режиссёр включает сам,
 * когда он нужен по сцене, — сорвавшиеся диалоги сюда не попадают.
 *
 * Живёт здесь, а не в ChatScreen, потому что телефон жертвы должен открыться
 * ровно на том же диалоге: до первого сообщения от чатера ему не от чего
 * отталкиваться, кроме номера места.
 */
export function openingThreadId(desk: ChatDesk, seat: number): string {
  const rich = desk.threads.filter(
    (t) => t.stage >= 3 && t.status !== "dead" && t.status !== "suspicious",
  );
  // Предпочитаем схему своего пула и смещаем выбор по номеру места:
  // иначе десять машин открываются на одинаковой реплике
  const own = rich.filter((t) => t.scheme === desk.bias);
  const pool = own.length > 0 ? own : rich;
  if (pool.length === 0) return desk.threads[0].id;
  return pool[(seat - 1) % pool.length].id;
}

/**
 * Фильтры слева. Счётчики считаются из реальных статусов, а не выдуманы —
 * иначе на крупном плане цифра в фильтре не сойдётся с длиной списка.
 */
export function buildChatQueues(threads: Thread[]) {
  const by = (fn: (t: Thread) => boolean) => threads.filter(fn).length;
  return [
    { id: "all", label: "Все диалоги", count: threads.length, tone: "text-zinc-400" },
    { id: "unread", label: "Непрочитанные", count: by((t) => t.unread > 0), tone: "text-cyan-300" },
    { id: "fresh", label: "Новые", count: by((t) => t.status === "fresh"), tone: "text-sky-300" },
    { id: "talking", label: "В переписке", count: by((t) => t.status === "talking"), tone: "text-cyan-300" },
    { id: "hot", label: "Готовы платить", count: by((t) => t.status === "hot"), tone: "text-amber-300" },
    { id: "link", label: "Ссылка открыта", count: by((t) => t.stage >= 3), tone: "text-fuchsia-300" },
    { id: "paid", label: "Оплатили", count: by((t) => t.status === "paid"), tone: "text-emerald-300" },
    { id: "suspicious", label: "Заподозрили", count: by((t) => t.status === "suspicious"), tone: "text-rose-400" },
    { id: "dead", label: "Молчат", count: by((t) => t.status === "dead"), tone: "text-zinc-500" },
  ] as const;
}

export type ChatQueueId = ReturnType<typeof buildChatQueues>[number]["id"];

export function filterThreads(threads: Thread[], queue: ChatQueueId): Thread[] {
  switch (queue) {
    case "all":
      return threads;
    case "unread":
      return threads.filter((t) => t.unread > 0);
    case "link":
      return threads.filter((t) => t.stage >= 3);
    default:
      return threads.filter((t) => t.status === queue);
  }
}

/** Каналы связи отдельным блоком: по ним фильтруют так же часто, как по статусу */
export function buildChannelCounts(threads: Thread[]) {
  return [
    { id: "whatsapp", label: "WhatsApp", count: threads.filter((t) => t.channel === "whatsapp").length },
    { id: "telegram", label: "Telegram", count: threads.filter((t) => t.channel === "telegram").length },
    { id: "instagram", label: "Instagram", count: threads.filter((t) => t.channel === "instagram").length },
  ] as const;
}
