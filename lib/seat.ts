/**
 * Номер рабочего места приходит из URL: /crm?seat=7
 *
 * На площадке каждая из десяти машин открывается со своим номером —
 * так экраны не повторяются в общем плане. Значение вне диапазона
 * приводится к 1..99, чтобы опечатка в адресной строке не сломала дубль.
 */
export const MAX_SEAT = 99;

export function parseSeat(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_SEAT, Math.max(1, n));
}
