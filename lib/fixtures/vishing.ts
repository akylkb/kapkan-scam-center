import { Rng, seatRng } from "@/lib/prng";
import { maskPhone } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { pickLocalCountry, pickName, type Country } from "./pools";

/**
 * Экран вишинга (/vishing): звонок «от службы поддержки оператора» и
 * оформление кредита на жертву по продиктованному ею SMS-коду.
 *
 * Как и везде в проекте, содержимое детерминировано по номеру места: десять
 * машин показывают разные базы и разных жертв, но дубль 1 и дубль 7 совпадают.
 * Math.random() здесь нет — только seatRng.
 *
 * Сумма кредита задана сценой и одна на всех местах — 800 000 сом. Меняется
 * только, на кого он оформляется.
 */

/** Сумма из сцены. Меняется личность жертвы, но не сумма. */
export const LOAN_AMOUNT = 800_000;

export type TargetStatus = "queue" | "active" | "done" | "noanswer";

export type Target = {
  id: string;
  name: string;
  phone: string;
  city: string;
  /** Маскированный «паспорт» — настоящих документов в кадр не даём */
  doc: string;
  status: TargetStatus;
  /** Минут назад последний дозвон */
  lastMin: number;
};

export type InterceptCode = {
  id: string;
  code: string;
  agoSec: number;
  purpose: string;
};

export type LoanDraft = {
  amount: number;
  /** Срок в месяцах */
  term: number;
  /** Годовая ставка, доли единицы */
  rate: number;
  /** Ежемесячный платёж, посчитанный аннуитетом */
  monthly: number;
  /** Куда «уходят» деньги после одобрения */
  payout: string;
};

export type VishingDesk = {
  seat: number;
  /** Псевдоним, под которым сидит оператор звонка */
  alias: string;
  /** Короткий номер, с которого якобы звонят */
  line: string;
  terminal: string;
  targets: Target[];
  /** Текущая жертва — та, что в работе */
  victim: Target;
  loan: LoanDraft;
};

const ALIASES = ["Мара", "Дина", "Лейла", "Аружан", "Сабина", "Томирис"] as const;

const DOC_PREFIX = ["AN", "ID", "AC", "AB"] as const;

/** Паспорт жертвы в кадре всегда маскирован: серия открыта, номер — нет */
function maskDoc(rng: Rng): string {
  return `${rng.pick(DOC_PREFIX)} ${rng.int(10, 49)}••••${rng.int(10, 99)}`;
}

function makeTargets(rng: Rng, count: number): Target[] {
  const out: Target[] = [];
  let ago = rng.int(1, 8);
  for (let i = 0; i < count; i++) {
    const country: Country = pickLocalCountry(rng);
    const name = pickName(rng, country);
    const local = `${country.dial}${rng.int(100000, 999999)}`;
    // Первая строка — та, что сейчас в работе: экран открывается на ней
    const status: TargetStatus =
      i === 0
        ? "active"
        : rng.weighted<TargetStatus>([
            ["queue", 46],
            ["done", 28],
            ["noanswer", 26],
          ]);
    out.push({
      id: `T-${rng.int(10000, 99999)}`,
      name,
      phone: maskPhone(country.cc, local),
      city: rng.pick(country.cities),
      doc: maskDoc(rng),
      status,
      lastMin: ago,
    });
    ago += rng.int(1, 14);
  }
  return out;
}

/** Аннуитетный платёж — чтобы в кадре цифры сходились, а не были выдуманы */
function annuity(principal: number, yearlyRate: number, months: number): number {
  const r = yearlyRate / 12;
  const m = (principal * r) / (1 - Math.pow(1 + r, -months));
  // Округляем до десятков сомов — ровное число выглядит фальшиво
  return Math.round(m / 10) * 10;
}

export function buildVishingDesk(seat: number): VishingDesk {
  const rng = seatRng(seat, "vishing");

  // 40 строк — таблица гарантированно уходит за нижний край.
  // Наполовину пустая база в кадре читается как макет.
  const targets = makeTargets(seatRng(seat, "targets"), 40);
  const victim = targets[0];

  const term = rng.pick([24, 36, 48]);
  const rate = rng.pick([0.26, 0.28, 0.32]);

  return {
    seat,
    alias: ALIASES[(seat - 1) % ALIASES.length],
    line: BRAND.telco.support,
    terminal: `OP-${1200 + seat * 7}`,
    targets,
    victim,
    loan: {
      amount: LOAN_AMOUNT,
      term,
      rate,
      monthly: annuity(LOAN_AMOUNT, rate, term),
      payout: BRAND.psp.name,
    },
  };
}

/**
 * Свежий перехваченный код.
 *
 * Привязан к номеру события (sigLink) и месту — так между дублями код
 * один и тот же. Это та же шина «link.opened», что роняет SMS-код на
 * экране чатера: у одного события один путь.
 */
export function freshCode(seat: number, signal: number): InterceptCode {
  const rng = new Rng(`vish-code-${seat}-${signal}`);
  return {
    id: `SM-${rng.int(100000, 999999)}`,
    code: String(rng.int(100000, 999999)),
    agoSec: 0,
    purpose: "подтверждение личности",
  };
}

/** История перехватов до текущего дубля — чтобы колонка не пустовала */
export function pastCodes(seat: number, count: number): InterceptCode[] {
  const rng = seatRng(seat, "vish-history");
  const out: InterceptCode[] = [];
  let ago = rng.int(40, 120);
  const purposes = [
    "вход в кабинет",
    "подтверждение заявки",
    "смена номера",
    "привязка устройства",
    "подтверждение перевода",
  ];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `SM-${rng.int(100000, 999999)}`,
      code: String(rng.int(100000, 999999)),
      agoSec: ago,
      purpose: rng.pick(purposes),
    });
    ago += rng.int(60, 600);
  }
  return out;
}
