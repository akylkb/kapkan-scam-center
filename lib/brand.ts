/**
 * Все названия, встречающиеся в кадре, собраны здесь.
 * Если юристы продакшена попросят переименовать — правится только этот файл.
 *
 * ВАЖНО: все бренды вымышленные. Ни одного реального брокера, платёжной
 * системы, CRM или домена. Проверено на пересечения с существующими компаниями.
 */

export const BRAND = {
  /** CRM колл-центра — то, что видят операторы */
  crm: {
    name: "VORTEX",
    suffix: "TS",
    full: "VORTEX·TS",
    version: "4.11.2-ent",
    tagline: "Trading Suite",
  },

  /** «Брокер» — то, что видит жертва */
  broker: {
    name: "AURUM CAPITAL",
    short: "AURUM",
    domain: "aurum-capital.trade",
    license: "IFSC/60/512/TS/24",
    support: "support@aurum-capital.trade",
  },

  /** Платёжный «провайдер» */
  psp: {
    name: "PayNordic",
    domain: "paynordic.io",
  },

  /** Внутреннее название конторы — в шапке админки */
  org: {
    name: "MERIDIAN GROUP",
    office: "OFFICE-04 · BISHKEK",
  },

  /** VoIP-провайдер в техническом логе */
  voip: {
    name: "TALKGRID",
  },

  /** Софт удалённого доступа (аналог AnyDesk из расследований) */
  rat: {
    name: "REMOTEVIEW",
  },

  /** Внутренняя панель отдела вывода — то, что видит дроповод */
  payout: {
    name: "TRANZIT",
    suffix: "OPS",
    full: "TRANZIT·OPS",
    version: "2.7.4-int",
    tagline: "Payout Operations",
  },

  /** «Обменник», через который деньги уходят в крипту */
  exchange: {
    name: "SWIFTBIT",
    domain: "swiftbit.exchange",
  },

  /** Кошелёк-накопитель в конце цепочки */
  vault: {
    name: "COLDNEST",
  },

  /** Панель отдела мессенджеров — то, что видит чатер */
  chat: {
    name: "LUREBOX",
    suffix: "MP",
    full: "LUREBOX·MP",
    version: "3.8.1-mp",
    tagline: "Messenger Panel",
  },

  /** Конструктор фишинговых страниц-клонов */
  phish: {
    name: "CLONEKIT",
  },

  /** Сервис, куда падают перехваченные SMS-коды */
  otp: {
    name: "SMSHUB",
  },

  /** Подмена голоса в звонке */
  voice: {
    name: "VOXSHIFT",
  },

  /** Подмена лица в видеозвонке */
  deepfake: {
    name: "FACEFORGE",
  },

  /** Массовая рассылка первых сообщений */
  blast: {
    name: "SPRAYER",
  },

  /**
   * Дальше — вымышленные «жертвы клонирования»: под них косят фишинговые
   * страницы. Существующие маркетплейсы, службы доставки и банки в кадр
   * не попадают ни под каким видом.
   */
  market: {
    name: "БАРАХОЛКА",
    domain: "baraholka.market",
  },
  delivery: {
    name: "СКОРОХОД",
    domain: "skorohod-post.net",
  },
  bankfake: {
    name: "ПЕРВЫЙ КРЕДИТНЫЙ",
    short: "ПКБ",
    domain: "pkb-online.bank",
  },
} as const;

/** Отделы — «деск» определяет, кому какие лиды падают */
export const DESKS = [
  { id: "conv-ru", label: "КОНВЕРСИЯ · RU", short: "КОНВ" },
  { id: "ret-ru", label: "РЕТЕНШН · RU", short: "РЕТ" },
  { id: "ret-eu", label: "РЕТЕНШН · EU", short: "РЕТ" },
  { id: "conv-eu", label: "КОНВЕРСИЯ · EU", short: "КОНВ" },
  { id: "recovery", label: "RECOVERY DESK", short: "REC" },
] as const;

export type DeskId = (typeof DESKS)[number]["id"];

/**
 * Пулы дропов — то же, что деск у оператора, только в отделе вывода.
 * Пул определяет, какими картами и в какой стране работает дроповод.
 */
export const DROP_POOLS = [
  { id: "kz-retail", label: "ПУЛ · KZ-РОЗНИЦА", short: "KZ-РОЗН" },
  { id: "ru-cards", label: "ПУЛ · RU-КАРТЫ", short: "RU-КАРТ" },
  { id: "uz-transfer", label: "ПУЛ · UZ-ПЕРЕВОДЫ", short: "UZ-ПЕР" },
  { id: "crypto", label: "ПУЛ · КРИПТА", short: "КРИПТА" },
  { id: "reserve", label: "ПУЛ · РЕЗЕРВ", short: "РЕЗЕРВ" },
] as const;

export type DropPoolId = (typeof DROP_POOLS)[number]["id"];

/**
 * Пулы чатеров — по какой схеме работает рабочее место.
 * Пул задаёт перекос по схемам: у «товарки» почти всё — продажа
 * несуществующего товара, у «романтики» — долгие диалоги.
 */
export const CHAT_POOLS = [
  { id: "goods", label: "ПУЛ · ТОВАРКА", short: "ТОВАР" },
  { id: "delivery", label: "ПУЛ · ДОСТАВКА", short: "ДОСТАВ" },
  { id: "bank", label: "ПУЛ · БАНК-СБ", short: "БАНК-СБ" },
  { id: "romance", label: "ПУЛ · РОМАНТИКА", short: "РОМАН" },
  { id: "crypto", label: "ПУЛ · КРИПТА", short: "КРИПТА" },
] as const;

export type ChatPoolId = (typeof CHAT_POOLS)[number]["id"];
