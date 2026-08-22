"use client";

import { useEffect, useMemo, useState } from "react";
import { Rng } from "@/lib/prng";
import {
  buildDropDesk,
  filterDrops,
  type DropQueueId,
} from "@/lib/fixtures/dropdesk";
import { makeChain } from "@/lib/fixtures/payouts";
import {
  selectEpoch,
  selectSigDropBurn,
  selectSigPayout,
  useSceneValue,
} from "@/lib/scene/SceneProvider";
import { Ticker } from "@/components/shared/Ticker";
import { EventFlash } from "@/components/shared/EventFlash";
import { DropsTopBar } from "./DropsTopBar";
import { DropFilters } from "./DropFilters";
import { DropsTable } from "./DropsTable";
import { PayoutQueue } from "./PayoutQueue";
import { DropCard } from "./DropCard";
import { LaunderChain } from "./LaunderChain";
import { CashDesk } from "./CashDesk";

export function DropsScreen({ seat }: { seat: number }) {
  // Как и на экране оператора, содержимое детерминировано по номеру места:
  // сервер и клиент рендерят одно и то же, а десять машин — разные пулы.
  const desk = useMemo(() => buildDropDesk(seat), [seat]);

  // По умолчанию — весь реестр: полная таблица с разноцветными статусами,
  // именно она нужна в кадре. Узкие фильтры актёр открывает по игре.
  const [queue, setQueue] = useState<DropQueueId>("all");
  const visible = useMemo(() => filterDrops(desk.drops, queue), [desk.drops, queue]);

  const [selectedDropId, setSelectedDropId] = useState(() => desk.drops[0].id);
  const [selectedPayoutId, setSelectedPayoutId] = useState(() => desk.payouts[0].id);

  const epoch = useSceneValue(selectEpoch);
  const sigBurn = useSceneValue(selectSigDropBurn);
  const sigPayout = useSceneValue(selectSigPayout);

  const [burnedId, setBurnedId] = useState<string | null>(null);
  const [failedPayouts, setFailedPayouts] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const selectedDrop =
    desk.drops.find((d) => d.id === selectedDropId) ?? desk.drops[0];
  const selectedPayout =
    desk.payouts.find((p) => p.id === selectedPayoutId) ?? desk.payouts[0];

  // Ctrl+Alt+7 — «дроп сгорел»: краснеет выбранная карта, а вместе с ней
  // срываются все заливы, которые на неё шли
  useEffect(() => {
    if (sigBurn === 0) return;
    setBurnedId(selectedDropId);
    setFailedPayouts((prev) => {
      const next = new Set(prev);
      for (const p of desk.payouts) {
        if (p.dropId === selectedDropId) next.add(p.id);
      }
      return next;
    });
    // selectedDropId читается в момент события и не должен сам его вызывать
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigBurn]);

  // Ctrl+Alt+8 — «залив ушёл»: снимаем отметку отказа с выбранной строки,
  // чтобы цепочка в правой колонке снова читалась как успешная
  useEffect(() => {
    if (sigPayout === 0) return;
    setFailedPayouts((prev) => {
      if (!prev.has(selectedPayoutId)) return prev;
      const next = new Set(prev);
      next.delete(selectedPayoutId);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigPayout]);

  // Ctrl+Alt+R — сброс дубля
  useEffect(() => {
    if (epoch === 0) return;
    setQueue("all");
    setSelectedDropId(desk.drops[0].id);
    setSelectedPayoutId(desk.payouts[0].id);
    setBurnedId(null);
    setFailedPayouts(new Set<string>());
  }, [epoch, desk.drops, desk.payouts]);

  // Цепочка считается от выбранного залива и его дропа. Сид детерминирован,
  // поэтому комиссии не «прыгают» между дублями.
  const chain = useMemo(() => {
    const drop =
      desk.drops.find((d) => d.id === selectedPayout.dropId) ?? selectedDrop;
    return makeChain(new Rng(`chain-${seat}-${selectedPayout.id}`), selectedPayout, drop);
  }, [desk.drops, selectedPayout, selectedDrop, seat]);

  const list = visible.length > 0 ? visible : desk.drops;
  const chainFailed =
    failedPayouts.has(selectedPayout.id) || selectedPayout.dropId === burnedId;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      <DropsTopBar desk={desk} />

      <div className="flex min-h-0 flex-1">
        <DropFilters drops={desk.drops} queue={queue} onQueue={setQueue}>
          <CashDesk cash={desk.cash} seat={seat} />
        </DropFilters>

        <div className="flex min-w-0 flex-1 flex-col">
          <DropsTable
            drops={list}
            selectedId={selectedDrop.id}
            onSelect={setSelectedDropId}
            burnedId={burnedId}
          />
          <PayoutQueue
            payouts={desk.payouts}
            selectedId={selectedPayout.id}
            onSelect={setSelectedPayoutId}
            failedIds={failedPayouts}
          />
        </div>

        {/* Правая колонка: карточка дропа + цепочка отмыва выбранного залива */}
        <aside className="flex w-[370px] shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#0b0b0e]">
          <DropCard
            key={selectedDrop.id}
            drop={selectedDrop}
            burned={selectedDrop.id === burnedId}
          />
          <div className="h-[300px] shrink-0">
            <LaunderChain
              hops={chain}
              payoutId={selectedPayout.id}
              failed={chainFailed}
            />
          </div>
        </aside>
      </div>

      <Ticker />
      <EventFlash />
    </div>
  );
}
