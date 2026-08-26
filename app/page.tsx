import Link from "next/link";
import {
  Building2,
  Keyboard,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Users,
  Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { DIRECTOR_KEYS } from "@/lib/scene/events";

/**
 * Служебная страница. В кадр не попадает — с неё запускают экраны
 * на площадке: выбрал экран, выбрал номер места, нажал F11.
 */
const SCREENS = [
  {
    href: "/crm",
    icon: Users,
    title: "CRM оператора",
    sub: "Главный экран · 10 машин",
    desc: "Таблица «мамонтов», карточка клиента, софтфон с активным звонком, окно удалённого доступа к экрану жертвы.",
    seats: true,
    accent: "border-emerald-700/50 hover:border-emerald-500",
  },
  {
    href: "/drops",
    icon: Wallet,
    title: "CRM дроповода",
    sub: "Вывод денег · 10 машин",
    desc: "Реестр подставных карт, очередь заливов, цепочки отмыва до наличных, касса и точки снятия.",
    seats: true,
    accent: "border-violet-700/50 hover:border-violet-500",
  },
  {
    href: "/chat",
    icon: MessageSquare,
    title: "CRM чатера",
    sub: "Мессенджеры · 10 машин",
    desc: "Переписка с жертвой, личины-аккаунты, звонок с подменой голоса, видео с подменой лица, фишинговые ссылки и перехват СМС-кодов.",
    seats: true,
    accent: "border-cyan-700/50 hover:border-cyan-500",
  },
  {
    href: "/wall",
    icon: LayoutDashboard,
    title: "Экран на стену",
    sub: "Общий план",
    desc: "Депозиты за смену, лидерборд операторов, карта мира с активными звонками, почасовая выручка.",
    seats: false,
    accent: "border-sky-700/50 hover:border-sky-500",
  },
  {
    href: "/client",
    icon: LineChart,
    title: "Экран жертвы",
    sub: "Фейковый терминал",
    desc: `Кабинет ${BRAND.broker.name}: растущий график, прибыль, попытка вывода и требование «налога 10%».`,
    seats: false,
    accent: "border-amber-700/50 hover:border-amber-500",
  },
  {
    href: "/admin",
    icon: Building2,
    title: "Панель супервайзера",
    sub: "Экран главного",
    desc: "Мониторинг звонков, корректировка баланса клиента, очередь заявок на вывод, подкрутка котировок.",
    seats: false,
    accent: "border-fuchsia-700/50 hover:border-fuchsia-500",
  },
] as const;

const SEATS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Launcher() {
  return (
    <main className="grid-bg h-full overflow-y-auto bg-zinc-950 px-8 py-7">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-6">
          <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-600 uppercase">
            Экранный реквизит · сериал «Капкан»
          </p>
          <h1 className="mt-1 text-[26px] font-semibold text-zinc-100">
            Пульт запуска экранов
          </h1>
          <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-zinc-500">
            Выберите экран и номер рабочего места. У каждого места свои операторы, клиенты и
            суммы — десять одинаковых мониторов в общем плане сразу читаются как декорация.
            После открытия нажмите <Kbd>F11</Kbd> для полноэкранного режима.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {SCREENS.map((s, i) => (
            <div
              key={s.href}
              className={`rounded-[5px] border bg-[#0d0d10] p-4 transition-colors ${s.accent} ${
                // Нечётное число карточек оставило бы дыру в сетке из двух колонок
                i === SCREENS.length - 1 && SCREENS.length % 2 === 1 ? "col-span-2" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.6} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[15px] font-semibold text-zinc-100">{s.title}</h2>
                    <span className="font-mono text-[9.5px] tracking-[0.12em] text-zinc-600 uppercase">
                      {s.sub}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-zinc-500">{s.desc}</p>
                </div>
              </div>

              {s.seats ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {SEATS.map((n) => (
                    <Link
                      key={n}
                      href={`${s.href}/${n}/`}
                      className="tnum flex h-8 w-9 items-center justify-center rounded-[3px] border border-zinc-800 bg-zinc-900/60 font-mono text-[12px] text-zinc-300 hover:border-emerald-600 hover:bg-emerald-950/50 hover:text-emerald-300"
                    >
                      {String(n).padStart(2, "0")}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={s.href}
                  className="mt-3 inline-flex h-8 items-center rounded-[3px] border border-zinc-800 bg-zinc-900/60 px-4 font-mono text-[11px] tracking-[0.1em] text-zinc-300 uppercase hover:border-zinc-600 hover:text-zinc-100"
                >
                  Открыть экран
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Шпаргалка режиссёра — печатается и кладётся рядом с монитором */}
        <section className="mt-5 rounded-[5px] border border-zinc-800 bg-[#0d0d10] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-zinc-200">
            <Keyboard className="h-4 w-4 text-zinc-500" strokeWidth={1.7} />
            Режиссёрский пульт
            <span className="font-mono text-[10px] font-normal tracking-wider text-zinc-600">
              работает на любом экране, в кадре не виден
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {DIRECTOR_KEYS.map((k) => (
              <div key={k.key} className="flex items-baseline gap-3 border-b border-zinc-900 pb-1.5">
                <Kbd>Ctrl+Alt+{k.key}</Kbd>
                <div className="min-w-0">
                  <p className="text-[12px] text-zinc-300">{k.label}</p>
                  <p className="text-[10.5px] text-zinc-600">{k.hint}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            Все данные вымышленные: бренды, имена, телефоны и номера карт не существуют.
            Проект не подключается к сети и не обрабатывает реальных данных.
          </p>
        </section>
      </div>
    </main>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="shrink-0 rounded-[3px] border border-zinc-700 bg-zinc-900 px-1.5 py-[2px] font-mono text-[10.5px] whitespace-nowrap text-zinc-300">
      {children}
    </kbd>
  );
}
