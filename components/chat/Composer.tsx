"use client";

import { useRef, useState } from "react";
import {
  FileCheck2,
  Image as ImageIcon,
  Languages,
  Link2,
  Package,
  Paperclip,
  SendHorizontal,
  Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Rng } from "@/lib/prng";
import { usd } from "@/lib/format";
import type { Persona, PersonaStatus } from "@/lib/fixtures/personas";
import type { PhishLink } from "@/lib/fixtures/chatdesk";
import type { Attach, Thread } from "@/lib/fixtures/threads";
import { TYPING_THROTTLE_MS } from "@/lib/live/protocol";
import { cx } from "@/components/shared/ui";

/**
 * Поле ввода.
 *
 * Слева — генератор доказательств: чек, трек, скрин баланса, фото товара,
 * фишинговая ссылка. Одно нажатие, и в переписке появляется «подтверждение»,
 * которого нет, — на телефоне жертвы оно всплывает в ту же секунду.
 */
const PROOFS = [
  { kind: "receipt", icon: FileCheck2, label: "Чек" },
  { kind: "track", icon: Package, label: "Трек" },
  { kind: "balance", icon: Wallet, label: "Баланс" },
  { kind: "photo", icon: ImageIcon, label: "Фото" },
  { kind: "link", icon: Link2, label: "Ссылка" },
] as const satisfies readonly { kind: Attach["kind"]; icon: typeof FileCheck2; label: string }[];

/**
 * Что именно уходит жертве при нажатии на кнопку доказательства.
 *
 * Числа берутся из детерминированного генератора, засеянного диалогом:
 * дубль 1 и дубль 7 должны показать один и тот же трек-номер.
 */
function makeProof(
  kind: Attach["kind"],
  thread: Thread,
  link: PhishLink,
): { text: string; attach: Attach } {
  const rng = new Rng(`proof-${thread.id}-${kind}`);

  switch (kind) {
    case "receipt":
      return {
        text: "Отправляю чек, оплата прошла — всё зафиксировано в системе.",
        attach: {
          kind,
          title: `Чек №${rng.int(100_000, 999_999)}`,
          sub: `${BRAND.psp.name} · ${usd(thread.askAmount)} · проведён`,
        },
      };
    case "track":
      return {
        text: "Посылка уже в пути, вот трек-номер — отслеживайте.",
        attach: {
          kind,
          title: `${rng.pick(["RS", "CT", "MX"])}${rng.int(100_000_000, 999_999_999)}RU`,
          sub: `${BRAND.delivery.name} · принято в сортировочном центре`,
        },
      };
    case "balance":
      return {
        text: "Смотрите сами: деньги на счёте, вывод откроется после подтверждения.",
        attach: {
          kind,
          title: usd(thread.askAmount * rng.int(3, 9)),
          sub: `${BRAND.broker.name} · личный кабинет · скриншот`,
        },
      };
    case "photo":
      return {
        text: "Вот фото, состояние отличное — как и договаривались.",
        attach: {
          kind,
          title: `IMG_${rng.int(1000, 9999)}.jpg`,
          sub: `${thread.item} · ${rng.int(2, 8)} фото в альбоме`,
        },
      };
    case "link":
      return {
        text: "Оформление по ссылке, займёт минуту. Реквизиты вводите как в банке.",
        attach: {
          kind,
          title: link.url,
          sub: `${link.label} · защищённое соединение`,
        },
      };
  }
}

export function Composer({
  thread,
  persona,
  bannedStatus,
  link,
  onSend,
  onTyping,
}: {
  thread: Thread;
  persona: Persona;
  /** Личина в бане — писать нечем, поле блокируется */
  bannedStatus: PersonaStatus;
  /** Фишинговая ссылка рабочего места — уходит по кнопке «Ссылка» */
  link: PhishLink;
  /** Отправить реплику в ленту чата и на телефон жертвы */
  onSend: (text: string, attach?: Attach) => void;
  /** Актёр набирает текст: у жертвы загорается «печатает…» */
  onTyping: () => void;
}) {
  const banned = bannedStatus === "banned";

  // Черновик живёт в компоненте: при переключении диалога Composer
  // перемонтируется вместе с ChatThread, и поле само очищается
  const [draft, setDraft] = useState("");

  // «Печатает…» повторяется не чаще раза в секунду: на каждую нажатую клавишу
  // слать сообщение по сети незачем, а актёр печатает быстро
  const typedAt = useRef(0);

  function send() {
    const text = draft.trim();
    if (!text || banned) return;
    onSend(text);
    setDraft("");
  }

  function signalTyping() {
    const now = Date.now();
    if (now - typedAt.current < TYPING_THROTTLE_MS) return;
    typedAt.current = now;
    onTyping();
  }

  return (
    <div
      className={cx(
        "flex h-[92px] shrink-0 flex-col justify-center gap-1.5 border-t bg-[#0b0b0e] px-3",
        banned ? "border-rose-800/60" : "border-zinc-800",
      )}
    >
      <div className="flex items-center gap-1">
        {PROOFS.map((p) => (
          <button
            key={p.label}
            disabled={banned}
            onClick={() => {
              if (banned) return;
              const proof = makeProof(p.kind, thread, link);
              onSend(proof.text, proof.attach);
            }}
            className={cx(
              "flex items-center gap-1 rounded-[3px] border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.06em] transition-colors",
              banned
                ? "border-zinc-900 bg-zinc-900/40 text-zinc-700"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-cyan-800/60 hover:text-cyan-300",
            )}
          >
            <p.icon className="h-3 w-3" strokeWidth={1.8} />
            {p.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] text-zinc-600">
          <Languages className="h-3 w-3" />
          язык RU · орфография проверена
        </span>
      </div>

      <div
        className={cx(
          "flex h-[34px] items-center gap-2 rounded-[4px] border px-2.5",
          banned ? "border-rose-900/60 bg-rose-950/20" : "border-zinc-800 bg-zinc-900/60",
        )}
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
        {banned ? (
          <span className="flex-1 text-[12px] text-rose-300">
            Аккаунт {persona.handle} заблокирован — переписка недоступна
          </span>
        ) : (
          /*
            Настоящее поле: актёр печатает реплику прямо в кадре и отправляет
            её в ленту. select-text — потому что выделение отключено глобально,
            а в поле ввода оно нужно.
          */
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              signalTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            placeholder="Введите сообщение"
            className="_typeMessage flex-1 select-text bg-transparent text-[12.5px] text-[#04b404] placeholder:text-zinc-600"
          />
        )}
        <button
          onClick={send}
          disabled={banned || draft.trim().length === 0}
          className={cx(
            "flex h-[24px] w-[26px] shrink-0 items-center justify-center rounded-[3px] transition-colors",
            banned || draft.trim().length === 0
              ? "bg-zinc-800 text-zinc-600"
              : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
          )}
        >
          <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>

      <p className="flex items-center justify-between font-mono text-[8.5px] text-zinc-600">
        <span>
          пишем от {persona.handle} · {persona.legend}
        </span>
        <span>
          шаблон «{BRAND.chat.name}-{thread.scheme.toUpperCase()}» ·{" "}
          {banned ? "отправка заблокирована" : "Enter — отправить"}
        </span>
      </p>
    </div>
  );
}
