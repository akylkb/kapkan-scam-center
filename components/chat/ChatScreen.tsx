"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rng } from "@/lib/prng";
import { BRAND } from "@/lib/brand";
import {
  buildChatDesk,
  filterThreads,
  type ChatQueueId,
  type OtpCode,
} from "@/lib/fixtures/chatdesk";
import {
  makeSuspicionLine,
  type Message,
  type ThreadStatus,
} from "@/lib/fixtures/threads";
import { usd } from "@/lib/format";
import {
  selectEpoch,
  selectSigBan,
  selectSigCall,
  selectSigDeposit,
  selectSigLink,
  selectSigLost,
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
import { ToolDock, type ToolId } from "./ToolDock";

/** Что режиссёр поменял в конкретном диалоге по ходу дубля */
type Override = { status?: ThreadStatus; stage?: number; blown?: boolean };

export function ChatScreen({ seat }: { seat: number }) {
  // Как и на остальных экранах, содержимое детерминировано по номеру места:
  // сервер и клиент рендерят одно и то же, а десять машин — разные схемы.
  const desk = useMemo(() => buildChatDesk(seat), [seat]);

  // Первый кадр должен быть полным, поэтому по умолчанию открыт диалог,
  // который уже дошёл до денег, а не свежий «здравствуйте, товар актуален?»
  const openingId = useMemo(() => {
    // Открываем рабочий диалог, а не сорвавшийся: «слив» режиссёр включает
    // сам, когда он нужен по сцене
    const rich = desk.threads.filter(
      (t) => t.stage >= 3 && t.status !== "dead" && t.status !== "suspicious",
    );
    // Предпочитаем схему своего пула и смещаем выбор по номеру места:
    // иначе десять машин открываются на одинаковой реплике
    const own = rich.filter((t) => t.scheme === desk.bias);
    const pool = own.length > 0 ? own : rich;
    if (pool.length === 0) return desk.threads[0].id;
    return pool[(seat - 1) % pool.length].id;
  }, [desk.threads, desk.bias, seat]);

  const [queue, setQueue] = useState<ChatQueueId>("all");
  const [selectedId, setSelectedId] = useState(openingId);
  // Личина закреплена за диалогом; вручную её меняют по игре
  const [personaPick, setPersonaPick] = useState<Record<string, string>>({});
  const [tool, setTool] = useState<ToolId>("voice");

  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [injected, setInjected] = useState<Record<string, Message[]>>({});
  const [extraOtp, setExtraOtp] = useState<OtpCode[]>([]);
  const [extraHits, setExtraHits] = useState(0);
  const [bannedPersonaId, setBannedPersonaId] = useState<string | null>(null);

  const epoch = useSceneValue(selectEpoch);
  const sigLink = useSceneValue(selectSigLink);
  const sigBan = useSceneValue(selectSigBan);
  const sigDeposit = useSceneValue(selectSigDeposit);
  const sigWhale = useSceneValue(selectSigWhale);
  const sigLost = useSceneValue(selectSigLost);
  const sigCall = useSceneValue(selectSigCall);

  // Правки режиссёра и реплики оператора накладываются поверх фикстур: сами
  // фикстуры не мутируем, иначе Ctrl+Alt+R не вернёт исходное состояние.
  // Слияние идёт здесь, а не в ленте чата, чтобы предпросмотр в списке слева
  // тоже показывал свежую реплику.
  const threads = useMemo(
    () =>
      desk.threads.map((t) => {
        const o = overrides[t.id];
        const inj = injected[t.id];
        if (!o && !inj) return t;
        return {
          ...t,
          status: o?.status ?? t.status,
          stage: o?.stage ?? t.stage,
          messages: inj ? [...inj, ...t.messages] : t.messages,
        };
      }),
    [desk.threads, overrides, injected],
  );

  const visible = useMemo(() => filterThreads(threads, queue), [threads, queue]);
  const list = visible.length > 0 ? visible : threads;

  const selected = threads.find((t) => t.id === selectedId) ?? threads[0];
  const personaId = personaPick[selected.id] ?? selected.personaId;
  const persona = desk.personas.find((p) => p.id === personaId) ?? desk.personas[0];

  // Реплика, которую актёр напечатал в кадре. Счётчик — вместо случайного id:
  // Math.random() в этом проекте запрещён, а ключи должны быть уникальны
  const sentRef = useRef(0);
  const handleSend = useCallback(
    (text: string) => {
      const id = `IN-sent-${(sentRef.current += 1)}`;
      setInjected((prev) => ({
        ...prev,
        [selected.id]: [
          { id, from: "operator", text, agoMin: 0 },
          ...(prev[selected.id] ?? []),
        ],
      }));
    },
    [selected.id],
  );

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

  // Ctrl+Alt+1 — звонок: док сам прыгает на подмену голоса
  useEffect(() => {
    if (sigCall === 0) return;
    setTool("voice");
  }, [sigCall]);

  // Ctrl+Alt+R — сброс дубля
  useEffect(() => {
    if (epoch === 0) return;
    setQueue("all");
    setSelectedId(openingId);
    setPersonaPick({});
    setTool("voice");
    setOverrides({});
    setInjected({});
    setExtraOtp([]);
    setExtraHits(0);
    setBannedPersonaId(null);
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

        <ThreadList threads={list} selectedId={selected.id} onSelect={setSelectedId} />

        <ChatThread
          key={selected.id}
          thread={selected}
          persona={persona}
          personaBanned={persona.id === bannedPersonaId}
          blown={overrides[selected.id]?.blown ?? selected.status === "suspicious"}
          onTool={setTool}
          onSend={handleSend}
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
            />
          </div>
        </aside>
      </div>

      <Ticker />
      <EventFlash />
    </div>
  );
}
