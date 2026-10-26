"use client";

import { MessageCircle } from "lucide-react";
import { ChatWindow, type ConvoLine } from "./ChatWindow";
import type { ChatItem } from "@/lib/fixtures/desktop";

/**
 * WhatsApp Web на рабочем столе. Разговор — короткая «товарка»: предлог, под
 * которым идёт развод. Это декорация общего плана; живой чат — на /chat.
 */
const CONVO: ConvoLine[] = [
  { from: "them", text: "Здравствуйте! Объявление ещё актуально?" },
  { from: "me", text: "Да, в наличии. Оформляем доставкой через офиц. сервис." },
  { from: "them", text: "Хорошо. Как оплатить?" },
  { from: "me", text: "Скину ссылку на оплату доставки, там всё по шагам." },
  { from: "them", text: "Открыл. Просит данные карты, это нормально?" },
  { from: "me", text: "Да, это защищённая страница сервиса. Подтвердите кодом из смс." },
];

export function WhatsAppWeb({ chats }: { chats: ChatItem[] }) {
  return (
    <ChatWindow
      title="WhatsApp Web"
      icon={MessageCircle}
      accent="bg-emerald-500"
      dot="bg-emerald-400"
      iconCls="text-emerald-400"
      selfBubble="bg-emerald-600/25 text-emerald-50"
      theirBubble="bg-zinc-800/80 text-zinc-200"
      chats={chats}
      convo={CONVO}
    />
  );
}
