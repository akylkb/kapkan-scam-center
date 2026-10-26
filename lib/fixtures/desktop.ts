import { seatRng, type Rng } from "@/lib/prng";
import { maskCard, maskPhone } from "@/lib/format";
import {
  DROP_ALIASES,
  HANDLE_WORDS,
  pickLocalCountry,
  pickName,
  type Country,
} from "./pools";

/**
 * Рабочий стол оператора (/desk): несколько окон разом — банк-клиент,
 * таблица с базой, WhatsApp Web, Telegram. Декорация общего плана, где по
 * экрану за спиной актёра видно весь «кухонный» набор конторы сразу.
 *
 * Содержимое детерминировано по номеру места (seatRng), Math.random() нет.
 */

export type BankAccount = {
  id: string;
  holder: string;
  bank: string;
  card: string;
  balance: number;
  /** Движение за сегодня, со знаком */
  delta: number;
};

export type Transfer = {
  id: string;
  dir: "in" | "out";
  counterparty: string;
  amount: number;
  agoMin: number;
  status: "ok" | "hold" | "fail";
};

export type SheetRow = {
  name: string;
  phone: string;
  city: string;
  bank: string;
  amount: number;
  status: string;
};

export type ChatItem = {
  id: string;
  name: string;
  preview: string;
  agoMin: number;
  unread: number;
  online: boolean;
};

export type Desktop = {
  seat: number;
  accounts: BankAccount[];
  transfers: Transfer[];
  sheet: SheetRow[];
  wa: ChatItem[];
  tg: ChatItem[];
};

const SHEET_STATUS = ["дозвон", "в работе", "отказ", "оплатил", "перезвон", "не берёт"] as const;

const WA_PREVIEWS = [
  "Здравствуйте, товар ещё актуален?",
  "Хорошо, скину реквизиты",
  "Оплату подтвердите, пожалуйста",
  "Код пришёл? Продиктуйте",
  "Я на линии, набираю вас",
  "Отправил договор, посмотрите",
  "Доставка завтра до обеда",
  "Всё получилось, спасибо!",
] as const;

const TG_PREVIEWS = [
  "залив ушёл, скинь чек",
  "карта по 7777 сгорела",
  "новый пул выгрузил в папку",
  "жду подтверждение",
  "нал забрали у ТЦ",
  "смена на завтра та же",
  "проверь обменник",
  "+3 строки в базу",
] as const;

function makeAccounts(rng: Rng, count: number): BankAccount[] {
  const out: BankAccount[] = [];
  for (let i = 0; i < count; i++) {
    const country: Country = pickLocalCountry(rng);
    const delta = rng.money(-180_000, 640_000);
    out.push({
      id: `AC-${rng.int(1000, 9999)}`,
      holder: rng.pick(DROP_ALIASES),
      bank: rng.pick(country.banks),
      card: maskCard(String(rng.int(1000, 9999))),
      balance: rng.money(40_000, 1_800_000),
      delta,
    });
  }
  return out;
}

function makeTransfers(rng: Rng, count: number): Transfer[] {
  const out: Transfer[] = [];
  let ago = rng.int(1, 6);
  for (let i = 0; i < count; i++) {
    out.push({
      id: `TR-${rng.int(100000, 999999)}`,
      dir: rng.chance(0.55) ? "in" : "out",
      counterparty: rng.pick(DROP_ALIASES),
      amount: rng.money(8_000, 480_000),
      agoMin: ago,
      status: rng.weighted<Transfer["status"]>([
        ["ok", 72],
        ["hold", 18],
        ["fail", 10],
      ]),
    });
    ago += rng.int(2, 40);
  }
  return out;
}

function makeSheet(rng: Rng, count: number): SheetRow[] {
  const out: SheetRow[] = [];
  for (let i = 0; i < count; i++) {
    const country: Country = pickLocalCountry(rng);
    const local = `${country.dial}${rng.int(100000, 999999)}`;
    out.push({
      name: pickName(rng, country),
      phone: maskPhone(country.cc, local),
      city: rng.pick(country.cities),
      bank: rng.pick(country.banks),
      amount: rng.money(50_000, 900_000),
      status: rng.pick(SHEET_STATUS),
    });
  }
  return out;
}

function makeChats(
  rng: Rng,
  previews: readonly string[],
  count: number,
  handles: boolean,
): ChatItem[] {
  const out: ChatItem[] = [];
  let ago = rng.int(0, 3);
  for (let i = 0; i < count; i++) {
    const country: Country = pickLocalCountry(rng);
    const useHandle = handles && rng.chance(0.5);
    out.push({
      id: `CH-${rng.int(1000, 9999)}`,
      name: useHandle ? `@${rng.pick(HANDLE_WORDS)}_${rng.int(10, 99)}` : pickName(rng, country),
      preview: previews[i % previews.length],
      agoMin: ago,
      unread: rng.chance(0.4) ? rng.int(1, 9) : 0,
      online: rng.chance(0.45),
    });
    ago += rng.int(1, 50);
  }
  return out;
}

export function buildDesktop(seat: number): Desktop {
  return {
    seat,
    accounts: makeAccounts(seatRng(seat, "desk-accounts"), 4),
    transfers: makeTransfers(seatRng(seat, "desk-transfers"), 16),
    sheet: makeSheet(seatRng(seat, "desk-sheet"), 26),
    wa: makeChats(seatRng(seat, "desk-wa"), WA_PREVIEWS, 9, false),
    tg: makeChats(seatRng(seat, "desk-tg"), TG_PREVIEWS, 9, true),
  };
}
