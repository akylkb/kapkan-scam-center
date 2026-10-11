import { Rng, mulberry32 } from "@/lib/prng";
import { clock } from "@/lib/format";
import { pickLocalCountry, pickName } from "@/lib/fixtures/pools";
import { SCENE_START_MINUTES } from "@/lib/scene/store";

/**
 * Платформа бинарных опционов (/options) — ноутбук Руслана.
 *
 * Сцена снимается в четыре приёма, между которыми по сюжету проходит время,
 * поэтому у каждого этапа свой адрес и своё стартовое состояние: экран не
 * нужно «доигрывать» до нужного баланса перед дублем.
 *
 * Счёт в кыргызских сомах. Исход вывода от этапа не зависит — его решает
 * только баланс, см. OPTION_WITHDRAW_LIMIT.
 */
export const OPTION_ACTS = {
  /** Новый счёт: Руслан зачисляет деньги. Сделки демо-счёта уже в истории */
  1: { balance: 0, withdrawLabel: "Вывести", stake: 500 },
  /** Первый вывод: баланс ниже порога — вывод проходит, чтобы жертва поверила */
  2: { balance: 8_450, withdrawLabel: "Вывести", stake: 500 },
  /** Крупная сумма: баланс выше порога — вывод отклоняется */
  3: { balance: 486_400, withdrawLabel: "Вывести средства", stake: 10_000 },
} as const;

export type OptionActId = keyof typeof OPTION_ACTS;
export type OptionAct = (typeof OPTION_ACTS)[OptionActId];

/**
 * Порог вывода, сом. Пока на балансе не больше — вывод проходит: мелочь
 * отдают, чтобы жертва поверила и занесла ещё. Как только больше —
 * «Операция отклонена», сколько ни повторяй.
 */
export const OPTION_WITHDRAW_LIMIT = 10_000;

/** Этап 4 — сайт пропал. Отдельная страница, терминала на ней нет */
export const OPTION_DOWN_ACT = 4;

export function optionStaticParams() {
  return [...Object.keys(OPTION_ACTS), String(OPTION_DOWN_ACT)].map((act) => ({ act }));
}

/** Карта, на которую «выводятся» деньги: в кадре только последние цифры */
export const OPTION_CARD_LAST4 = "4471";

export type OptionAsset = {
  symbol: string;
  name: string;
  price: number;
  digits: number;
  /** Доходность сделки, % */
  payout: number;
  /** Сдвиг фазы — чтобы графики активов не шли синхронно */
  phase: number;
};

export const OPTION_ASSETS: readonly OptionAsset[] = (
  [
    ["BTC/USD", "Bitcoin", 71_420, 2, 87],
    ["ETH/USD", "Ethereum", 3_812, 2, 85],
    ["SOL/USD", "Solana", 168.4, 2, 82],
    ["TON/USD", "Toncoin", 6.914, 3, 86],
    ["BNB/USD", "BNB", 604.2, 2, 80],
    ["XRP/USD", "Ripple", 0.5284, 4, 84],
    ["DOGE/USD", "Dogecoin", 0.1582, 5, 78],
    ["ADA/USD", "Cardano", 0.4631, 4, 79],
    ["AVAX/USD", "Avalanche", 36.82, 2, 81],
    ["LTC/USD", "Litecoin", 84.15, 2, 77],
    ["DOT/USD", "Polkadot", 7.248, 3, 80],
    ["LINK/USD", "Chainlink", 17.36, 2, 83],
    ["TRX/USD", "Tron", 0.1247, 5, 76],
    ["ATOM/USD", "Cosmos", 8.512, 3, 78],
    ["NEAR/USD", "Near", 7.106, 3, 82],
    ["XLM/USD", "Stellar", 0.1103, 5, 75],
  ] as const
).map(([symbol, name, price, digits, payout], i) => ({
  symbol,
  name,
  price,
  digits,
  payout,
  phase: i * 137,
}));

/** Размах колебаний в долях цены: одна «единица волны» */
export const OPTION_VOL = 0.0007;

/**
 * Подкрутка котировки под открытую сделку: к рыночной цене плавно
 * прибавляется delta. Именно так платформа и «даёт выигрывать» — график
 * в кадре честно уходит в сторону прогноза, а не просто рисует «+».
 */
export type OptionNudge = { symbol: string; t0: number; t1: number; delta: number };

function basePrice(asset: OptionAsset, k: number): number {
  const t = k / 4 + asset.phase;
  const wave =
    Math.sin(t / 41) * 1.4 +
    Math.sin(t / 13.1) * 0.8 +
    Math.sin(t / 5.3) * 0.45 +
    Math.sin(t / 1.9) * 0.18;
  // Мелкая «дрожь» на каждом тике — без неё линия выглядит синусоидой
  const noise = (mulberry32(k * 7919 + asset.phase)() - 0.5) * 0.14;
  return asset.price * (1 + OPTION_VOL * (wave + noise));
}

/** Цена актива на тике сцены k. Чистая функция: дубли совпадают */
export function optionPrice(asset: OptionAsset, k: number, nudges: readonly OptionNudge[]): number {
  let price = basePrice(asset, k);
  for (const n of nudges) {
    if (n.symbol !== asset.symbol || k <= n.t0) continue;
    const x = Math.min(1, (k - n.t0) / (n.t1 - n.t0));
    price += n.delta * x * x * (3 - 2 * x);
  }
  return price;
}

/**
 * Подкрутка для новой сделки: к экспирации цена обязана уйти в сторону
 * прогноза минимум на пол-единицы волны. Если рынок и сам туда идёт —
 * delta нулевая. Сделка на экране всегда одна, поэтому прежние подкрутки
 * к этому моменту уже отыграны и на разницу цен не влияют.
 */
export function planNudge(asset: OptionAsset, t0: number, t1: number, dir: 1 | -1): OptionNudge {
  const want = asset.price * OPTION_VOL * 0.5;
  const natural = (basePrice(asset, t1) - basePrice(asset, t0)) * dir;
  return {
    symbol: asset.symbol,
    t0,
    t1,
    delta: natural >= want ? 0 : (want - natural) * dir,
  };
}

/** Время сцены с секундами — для оси графика и истории сделок */
export function sceneClock(second: number): string {
  const s = ((Math.floor(second) % 60) + 60) % 60;
  return `${clock(SCENE_START_MINUTES + Math.floor(second / 60))}:${s.toString().padStart(2, "0")}`;
}

export type OptionDeal = {
  id: string;
  time: string;
  symbol: string;
  digits: number;
  dir: 1 | -1;
  stake: number;
  entry: number;
  close: number;
  /** Чистый результат: +выплата или −ставка */
  profit: number;
  demo: boolean;
};

const HISTORY_STAKES: Record<OptionActId, readonly number[]> = {
  1: [500, 1_000, 1_000, 2_500],
  2: [200, 500, 1_000, 1_500],
  3: [5_000, 10_000, 25_000, 50_000],
};

/**
 * История сделок на старте этапа, новыми вперёд. Почти всё в плюсе — это
 * часть обмана. На первом этапе счёт новый, поэтому в истории сделки
 * демо-счёта: на нём выигрывают все, с него и начинается заманивание.
 */
export function makeOptionHistory(act: OptionActId): OptionDeal[] {
  const rng = new Rng(`options-history-${act}`);
  let ago = 0;
  return Array.from({ length: 14 }, (_, i) => {
    ago += rng.int(2, 14);
    const asset = rng.pick(OPTION_ASSETS.slice(0, 6));
    const dir: 1 | -1 = rng.chance(0.6) ? 1 : -1;
    const win = rng.chance(0.86);
    const stake = rng.pick(HISTORY_STAKES[act]);
    const entry = asset.price * (1 + rng.range(-0.01, 0.01));
    const move = asset.price * OPTION_VOL * rng.range(0.3, 1.6);
    return {
      id: `#${8_400_000 - i * 37 - rng.int(1, 30)}`,
      time: `${clock(SCENE_START_MINUTES - ago)}:${rng.int(0, 59).toString().padStart(2, "0")}`,
      symbol: asset.symbol,
      digits: asset.digits,
      dir,
      stake,
      entry,
      close: entry + move * dir * (win ? 1 : -1),
      profit: win ? (stake * asset.payout) / 100 : -stake,
      demo: act === 1,
    };
  });
}

export type OptionFeedItem = { who: string; symbol: string; amount: number };

/** Чужие «выигрыши» в правой панели — крутятся по кругу вместе с часами сцены */
export function makeOptionFeed(count = 48): OptionFeedItem[] {
  const rng = new Rng("options-feed");
  return Array.from({ length: count }, () => {
    const country = pickLocalCountry(rng);
    const [first, last] = pickName(rng, country).split(" ");
    return {
      who: `${country.flag} ${first} ${last[0]}.`,
      symbol: rng.pick(OPTION_ASSETS).symbol,
      amount: rng.money(400, 96_000),
    };
  });
}
