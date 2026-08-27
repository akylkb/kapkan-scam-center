"use client";

import { CornerDownLeft, TriangleAlert } from "lucide-react";
import { STAGES, type Scheme, type Thread } from "@/lib/fixtures/threads";
import { cx } from "@/components/shared/ui";

/**
 * Подсказки скрипта.
 *
 * Реплики подобраны так, чтобы читаться с монитора за спиной актёра: это
 * и есть «искусственный интеллект» конторы — заранее написанные фразы,
 * которые оператор жмёт не глядя.
 */
const SUGGESTIONS: Record<Scheme, readonly string[]> = {
  goods: [
    "Здравствуйте) Да, актуально, состояние отличное",
    "Могу придержать до вечера, но не дольше",
    "Отдам дешевле, если заберёте сегодня",
    "Оформим через безопасную сделку, так надёжнее",
    "Отправлю ссылку, там бронь на два часа",
    "Деньги спишутся только после получения",
    "Это стандартный залог, он возвращается",
    "Сейчас пришлю трек-номер, посылка уже в пути",
    "Не переживайте, у нас сотни таких сделок",
  ],
  delivery: [
    "На ваше имя посылка, хранение оплачено до завтра",
    "Отправитель указан, содержимое не раскрывается",
    "Доплата за доставку — сумма небольшая",
    "Соединяю со специалистом банка, оставайтесь на линии",
    "С вашей карты пытались списать средства",
    "Переведём деньги на резервный счёт, это безопасно",
    "Продиктуйте код из СМС, он для отмены операции",
    "Никому кроме меня код не сообщайте",
    "Средства вернутся в течение суток",
  ],
  romance: [
    "Мы точно раньше не пересекались? Лицо знакомое",
    "Вы очень хороший собеседник, сейчас это редкость",
    "Давайте я голосовое запишу, печатать долго",
    "Могу созвониться по видео, только связь слабая",
    "У меня беда, и обратиться больше не к кому",
    "Мне неудобно просить, я всё верну с зарплаты",
    "Вы единственный, кто меня понимает",
    "Не говорите никому, мне очень стыдно",
    "Вот ссылка на оплату счёта, там всё официально",
  ],
  crypto: [
    "Помните, я говорил про площадку? Зашёл, не пожалел",
    "Смотрите сами, вот кабинет",
    "Вывод на карту приходит минут за двадцать",
    "Вход только по приглашению, у меня две ссылки",
    "С этой суммы процент ниже, я бы заходил вдвое",
    "Могу показать выписку по последнему выводу",
    "Площадка старая, работает четвёртый год",
    "Сначала комиссия, потом вывод — это как везде",
    "Если сомневаетесь, заходите минималкой",
  ],
  job: [
    "Здравствуйте) Да, набор идёт, места ещё есть",
    "Занятость 2–3 часа в день, график ставите сами",
    "Оформление удалённое, договор пришлю на подпись",
    "Мы платёжный агент, всё официально",
    "Нужна карта на ваше имя и паспорт для договора",
    "Первую выплату получите уже завтра",
    "Сегодня пришлём тестовый перевод, сумма небольшая",
    "Снимаете наличными и передаёте курьеру, он подъедет сам",
    "Ваш процент начислю вечером, ничего вкладывать не нужно",
  ],
};

export function SuggestBar({
  thread,
  blown,
  onTool,
}: {
  thread: Thread;
  /** Клиент заподозрил — вместо подсказок красная плашка */
  blown: boolean;
  onTool: (tool: "voice") => void;
}) {
  if (blown) {
    return (
      <div className="flex h-[74px] shrink-0 items-center gap-3 border-t border-rose-800/60 bg-rose-950/30 px-3">
        <TriangleAlert className="h-6 w-6 shrink-0 animate-throb text-rose-400" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12px] font-bold tracking-[0.1em] text-rose-300 uppercase">
            Слив · клиент заподозрил
          </p>
          <p className="truncate text-[11px] text-rose-200/70">
            Стоп-слова в последней реплике. Переключись на скрипт отказа или уводи на голос —
            текстом уже не вытянешь.
          </p>
        </div>
        <button
          onClick={() => onTool("voice")}
          className="shrink-0 rounded-[3px] border border-rose-700/60 bg-rose-900/40 px-3 py-1.5 text-[11px] text-rose-200 transition-colors hover:bg-rose-900/70"
        >
          Позвонить голосом
        </button>
      </div>
    );
  }

  const list = SUGGESTIONS[thread.scheme];
  // Подсказки зависят от этапа: на «оплате» и на «контакте» это разные фразы
  const picks = [0, 1, 2].map((i) => list[(thread.stage * 3 + i) % list.length]);

  return (
    <div className="flex h-[74px] shrink-0 flex-col justify-center gap-1 border-t border-zinc-800 bg-[#0b0b0e] px-3">
      <p className="font-mono text-[8.5px] tracking-[0.18em] text-zinc-600 uppercase">
        Подсказка скрипта · этап «{STAGES[thread.stage]}»
      </p>
      <div className="flex gap-1.5">
        {picks.map((text, i) => (
          <button
            key={i}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[3px] border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-left transition-colors hover:border-cyan-800/60 hover:bg-cyan-950/30"
          >
            <span
              className={cx(
                "shrink-0 rounded-[2px] px-1 font-mono text-[8px] font-bold",
                i === 0 ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-500",
              )}
            >
              F{i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{text}</span>
            <CornerDownLeft className="h-3 w-3 shrink-0 text-zinc-700" />
          </button>
        ))}
      </div>
    </div>
  );
}
