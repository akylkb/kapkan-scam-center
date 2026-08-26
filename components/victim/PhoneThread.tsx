"use client";

import type { Message } from "@/lib/fixtures/threads";
import { PhoneBubble } from "./PhoneBubble";

/**
 * Лента переписки на телефоне.
 *
 * flex-col-reverse — то же правило, что и у чатера: переписка сама упирается
 * в нижний край и открывается на свежих репликах, без единой строки JS.
 * Поэтому сообщения хранятся новыми вперёд, а разделитель «начало переписки»
 * объявлен последним, хотя рисуется сверху. Автоскролла на рефах здесь нет
 * и быть не должно.
 */
export function PhoneThread({
  messages,
  accent,
  visited,
  onLinkTap,
}: {
  messages: Message[];
  accent: { bubble: string; border: string; check: string };
  /** id реплик, по ссылкам в которых уже перешли */
  visited: Set<string>;
  onLinkTap: (msgId: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto py-2">
      {messages.map((m) => (
        <PhoneBubble
          key={m.id}
          msg={m}
          accent={accent}
          visited={visited.has(m.id)}
          onLinkTap={() => onLinkTap(m.id)}
        />
      ))}

      {/* Чтобы лента не обрывалась в пустоту на самом верху */}
      <p className="px-4 py-3 text-center text-[10px] tracking-[0.1em] text-zinc-700 uppercase">
        сообщения защищены сквозным шифрованием
      </p>
    </div>
  );
}
