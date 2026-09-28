import { ReactNode } from "react";
import type { Status } from "@/lib/disposition";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[var(--db-paper)] border border-[var(--db-line)] rounded-[var(--db-radius)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "warm" | "good" | "fail";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--db-line)] text-[var(--db-ink-soft)]",
    blue: "bg-[var(--db-tint-blue)] text-[var(--db-primary)]",
    warm: "bg-[var(--db-tint-warm)] text-[var(--db-accent-700)]",
    good: "bg-[var(--db-tint-blue)] text-[var(--db-pass)]",
    fail: "bg-[var(--db-tint-warm)] text-[var(--db-fail)]",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status, label }: { status: Status; label: string }) {
  const tone = status === "good" ? "good" : status === "watch" ? "fail" : "neutral";
  return <Pill tone={tone}>{label}</Pill>;
}

export function KpiCard({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold">
        {label}
      </div>
      <div className="font-display text-[26px] font-semibold text-[var(--db-dark)]">{value}</div>
      {sub}
    </Card>
  );
}

export function Section({
  number,
  label,
  title,
  children,
}: {
  number: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-4 border-b border-[var(--db-line)] pb-3">
        <span className="font-display text-[13px] font-semibold text-[var(--db-primary)]">
          {number}
        </span>
        <span className="text-[10.5px] uppercase tracking-widest text-[var(--db-muted)] font-semibold">
          {label}
        </span>
        <h2 className="font-display text-[19px] font-semibold text-[var(--db-dark)] ml-2">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-[3px] border-[var(--db-accent-700)] pl-4 py-1 my-4 font-display text-[17px] text-[var(--db-dark)]">
      {children}
    </blockquote>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (ReactNode | string | number)[][];
}) {
  return (
    <div className="overflow-x-auto border border-[var(--db-line)] rounded-[var(--db-radius)]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--db-primary)] text-white">
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-semibold text-[12px] whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--db-line)] odd:bg-[var(--db-paper)] even:bg-[var(--db-light)]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RulesList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-[var(--db-ink-soft)]">
          <span className="text-[var(--db-primary)]">&#8250;</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[var(--db-radius)] border border-[var(--db-line)] bg-[var(--db-tint-blue)] px-3 py-2 text-sm text-[var(--db-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--db-primary)]";

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  const base = "rounded-[var(--db-radius)] px-4 py-2 text-sm font-semibold transition-colors";
  const styles =
    variant === "primary"
      ? "bg-[var(--db-primary)] text-white hover:opacity-90"
      : "border border-dashed border-[var(--db-line)] text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]";
  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
}
