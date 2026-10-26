"use client";

import { useMemo } from "react";
import {
  Landmark,
  MessageCircle,
  Send,
  Table2,
  Wifi,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { buildDesktop } from "@/lib/fixtures/desktop";
import { BigClock } from "@/components/shared/SceneClock";
import { cx } from "@/components/shared/ui";
import { BankApp } from "./BankApp";
import { SheetApp } from "./SheetApp";
import { WhatsAppWeb } from "./WhatsAppWeb";
import { TelegramApp } from "./TelegramApp";

/**
 * Рабочий стол оператора: четыре окна открыты разом — банк-клиент, таблица
 * базы, WhatsApp Web, Telegram. Весь «кухонный» набор конторы в одном общем
 * плане. Сетка 2×2 заполняет кадр целиком, пустого стола нет.
 *
 * Содержимое детерминировано по номеру места (buildDesktop), как и у всех
 * экранов: десять машин — десять разных столов.
 */
const DOCK = [
  { icon: Landmark, label: BRAND.bankfake.short, cls: "text-violet-300" },
  { icon: Table2, label: "Таблицы", cls: "text-emerald-300" },
  { icon: MessageCircle, label: "WhatsApp", cls: "text-emerald-300" },
  { icon: Send, label: "Telegram", cls: "text-sky-300" },
] as const;

export function DesktopScreen({ seat }: { seat: number }) {
  const data = useMemo(() => buildDesktop(seat), [seat]);

  return (
    <div className="grid-bg flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Меню-бар ОС */}
      <header className="flex h-7 shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#0b0b0e]/90 px-3 font-mono text-[10px] text-zinc-500">
        <span className="font-semibold tracking-[0.1em] text-zinc-300">{BRAND.org.name}</span>
        <span className="text-zinc-700">·</span>
        <span>{BRAND.org.office}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            {BRAND.voip.name}-VPN
          </span>
          <span className="tnum">SEAT-{String(seat).padStart(2, "0")}</span>
        </span>
      </header>

      {/* Четыре окна */}
      <div className="grid min-h-0 flex-1 grid-cols-[1.12fr_1fr] grid-rows-2 gap-2.5 p-2.5">
        <BankApp accounts={data.accounts} transfers={data.transfers} />
        <SheetApp rows={data.sheet} />
        <WhatsAppWeb chats={data.wa} />
        <TelegramApp chats={data.tg} />
      </div>

      {/* Таскбар-док */}
      <footer className="flex h-11 shrink-0 items-center gap-2 border-t border-zinc-800 bg-[#0b0b0e]/90 px-3">
        {DOCK.map((d) => (
          <div
            key={d.label}
            className="flex items-center gap-1.5 rounded-[4px] border border-zinc-800 bg-zinc-900/60 px-2.5 py-1"
          >
            <d.icon className={cx("h-3.5 w-3.5", d.cls)} strokeWidth={1.8} />
            <span className="font-mono text-[9.5px] text-zinc-400">{d.label}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-zinc-500" />
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <BigClock />
        </div>
      </footer>
    </div>
  );
}
