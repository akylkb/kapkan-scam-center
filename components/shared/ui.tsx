import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className,
  title,
  right,
  accent,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  right?: ReactNode;
  accent?: "default" | "danger" | "success";
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 flex-col overflow-hidden rounded-sm border bg-[#0d0d10]",
        accent === "danger"
          ? "border-rose-900/60"
          : accent === "success"
            ? "border-emerald-900/60"
            : "border-zinc-800/80",
        className,
      )}
    >
      {title !== undefined && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1.5">
          <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

/** Маленькая метка-«чип»: статусы, теги, коды */
export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-[1px] font-mono text-[9.5px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Пульсирующая точка — «живое» соединение, активный звонок, клиент онлайн */
export function LiveDot({ className, size = 5 }: { className?: string; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={cx("absolute inset-0 animate-ping rounded-full opacity-70", className)}
      />
      <span className={cx("relative inline-flex rounded-full", className)} style={{ width: size, height: size }} />
    </span>
  );
}

/** Подпись поля в карточке клиента */
export function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-zinc-900 py-[3px]">
      <span className="font-mono text-[9.5px] tracking-wide text-zinc-600 uppercase">{label}</span>
      <span className={cx("truncate text-right text-[11px] text-zinc-300", valueClass)}>{value}</span>
    </div>
  );
}

/** Горизонтальная шкала: «температура» лида, прогресс плана, уровень сигнала */
export function Meter({
  value,
  className,
  trackClass,
}: {
  value: number;
  className?: string;
  trackClass?: string;
}) {
  return (
    <div className={cx("h-1 w-full overflow-hidden rounded-full bg-zinc-800/80", trackClass)}>
      <div
        className={cx("h-full rounded-full transition-[width] duration-700", className)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
