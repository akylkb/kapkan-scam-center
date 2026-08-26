/**
 * Номер рабочего места приходит из URL: /crm/7/
 *
 * На площадке каждая из десяти машин открывается со своим номером —
 * так экраны не повторяются в общем плане. Значение вне диапазона
 * приводится к 1..99, чтобы опечатка в адресной строке не сломала дубль.
 *
 * Номер лежит в пути (/crm/7/), а не в query: сборка статическая, и каждое
 * место должно превратиться в отдельный готовый HTML на диске.
 */
export const MAX_SEAT = 99;

export function parseSeat(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_SEAT, Math.max(1, n));
}

/** Места, под которые собираются страницы: весь диапазон, чтобы не было 404. */
export const SEATS = Array.from({ length: MAX_SEAT }, (_, i) => i + 1);

/** Список путей для generateStaticParams на всех трёх рабочих экранах. */
export function seatStaticParams() {
  return SEATS.map((seat) => ({ seat: String(seat) }));
}
