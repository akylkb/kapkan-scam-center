/**
 * Персонажи из сценария — те, кого играют по имени.
 *
 * Всё остальное содержимое генерируется: лидов, дропов и диалогов в кадре
 * много, они должны быть разными на десяти машинах и потому собираются
 * генератором. Человек, вокруг которого идёт сцена, генератору не доверен —
 * он написан руками целиком, до последней реплики и до последней строки
 * журнала. Math.random() здесь нет по определению: файл статический.
 *
 * Правило «десять машин — десять экранов» тут не нарушено, а сужено:
 * сценарный персонаж обязан находиться на любой машине, которая попадёт
 * в кадр, иначе дубль нельзя переснять с соседнего места. Поэтому Ажар
 * стоит первой строкой и в списке диалогов чатера, и в реестре дроповода —
 * на всех местах. Остальные 42 диалога и 90 дропов по-прежнему у каждого
 * места свои.
 *
 * Один и тот же номер телефона в двух CRM — не совпадение, а связка:
 * в /chat её вербуют «на подработку», в /drops она уже карта под залив.
 * Монтаж этих двух экранов встык должен сходиться по номеру и по банку.
 */

import { maskCard, maskPhone } from "@/lib/format";
import { AGENT_ALIASES, COUNTRIES } from "./pools";
import type { Persona } from "./personas";
import type { Drop, DropOp } from "./drops";
import type { CallRecord, Lead, Transaction } from "./leads";
import type { Payout } from "./payouts";
import type { Message, Thread, ThreadEvent } from "./threads";

const KG = COUNTRIES.find((c) => c.code === "KG")!;

/** Номера сценарных персонажей вынесены за диапазоны генератора:
    TH-40xx у диалогов, DR-70xx-72xx у дропов — 7777 и 4777 не столкнутся */
export const AZHAR_THREAD_ID = "TH-4777";
export const AZHAR_DROP_ID = "DR-7777";

const AZHAR_NAME = "Декрет";
const AZHAR_CITY = "Бишкек";
const AZHAR_BANK = KG.banks[0];
const AZHAR_PHONE = maskPhone(KG.cc, `${KG.dial}204831`);

/* ---------------------------------------------------------------------------
   Переписка.

   Схема «job»: контора не продаёт ей товар, а нанимает её саму. Реплики
   написаны под крупный план — читаются с монитора за спиной актёра и
   объясняют зрителю, как человек становится дропом, не понимая этого.
--------------------------------------------------------------------------- */

type Line = Omit<Message, "id"> & { agoMin: number };

/** Хронологический порядок — в ленту он уходит перевёрнутым */
const SCRIPT: readonly Line[] = [
  {
    from: "victim",
    agoMin: 60 * 24 * 7,
    text: "Саламатсызбы! Мен объявление боюнча, онлайн жумуш тууралуу, жазып жатам",
  },
  {
    from: "operator",
    agoMin: 60 * 24 * 7,
    text: "Саламатсызбы! Жакында байланышабыз",
  }
];

/* ---------------------------------------------------------------------------
   Журнал карточки. Это не копия переписки: сюда попадает то, что делала
   контора — звонила, слала договор, забирала нал.
--------------------------------------------------------------------------- */

/** Новые сверху — как во всех журналах проекта */
const EVENTS: readonly Omit<ThreadEvent, "id">[] = [
  { agoMin: 70, kind: "pay", text: "нал забран курьером у ТЦ", amount: 1_240 },
  { agoMin: 84, kind: "proof", text: "отправлен «график выплат» на неделю" },
  { agoMin: 300, kind: "call", text: "звонок 6:20 · условия и график" },
  { agoMin: 452, kind: "proof", text: "принято фото паспорта · разворот" },
  { agoMin: 628, kind: "link", text: "отправлена ссылка на анкету кандидата" },
  { agoMin: 1_010, kind: "call", text: "звонок 4:12 · «менеджер по подбору»" },
  { agoMin: 1_108, kind: "proof", text: "отправлен договор с печатью" },
  { agoMin: 1_180, kind: "contact", text: "ответила на объявление о подработке" },
];

/**
 * Диалог с Ажар для рабочего места чатера.
 *
 * Личина не зашита: у каждого места свой набор аккаунтов, и переписка должна
 * висеть на том, который на этом месте действительно в работе. Берём первый
 * WhatsApp-аккаунт — канал у Ажар задан сценарием и меняться не должен.
 */
export function makeAzharThread(personas: Persona[]): Thread {
  const persona = personas.find((p) => p.channel === "whatsapp") ?? personas[0];

  const messages: Message[] = SCRIPT.map((line, i) => ({
    ...line,
    id: `MS-${AZHAR_THREAD_ID}-${i}`,
  })).reverse();

  return {
    id: AZHAR_THREAD_ID,
    name: AZHAR_NAME,
    country: KG,
    city: AZHAR_CITY,
    age: 34,
    channel: "whatsapp",
    handle: "@azhar_bishkek",
    phone: AZHAR_PHONE,
    scheme: "job",
    // «ТОРГ»: условия обговорены, тестовый перевод прошёл, дальше суммы крупнее
    stage: 1,
    status: "talking",
    personaId: persona.id,
    item: "подработка · приём переводов на карту",
    askAmount: 4_800,
    paidAmount: 0,
    wealth: 2_400,
    readiness: 74,
    inWorkMin: 1_180,
    lastMsgMin: 6,
    unread: 0,
    online: true,
    hook: "«стабильный доход, 2 часа в день»",
    note: "Разведена, есть ребенок. Деньги нужны сейчас — не торговаться, обещать выплату завтра. Карту уже отдала.",
    messages,
    events: EVENTS.map((e, i) => ({ ...e, id: `EV-${AZHAR_THREAD_ID}-${i}` })),
  };
}

/* ---------------------------------------------------------------------------
   Та же Ажар в реестре дроповода. Кличка — её же имя: в реестре она новая,
   позывной ей ещё не дали.
--------------------------------------------------------------------------- */

const OPS: readonly Omit<DropOp, "id">[] = [
  { agoMin: 14, kind: "in", amount: 1_240, note: "залив принят" },
  { agoMin: 68, kind: "cash", amount: 1_240, note: "нал передан курьеру" },
  { agoMin: 150, kind: "in", amount: 900, note: "прогрев · вторая сумма" },
  { agoMin: 212, kind: "cash", amount: 900, note: "снято в банкомате" },
  { agoMin: 320, kind: "in", amount: 180, note: "первое зачисление · проверка карты" },
  { agoMin: 344, kind: "hold", amount: 180, note: "деньги на удержании · 20 минут" },
];

export const AZHAR_DROP: Drop = {
  id: AZHAR_DROP_ID,
  alias: "Ажар",
  initials: "А. С.",
  country: KG,
  city: AZHAR_CITY,
  bank: AZHAR_BANK,
  card: maskCard("4417"),
  phone: AZHAR_PHONE,
  // Завербована вчера, карта чистая: три дня мелкими, крупное пока не лить
  status: "warm",
  // 8 000, а не 5 000: на её карту стоят два сценарных залива (Асан 3 200 и
  // Кундуз 1 800) поверх уже залитых 2 320 — в 5 000 это не умещалось,
  // и реестр на крупном плане противоречил бы очереди
  limitDay: 8_000,
  loadedToday: 2_320,
  holdMin: 40,
  feePct: 8,
  risk: 22,
  lastOpMin: 14,
  online: true,
  courier: "Курьер-11",
  note: "Приведена из чата: разведена, ребёнок, ищет заработок. Думает, что работает инкассатором. Прогревать мелкими три дня.",
  ops: OPS.map((op, i) => ({ ...op, id: `OP-${AZHAR_DROP_ID}-${i}` })),
};

/* ===========================================================================
   АСАН АМАНОВ — сквозной персонаж.

   Ажар видно на двух экранах, Асана — на всех: он жертва, а жертва в этой
   конторе проходит через каждый отдел. Один и тот же человек читается
   в CRM оператора, в кабинете «брокера», на телефоне, в очереди заливов,
   в панели супервайзера и в бегущей строке на стене — и везде сходятся
   номер, суммы и имя. Именно это склеивает монтаж: зритель узнаёт человека,
   когда камера переходит с одного монитора на другой.

   Его деньги льют на карту Ажар — две половины одной схемы в одном кадре.
=========================================================================== */

export const ASAN_LEAD_ID = "LD-49777";
export const ASAN_THREAD_ID = "TH-4779";
export const ASAN_PAYOUT_ID = "PO-38777";

export const ASAN_NAME = "Кредит";
/** Инициалы для лент и очередей: «🇰🇬 Асан А.» */
export const ASAN_SHORT = `${KG.flag} Кредит`;
const ASAN_CITY = "Ош";
const ASAN_PHONE = maskPhone(KG.cc, `${KG.dial}173094`);

/**
 * Оператор, который его ведёт. Зашит константой, а не берётся по номеру
 * места: одно имя должно стоять и в карточке лида, и в очереди заливов,
 * и в бегущей строке — иначе на стыке двух экранов это разные истории.
 */
export const ASAN_AGENT = AGENT_ALIASES[0];

/** Сколько он занёс на самом деле — цифра сходится во всех трёх CRM */
export const ASAN_DEPOSIT = 3_200;
/** Сколько ему нарисовали «прибыли» и что он просит вывести */
export const ASAN_WITHDRAW = 12_400;
/** «Комиссия за вывод», которую из него выбивают прямо сейчас */
export const ASAN_ASK = 2_400;

/* --- /crm: карточка лида у оператора ------------------------------------ */

const ASAN_CALLS: readonly CallRecord[] = [
  { id: "CL-AS-1", agoMin: 12, durationSec: 214, agent: ASAN_AGENT, outcome: "требует вывод", recorded: true },
  { id: "CL-AS-2", agoMin: 96, durationSec: 1_340, agent: ASAN_AGENT, outcome: "согласие на апгрейд", recorded: true },
  { id: "CL-AS-3", agoMin: 640, durationSec: 428, agent: ASAN_AGENT, outcome: "депозит получен", recorded: true },
  { id: "CL-AS-4", agoMin: 1_180, durationSec: 96, agent: AGENT_ALIASES[3], outcome: "перезвонить", recorded: true },
  { id: "CL-AS-5", agoMin: 2_640, durationSec: 41, agent: AGENT_ALIASES[3], outcome: "думает", recorded: false },
];

const ASAN_TX: readonly Transaction[] = [
  { id: "TX-AS-1", agoMin: 34, kind: "withdraw_req", amount: ASAN_WITHDRAW, method: "SEPA перевод", status: "REJECTED" },
  { id: "TX-AS-2", agoMin: 620, kind: "deposit", amount: 2_000, method: "USDT TRC-20", status: "OK" },
  { id: "TX-AS-3", agoMin: 1_190, kind: "bonus", amount: 400, method: "внутренний счёт", status: "MANUAL" },
  { id: "TX-AS-4", agoMin: 2_610, kind: "deposit", amount: 950, method: "VISA ****4821", status: "OK" },
  { id: "TX-AS-5", agoMin: 4_180, kind: "deposit", amount: 250, method: "VISA ****4821", status: "OK" },
];

/**
 * Лид Асана для CRM оператора.
 *
 * Отдельная функция, а не константа: `calls` и `transactions` в карточке
 * живут дольше дубля, и мутировать общий объект между местами нельзя.
 */
export function makeAsanLead(): Lead {
  return {
    id: ASAN_LEAD_ID,
    name: ASAN_NAME,
    country: KG,
    age: 46,
    phone: ASAN_PHONE,
    netWorth: 84_000,
    deposit: ASAN_DEPOSIT,
    status: "deposited",
    agent: ASAN_AGENT,
    lastContactMin: 12,
    temperature: 71,
    online: true,
    note: "Продал грузовик, деньги от семьи скрывает. Вывод не отдавать — держать на «комиссии». Звонит сам по три раза в день, торопится.",
    city: ASAN_CITY,
    bank: KG.banks[1],
    experience: "нет",
    marital: "женат",
    occupation: "водитель",
    tier: "Silver",
    // Диапазон 198.51.100.0/24 зарезервирован под документацию: реальным
    // адресом он быть не может — та же гигиена, что и с телефонами
    ip: "198.51.100.42",
    calls: [...ASAN_CALLS],
    transactions: [...ASAN_TX],
    withdrawBlocked: 2,
  };
}

/* --- /chat: переписка в WhatsApp ---------------------------------------- */

/** Хронологический порядок — в ленту он уходит перевёрнутым */
const ASAN_SCRIPT: readonly Line[] = [
  {
    from: "operator",
    agoMin: 4_320,
    text: "Асан, здравствуйте! Это ваш персональный аналитик, продолжим в WhatsApp — тут удобнее.",
  },
  { from: "victim", agoMin: 4_300, text: "Здравствуйте. Я пока присматриваюсь" },
  {
    from: "operator",
    agoMin: 4_290,
    text: "Правильно делаете. Начнём с $250 — это учебный счёт, чтобы вы сами увидели, как идёт сделка.",
  },
  { from: "victim", agoMin: 4_180, text: "Ладно, завёл 250. Что дальше?" },
  {
    from: "operator",
    agoMin: 4_170,
    text: "Открыл вам две позиции. Утром покажу результат — не закрывайте сами.",
  },
  {
    from: "operator",
    agoMin: 2_620,
    text: "Смотрите, за ночь плюс 38%",
    attach: { kind: "balance", title: "Баланс $1 340", sub: "скриншот кабинета · сегодня" },
  },
  { from: "victim", agoMin: 2_610, text: "Ого. А если больше завести?" },
  {
    from: "operator",
    agoMin: 2_600,
    text: "Тогда и процент другой. С $1 000 вас переводят на Silver, там комиссия ниже.",
  },
  { from: "victim", agoMin: 2_540, text: "Отправил 950. Больше пока нет" },
  { from: "system", agoMin: 2_538, text: "депозит подтверждён · счёт переведён на Silver" },
  {
    from: "operator",
    agoMin: 1_200,
    text: "Асан, сегодня редкий вход. Я свои деньги туда же поставил, честно говорю.",
  },
  { from: "victim", agoMin: 1_190, text: "Жена не знает. Я грузовик продал, там 2 000" },
  {
    from: "operator",
    agoMin: 1_185,
    text: "И правильно, потом сами всё покажете, когда выведете. Начислил вам бонус $400 за доверие.",
  },
  { from: "victim", agoMin: 640, text: "Вижу баланс $12 400. Хочу вывести, деньги нужны" },
  {
    from: "operator",
    agoMin: 630,
    text: "Конечно, это ваши деньги. Подавайте заявку в кабинете, я поставлю приоритет.",
  },
  { from: "system", agoMin: 34, text: "заявка на вывод отклонена · причина «незакрытые позиции»" },
  { from: "victim", agoMin: 30, text: "Заявку отклонили. Почему?" },
  {
    from: "operator",
    agoMin: 26,
    text: "Не переживайте, это техническое. Площадка держит комиссию 2 400 на незакрытых позициях — как только она на счету, вывод уходит в тот же день.",
  },
  { from: "victim", agoMin: 18, text: "У меня больше нет. Возьмите из моих же 12 400" },
  {
    from: "operator",
    agoMin: 14,
    text: "Так нельзя, счёт заморожен до комиссии. Это правило площадки, не моё.",
  },
  {
    from: "operator",
    agoMin: 9,
    text: "Вот регламент, пункт 4.2",
    attach: { kind: "receipt", title: "Регламент вывода №4.2", sub: "комиссия удержания · $2 400" },
  },
  { from: "victim", agoMin: 3, text: "Мне брат сказал занять. Дайте до вечера, я найду" },
];

/** Новые сверху — как во всех журналах проекта */
const ASAN_EVENTS: readonly Omit<ThreadEvent, "id">[] = [
  { agoMin: 14, kind: "refuse", text: "потребовал вернуть деньги" },
  { agoMin: 26, kind: "call", text: "звонок 3:34 · «комиссия за вывод»" },
  { agoMin: 34, kind: "proof", text: "отправлен регламент вывода · п. 4.2" },
  { agoMin: 620, kind: "pay", text: "третий депозит · довнесли", amount: 2_000 },
  { agoMin: 1_190, kind: "call", text: "звонок 22:20 · разговор о грузовике" },
  { agoMin: 2_540, kind: "pay", text: "второй депозит", amount: 950 },
  { agoMin: 2_620, kind: "proof", text: "отправлен скриншот баланса" },
  { agoMin: 4_180, kind: "pay", text: "первый «пробный» депозит", amount: 250 },
  { agoMin: 4_320, kind: "contact", text: "переведён из звонка в переписку" },
];

/**
 * Диалог с Асаном для рабочего места чатера. Личина — та же логика, что
 * и у Ажар: канал задан сценарием, аккаунт берём с этого места.
 */
export function makeAsanThread(personas: Persona[]): Thread {
  const persona = personas.find((p) => p.channel === "whatsapp") ?? personas[0];

  const messages: Message[] = ASAN_SCRIPT.map((line, i) => ({
    ...line,
    id: `MS-${ASAN_THREAD_ID}-${i}`,
  })).reverse();

  return {
    id: ASAN_THREAD_ID,
    name: ASAN_NAME,
    country: KG,
    city: ASAN_CITY,
    age: 46,
    channel: "whatsapp",
    handle: "@asan_amanov",
    phone: ASAN_PHONE,
    scheme: "crypto",
    // «СПИСАНИЕ»: деньги уже забрали, теперь выбивают «комиссию за вывод»
    stage: 4,
    status: "talking",
    personaId: persona.id,
    item: "«инвестплощадка» · комиссия за вывод",
    askAmount: ASAN_ASK,
    paidAmount: ASAN_DEPOSIT,
    wealth: 84_000,
    readiness: 66,
    inWorkMin: 4_320,
    lastMsgMin: 3,
    unread: 3,
    online: true,
    hook: "«вывод заблокирован, нужна комиссия»",
    note: "Занёс $3 200 тремя платежами, продал грузовик. Вывод не отдавать. Ищет, у кого занять 2 400 — дожимать сегодня, пока не посоветовался с братом.",
    messages,
    events: ASAN_EVENTS.map((e, i) => ({ ...e, id: `EV-${ASAN_THREAD_ID}-${i}` })),
  };
}

/* --- /drops: его деньги в очереди заливов -------------------------------- */

/**
 * Залив с деньгами Асана — на карту Ажар.
 *
 * Стадия считается от тика сцены, поэтому строка «живёт» в кадре сама:
 * стартовый тик отрицательный, то есть залив начался ещё до дубля и к
 * первому кадру уже прошёл середину пути. `failAt: null` — эти деньги
 * доходят до кассы, срывать их по сценарию нечему.
 */
export const ASAN_PAYOUT: Payout = {
  id: ASAN_PAYOUT_ID,
  amount: ASAN_DEPOSIT,
  victim: ASAN_SHORT,
  fromAgent: ASAN_AGENT,
  dropId: AZHAR_DROP_ID,
  dropAlias: "Ажар",
  method: "USDT TRC-20",
  startTick: -272,
  paceSec: 34,
  failAt: null,
};

/* --- /admin: панель супервайзера ---------------------------------------- */

/** Его заявка на вывод — та самая, которую в переписке «отклонила площадка» */
export const ASAN_WITHDRAWAL = {
  id: "WD-49777",
  name: ASAN_NAME,
  flag: KG.flag,
  amount: ASAN_WITHDRAW,
  waiting: 26,
  attempt: 3,
  risk: "ВЫСОКИЙ",
} as const;

/** Его же машина под удалённым просмотром — это и есть экран /client */
export const ASAN_SESSION = {
  id: "RV-4977",
  name: ASAN_NAME,
  flag: KG.flag,
  ip: "198.51.100.42",
  seat: 4,
  app: "браузер · терминал",
  control: true,
  duration: 1_284,
} as const;

/* ===========================================================================
   КУНДУЗ ТОКТОСУНОВА — вторая сквозная жертва.

   Асана ведут «инвестициями», её — звонком из «службы безопасности банка»:
   две классические схемы рядом, чтобы в кадре было видно, что контора
   работает не одним сценарием. Она же — та самая «клиентка, которая успешно
   вывела деньги», которую показывают Асану в кабинете брокера: в CRM она
   отдала конторе сбережения, а на его экране числится счастливым примером.
   Этот стык двух экранов и есть самая говорящая деталь всей истории.
=========================================================================== */

export const KUNDUZ_LEAD_ID = "LD-49778";
export const KUNDUZ_THREAD_ID = "TH-4781";
export const KUNDUZ_PAYOUT_ID = "PO-38778";

export const KUNDUZ_NAME = "Кундуз Токтосунова";
/** Инициалы для лент и очередей: «🇰🇬 Кундуз Т.» */
export const KUNDUZ_SHORT = `${KG.flag} Кундуз Т.`;
const KUNDUZ_CITY = "Бишкек";
const KUNDUZ_PHONE = maskPhone(KG.cc, `${KG.dial}310562`);

/** Оператор, который её ведёт. Не тот же, что у Асана: в лидерборде смены
    и в очереди заливов должны стоять разные имена, иначе зал выглядит пустым */
export const KUNDUZ_AGENT = AGENT_ALIASES[4];

/** Сколько она уже отдала — цифра сходится в CRM, в чате и в админке */
export const KUNDUZ_PAID = 38_400;
/** Что из неё выбивают сейчас — «страховой взнос» за возврат */
export const KUNDUZ_ASK = 6_800;
/** Сумма, которой её показывают Асану в кабинете брокера как «успешный вывод» */
export const KUNDUZ_BAIT = 2_400;

/* --- /crm: карточка лида ------------------------------------------------- */

const KUNDUZ_CALLS: readonly CallRecord[] = [
  { id: "CL-KT-1", agoMin: 26, durationSec: 892, agent: KUNDUZ_AGENT, outcome: "думает", recorded: true },
  { id: "CL-KT-2", agoMin: 180, durationSec: 1_640, agent: KUNDUZ_AGENT, outcome: "депозит получен", recorded: true },
  { id: "CL-KT-3", agoMin: 1_460, durationSec: 2_240, agent: KUNDUZ_AGENT, outcome: "согласие на апгрейд", recorded: true },
  { id: "CL-KT-4", agoMin: 2_880, durationSec: 1_180, agent: AGENT_ALIASES[7], outcome: "депозит получен", recorded: true },
  { id: "CL-KT-5", agoMin: 5_760, durationSec: 316, agent: AGENT_ALIASES[7], outcome: "перезвонить", recorded: true },
  { id: "CL-KT-6", agoMin: 8_640, durationSec: 74, agent: AGENT_ALIASES[7], outcome: "не отвечает", recorded: false },
];

const KUNDUZ_TX: readonly Transaction[] = [
  { id: "TX-KT-1", agoMin: 92, kind: "withdraw_req", amount: 24_000, method: "SEPA перевод", status: "REJECTED" },
  { id: "TX-KT-2", agoMin: 180, kind: "deposit", amount: 18_400, method: "Wire · SWIFT", status: "OK" },
  { id: "TX-KT-3", agoMin: 1_460, kind: "deposit", amount: 12_000, method: "Wire · SWIFT", status: "OK" },
  { id: "TX-KT-4", agoMin: 2_880, kind: "deposit", amount: 6_500, method: "MC ****9017", status: "OK" },
  { id: "TX-KT-5", agoMin: 5_760, kind: "deposit", amount: 1_500, method: "MC ****9017", status: "OK" },
];

/** Лид Кундуз для CRM оператора — см. makeAsanLead о том, почему функция */
export function makeKunduzLead(): Lead {
  return {
    id: KUNDUZ_LEAD_ID,
    name: KUNDUZ_NAME,
    country: KG,
    age: 61,
    phone: KUNDUZ_PHONE,
    netWorth: 52_000,
    deposit: KUNDUZ_PAID,
    status: "whale",
    agent: KUNDUZ_AGENT,
    lastContactMin: 26,
    temperature: 88,
    online: true,
    note: "Учительница на пенсии, живёт одна. Отдала все сбережения и деньги с продажи дачи. Верит «службе безопасности», сына не слушает. Дожимать на страховой взнос, вывод не отдавать.",
    city: KUNDUZ_CITY,
    bank: KG.banks[2],
    experience: "нет",
    marital: "вдова",
    occupation: "учитель",
    tier: "Platinum",
    // Тот же зарезервированный под документацию диапазон, что и у Асана
    ip: "198.51.100.87",
    calls: [...KUNDUZ_CALLS],
    transactions: [...KUNDUZ_TX],
    withdrawBlocked: 3,
  };
}

/* --- /chat: переписка в WhatsApp ---------------------------------------- */

/** Хронологический порядок — в ленту он уходит перевёрнутым */
const KUNDUZ_SCRIPT: readonly Line[] = [];

/** Новые сверху — как во всех журналах проекта */
const KUNDUZ_EVENTS: readonly Omit<ThreadEvent, "id">[] = [
  { agoMin: 12, kind: "refuse", text: "потребовала вернуть деньги" },
  { agoMin: 26, kind: "call", text: "звонок 14:52 · «страховой взнос»" },
  { agoMin: 92, kind: "otp", text: "перехвачен код · подтверждение перевода" },
  { agoMin: 180, kind: "pay", text: "четвёртый перевод · всё, что осталось", amount: 18_400 },
  { agoMin: 1_460, kind: "pay", text: "третий перевод · деньги с продажи дачи", amount: 12_000 },
  { agoMin: 2_870, kind: "proof", text: "отправлена квитанция «страхового счёта»" },
  { agoMin: 2_880, kind: "pay", text: "второй перевод · снят вклад", amount: 6_500 },
  { agoMin: 5_760, kind: "pay", text: "первый перевод", amount: 1_500 },
  { agoMin: 8_640, kind: "call", text: "звонок 37:20 · «служба безопасности банка»" },
  { agoMin: 8_660, kind: "contact", text: "холодный звонок по базе отделения" },
];

/** Диалог с Кундуз — личина берётся так же, как у Ажар и Асана */
export function makeKunduzThread(personas: Persona[]): Thread {
  const persona = personas.find((p) => p.channel === "whatsapp") ?? personas[0];

  const messages: Message[] = KUNDUZ_SCRIPT.map((line, i) => ({
    ...line,
    id: `MS-${KUNDUZ_THREAD_ID}-${i}`,
  })).reverse();

  return {
    id: KUNDUZ_THREAD_ID,
    name: KUNDUZ_NAME,
    country: KG,
    city: KUNDUZ_CITY,
    age: 61,
    channel: "whatsapp",
    handle: "@kunduz_t",
    phone: KUNDUZ_PHONE,
    scheme: "delivery",
    // «СПИСАНИЕ»: четыре перевода уже ушли, идёт пятый — «страховой взнос»
    stage: 4,
    status: "talking",
    personaId: persona.id,
    item: "«страховой счёт» · возврат средств",
    askAmount: KUNDUZ_ASK,
    paidAmount: KUNDUZ_PAID,
    wealth: 52_000,
    readiness: 81,
    inWorkMin: 8_660,
    lastMsgMin: 12,
    unread: 0,
    online: true,
    hook: "«с вашего счёта пытались списать»",
    note: "Вдова, живёт одна, сын в другом городе. Отдала 38 400 четырьмя переводами. Держать на «уголовной ответственности за разглашение» — сына боится больше, чем банка. Дожимать сегодня.",
    messages,
    events: KUNDUZ_EVENTS.map((e, i) => ({ ...e, id: `EV-${KUNDUZ_THREAD_ID}-${i}` })),
  };
}

/* --- /drops: её деньги в очереди заливов --------------------------------- */

/**
 * Последний перевод Кундуз — на ту же карту Ажар. Суммы обоих сценарных
 * заливов вместе с уже залитым за день умещаются в суточный лимит карты:
 * иначе на крупном плане реестр противоречит сам себе.
 */
export const KUNDUZ_PAYOUT: Payout = {
  id: KUNDUZ_PAYOUT_ID,
  amount: 1_800,
  victim: KUNDUZ_SHORT,
  fromAgent: KUNDUZ_AGENT,
  dropId: AZHAR_DROP_ID,
  dropAlias: "Ажар",
  method: "Wire · SWIFT",
  startTick: -96,
  paceSec: 28,
  failAt: null,
};

/* --- /admin: панель супервайзера ---------------------------------------- */

/** Её заявка на возврат — крупнейшая в очереди, из-за неё и держат «взнос» */
export const KUNDUZ_WITHDRAWAL = {
  id: "WD-49778",
  name: KUNDUZ_NAME,
  flag: KG.flag,
  amount: 24_000,
  waiting: 38,
  attempt: 4,
  risk: "ВЫСОКИЙ",
} as const;

/** Её интернет-банк под удалённым просмотром — оператор ведёт её по шагам */
export const KUNDUZ_SESSION = {
  id: "RV-4978",
  name: KUNDUZ_NAME,
  flag: KG.flag,
  ip: "198.51.100.87",
  seat: 7,
  app: "интернет-банк",
  control: true,
  duration: 2_180,
} as const;

/* ===========================================================================
   «МАМА В ДЕКРЕТЕ» — третья линия вербовки.

   Ажар уже отдала карту и числится дропом, эта только откликнулась на
   объявление: в списке чатера они стоят рядом и показывают одну схему
   в двух точках — начало и результат. Канал тот же, WhatsApp: по объявлению
   о подработке пишут именно туда, и на общем плане обе строки идут под
   зелёной меткой WA.

   Диалог держат коротким намеренно: сцену играют вживую, реплики актёра
   ложатся поверх фикстуры — см. правило про живую переписку в CLAUDE.md.
=========================================================================== */

export const MAMA_THREAD_ID = "TH-4783";

export const MAMA_NAME = "Мама в декрете";
/** Инициалы для лент и очередей: «🇰🇬 Мама в декрете» */
export const MAMA_SHORT = `${KG.flag} ${MAMA_NAME}`;
const MAMA_CITY = "Бишкек";
const MAMA_PHONE = maskPhone(KG.cc, `${KG.dial}268140`);

/** Хронологический порядок — в ленту он уходит перевёрнутым */
const MAMA_SCRIPT: readonly Line[] = [
  {
    from: "victim",
    agoMin: 96,
    text: "Здравствуйте! Увидела объявление про работу на дому. Я в декрете, свободна вечером 2-3 часа",
  },
  {
    from: "operator",
    agoMin: 92,
    text: "Здравствуйте! Да, набор открыт. Оформление удалённое, опыт не нужен — расскажу условия.",
  },
];

/** Новые сверху — как во всех журналах проекта */
const MAMA_EVENTS: readonly Omit<ThreadEvent, "id">[] = [
  { agoMin: 92, kind: "contact", text: "ответила на объявление о подработке" },
  { agoMin: 140, kind: "link", text: "показ объявления · группа «работа на дому»" },
];

/**
 * Диалог для рабочего места чатера. Личина — та же логика, что у Ажар,
 * Асана и Кундуз: канал задан сценарием, аккаунт берём с этого места.
 */
export function makeMamaThread(personas: Persona[]): Thread {
  const persona = personas.find((p) => p.channel === "whatsapp") ?? personas[0];

  const messages: Message[] = MAMA_SCRIPT.map((line, i) => ({
    ...line,
    id: `MS-${MAMA_THREAD_ID}-${i}`,
  })).reverse();

  return {
    id: MAMA_THREAD_ID,
    name: MAMA_NAME,
    country: KG,
    city: MAMA_CITY,
    age: 29,
    channel: "whatsapp",
    handle: "@dekret_mama",
    phone: MAMA_PHONE,
    scheme: "job",
    // «КОНТАКТ»: откликнулась час назад, условий ещё не слышала
    stage: 0,
    status: "fresh",
    personaId: persona.id,
    item: "подработка на дому · «оператор переводов»",
    askAmount: 0,
    paidAmount: 0,
    wealth: 900,
    readiness: 41,
    inWorkMin: 96,
    lastMsgMin: 92,
    unread: 0,
    online: true,
    hook: "«работа из дома, 2 часа в день»",
    note: "Декрет, живёт с матерью, доход — пособие. Опыта нет, торопить нельзя: сначала «оформление», карту просить на втором звонке. Кандидат на замену Ажар.",
    messages,
    events: MAMA_EVENTS.map((e, i) => ({ ...e, id: `EV-${MAMA_THREAD_ID}-${i}` })),
  };
}
