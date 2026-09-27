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
        <header className="mb-8 border-b border-[var(--db-line)] pb-6">
          <div className="text-[11px] uppercase tracking-widest text-[var(--db-primary)] font-semibold mb-2">
            Outbound Engagement Reporting
          </div>
          <h1 className="font-display text-[24px] font-semibold text-[var(--db-dark)]">
            {engagement.name}
          </h1>
          <div className="text-[13px] text-[var(--db-muted)] mt-1">
            {engagement.startDate} &ndash; {engagement.endDate ?? "Ongoing"} &middot; Updated as calls
            are logged
          </div>
        </header>

        <nav className="flex gap-1 mb-6">
          <Link
            href={`${base}?tab=dashboard`}
            className={`px-3 py-2 text-[13px] font-medium border-b-2 ${
              tab === "dashboard"
                ? "border-[var(--db-primary)] text-[var(--db-primary)]"
                : "border-transparent text-[var(--db-ink-soft)]"
            }`}
          >
            Summary Dashboard
          </Link>
          <Link
            href={`${base}?tab=recordings`}
            className={`px-3 py-2 text-[13px] font-medium border-b-2 ${
              tab === "recordings"
                ? "border-[var(--db-primary)] text-[var(--db-primary)]"
                : "border-transparent text-[var(--db-ink-soft)]"
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
  const [{ counts, dials, totalCompleted: completed }, segmentBreakdown] = await Promise.all([
    getEngagementCounts(engagementId, range),
    getSegmentBreakdown(engagementId),
  ]);

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
                : "bg-white border border-[var(--db-line)] text-[var(--db-ink-soft)]"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <KpiStrip counts={counts} dials={dials} />
      <BelowMinimumBanner completed={completed} />

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
        </h2>
        <SegmentBreakdownCards breakdown={segmentBreakdown} showLogic={false} />
      </div>
    </div>
  );
}

async function RecordingsTab({ engagementId }: { engagementId: string }) {
  const [recordingList, repList] = await Promise.all([getRecordings(engagementId), getReps(engagementId)]);
  const repName = (repId: string | null) => repList.find((r) => r.id === repId)?.name ?? "—";

  if (recordingList.length === 0) {
    return <p className="text-sm text-[var(--db-muted)]">No recordings logged yet.</p>;
  }

  return (
    <DataTable
      columns={["Date", "Rep", "Contact", "Company", "Duration (min)", "Consent", "Notes"]}
      rows={recordingList.map((r) => [
        r.date,
        repName(r.repId),
        r.contact,
        r.company,
        r.durationMinutes,
        r.consent ? "Yes" : "No",
        r.notes,
      ])}
    />
  );
}
