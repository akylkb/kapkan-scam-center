/**
 * Форматирование чисел и времени.
 *
 * Всё намеренно детерминированно и без Intl-локалей, зависящих от машины:
 * на площадке экраны должны выглядеть одинаково независимо от настроек ОС.
 */

/** 124580 → "124 580" (неразрывные пробелы, чтобы не рвалось в узкой колонке) */
export function groupDigits(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(value)).toString();
  let out = "";
  for (let i = 0; i < abs.length; i++) {
    if (i > 0 && (abs.length - i) % 3 === 0) out += " ";
    out += abs[i];
  }
  return sign + out;
}

/** 124580 → "$124 580" */
export function usd(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}$${groupDigits(Math.abs(value))}`;
}

/** 124580.4 → "$124 580.40" — для баланса жертвы, где важны копейки */
export function usdCents(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const cents = Math.round((abs % 1) * 100)
    .toString()
    .padStart(2, "0");
  return `${sign}$${groupDigits(Math.floor(abs))}.${cents}`;
}

/** 184320 → "184.3K", 2400000 → "2.4M" — для крупных цифр на стене */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toString();
}

/** 0.124 → "12.4%" */
export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** +18.4 → "+18.4%" со знаком */
export function signedPct(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}%`;
}

/** 277 секунд → "04:37" */
export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Минуты от полуночи → "16:42" (с опциональным смещением часового пояса) */
export function clock(minutesFromMidnight: number, offsetHours = 0): string {
  const total = Math.floor(minutesFromMidnight + offsetHours * 60);
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  return `${h.toString().padStart(2, "0")}:${(wrapped % 60).toString().padStart(2, "0")}`;
}

/**
 * Маскировка телефона: реальный номер в кадр не попадает никогда.
 *
 * Код страны передаётся явным аргументом. Угадывать его по длине номера
 * нельзя — получается «+6» вместо «+61» и «+3» вместо «+34», а такую
 * ошибку зритель, знающий свой код, замечает мгновенно.
 *
 * maskPhone("49", "555812482") → "+49 5** ****482"
 *
 * Открыта одна цифра абонентской части, а не две: префикс у всех номеров
 * страны одинаковый (диапазон для кино), и при двух видимых цифрах колонка
 * телефонов выглядит скопированной.
 */
export function maskPhone(countryCode: string, local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.length < 6) return `+${countryCode} ${digits}`;
  const tail = digits.slice(-3);
  const hidden = "*".repeat(digits.length - 4);
  return `+${countryCode} ${digits[0]}${hidden.slice(0, 2)} ${hidden.slice(2)}${tail}`;
}

/**
 * Маскировка номера карты. Полный номер в кадр не попадает никогда —
 * ни настоящий, ни сгенерированный: на стоп-кадре зритель его перепишет.
 *
 * maskCard("8134") → "•••• •••• •••• 8134"
 */
export function maskCard(last4: string): string {
  return `•••• •••• •••• ${last4.slice(-4).padStart(4, "0")}`;
}

/**
 * Крипто-адрес: открыты только начало и конец, середина скрыта.
 * Полный адрес не показываем сознательно — иначе его можно проверить
 * в блокчейне, а любое совпадение с реальным кошельком недопустимо.
 *
 * maskWallet("TQm4", "7bXe") → "TQm4••••••••••7bXe"
 */
export function maskWallet(head: string, tail: string): string {
  return `${head}${"•".repeat(10)}${tail}`;
}

/** "12 мин назад" — принимает готовое число минут, чтобы не зависеть от Date */
export function agoLabel(minutes: number): string {
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

