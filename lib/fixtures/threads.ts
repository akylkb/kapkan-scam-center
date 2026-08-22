import { Rng } from "@/lib/prng";
import { maskPhone, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import type { StatusMeta } from "./leads";
import type { Persona } from "./personas";
import {
  CHAT_HOOKS,
  CHAT_NOTES,
  GOODS_ITEMS,
  HANDLE_WORDS,
  RED_FLAGS,
  pickLocalCountry,
  pickName,
  type Country,
} from "./pools";

/** Мессенджер, в котором идёт переписка */
export type ChatChannel = "whatsapp" | "telegram" | "instagram";

export const CHANNEL_META: Record<ChatChannel, StatusMeta & { short: string }> = {
  whatsapp: {
    label: "WHATSAPP",
    short: "WA",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  telegram: {
    label: "TELEGRAM",
    short: "TG",
    text: "text-sky-300",
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    dot: "bg-sky-400",
  },
  instagram: {
    label: "INSTAGRAM",
    short: "IG",
    text: "text-fuchsia-300",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    dot: "bg-fuchsia-400",
  },
};

/** Схема развода — от неё зависит и сценарий переписки, и инструмент */
export type Scheme = "goods" | "delivery" | "romance" | "crypto";

export const SCHEME_META: Record<Scheme, { label: string; short: string; text: string }> = {
  goods: { label: "Товар · продажа", short: "ТОВАР", text: "text-cyan-300" },
  delivery: { label: "Доставка / банк-СБ", short: "ДОСТАВКА", text: "text-amber-300" },
  romance: { label: "Романтика", short: "РОМАН", text: "text-fuchsia-300" },
  crypto: { label: "Крипта · «инвестиции»", short: "КРИПТА", text: "text-emerald-300" },
};

/**
 * Воронка. Она же полоска этапа в списке и степпер над перепиской —
 * по ней на общем плане видно, кто из чатеров близок к деньгам.
 */
export const STAGES = ["КОНТАКТ", "ТОРГ", "ОПЛАТА", "ССЫЛКА", "СПИСАНИЕ"] as const;
export const LAST_STAGE = STAGES.length - 1;

export type ThreadStatus =
  | "fresh"
  | "talking"
  | "hot"
  | "paid"
  | "suspicious"
  | "dead";

export const THREAD_STATUS_META: Record<ThreadStatus, StatusMeta> = {
  fresh: {
    label: "НОВЫЙ",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  talking: {
    label: "В ПЕРЕПИСКЕ",
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  hot: {
    label: "ГОТОВ ПЛАТИТЬ",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  paid: {
    label: "ОПЛАТИЛ",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  suspicious: {
    label: "ЗАПОДОЗРИЛ",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    dot: "bg-rose-500",
  },
  dead: {
    label: "МОЛЧИТ",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-600/40",
    dot: "bg-zinc-500",
  },
};

/** Вложение в переписке: сгенерированное «доказательство» */
export type Attach = {
  kind: "receipt" | "track" | "balance" | "photo" | "link";
  title: string;
  sub: string;
};

export type Message = {
  id: string;
  from: "victim" | "operator" | "system";
  text: string;
  agoMin: number;
  attach?: Attach;
  /** Стоп-слова в реплике жертвы — детектор подсвечивает их красным */
  flags?: string[];
};

/**
 * Строка журнала в карточке клиента. Это не копия переписки: сюда попадает
 * то, что делала контора — звонила, слала ссылку, снимала деньги.
 */
export type ThreadEvent = {
  id: string;
  agoMin: number;
  kind: "contact" | "call" | "video" | "link" | "otp" | "pay" | "proof" | "refuse";
  text: string;
  amount?: number;
};

export type Thread = {
  id: string;
  name: string;
  country: Country;
  city: string;
  age: number;
  channel: ChatChannel;
  handle: string;
  phone: string;
  scheme: Scheme;
  /** Индекс в STAGES */
  stage: number;
  status: ThreadStatus;
  personaId: string;
  /** Что «продаём» или под каким предлогом пишем */
  item: string;
  /** Сумма сделки */
  askAmount: number;
  /** Сколько уже отдал */
  paidAmount: number;
  /** Оценка платёжеспособности */
  wealth: number;
  /** 0..100 — готовность платить */
  readiness: number;
  /** Сколько минут диалог в работе */
  inWorkMin: number;
  lastMsgMin: number;
  unread: number;
  online: boolean;
  typing: boolean;
  hook: string;
  note: string;
  /** Новые сверху — как в истории операций у дроповода */
  messages: Message[];
  events: ThreadEvent[];
};

/* ---------------------------------------------------------------------------
   Сценарии переписки.

   Диалог на крупном плане должен читаться как настоящий, поэтому он не
   собирается из случайных фраз: у каждой схемы жёсткий хребет реплик по
   этапам, а случайность добавляет только «воду» между ними.
--------------------------------------------------------------------------- */

/** Ниже этого числа реплик лента чата в кадре выглядит пустой */
const MIN_MESSAGES = 18;

type Beat = {
  from: Message["from"];
  text: string;
  /** До какого этапа воронки реплика уже прозвучала */
  stage: number;
  attach?: Attach;
};

const SPINE: Record<Scheme, readonly Beat[]> = {
  goods: [
    { from: "victim", stage: 0, text: "Здравствуйте! {item} ещё продаёте?" },
    { from: "operator", stage: 0, text: "Здравствуйте) Да, актуально. Состояние отличное." },
    { from: "victim", stage: 0, text: "А почему так дёшево?" },
    { from: "operator", stage: 1, text: "Переезжаю, надо срочно. Заберут сегодня — отдам за {amount}." },
    {
      from: "operator",
      stage: 1,
      text: "Вот фото, снимал вчера",
      attach: { kind: "photo", title: "IMG_4821.jpg", sub: "фото товара · 2.4 Мб" },
    },
    { from: "victim", stage: 1, text: "Можно посмотреть вживую?" },
    { from: "operator", stage: 1, text: "Я на вахте до пятницы. Отправлю доставкой, оформим через безопасную сделку." },
    { from: "victim", stage: 2, text: "А как оплата тогда?" },
    { from: "operator", stage: 2, text: "Через сервис {market}. Вам придёт ссылка, там бронь на 2 часа." },
    { from: "victim", stage: 2, text: "Ладно, давайте ссылку" },
    {
      from: "operator",
      stage: 3,
      text: "Держите, оформляйте:",
      attach: { kind: "link", title: "{link}", sub: "безопасная сделка · бронь 2 ч" },
    },
    { from: "system", stage: 3, text: "ссылка отправлена · шаблон «безопасная сделка»" },
    { from: "victim", stage: 3, text: "Открыл, тут просят данные карты" },
    { from: "operator", stage: 3, text: "Да, это только для брони. Деньги спишутся при получении." },
    { from: "system", stage: 4, text: "жертва открыла ссылку · введены данные карты" },
    { from: "victim", stage: 4, text: "У меня списалось {amount}! Это что такое?" },
    { from: "operator", stage: 4, text: "Это залог, вернётся при получении. Сейчас пришлю трек." },
    {
      from: "operator",
      stage: 4,
      text: "Посылка оформлена",
      attach: { kind: "track", title: "{track}", sub: "{delivery} · в пути" },
    },
  ],
  delivery: [
    { from: "operator", stage: 0, text: "Здравствуйте! {delivery}, отдел выдачи. На ваше имя посылка." },
    { from: "victim", stage: 0, text: "Какая посылка? Я ничего не заказывал" },
    { from: "operator", stage: 0, text: "Отправитель — {market}. Наложенный платёж {amount}, хранение оплачено до завтра." },
    { from: "victim", stage: 1, text: "Странно... а что там?" },
    { from: "operator", stage: 1, text: "Содержимое не указано, только вес 1.2 кг. Возможно, подарок." },
    {
      from: "operator",
      stage: 1,
      text: "Вот накладная",
      attach: { kind: "track", title: "{track}", sub: "{delivery} · ожидает оплаты" },
    },
    { from: "victim", stage: 2, text: "Как оплатить?" },
    { from: "operator", stage: 2, text: "Онлайн, картой. Соединяю с оператором банка для подтверждения." },
    { from: "operator", stage: 2, text: "Здравствуйте, {bank}, служба безопасности. С вашей карты пытались списать {amount}." },
    { from: "victim", stage: 2, text: "Я не списывал! Что делать?" },
    { from: "operator", stage: 3, text: "Не паникуйте. Сейчас переведём средства на резервный счёт, я пришлю форму." },
    {
      from: "operator",
      stage: 3,
      text: "Форма подтверждения:",
      attach: { kind: "link", title: "{link}", sub: "вход в кабинет · {bank}" },
    },
    { from: "system", stage: 3, text: "ссылка отправлена · шаблон «вход в кабинет банка»" },
    { from: "victim", stage: 3, text: "Ввёл, пришёл код 4 цифры" },
    { from: "operator", stage: 3, text: "Продиктуйте, он для отмены операции. Никому кроме меня не сообщайте." },
    { from: "system", stage: 4, text: "код перехвачен · операция подтверждена" },
    { from: "victim", stage: 4, text: "Деньги ушли! {amount}! Верните!" },
    { from: "operator", stage: 4, text: "Средства на резервном счёте, вернутся в течение суток." },
  ],
  romance: [
    { from: "operator", stage: 0, text: "Привет) Мы точно раньше не пересекались? Лицо знакомое" },
    { from: "victim", stage: 0, text: "Здравствуйте. Не думаю, я редко тут бываю" },
    { from: "operator", stage: 0, text: "Значит судьба) Я {persona}. А вас как зовут?" },
    { from: "victim", stage: 0, text: "{name}. Приятно познакомиться" },
    { from: "operator", stage: 1, text: "Живу одна, работаю посменно. Вечерами тоскливо, если честно" },
    { from: "victim", stage: 1, text: "Понимаю. У меня после развода тоже тихо стало" },
    { from: "operator", stage: 1, text: "Вы очень хороший собеседник. Редкость сейчас" },
    { from: "operator", stage: 1, text: "Можно я вам голосовое отправлю? Печатать долго" },
    { from: "system", stage: 2, text: "голосовое сообщение · 0:34 · синтез {voice}" },
    { from: "victim", stage: 2, text: "Голос приятный. Может, созвонимся по видео?" },
    { from: "system", stage: 2, text: "видеозвонок · 4:12 · подмена лица {deepfake}" },
    { from: "operator", stage: 2, text: "Так рада была вас увидеть. Только связь плохая, извините" },
    { from: "operator", stage: 3, text: "{name}, у меня беда. Маму увезли, нужна операция, не хватает {amount}" },
    { from: "victim", stage: 3, text: "Господи. Куда переводить?" },
    {
      from: "operator",
      stage: 3,
      text: "Вот ссылка клиники, там форма оплаты",
      attach: { kind: "link", title: "{link}", sub: "оплата счёта · бронь 2 ч" },
    },
    { from: "system", stage: 4, text: "жертва открыла ссылку · введены данные карты" },
    { from: "victim", stage: 4, text: "Перевёл {amount}. Держитесь" },
    {
      from: "operator",
      stage: 4,
      text: "Спасибо вам. Вот чек из клиники",
      attach: { kind: "receipt", title: "Квитанция №{doc}", sub: "оплата принята · {amount}" },
    },
  ],
  crypto: [
    { from: "operator", stage: 0, text: "{name}, помните, я говорил про площадку? Не удержался, зашёл" },
    { from: "victim", stage: 0, text: "И как? Работает?" },
    {
      from: "operator",
      stage: 0,
      text: "Смотрите сами",
      attach: { kind: "balance", title: "Баланс {profit}", sub: "скриншот кабинета · сегодня" },
    },
    { from: "victim", stage: 1, text: "Это за неделю?!" },
    { from: "operator", stage: 1, text: "За четыре дня. Заходил на {amount}, вывел уже дважды" },
    { from: "victim", stage: 1, text: "А вывод точно проходит?" },
    { from: "operator", stage: 1, text: "На карту, минут за двадцать. Могу показать выписку" },
    {
      from: "operator",
      stage: 2,
      text: "Вот последний вывод",
      attach: { kind: "receipt", title: "Выписка №{doc}", sub: "зачислено · {amount}" },
    },
    { from: "victim", stage: 2, text: "Хорошо, а как зайти?" },
    { from: "operator", stage: 2, text: "Только по приглашению. Дам свою реферальную, у меня две осталось" },
    {
      from: "operator",
      stage: 3,
      text: "Регистрируйтесь:",
      attach: { kind: "link", title: "{link}", sub: "P2P-пополнение · {exchange}" },
    },
    { from: "system", stage: 3, text: "ссылка отправлена · шаблон «пополнение биржи»" },
    { from: "victim", stage: 3, text: "Зарегистрировался. Минимальный вход {amount}?" },
    { from: "operator", stage: 3, text: "Да, но с этой суммы процент ниже. Я бы заходил сразу вдвое" },
    { from: "system", stage: 4, text: "жертва открыла ссылку · пополнение подтверждено" },
    { from: "victim", stage: 4, text: "Завёл. Когда можно выводить?" },
    { from: "operator", stage: 4, text: "Через сутки. Только сначала комиссия площадки, {fee} от суммы" },
  ],
};

/** «Вода» между ключевыми репликами — без неё диалог выглядит слишком гладким */
const FILLER: Record<Message["from"], readonly string[]> = {
  victim: [
    "Хорошо", "Понял вас", "Секунду, отвлекли", "Извините, был занят",
    "А это точно надёжно?", "Мне сын говорил быть осторожнее",
    "Я не очень разбираюсь в этом", "Сейчас посмотрю",
    "У меня телефон старый, всё медленно", "Перезвоните позже, я на работе",
    "Ладно, доверюсь вам", "А гарантии какие-то есть?",
  ],
  operator: [
    "Конечно, не торопитесь", "Всё официально, не переживайте",
    "Я на связи весь день", "Пишите, если что-то непонятно",
    "У нас уже сотни таких оформлений", "Давайте я подскажу пошагово",
    "Только не затягивайте, бронь горит", "Понимаю вас, сам такой же осторожный",
    "Могу голосовым объяснить, если удобнее", "Всё под контролем",
  ],
  system: [
    "сообщение доставлено", "сообщение прочитано",
    "вложение загружено", "клиент онлайн", "автоперевод RU → EN",
  ],
};

/** Реплики, которыми жертва срывается — сюда попадают стоп-слова */
export const SUSPICIOUS_LINES = [
  "Я почитал отзывы, пишут что это мошенники",
  "Знакомый сказал что это развод, я никуда не буду переводить",
  "Верните деньги или я напишу заявление в полицию",
  "Сын сказал что так не бывает, я проверю",
  "Банк предупредил о таких звонках. Встретимся лично",
  "Отдам наличными при встрече, по-другому не буду",
] as const;

const EVENT_TEXT: Record<ThreadEvent["kind"], readonly string[]> = {
  contact: [
    "первый контакт · рассылка",
    "ответил на рассылку",
    "перешёл из объявления",
    "написал сам по ссылке в профиле",
  ],
  call: [
    "исходящий звонок · подмена голоса",
    "звонок 3:41 · пресет «оператор банка»",
    "звонок сброшен клиентом",
    "перезвонил сам · говорили 6 мин",
  ],
  video: [
    "видеозвонок · подмена лица",
    "видео 2:08 · клиент попросил показать лицо",
    "видеозвонок прерван · подозрение",
  ],
  link: [
    "отправлена ссылка · клон страницы",
    "переход по ссылке · мобильный браузер",
    "ссылка открыта повторно",
    "ссылка отправлена второй раз",
  ],
  otp: [
    "код подтверждения продиктован",
    "перехвачен код · вход в кабинет",
    "запрошен повторный код",
  ],
  pay: [
    "списание прошло",
    "перевод получен · карта дропа",
    "оплата «доставки»",
    "второй перевод · дожали",
  ],
  proof: [
    "отправлен сгенерированный чек",
    "отправлен трек-номер",
    "отправлен скриншот баланса",
    "отправлено фото товара",
  ],
  refuse: [
    "клиент отказался переводить",
    "потребовал вернуть деньги",
    "упомянул полицию",
    "передал переписку родственникам",
  ],
};

function buildEvents(rng: Rng, thread: Omit<Thread, "messages" | "events">): ThreadEvent[] {
  const out: ThreadEvent[] = [];
  let n = 0;
  let ago = rng.int(2, 30);

  const push = (kind: ThreadEvent["kind"], amount?: number) => {
    out.push({
      id: `EV-${thread.id}-${n++}`,
      agoMin: ago,
      kind,
      text: rng.pick(EVENT_TEXT[kind]),
      amount,
    });
    ago += rng.int(9, 180);
  };

  // Порядок обратный: сверху свежее, внизу — первый контакт
  if (thread.status === "suspicious" || thread.status === "dead") push("refuse");
  if (thread.stage >= 4) push("pay", thread.askAmount);
  if (thread.stage >= 3) push("otp");
  if (thread.stage >= 3) push("link");
  if (thread.stage >= 2) push("proof");
  if (thread.scheme === "romance" && thread.stage >= 2) push("video");

  const extra = rng.int(4, 8);
  for (let i = 0; i < extra; i++) {
    push(
      rng.weighted<ThreadEvent["kind"]>([
        ["call", 30],
        ["proof", 22],
        ["link", 18],
        ["video", 12],
        ["otp", 10],
        ["refuse", 8],
      ]),
    );
  }

  push("contact");
  return out;
}

function fill(
  text: string,
  ctx: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => ctx[key] ?? m);
}

function buildMessages(rng: Rng, thread: Omit<Thread, "messages">, ctx: Record<string, string>): Message[] {
  const spine = SPINE[thread.scheme].filter((b) => b.stage <= thread.stage);
  const out: Message[] = [];
  let n = 0;

  const pushFiller = (from?: Message["from"]) => {
    const who =
      from ??
      rng.weighted<Message["from"]>([
        ["victim", 44],
        ["operator", 44],
        ["system", 12],
      ]);
    out.push({
      id: `MS-${thread.id}-${n++}`,
      from: who,
      text: rng.pick(FILLER[who]),
      agoMin: 0,
    });
  };

  const pushBeat = (beat: Beat, last = false) => {
    out.push({
      id: `MS-${thread.id}-${n++}`,
      from: beat.from,
      text: fill(beat.text, ctx),
      agoMin: 0,
      attach: beat.attach
        ? {
            kind: beat.attach.kind,
            title: fill(beat.attach.title, ctx),
            sub: fill(beat.attach.sub, ctx),
          }
        : undefined,
    });
    // Вода добавляется после реплики, а не вместо — хребет остаётся целым.
    // После последней реплики её нет: именно она попадает в предпросмотр
    // списка диалогов и должна сходиться с этапом воронки.
    if (!last && rng.chance(0.42)) pushFiller();
  };

  // Завязка
  const head = spine.slice(0, 2);
  const tail = spine.slice(2);
  head.forEach((beat, i) => pushBeat(beat, tail.length === 0 && i === head.length - 1));

  /*
   * Короткая переписка в кадре читается как макет, поэтому диалог добивается
   * «водой» — но в середину, а не в конец. Иначе у диалога на этапе «КОНТАКТ»
   * последней репликой окажется «ладно, доверюсь вам», и строка предпросмотра
   * в списке разойдётся с этапом воронки.
   */
  while (out.length + tail.length < MIN_MESSAGES) {
    pushFiller(out.length % 2 === 0 ? "victim" : "operator");
  }

  tail.forEach((beat, i) => pushBeat(beat, i === tail.length - 1));

  // Сорвавшийся клиент дописывает финальную реплику со стоп-словами:
  // без неё непонятно, почему строка в списке красная
  if (thread.status === "suspicious" || thread.status === "dead") {
    const text = rng.pick(SUSPICIOUS_LINES);
    out.push({
      id: `MS-${thread.id}-${n++}`,
      from: "victim",
      text,
      agoMin: 0,
      flags: RED_FLAGS.filter((f) => text.toLowerCase().includes(f.toLowerCase())),
    });
  }

  // Время: последняя реплика — самая свежая, вверх по ленте всё старше
  let ago = thread.lastMsgMin;
  for (let i = out.length - 1; i >= 0; i--) {
    out[i].agoMin = ago;
    ago += rng.int(1, 14);
  }

  // Новые сверху — дальше лента рисуется flex-col-reverse и упирается в низ
  return out.reverse();
}

/** Один диалог. `index` входит в id, чтобы списки разных мест не совпадали. */
export function makeThread(
  rng: Rng,
  index: number,
  personas: Persona[],
  schemeBias: Scheme,
): Thread {
  // Жертвы — «свои»: переписка идёт по-русски, и на крупном плане имя
  // собеседника должно сходиться с языком реплик
  const country = pickLocalCountry(rng);
  const name = pickName(rng, country);

  // Пул рабочего места перекашивает схемы, но не делает их одинаковыми:
  // десять одинаковых списков в общем плане сразу выдают декорацию
  const scheme = rng.chance(0.55)
    ? schemeBias
    : rng.pick(["goods", "delivery", "romance", "crypto"] as const);

  const status = rng.weighted<ThreadStatus>([
    ["fresh", 16],
    ["talking", 28],
    ["hot", 22],
    ["paid", 14],
    ["suspicious", 11],
    ["dead", 9],
  ]);

  const stage =
    status === "fresh"
      ? 0
      : status === "talking"
        ? rng.int(1, 2)
        : status === "hot"
          ? rng.int(2, 3)
          : status === "paid"
            ? 4
            : status === "suspicious"
              ? rng.int(2, 3)
              : rng.int(1, 2);

  const goods = rng.pick(GOODS_ITEMS);
  const item =
    scheme === "goods"
      ? goods.label
      : scheme === "delivery"
        ? "посылка · наложенный платёж"
        : scheme === "romance"
          ? "«операция маме» · срочный перевод"
          : "вход на площадку по приглашению";

  const askAmount =
    scheme === "goods"
      ? rng.money(goods.min, goods.max)
      : scheme === "delivery"
        ? rng.money(40, 900)
        : scheme === "romance"
          ? rng.money(400, 4_800)
          : rng.money(300, 6_500);

  const persona = personas[rng.int(0, personas.length - 1)];

  return {
    id: `TH-${4000 + index * 3 + rng.int(1, 2)}`,
    name,
    country,
    city: rng.pick(country.cities),
    age: rng.int(28, 79),
    channel: persona.channel,
    handle: `@${rng.pick(HANDLE_WORDS)}${rng.int(100, 999)}`,
    phone: maskPhone(country.cc, country.dial + rng.int(100000, 999999)),
    scheme,
    stage,
    status,
    personaId: persona.id,
    item,
    askAmount,
    paidAmount: status === "paid" ? askAmount : stage >= 4 ? rng.money(50, askAmount) : 0,
    wealth: rng.money(1_800, 68_000),
    readiness:
      status === "paid"
        ? rng.int(92, 100)
        : status === "hot"
          ? rng.int(64, 90)
          : status === "suspicious"
            ? rng.int(4, 22)
            : status === "dead"
              ? rng.int(2, 14)
              : rng.int(18, 58),
    inWorkMin: rng.weighted([
      [rng.int(8, 90), 40],
      [rng.int(90, 600), 38],
      [rng.int(600, 9_600), 22],
    ]),
    lastMsgMin: rng.weighted([
      [rng.int(0, 12), 46],
      [rng.int(12, 90), 34],
      [rng.int(90, 1_400), 20],
    ]),
    unread: rng.weighted([
      [0, 46],
      [rng.int(1, 3), 34],
      [rng.int(4, 12), 20],
    ]),
    online: rng.chance(0.44),
    typing: rng.chance(0.12),
    hook: rng.pick(CHAT_HOOKS),
    note: rng.pick(CHAT_NOTES),
    messages: [],
    events: [],
  };
}

/** Все диалоги одного рабочего места */
export function makeThreads(
  rng: Rng,
  personas: Persona[],
  count: number,
  schemeBias: Scheme,
): Thread[] {
  return Array.from({ length: count }, (_, i) => {
    const thread = makeThread(rng, i, personas, schemeBias);
    const persona = personas.find((p) => p.id === thread.personaId) ?? personas[0];

    const ctx: Record<string, string> = {
      item: thread.item,
      amount: usd(thread.askAmount),
      profit: usd(thread.askAmount * rng.int(4, 9)),
      fee: `${rng.int(8, 18)}%`,
      name: thread.name.split(" ")[0],
      persona: persona.name,
      link: `${BRAND.phish.name.toLowerCase()}-${rng.int(100, 999)}.link`,
      track: `${rng.int(10, 99)}${rng.int(1000000, 9999999)}`,
      doc: `${rng.int(100000, 999999)}`,
      market: BRAND.market.name,
      delivery: BRAND.delivery.name,
      bank: BRAND.bankfake.name,
      exchange: BRAND.exchange.name,
      voice: BRAND.voice.name,
      deepfake: BRAND.deepfake.name,
    };

    return {
      ...thread,
      messages: buildMessages(rng, thread, ctx),
      events: buildEvents(rng, thread),
    };
  });
}

/**
 * Реплика, которой клиент срывается по команде режиссёра (Ctrl+Alt+3).
 * Стоп-слова возвращаются отдельно — их подсвечивает детектор в чате.
 */
export function makeSuspicionLine(rng: Rng): { text: string; flags: string[] } {
  const text = rng.pick(SUSPICIOUS_LINES);
  return {
    text,
    flags: RED_FLAGS.filter((f) => text.toLowerCase().includes(f.toLowerCase())),
  };
}

/** Последняя реплика — строка предпросмотра в списке диалогов */
export function lastLine(thread: Thread): Message | undefined {
  return thread.messages[0];
}
