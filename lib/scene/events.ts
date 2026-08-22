/**
 * События сцены — то, чем режиссёр управляет с клавиатуры во время дубля.
 *
 * Раскладка вынесена сюда, потому что она печатается на шпаргалку
 * для площадки (см. README).
 */

export type SceneEventKind =
  | "call.incoming"
  | "deposit"
  | "client.lost"
  | "whale"
  | "withdraw.request"
  | "drop.burned"
  | "payout.sent"
  | "link.opened"
  | "account.banned"
  | "alarm"
  | "freeze"
  | "reset";

export type DirectorKey = {
  kind: SceneEventKind;
  /** Символ клавиши в сочетании Ctrl+Alt+_ */
  key: string;
  label: string;
  hint: string;
};

export const DIRECTOR_KEYS: readonly DirectorKey[] = [
  {
    kind: "call.incoming",
    key: "1",
    label: "Входящий звонок",
    hint: "Софтфон поднимает трубку, таймер с нуля",
  },
  {
    kind: "deposit",
    key: "2",
    label: "Депозит зачислен",
    hint: "Зелёная вспышка, счётчики скачут, тикер",
  },
  {
    kind: "client.lost",
    key: "3",
    label: "Клиент сорвался",
    hint: "Красный статус, звонок обрывается",
  },
  {
    kind: "whale",
    key: "4",
    label: "VIP-кит",
    hint: "Крупный депозит, лидерборд перестраивается",
  },
  {
    kind: "withdraw.request",
    key: "5",
    label: "Запрос на вывод",
    hint: "У жертвы — модалка «налог 10%», в CRM — тревожная заявка",
  },
  {
    kind: "alarm",
    key: "6",
    label: "ТРЕВОГА / рейд",
    hint: "Всё краснеет, домен заблокирован, сессии рвутся",
  },
  {
    kind: "drop.burned",
    key: "7",
    label: "Дроп сгорел",
    hint: "У дроповода карта краснеет, залив по ней срывается",
  },
  {
    kind: "payout.sent",
    key: "8",
    label: "Залив ушёл",
    hint: "Деньги прошли цепочку, касса и счётчик вывода прыгают",
  },
  {
    kind: "link.opened",
    key: "9",
    label: "Жертва открыла ссылку",
    hint: "У чатера прилетает переход, вводятся данные карты, падает SMS-код",
  },
  {
    kind: "account.banned",
    key: "B",
    label: "Личину забанили",
    hint: "Аккаунт чатера краснеет, переписка обрывается на полуслове",
  },
  {
    kind: "freeze",
    key: "0",
    label: "Заморозить анимации",
    hint: "Стоп-кадр для установки света. Повторно — разморозить",
  },
  {
    kind: "reset",
    key: "R",
    label: "СБРОС ДУБЛЯ",
    hint: "Вернуть исходное состояние перед новым дублем",
  },
] as const;

export type FeedItem = {
  id: number;
  kind:
    | "deposit"
    | "lost"
    | "join"
    | "call"
    | "withdraw"
    | "alarm"
    | "upgrade"
    | "payout"
    | "burn"
    | "link"
    | "ban";
  text: string;
  amount?: number;
  /** Тик сцены, когда событие появилось */
  at: number;
};
