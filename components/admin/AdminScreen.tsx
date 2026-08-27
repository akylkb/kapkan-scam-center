"use client";

import { useMemo } from "react";
import {
  Ear,
  Eye,
  Gauge,
  Headphones,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
  Sliders,
  UserCog,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Rng } from "@/lib/prng";
import { AGENT_STATE_META, makeAgents, type Agent } from "@/lib/fixtures/agents";
import { INSTRUMENTS, pickCountry, pickName } from "@/lib/fixtures/pools";
import { ASAN_SESSION, ASAN_WITHDRAWAL } from "@/lib/fixtures/cast";
import { mmss, usd } from "@/lib/format";
import { SceneClock } from "@/components/shared/SceneClock";
import { Ticker } from "@/components/shared/Ticker";
import { EventFlash } from "@/components/shared/EventFlash";
import { Chip, Panel, cx } from "@/components/shared/ui";
import { useSecond } from "@/lib/scene/SceneProvider";

/**
 * Панель супервайзера.
 *
 * Самый «говорящий» экран сериала: здесь видно саму механику обмана —
 * дорисовка денег на счёт клиента, блокировка выводов, подкрутка котировок,
 * прослушка операторов. По материалам расследований именно такие функции
 * были встроены в CRM подобных контор.
 */
export function AdminScreen() {
  // Восемнадцать операторов, а не двенадцать: список должен уходить за нижний
  // край панели, иначе треть экрана в кадре остаётся пустой
  const floor = useMemo(() => makeAgents(new Rng("admin-floor"), 20), []);
  const second = useSecond();

  const withdrawals = useMemo(() => {
    const rng = new Rng("admin-withdrawals");
    const rows = Array.from({ length: 11 }, (_, i) => {
      const c = pickCountry(rng);
      return {
        id: `WD-${rng.int(10000, 99999)}`,
        name: pickName(rng, c),
        flag: c.flag,
        amount: rng.money(1_800, 74_000),
        waiting: rng.int(2, 41),
        attempt: rng.int(1, 4),
        risk: rng.weighted([
          ["ВЫСОКИЙ", 3],
          ["СРЕДНИЙ", 4],
          ["НИЗКИЙ", 3],
        ] as const),
        i,
      };
    }).sort((a, b) => b.amount - a.amount);
    // Сценарный Асан — первой строкой, поверх сортировки по сумме: его заявку
    // в кадре открывают и отклоняют вручную, искать её в списке некогда
    return [{ ...ASAN_WITHDRAWAL, i: -1 }, ...rows];
  }, []);

  // Кто из операторов прямо сейчас видит экран своей жертвы
  const sessions = useMemo(() => {
    const rng = new Rng("admin-sessions");
    const rows = Array.from({ length: 9 }, (_, i) => {
      const c = pickCountry(rng);
      return {
        id: `RV-${rng.int(1000, 9999)}`,
        name: pickName(rng, c),
        flag: c.flag,
        ip: `${rng.int(31, 213)}.${rng.int(2, 254)}.${rng.int(2, 254)}.${rng.int(2, 254)}`,
        seat: rng.int(1, 20),
        app: rng.pick(["браузер · терминал", "интернет-банк", "почта", "мессенджер"]),
        // Смесь режимов задана явно: случайный бросок легко даёт девять
        // одинаковых подписей подряд, и колонка выглядит скопированной
        control: i % 4 !== 3,
        duration: rng.int(40, 2600) + i,
      };
    });
    // Первая сессия — машина Асана: это ровно тот экран, который показан
    // на /client, и супервайзер смотрит его прямо сейчас
    return [ASAN_SESSION, ...rows];
  }, []);

  const quotes = useMemo(() => {
    const rng = new Rng("admin-quotes");
    return rng.sample(INSTRUMENTS, 5).map((ins) => ({
      ...ins,
      skew: rng.int(-40, 65),
    }));
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Шапка */}
      <header className="flex h-11 shrink-0 items-center gap-4 border-b border-rose-900/50 bg-[#0e0a0c] px-3">
        <span className="flex items-center gap-2 font-mono text-[13px] font-bold tracking-[0.16em] text-rose-300">
          <ShieldAlert className="h-4 w-4" />
          {BRAND.crm.full} · ADMIN
        </span>
        <Chip className="border-rose-700/50 bg-rose-500/10 text-rose-300">
          ROOT · ПОЛНЫЙ ДОСТУП
        </Chip>
        <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-600">
          {BRAND.org.name} · {BRAND.org.office}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.1em] text-zinc-500">
          <span>
            ОПЕРАТОРОВ В СЕТИ <span className="text-emerald-300">{floor.length}</span>
          </span>
          <span>
            В РАЗГОВОРЕ{" "}
            <span className="text-emerald-300">
              {floor.filter((a) => a.state === "call").length}
            </span>
          </span>
          <span>
            ЗАЯВОК НА ВЫВОД <span className="text-amber-300">{withdrawals.length}</span>
          </span>
        </div>
        <SceneClock />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr_1fr] gap-2 p-2">
        {/* КОЛОНКА 1: операторы и прослушка */}
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <Headphones className="h-3 w-3" />
              Операторы · мониторинг звонков
            </span>
          }
          right={
            <span className="font-mono text-[9px] tracking-[0.12em] text-zinc-600">
              ВСЕ РАЗГОВОРЫ ПИШУТСЯ
            </span>
          }
          className="min-h-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {floor.map((a) => (
              <AgentRow key={a.seat} agent={a} second={second} />
            ))}
          </div>
        </Panel>

        {/* КОЛОНКА 2: корректировка баланса + подкрутка котировок */}
        <div className="flex min-h-0 flex-col gap-2">
          <Panel
            title={
              <span className="flex items-center gap-1.5 text-emerald-400">
                <UserCog className="h-3 w-3" />
                Корректировка баланса клиента
              </span>
            }
            accent="success"
            className="shrink-0"
          >
            <div className="space-y-2 p-3">
              <FormRow label="Клиент" value="Klaus Brandt · LD-48117 · 🇩🇪" />
              <FormRow label="Торговый счёт" value="AC-7742019 · GOLD" />
              <FormRow label="Текущий баланс" value={usd(124_580)} tone="text-zinc-200" />

              <div>
                <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
                  Сумма начисления
                </p>
                <div className="flex items-center gap-2 rounded-[3px] border border-emerald-700/50 bg-emerald-950/40 px-3 py-2">
                  <span className="font-mono text-[22px] font-bold text-emerald-300">
                    + $24 000.00
                  </span>
                  <span className="animate-blink font-mono text-[18px] text-emerald-500">▌</span>
                </div>
              </div>

              <div>
                <p className="mb-1 font-mono text-[8.5px] tracking-[0.16em] text-zinc-600 uppercase">
                  Тип операции
                </p>
                <div className="flex gap-1">
                  {["Бонус", "Прибыль по сделке", "Ручное начисление"].map((t, i) => (
                    <span
                      key={t}
                      className={cx(
                        "flex-1 rounded-[3px] border py-1 text-center text-[10.5px]",
                        i === 1
                          ? "border-emerald-600/60 bg-emerald-500/15 text-emerald-300"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-500",
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-0.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border border-emerald-600 bg-emerald-500/20 font-mono text-[9px] text-emerald-300">
                  ✓
                </span>
                <span className="text-[11px] text-zinc-400">
                  Не уведомлять клиента о происхождении средств
                </span>
              </label>
              <label className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-[2px] border border-zinc-700" />
                <span className="text-[11px] text-zinc-500">Отразить в выписке клиента</span>
              </label>

              <button className="w-full rounded-[3px] bg-emerald-600 py-2 font-mono text-[12px] font-bold tracking-[0.16em] text-zinc-950 uppercase hover:bg-emerald-500">
                Провести операцию
              </button>
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sliders className="h-3 w-3" />
                Корректировка котировок
              </span>
            }
            className="min-h-0 flex-1"
          >
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              <p className="text-[10.5px] leading-snug text-zinc-500">
                Смещение цены применяется только к выбранному счёту. Остальные клиенты видят
                рыночные котировки.
              </p>
              {quotes.map((q) => (
                <div key={q.symbol}>
                  <div className="mb-1 flex items-baseline justify-between font-mono text-[10.5px]">
                    <span className="text-zinc-300">{q.symbol}</span>
                    <span className={q.skew >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {q.skew >= 0 ? "+" : "−"}
                      {Math.abs(q.skew)} пп
                    </span>
                  </div>
                  {/* Ползунок смещения: середина — рыночная цена */}
                  <div className="relative h-1.5 rounded-full bg-zinc-800">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600" />
                    <div
                      className={cx(
                        "absolute inset-y-0 rounded-full",
                        q.skew >= 0 ? "bg-emerald-500" : "bg-rose-500",
                      )}
                      style={{
                        left: q.skew >= 0 ? "50%" : `${50 + q.skew / 2}%`,
                        width: `${Math.abs(q.skew) / 2}%`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-zinc-300"
                      style={{ left: `${50 + q.skew / 2}%` }}
                    />
                  </div>
                </div>
              ))}
              <button className="w-full rounded-[3px] border border-amber-600/60 bg-amber-500/15 py-1.5 font-mono text-[11px] font-bold tracking-[0.14em] text-amber-300 uppercase">
                Применить к счёту
              </button>
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                Активные сессии {BRAND.rat.name}
              </span>
            }
            className="min-h-0 flex-1"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 border-b border-zinc-900 px-2.5 py-[6px]"
                >
                  <span
                    className={cx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      s.control ? "animate-pulse bg-emerald-400" : "bg-zinc-600",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] text-zinc-300">
                      {s.flag} {s.name}
                    </p>
                    <p className="truncate font-mono text-[9px] text-zinc-600">
                      {s.ip} · SEAT-{String(s.seat).padStart(2, "0")} · {s.app}
                    </p>
                  </div>
                  <span
                    className={cx(
                      "shrink-0 font-mono text-[9px] tracking-[0.1em]",
                      s.control ? "text-emerald-400" : "text-zinc-600",
                    )}
                  >
                    {s.control ? "УПРАВЛЕНИЕ" : "ПРОСМОТР"}
                  </span>
                  <span className="tnum w-[42px] shrink-0 text-right font-mono text-[10.5px] text-zinc-500">
                    {mmss(s.duration + second)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* КОЛОНКА 3: заявки на вывод + технический лог */}
        <div className="flex min-h-0 flex-col gap-2">
          <Panel
            title={
              <span className="flex items-center gap-1.5 text-rose-400">
                <Lock className="h-3 w-3" />
                Заявки на вывод
              </span>
            }
            accent="danger"
            className="min-h-0 flex-1"
          >
            <div className="border-b border-rose-900/40 bg-rose-950/30 px-3 py-1.5">
              <p className="font-mono text-[10px] tracking-[0.1em] text-rose-300 uppercase">
                Лимит одобрения: 2% от оборота смены
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="border-b border-zinc-900 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] text-zinc-200">
                        {w.flag} {w.name}
                      </p>
                      <p className="font-mono text-[9.5px] text-zinc-600">
                        {w.id} · ожидает {w.waiting} ч · попытка №{w.attempt}
                      </p>
                    </div>
                    <span className="tnum shrink-0 font-mono text-[15px] font-semibold text-rose-300">
                      {usd(w.amount)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1">
                    <Chip
                      className={cx(
                        w.risk === "ВЫСОКИЙ"
                          ? "border-rose-700/50 bg-rose-500/10 text-rose-300"
                          : w.risk === "СРЕДНИЙ"
                            ? "border-amber-700/50 bg-amber-500/10 text-amber-300"
                            : "border-zinc-700 bg-zinc-800/60 text-zinc-400",
                      )}
                    >
                      РИСК УХОДА: {w.risk}
                    </Chip>
                    <div className="flex-1" />
                    <MiniBtn label="Отклонить" tone="rose" />
                    <MiniBtn label="Затянуть" tone="amber" />
                    <MiniBtn label="Запросить док." tone="zinc" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <Gauge className="h-3 w-3" />
                Технический лог
              </span>
            }
            className="h-[236px] shrink-0"
          >
            <div className="min-h-0 flex-1 space-y-[3px] overflow-y-auto p-2 font-mono text-[10px]">
              {TECH_LOG.map((l) => (
                <p key={l.text} className={cx("truncate", l.tone)}>
                  <span className="mr-1.5 text-zinc-700">{l.t}</span>
                  {l.text}
                </p>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Ticker />
      <EventFlash />
    </div>
  );
}

/** Строка оператора с живым таймером разговора и кнопками прослушки */
function AgentRow({ agent, second }: { agent: Agent; second: number }) {
  const meta = AGENT_STATE_META[agent.state];
  const onCall = agent.state === "call";

  return (
    <div className="flex items-center gap-2.5 border-b border-zinc-900 px-2.5 py-[7px]">
      <span className="tnum w-6 shrink-0 text-center font-mono text-[10px] text-zinc-700">
        {String(agent.seat).padStart(2, "0")}
      </span>

      <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot, onCall && "animate-pulse")} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-zinc-200">
          {agent.alias}
          <span className="ml-1.5 font-mono text-[9.5px] text-zinc-600">{agent.real}</span>
        </p>
        <p className="truncate font-mono text-[9.5px] text-zinc-600">
          {agent.desk}
          {onCall && (
            <>
              {" · "}
              <span className="text-zinc-400">
                {agent.onCallFlag} {agent.onCallWith}
              </span>
            </>
          )}
        </p>
      </div>

      <span className={cx("w-[74px] shrink-0 font-mono text-[9px] tracking-[0.1em]", meta.text)}>
        {meta.label}
      </span>

      <span
        className={cx(
          "tnum w-[46px] shrink-0 text-right font-mono text-[12px]",
          onCall ? "text-emerald-300" : "text-zinc-700",
        )}
      >
        {onCall ? mmss(agent.stateSince + second) : "—:—"}
      </span>

      <span className="tnum w-[62px] shrink-0 text-right font-mono text-[12px] text-emerald-300">
        {usd(agent.today)}
      </span>

      <span className="flex shrink-0 gap-1">
        <IconBtn icon={Ear} title="Прослушать" active={onCall} />
        <IconBtn icon={MessageSquareWarning} title="Подсказать" active={onCall} />
      </span>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  title,
  active,
}: {
  icon: typeof Ear;
  title: string;
  active: boolean;
}) {
  return (
    <button
      title={title}
      className={cx(
        "flex h-5 w-5 items-center justify-center rounded-[2px] border",
        active
          ? "border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:border-emerald-600 hover:text-emerald-300"
          : "border-zinc-900 bg-zinc-900/40 text-zinc-700",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.8} />
    </button>
  );
}

function FormRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-[3px] border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5">
      <span className="font-mono text-[9px] tracking-[0.14em] text-zinc-600 uppercase">
        {label}
      </span>
      <span className={cx("font-mono text-[11px] text-zinc-300", tone)}>{value}</span>
    </div>
  );
}

function MiniBtn({ label, tone }: { label: string; tone: "rose" | "amber" | "zinc" }) {
  const cls = {
    rose: "border-rose-800/60 bg-rose-950/50 text-rose-300",
    amber: "border-amber-800/60 bg-amber-950/50 text-amber-300",
    zinc: "border-zinc-800 bg-zinc-900/60 text-zinc-400",
  }[tone];
  return (
    <span className={cx("rounded-[2px] border px-1.5 py-[2px] text-[9.5px] whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

const TECH_LOG = [
  { t: "16:41", text: `${BRAND.voip.name}: номер +34 91 ··· помечен как СПАМ · заменён`, tone: "text-amber-400" },
  { t: "16:39", text: "SEAT-07 · сессия удалённого доступа открыта · 91.203.··.··", tone: "text-zinc-400" },
  { t: "16:38", text: `${BRAND.psp.name}: платёж 2 400 USD · маршрут B · OK`, tone: "text-emerald-400" },
  { t: "16:36", text: "SEAT-03 · попытка экспорта базы лидов · ЗАБЛОКИРОВАНО", tone: "text-rose-400" },
  { t: "16:34", text: "affiliate ADS-41: получено 128 лидов · DE, AT, CH", tone: "text-sky-400" },
  { t: "16:31", text: "AC-7742019 · ручная корректировка +18 000 · admin", tone: "text-emerald-400" },
  { t: "16:29", text: "WD-48210 · отклонено · причина: верификация", tone: "text-rose-400" },
  { t: "16:27", text: "зеркало домена -07 поднято · TTL 300", tone: "text-zinc-400" },
  { t: "16:24", text: "SEAT-11 · превышено время паузы 14 мин", tone: "text-amber-400" },
  { t: "16:22", text: `${BRAND.voip.name}: линия ES-04 · качество 3.1/5`, tone: "text-zinc-400" },
  { t: "16:19", text: "жалоба клиента на регулятора · тикет закрыт", tone: "text-rose-400" },
  { t: "16:17", text: "резервная копия CRM · 4.2 ГБ · OK", tone: "text-zinc-400" },
];
