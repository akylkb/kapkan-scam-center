"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildChatDesk, openingThreadId } from "@/lib/fixtures/chatdesk";
import type { Message } from "@/lib/fixtures/threads";
import {
  selectEpoch,
  selectSigCall,
  selectSigLost,
  useSceneDispatch,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { useLiveMessages, useLiveSend, useLiveStatus } from "@/lib/live/LiveProvider";
import { LIVE_STATUS_LABEL, TYPING_TTL_MS } from "@/lib/live/protocol";
import { cx } from "@/components/shared/ui";
import { VictimPhone } from "./VictimPhone";
import { PhoneStatusBar } from "./PhoneStatusBar";
import { PhoneChatHeader } from "./PhoneChatHeader";
import { PhoneThread } from "./PhoneThread";
import { PhoneComposer } from "./PhoneComposer";
import { IncomingCall } from "./IncomingCall";

/**
 * Телефон жертвы: вторая половина живого чата.
 *
 * Экран следует за чатером — тот объявляет открытый диалог сообщением focus,
 * и телефон перерисовывается под нужного собеседника. Пока чатер не запущен,
 * оба экрана открываются на одном и том же диалоге (openingThreadId), поэтому
 * порядок включения машин на площадке значения не имеет.
 *
 * Фикстура здесь та же, что у чатера, и детерминирована по номеру места:
 * история переписки на обоих экранах совпадает до реплики.
 */

/** Цвет мессенджера: у каждого канала свой, как и в жизни */
const ACCENTS = {
  whatsapp: {
    bubble: "bg-emerald-600/35",
    border: "border-emerald-500/40",
    check: "text-emerald-300",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    send: "bg-emerald-500 hover:bg-emerald-400",
  },
  telegram: {
    bubble: "bg-sky-600/35",
    border: "border-sky-500/40",
    check: "text-sky-300",
    text: "text-sky-300",
    dot: "bg-sky-400",
    send: "bg-sky-500 hover:bg-sky-400",
  },
  instagram: {
    bubble: "bg-fuchsia-600/35",
    border: "border-fuchsia-500/40",
    check: "text-fuchsia-300",
    text: "text-fuchsia-300",
    dot: "bg-fuchsia-400",
    send: "bg-fuchsia-500 hover:bg-fuchsia-400",
  },
} as const;

export function VictimScreen({ seat }: { seat: number }) {
  const desk = useMemo(() => buildChatDesk(seat), [seat]);
  const openingId = useMemo(() => openingThreadId(desk, seat), [desk, seat]);

  // Что чатер объявил открытым. null — он ещё не запущен, держим стартовый
  const [focus, setFocus] = useState<{ threadId: string; personaId: string } | null>(null);
  const [injected, setInjected] = useState<Record<string, Message[]>>({});
  /** Реплики, стёртые чатером: у жертвы они исчезают тем же движением */
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [typing, setTyping] = useState(false);
  const [callFrom, setCallFrom] = useState<string | null>(null);
  /** Реплики, по ссылкам в которых жертва уже перешла */
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentRef = useRef(0);

  const live = useLiveSend();
  const status = useLiveStatus();
  const dispatch = useSceneDispatch();

  const epoch = useSceneValue(selectEpoch);
  const sigCall = useSceneValue(selectSigCall);
  const sigLost = useSceneValue(selectSigLost);

  const thread =
    desk.threads.find((t) => t.id === (focus?.threadId ?? openingId)) ?? desk.threads[0];
  const persona =
    desk.personas.find((p) => p.id === (focus?.personaId ?? thread.personaId)) ??
    desk.personas[0];

  const accent = ACCENTS[persona.channel];

  /**
   * Что видно на телефоне.
   *
   * Служебные строки чатера («перевод получен · карта дропа», «аккаунт
   * заблокирован») отсекаются здесь: это его технический журнал, жертва их
   * видеть не может ни при каких обстоятельствах.
   */
  const messages = useMemo(() => {
    const own = injected[thread.id] ?? [];
    return [...own, ...thread.messages].filter(
      (m) => m.from !== "system" && !removed.has(m.id),
    );
  }, [injected, thread, removed]);

  const push = useCallback((threadId: string, msg: Message) => {
    setInjected((prev) => {
      const list = prev[threadId] ?? [];
      if (list.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [threadId]: [msg, ...list] };
    });
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      const threadId = thread.id;
      const id =
        live({ t: "say", from: "victim", threadId, text }) ??
        `IN-victim-${(sentRef.current += 1)}`;
      push(threadId, { id, from: "victim", text, agoMin: 0, live: true });
    },
    [thread.id, live, push],
  );

  const handleTyping = useCallback(() => {
    live({ t: "typing", from: "victim", threadId: thread.id });
  }, [thread.id, live]);

  /**
   * Жертва тапнула фишинговую ссылку.
   *
   * Уходит обычным событием сцены — тем самым, что висит на Ctrl+Alt+9.
   * Отдельного сообщения для тапа нет намеренно: у чатера тогда было бы два
   * разных пути к одному результату, и однажды они бы разошлись. Заодно тап
   * попадает в тикер и на экран-стену, как и положено переходу по ссылке.
   */
  const handleLinkTap = useCallback(
    (msgId: string) => {
      setVisited((prev) => (prev.has(msgId) ? prev : new Set(prev).add(msgId)));
      dispatch("link.opened");
    },
    [dispatch],
  );

  useLiveMessages((msg, meta) => {
    if (msg.t === "focus") {
      setFocus({ threadId: msg.threadId, personaId: msg.personaId });
      return;
    }

    if (msg.t === "say") {
      // Эхо своей реплики от сервера — подтверждение доставки
      if (meta.own) {
        setInjected((prev) => {
          const list = prev[msg.threadId];
          if (!list) return prev;
          let changed = false;
          const next = list.map((m) => {
            if (m.id !== meta.id || m.delivered) return m;
            changed = true;
            return { ...m, delivered: true };
          });
          return changed ? { ...prev, [msg.threadId]: next } : prev;
        });
        return;
      }

      if (msg.from === "operator") setTyping(false);
      push(msg.threadId, {
        id: meta.id,
        from: msg.from,
        text: msg.text,
        agoMin: 0,
        attach: msg.attach,
        live: true,
        delivered: true,
      });
      return;
    }

    // Чатер стёр реплику — снимаем и здесь. Удаление приходит по той же
    // комнате, что и переписка, поэтому доходит и до соседней машины
    if (msg.t === "unsay") {
      setRemoved((prev) => (prev.has(msg.msgId) ? prev : new Set(prev).add(msg.msgId)));
      return;
    }

    if (msg.t === "typing" && msg.from === "operator") {
      setTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), TYPING_TTL_MS);
    }
  });

  // Ctrl+Alt+1 — телефон звонит. Личина в момент звонка запоминается:
  // если чатер переключит диалог, звонок на экране не должен «переобуться»
  useEffect(() => {
    if (sigCall === 0) return;
    setCallFrom(persona.id);
    // Диалог читается в момент события и не должен сам вызывать эффект
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigCall]);

  // Ctrl+Alt+3 — клиент сорвался: трубка брошена
  useEffect(() => {
    if (sigLost === 0) return;
    setCallFrom(null);
  }, [sigLost]);

  // Ctrl+Alt+R — сброс дубля. Прилетает и с соседней машины: событие идёт
  // по той же шине, что и переписка
  useEffect(() => {
    if (epoch === 0) return;
    setFocus(null);
    setInjected({});
    setRemoved(new Set());
    setTyping(false);
    setCallFrom(null);
    setVisited(new Set());
  }, [epoch]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  const caller = desk.personas.find((p) => p.id === callFrom);

  return (
    <VictimPhone>
      <PhoneStatusBar />
      <PhoneChatHeader persona={persona} typing={typing} accent={accent} />
      <PhoneThread
        messages={messages}
        accent={accent}
        visited={visited}
        onLinkTap={handleLinkTap}
      />
      <PhoneComposer accent={accent} onSend={handleSend} onTyping={handleTyping} />

      {caller && <IncomingCall persona={caller} onDismiss={() => setCallFrom(null)} />}

      {/*
        Служебная строка: в кадр не попадает (она за корпусом телефона, в углу),
        но режиссёру с одного взгляда видно, связаны экраны или нет. Без неё
        рассинхрон обнаруживается только на дубле.
      */}
      <ServiceLine
        seat={seat}
        threadId={thread.id}
        following={focus !== null}
        status={status}
      />
    </VictimPhone>
  );
}

function ServiceLine({
  seat,
  threadId,
  following,
  status,
}: {
  seat: number;
  threadId: string;
  following: boolean;
  status: keyof typeof LIVE_STATUS_LABEL;
}) {
  return (
    <p className="pointer-events-none fixed bottom-2 left-3 flex gap-3 font-mono text-[9px] tracking-[0.1em] text-zinc-800 uppercase">
      <span>место {String(seat).padStart(2, "0")}</span>
      <span>{threadId}</span>
      <span>{following ? "следую за оператором" : "оператор не в сети"}</span>
      <span className={cx(status === "net" && "text-zinc-700")}>
        {LIVE_STATUS_LABEL[status]}
      </span>
    </p>
  );
}
