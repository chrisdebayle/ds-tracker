import Link from "next/link";
import { notFound } from "next/navigation";
import { getEngagement } from "@/db/queries";

const TABS = [
  { seg: "setup", label: "Setup" },
  { seg: "log", label: "Daily Log" },
  { seg: "dashboard", label: "Dashboard" },
  { seg: "recordings", label: "Call Recordings" },
  { seg: "report", label: "Diagnostic Report" },
];

export default async function EngagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/engagements" className="text-[12px] text-[var(--db-primary)] no-print">
          &larr; All Engagements
        </Link>
        <h1 className="font-display text-[22px] font-semibold text-[var(--db-dark)] mt-1">
          {engagement.name}
        </h1>
      </div>
      <nav className="flex gap-1 border-b border-[var(--db-line)] mb-6 no-print">
        {TABS.map((tab) => (
          <Link
            key={tab.seg}
            href={`/engagements/${id}/${tab.seg}`}
            className="px-3 py-2 text-[13px] font-medium text-[var(--db-ink-soft)] hover:text-[var(--db-primary)] border-b-2 border-transparent hover:border-[var(--db-primary)]"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
