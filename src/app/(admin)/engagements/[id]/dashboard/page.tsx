import Link from "next/link";
import { notFound } from "next/navigation";
import { getEngagement, getEngagementCounts, getSegmentBreakdown, type Range } from "@/db/queries";
import { getOrCreateShareLink } from "@/lib/share-tokens";
import { getSiteOrigin } from "@/lib/site-url";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  BelowMinimumBanner,
  CompositeMetricCards,
  DispositionBreakdownTable,
  KpiStrip,
  SegmentBreakdownCards,
} from "@/components/dashboard-blocks";

const RANGES: { key: Range; label: string }[] = [
  { key: "all", label: "All-Time" },
  { key: "30d", label: "Last 30 Days" },
  { key: "7d", label: "Last 7 Days" },
];

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const { range: rangeParam } = await searchParams;
  const range: Range = rangeParam === "30d" || rangeParam === "7d" ? rangeParam : "all";

  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [{ counts, dials, totalCompleted: completed }, segmentBreakdown, liveLink, origin] =
    await Promise.all([
      getEngagementCounts(id, range),
      getSegmentBreakdown(id),
      getOrCreateShareLink(id, "live"),
      getSiteOrigin(),
    ]);

  const liveUrl = `${origin}/portal/live/${liveLink.token}`;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 no-print">
        <div className="text-[12px] text-[var(--db-muted)]">
          Shared with the client via the Live View link below — dashboard + call recordings only.
        </div>
        <div className="flex gap-2">
          <Link href={liveUrl} target="_blank" className="text-[13px] font-semibold text-[var(--db-primary)] self-center">
            Preview Client View
          </Link>
          <CopyLinkButton label="Copy Client Link" url={liveUrl} />
        </div>
      </div>

      <div className="flex gap-1 mb-6 no-print">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`?range=${r.key}`}
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
        <SegmentBreakdownCards breakdown={segmentBreakdown} showLogic />
      </div>
    </div>
  );
}
