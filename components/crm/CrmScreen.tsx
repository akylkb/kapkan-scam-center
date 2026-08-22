"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWorkspace, filterLeads, type QueueId } from "@/lib/fixtures/workspace";
import {
  selectEpoch,
  selectSigLost,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { Ticker } from "@/components/shared/Ticker";
import { EventFlash } from "@/components/shared/EventFlash";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { LeadsTable } from "./LeadsTable";
import { LeadCard } from "./LeadCard";
import { Softphone } from "./Softphone";
import { RemoteView } from "./RemoteView";
import { QuickActions } from "./QuickActions";

export function CrmScreen({ seat }: { seat: number }) {
  // Данные детерминированы по номеру места: сервер и клиент рендерят одно и то же,
  // а десять машин на площадке при этом показывают разные экраны.
  const ws = useMemo(() => buildWorkspace(seat), [seat]);

  // По умолчанию — все лиды: полная таблица с разноцветными статусами,
  // именно она нужна в кадре. Узкие очереди актёр открывает по игре.
  const [queue, setQueue] = useState<QueueId>("all");
  const visible = useMemo(() => filterLeads(ws.leads, queue), [ws.leads, queue]);
  const [selectedId, setSelectedId] = useState(() => ws.leads[0].id);

  const epoch = useSceneValue(selectEpoch);
  const sigLost = useSceneValue(selectSigLost);
  const [lostId, setLostId] = useState<string | null>(null);

  // Ctrl+Alt+3 — «клиент сорвался»: помечаем выбранного красным
  useEffect(() => {
    if (sigLost === 0) return;
    setLostId(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigLost]);

  // Ctrl+Alt+R — сброс дубля: возвращаем очередь и выделение в исходное
  useEffect(() => {
    if (epoch === 0) return;
    setQueue("all");
    setSelectedId(ws.leads[0].id);
    setLostId(null);
  }, [epoch, ws.leads]);

  const selected = ws.leads.find((l) => l.id === selectedId) ?? ws.leads[0];
  const list = visible.length > 0 ? visible : ws.leads;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      <TopBar ws={ws} />

      <div className="flex min-h-0 flex-1">
        <SideNav leads={ws.leads} queue={queue} onQueue={setQueue} />

        <div className="flex min-w-0 flex-1 flex-col">
          <LeadsTable
            leads={list}
            selectedId={selected.id}
            onSelect={setSelectedId}
            lostId={lostId}
          />
          <QuickActions />
        </div>

        {/* Правая колонка: карточка клиента + софтфон */}
        <aside className="flex w-[366px] shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#0b0b0e]">
          <LeadCard key={selected.id} lead={selected} />
          <Softphone lead={selected} />
        </aside>
      </div>

      <Ticker />

      {/* Окно удалённого доступа держим открытым всегда: на площадке это
          ключевая деталь кадра, а не состояние конкретного лида */}
      {/* <RemoteView lead={selected} /> */}
      <EventFlash />
    </div>
  );
}
