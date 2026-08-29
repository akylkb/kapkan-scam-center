"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rng } from "@/lib/prng";
import { BRAND } from "@/lib/brand";
import {
  buildChatDesk,
  filterThreads,
  openingThreadId,
  type ChatQueueId,
  type OtpCode,
} from "@/lib/fixtures/chatdesk";
import {
  makeSuspicionLine,
  type Attach,
  type Message,
  type ThreadStatus,
} from "@/lib/fixtures/threads";
import { UNKNOWN_THREAD_ID } from "@/lib/fixtures/cast";
import { usd } from "@/lib/format";
import { useLiveMessages, useLiveSend } from "@/lib/live/LiveProvider";
import { TYPING_TTL_MS } from "@/lib/live/protocol";
import {
  selectCallStart,
  selectEpoch,
  selectSigBan,
  selectSigCall,
  selectSigDeposit,
  selectSigLink,
  selectSigLost,
  selectSigRing,
  selectSigWhale,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { Ticker } from "@/components/shared/Ticker";
import { EventFlash } from "@/components/shared/EventFlash";
import { ChatTopBar } from "./ChatTopBar";
import { ChatFilters } from "./ChatFilters";
import { PersonaRail } from "./PersonaRail";
import { ThreadList } from "./ThreadList";
import { ChatThread } from "./ChatThread";
import { VictimCard } from "./VictimCard";
import { CallOverlay, RING_TICKS, type Call } from "./CallOverlay";
import { IncomingCall } from "./IncomingCall";
import { ToolDock, type ToolId } from "./ToolDock";

/** Что режиссёр поменял в конкретном диалоге по ходу дубля */
type Override = { status?: ThreadStatus; stage?: number; blown?: boolean };

export function ChatScreen({ seat }: { seat: number }) {
  // Как и на остальных экранах, содержимое детерминировано по номеру места:
  // сервер и клиент рендерят одно и то же, а десять машин — разные схемы.
  const desk = useMemo(() => buildChatDesk(seat), [seat]);

  // Первый кадр должен быть полным, поэтому по умолчанию открыт диалог,
  // который уже дошёл до денег, а не свежий «здравствуйте, товар актуален?».
  // Выборка общая с телефоном жертвы: до первого focus ему не на что опереться,
  // кроме номера места, и экраны обязаны сойтись на одном диалоге.
  const openingId = useMemo(() => openingThreadId(desk, seat), [desk, seat]);

  const [queue, setQueue] = useState<ChatQueueId>("all");
  const [selectedId, setSelectedId] = useState(openingId);
  // Личина закреплена за диалогом; вручную её меняют по игре
  const [personaPick, setPersonaPick] = useState<Record<string, string>>({});
  const [tool, setTool] = useState<ToolId>("voice");

  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [injected, setInjected] = useState<Record<string, Message[]>>({});
  /**
   * Реплики, стёртые по игре. Держим id, а не правим ленту: удалить можно и
   * фикстурную реплику, а сами фикстуры не мутируются — иначе Ctrl+Alt+R не
   * вернул бы исходную переписку.
   */
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [extraOtp, setExtraOtp] = useState<OtpCode[]>([]);
  const [extraHits, setExtraHits] = useState(0);
  const [bannedPersonaId, setBannedPersonaId] = useState<string | null>(null);
  // Разговор держим здесь, а не в панели голоса: иначе переключение вкладки
  // дока обрывало бы звонок. Отсюда же он рисуется модалкой поверх экрана
  const [call, setCall] = useState<Call | null>(null);
  /**
   * Входящий вызов, на который ещё не ответили: тик, когда он пошёл.
   * null — телефон молчит. Разговором это станет только после «Принять».
   */
  const [ringingAt, setRingingAt] = useState<number | null>(null);

  const epoch = useSceneValue(selectEpoch);
  const sceneCallStart = useSceneValue(selectCallStart);
  const sigLink = useSceneValue(selectSigLink);
  const sigBan = useSceneValue(selectSigBan);
  const sigDeposit = useSceneValue(selectSigDeposit);
  const sigWhale = useSceneValue(selectSigWhale);
  const sigLost = useSceneValue(selectSigLost);
  const sigCall = useSceneValue(selectSigCall);
  const sigRing = useSceneValue(selectSigRing);

  // Правки режиссёра и реплики оператора накладываются поверх фикстур: сами
  // фикстуры не мутируем, иначе Ctrl+Alt+R не вернёт исходное состояние.
  // Слияние идёт здесь, а не в ленте чата, чтобы предпросмотр в списке слева
  // тоже показывал свежую реплику.
  const threads = useMemo(
    () =>
      desk.threads.map((t) => {
        const o = overrides[t.id];
        const inj = injected[t.id];
        const merged = inj ? [...inj, ...t.messages] : t.messages;
        // Стёртое отсекаем здесь же, а не в ленте: иначе предпросмотр в списке
        // слева продолжал бы показывать удалённую реплику
        const messages =
          removed.size > 0 ? merged.filter((m) => !removed.has(m.id)) : merged;
        if (!o && messages === t.messages) return t;
        return {
          ...t,
          status: o?.status ?? t.status,
          stage: o?.stage ?? t.stage,
          messages,
        };
      }),
    [desk.threads, overrides, injected, removed],
  );

  const visible = useMemo(() => filterThreads(threads, queue), [threads, queue]);
  const list = visible.length > 0 ? visible : threads;

  const selected = threads.find((t) => t.id === selectedId) ?? threads[0];
  /**
   * Кто звонит. Входящий в этом отделе всегда один и тот же — «не известный
   * номер» из сценарных строк: его номер набран в модалке крупно, и страна
   * с городом под ним обязаны быть его, а не того диалога, который в этот
   * момент открыт на экране. Иначе после «Принять» карточка справа сменится
   * на другого человека, и монтаж двух кадров не сойдётся.
   */
  const incoming =
    threads.find((t) => t.id === UNKNOWN_THREAD_ID) ?? selected;
  const personaId = personaPick[selected.id] ?? selected.personaId;
  const persona = desk.personas.find((p) => p.id === personaId) ?? desk.personas[0];

  // --- живой обмен с телефоном жертвы --------------------------------------

  const live = useLiveSend();

  /** Диалог, в котором жертва сейчас набирает текст */
  const [typingIn, setTypingIn] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Добавить реплику в ленту, не задвоив уже полученную */
  const push = useCallback((threadId: string, msg: Message) => {
    setInjected((prev) => {
      const list = prev[threadId] ?? [];
      if (list.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [threadId]: [msg, ...list] };
    });
  }, []);

  // Реплика, которую актёр напечатал в кадре. id даёт шина — по нему же
  // возвращается подтверждение доставки. Math.random() в проекте запрещён,
  // поэтому запасной id — счётчик, а не случайное число.
  const sentRef = useRef(0);
  const handleSend = useCallback(
    (text: string, attach?: Attach) => {
      const threadId = selected.id;
      const id =
        live({ t: "say", from: "operator", threadId, text, attach }) ??
        `IN-sent-${(sentRef.current += 1)}`;
      // Рисуем сразу, не дожидаясь эха: в кадре реплика должна появляться
      // в тот же момент, когда актёр нажал Enter
      push(threadId, { id, from: "operator", text, agoMin: 0, attach, live: true });
    },
    [selected.id, live, push],
  );

  /** Актёр набирает текст — у жертвы загорается «печатает…» */
  const handleTyping = useCallback(() => {
    live({ t: "typing", from: "operator", threadId: selected.id });
  }, [selected.id, live]);

  /** Убрать реплику из ленты. Идемпотентно: эхо и повторный клик безвредны */
  const forget = useCallback((msgId: string) => {
    setRemoved((prev) => (prev.has(msgId) ? prev : new Set(prev).add(msgId)));
  }, []);

  /**
   * Чатер стёр реплику — свою, жертвы или служебную.
   *
   * Гасим сразу, не дожидаясь эха: в кадре реплика должна исчезать в момент
   * нажатия, как и появляться. Телефон жертвы уберёт её по сообщению из шины.
   */
  const handleDelete = useCallback(
    (msgId: string) => {
      live({ t: "unsay", threadId: selected.id, msgId });
      forget(msgId);
    },
    [selected.id, live, forget],
  );

  // Открытый диалог объявляется в шину: телефон жертвы следует за чатером,
  // и режиссёру не нужно синхронизировать экраны вручную
  useEffect(() => {
    live({ t: "focus", threadId: selected.id, personaId: persona.id });
  }, [selected.id, persona.id, live]);

  useLiveMessages((msg, meta) => {
    if (msg.t === "say") {
      // Собственное эхо от сервера — не новая реплика, а подтверждение
      // доставки: зажигаем вторую галочку
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

      if (msg.from === "victim") setTypingIn(null);
      push(msg.threadId, {
        id: meta.id,
        from: msg.from,
        text: msg.text,
        agoMin: 0,
        attach: msg.attach,
        live: true,
        // Входящая реплика доставлена по определению: мы её уже держим в руках
        delivered: true,
      });
      return;
    }

    if (msg.t === "unsay") {
      // Своё эхо тоже проходит сюда — Set это переживает без последствий
      forget(msg.msgId);
      return;
    }

    if (msg.t === "typing" && msg.from === "victim") {
      setTypingIn(msg.threadId);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingIn(null), TYPING_TTL_MS);
    }
  });

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  // Ctrl+Alt+9 — жертва открыла ссылку и ввела карту: переход в счётчике,
  // системная строка в переписке, свежий код в панели перехвата
  useEffect(() => {
    if (sigLink === 0) return;
    const rng = new Rng(`chat-link-${seat}-${sigLink}`);
    const th = threads.find((t) => t.id === selectedId) ?? threads[0];

    setExtraHits((n) => n + 1);
    setOverrides((prev) => ({
      ...prev,
      [th.id]: { ...prev[th.id], stage: 4 },
    }));
    setInjected((prev) => ({
      ...prev,
      [th.id]: [
        {
          id: `IN-link-${sigLink}-b`,
          from: "victim",
          text: "Ввёл всё, пришло смс с кодом. Диктовать?",
          agoMin: 0,
        },
        {
          id: `IN-link-${sigLink}-a`,
          from: "system",
          text: "жертва открыла ссылку · введены данные карты",
          agoMin: 0,
        },
        ...(prev[th.id] ?? []),
      ],
    }));
    setExtraOtp((prev) => [
      {
        id: `SM-live-${sigLink}`,
        agoSec: 0,
        issuer: BRAND.bankfake.short,
        code: String(rng.int(1000, 9999)),
        purpose: "подтверждение перевода",
        amount: th.askAmount,
        usedFor: th.id,
      },
      ...prev,
    ]);
    setTool("otp");
    // Выбранный диалог читается в момент события и не должен сам его вызывать
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigLink]);

  // Ctrl+Alt+B — личину забанили: аккаунт краснеет, переписка обрывается
  useEffect(() => {
    if (sigBan === 0) return;
    const th = threads.find((t) => t.id === selectedId) ?? threads[0];
    setBannedPersonaId(personaId);
    setInjected((prev) => ({
      ...prev,
      [th.id]: [
        {
          id: `IN-ban-${sigBan}`,
          from: "system",
          text: "аккаунт заблокирован · отправка сообщений недоступна",
          agoMin: 0,
        },
        ...(prev[th.id] ?? []),
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigBan]);

  // Ctrl+Alt+2 и Ctrl+Alt+4 — деньги пришли: диалог закрывается «оплатой»
  useEffect(() => {
    if (sigDeposit === 0 && sigWhale === 0) return;
    const th = threads.find((t) => t.id === selectedId) ?? threads[0];
    setOverrides((prev) => ({
      ...prev,
      [th.id]: { ...prev[th.id], status: "paid", stage: 4, blown: false },
    }));
    setInjected((prev) => ({
      ...prev,
      [th.id]: [
        {
          id: `IN-pay-${sigDeposit}-${sigWhale}`,
          from: "system",
          text: `перевод получен · ${usd(th.askAmount)} · карта дропа`,
          agoMin: 0,
        },
        ...(prev[th.id] ?? []),
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigDeposit, sigWhale]);

  // Ctrl+Alt+3 — клиент заподозрил: стоп-слова в последней реплике,
  // вместо подсказок скрипта загорается детектор «палева»
  useEffect(() => {
    if (sigLost === 0) return;
    const rng = new Rng(`chat-lost-${seat}-${sigLost}`);
    const th = threads.find((t) => t.id === selectedId) ?? threads[0];
    const line = makeSuspicionLine(rng);

    // Клиент бросает трубку вместе с доверием — и трубку, которую ещё
    // не подняли, тоже: звонить дальше некому
    setCall(null);
    setRingingAt(null);
    setOverrides((prev) => ({
      ...prev,
      [th.id]: { ...prev[th.id], status: "suspicious", blown: true },
    }));
    setInjected((prev) => ({
      ...prev,
      [th.id]: [
        {
          id: `IN-lost-${sigLost}`,
          from: "victim",
          text: line.text,
          agoMin: 0,
          flags: line.flags,
        },
        ...(prev[th.id] ?? []),
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigLost]);

  // Ctrl+Alt+1 — звонок: док прыгает на подмену голоса, таймер идёт с нуля
  // (store выставил callStartTick текущим тиком). Гудков нет: звонок входящий,
  // трубку уже подняли — модалка открывается сразу на разговоре
  useEffect(() => {
    if (sigCall === 0) return;
    setTool("voice");
    setRingingAt(null);
    setCall({ startTick: sceneCallStart, ringTicks: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigCall]);

  // Ctrl+Alt+C — клиент звонит сам: сначала модалка входящего с номером и
  // двумя кнопками, разговор начнётся только если актёр примет вызов.
  // Тик вызова берём из store (callStartTick), чтобы не подписывать экран
  // на тик и не перерисовывать его четыре раза в секунду
  useEffect(() => {
    if (sigRing === 0) return;
    setTool("voice");
    setCall(null);
    setRingingAt(sceneCallStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigRing]);

  // Ctrl+Alt+R — сброс дубля
  useEffect(() => {
    if (epoch === 0) return;
    setQueue("all");
    setSelectedId(openingId);
    setPersonaPick({});
    setTool("voice");
    setOverrides({});
    setInjected({});
    setRemoved(new Set());
    setExtraOtp([]);
    setExtraHits(0);
    setBannedPersonaId(null);
    setCall(null);
    setRingingAt(null);
    setTypingIn(null);
  }, [epoch, openingId]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      <ChatTopBar desk={desk} bannedId={bannedPersonaId} />

      <div className="flex min-h-0 flex-1">
        <ChatFilters threads={threads} queue={queue} onQueue={setQueue}>
          <PersonaRail
            personas={desk.personas}
            activeId={personaId}
            bannedId={bannedPersonaId}
            onSelect={(id) => setPersonaPick((prev) => ({ ...prev, [selected.id]: id }))}
            blast={desk.blast}
          />
        </ChatFilters>

        <ThreadList
          threads={list}
          selectedId={selected.id}
          typingId={typingIn}
          onSelect={setSelectedId}
        />

        <ChatThread
          key={selected.id}
          thread={selected}
          persona={persona}
          personaBanned={persona.id === bannedPersonaId}
          blown={overrides[selected.id]?.blown ?? selected.status === "suspicious"}
          typing={typingIn === selected.id}
          link={desk.link}
          onTool={setTool}
          onSend={handleSend}
          onTyping={handleTyping}
          onDelete={handleDelete}
        />

        {/* Правая колонка: карточка жертвы + док инструментов */}
        <aside className="flex w-[372px] shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#0b0b0e]">
          <VictimCard key={selected.id} thread={selected} persona={persona} />
          <div className="h-[338px] shrink-0">
            <ToolDock
              desk={desk}
              thread={selected}
              tool={tool}
              onTool={setTool}
              extraOtp={extraOtp}
              extraHits={extraHits}
              call={call}
              onCall={(tick) => setCall({ startTick: tick, ringTicks: RING_TICKS })}
            />
          </div>
        </aside>
      </div>

      <Ticker />
      <EventFlash />

      {/*
        Разговор — модалкой по центру всего экрана, а не внутри узкой панели
        дока: на крупном плане должно быть видно лицо жертвы, таймер и
        осциллограмму, а не мелкую колонку справа.
      */}
      {/* Входящий вызов — до разговора и вместо него: две модалки разом
          в кадре не пересекаются */}
      {ringingAt !== null && call === null && (
        <IncomingCall
          thread={incoming}
          startTick={ringingAt}
          onAccept={(tick) => {
            // Трубку подняли — экран переезжает на звонящего: его диалог
            // в списке, его карточка справа, его же разговор в модалке.
            // Фильтр возвращаем на «Все диалоги», иначе выбранная строка
            // может не попасть в текущую выборку и подсветки в кадре не будет
            setQueue("all");
            setSelectedId(incoming.id);
            setRingingAt(null);
            setCall({ startTick: tick, ringTicks: 0 });
          }}
          onReject={() => setRingingAt(null)}
        />
      )}

      {call && (
        <CallOverlay
          call={call}
          thread={selected}
          persona={persona}
          seat={seat}
          onHangUp={() => setCall(null)}
        />
      )}
    </div>
  );
}
