import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveShareToken } from "@/lib/share-tokens";
import { getEngagement, getEngagementCounts, getRecordings, getReps, getSegmentBreakdown, type Range } from "@/db/queries";
import {
  BelowMinimumBanner,
  CompositeMetricCards,
  DispositionBreakdownTable,
  KpiStrip,
  SegmentBreakdownCards,
} from "@/components/dashboard-blocks";
import { DataTable } from "@/components/ui";
import { nameById } from "@/lib/lookup";
import { ThemeToggle } from "@/components/theme-toggle";

const RANGES: { key: Range; label: string }[] = [
  { key: "all", label: "All-Time" },
  { key: "30d", label: "Last 30 Days" },
  { key: "7d", label: "Last 7 Days" },
];

export default async function LivePortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const { token } = await params;
  const { tab: tabParam, range: rangeParam } = await searchParams;
  const tab = tabParam === "recordings" ? "recordings" : "dashboard";
  const range: Range = rangeParam === "30d" || rangeParam === "7d" ? rangeParam : "all";

  const link = await resolveShareToken(token, "live");
  if (!link) notFound();

  const engagement = await getEngagement(link.engagementId);
  if (!engagement) notFound();

  const base = `/portal/live/${token}`;

  return (
    <div className="min-h-screen bg-[var(--db-light)]">
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        <header className="mb-8 border-b border-[var(--db-line)] pb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--db-primary)] font-semibold mb-2">
              Outbound Engagement Reporting
            </div>
            <h1 className="font-display text-[24px] font-semibold text-[var(--db-dark)]">
              {engagement.name}
            </h1>
            <div className="text-[13px] text-[var(--db-muted)] mt-1">
              {engagement.startDate} &ndash; {engagement.endDate ?? "Ongoing"} &middot; Updated as
              calls are logged
            </div>
          </div>
          <span className="no-print">
            <ThemeToggle />
          </span>
        </header>

        <nav className="flex gap-2 mb-6">
          <Link
            href={`${base}?tab=dashboard`}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              tab === "dashboard"
                ? "bg-[var(--db-primary)] text-white"
                : "bg-[var(--db-paper)] border border-[var(--db-line)] text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]"
            }`}
          >
            Summary Dashboard
          </Link>
          <Link
            href={`${base}?tab=recordings`}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              tab === "recordings"
                ? "bg-[var(--db-primary)] text-white"
                : "bg-[var(--db-paper)] border border-[var(--db-line)] text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]"
            }`}
          >
            Call Recordings
          </Link>
        </nav>

        {tab === "dashboard" ? (
          <DashboardTab engagementId={engagement.id} base={base} range={range} />
        ) : (
          <RecordingsTab engagementId={engagement.id} />
        )}
      </div>
    </div>
  );
}

async function DashboardTab({
  engagementId,
  base,
  range,
}: {
  engagementId: string;
  base: string;
  range: Range;
}) {
  const [{ counts, dials, totalCompleted: completed }, allTime, segmentBreakdown] = await Promise.all([
    getEngagementCounts(engagementId, range),
    range === "all" ? Promise.resolve(null) : getEngagementCounts(engagementId, "all"),
    getSegmentBreakdown(engagementId),
  ]);

  // The 200-conversation minimum is an all-time engagement maturity gate, not
  // a per-range one — otherwise it falsely fires on nearly every 7d/30d view.
  const allTimeCompleted = allTime ? allTime.totalCompleted : completed;

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`${base}?tab=dashboard&range=${r.key}`}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${
              range === r.key
                ? "bg-[var(--db-primary)] text-white"
                : "bg-[var(--db-paper)] border border-[var(--db-line)] text-[var(--db-ink-soft)]"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <KpiStrip counts={counts} dials={dials} />
      <BelowMinimumBanner completed={allTimeCompleted} />

      <div className="mb-8">
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          Disposition Breakdown
        </h2>
        <DispositionBreakdownTable counts={counts} />
      </div>

      <div className="mb-8">
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          Composite Diagnostic Metrics
        </h2>
        <CompositeMetricCards counts={counts} />
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          Segment Breakdown
          {range !== "all" && (
            <span className="text-[11px] font-normal text-[var(--db-muted)] ml-2">
              (always shows all-time totals, not the selected range)
            </span>
          )}
        </h2>
        <SegmentBreakdownCards breakdown={segmentBreakdown} showLogic={false} />
      </div>
    </div>
  );
}

async function RecordingsTab({ engagementId }: { engagementId: string }) {
  const [recordingList, repList] = await Promise.all([getRecordings(engagementId), getReps(engagementId)]);
  const repName = nameById(repList);

  if (recordingList.length === 0) {
    return <p className="text-sm text-[var(--db-muted)]">No recordings logged yet.</p>;
  }

  return (
    <DataTable
      columns={["Date", "Rep", "Contact", "Company", "Duration (min)", "Consent", "Notes", "Link"]}
      rows={recordingList.map((r) => [
        r.date,
        repName(r.repId),
        r.contact,
        r.company,
        r.durationMinutes,
        r.consent ? "Yes" : "No",
        r.notes,
        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--db-primary)] font-semibold">
          Open
        </a>,
      ])}
    />
  );
}
