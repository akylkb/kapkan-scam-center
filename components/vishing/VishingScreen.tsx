"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  selectEpoch,
  selectSigLink,
  useSceneValue,
  useSecond,
} from "@/lib/scene/SceneProvider";
import { Ticker } from "@/components/shared/Ticker";
import { FlashCard } from "@/components/shared/EventFlash";
import { som } from "@/lib/format";
import {
  buildVishingDesk,
  freshCode,
  pastCodes,
  type InterceptCode,
} from "@/lib/fixtures/vishing";
import { VishingTopBar } from "./VishingTopBar";
import { TargetList } from "./TargetList";
import { CallPanel } from "./CallPanel";
import { CreditForm } from "./CreditForm";
import { CodeStream } from "./CodeStream";

/**
 * Экран вишинга: звонок жертве «от службы поддержки оператора» и оформление
 * кредита на 800 000 сом по продиктованному SMS-коду.
 *
 * Код приходит той же командой режиссёра, что и на экране чатера, — Ctrl+Alt+9
 * (link.opened). Одно событие — один путь: отдельного типа для этой сцены нет,
 * иначе «код пришёл» имел бы две расходящиеся реализации.
 */
export function VishingScreen({ seat }: { seat: number }) {
  const desk = useMemo(() => buildVishingDesk(seat), [seat]);
  const history = useMemo(() => pastCodes(seat, 12), [seat]);

  const [selectedId, setSelectedId] = useState(() => desk.victim.id);
  const [approved, setApproved] = useState(false);
  const [live, setLive] = useState<InterceptCode | null>(null);

  const epoch = useSceneValue(selectEpoch);
  const sigLink = useSceneValue(selectSigLink);
  const second = useSecond();

  const victim = desk.targets.find((t) => t.id === selectedId) ?? desk.victim;

  // Для таймера жизни кода: от какой секунды сцены он пришёл
  const codeSecond = useRef(0);

  // Локальная вспышка «кредит оформлен» — на этом экране копия глобального
  // EventFlash («деньги списаны») звучала бы не по сцене
  const [flashKey, setFlashKey] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+Alt+9 — жертва продиктовала код: он вспыхивает в перехвате и
  // проставляется в заявку, кредит перескакивает в «одобрен»
  useEffect(() => {
    if (sigLink === 0) return;
    const code = freshCode(seat, sigLink);
    codeSecond.current = second;
    setLive(code);
    setApproved(true);
    setFlashKey((k) => k + 1);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKey((k) => k + 1), 4000);
    // second читается в момент события и не должен сам его вызывать
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigLink]);

  // Ctrl+Alt+R — сброс дубля: заявка снова в ожидании кода
  useEffect(() => {
    if (epoch === 0) return;
    setSelectedId(desk.victim.id);
    setApproved(false);
    setLive(null);
    setFlashKey(0);
  }, [epoch, desk.victim.id]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  // Живой код «стареет» от секунд сцены, прошедших с его прихода
  const liveWithAge = live
    ? { ...live, agoSec: Math.max(0, second - codeSecond.current) }
    : null;

  const showFlash = approved && flashKey % 2 === 1;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      <VishingTopBar desk={desk} />

      <div className="flex min-h-0 flex-1">
        <TargetList targets={desk.targets} selectedId={victim.id} onSelect={setSelectedId} />

        <div className="flex min-w-0 flex-1 flex-col">
          <CallPanel victim={victim} />
          <CreditForm victim={victim} loan={desk.loan} code={live?.code ?? null} approved={approved} />
        </div>

        <CodeStream live={liveWithAge} history={history} second={second} />
      </div>

      <Ticker />

      {showFlash && (
        <FlashCard
          key={flashKey}
          tone="done"
          title="КРЕДИТ ОФОРМЛЕН"
          sub={`${som(desk.loan.amount)} · ${victim.name}`}
        />
      )}
    </div>
  );
}
