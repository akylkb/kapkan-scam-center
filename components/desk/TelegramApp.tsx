"use client";

import { Send } from "lucide-react";
import { ChatWindow, type ConvoLine } from "./ChatWindow";
import type { ChatItem } from "@/lib/fixtures/desktop";

/**
 * Telegram на рабочем столе. Разговор — внутренний, между «коллегами»:
 * координация залива и базы. Открывает зрителю кухню, не трогая жертву.
 */
const CONVO: ConvoLine[] = [
  { from: "them", text: "скинул новый пул в папку, 60 строк" },
  { from: "me", text: "принял, разношу по сменам" },
  { from: "them", text: "по 7777 карта сгорела, залив завис" },
  { from: "me", text: "переставил на резерв, нал заберут вечером" },
  { from: "them", text: "ок. чек по последнему переводу кинь" },
  { from: "me", text: "сейчас, обменник подтверждает" },
];

export function TelegramApp({ chats }: { chats: ChatItem[] }) {
  return (
    <ChatWindow
      title="Telegram"
      icon={Send}
      accent="bg-sky-500"
      dot="bg-sky-400"
      iconCls="text-sky-400"
      selfBubble="bg-sky-600/25 text-sky-50"
      theirBubble="bg-zinc-800/80 text-zinc-200"
      chats={chats}
      convo={CONVO}
    />
  );
}
