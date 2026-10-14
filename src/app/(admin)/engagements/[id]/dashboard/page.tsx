import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEngagement,
  getEngagementCounts,
  getRepBreakdown,
  getSegmentBreakdown,
  type Range,
} from "@/db/queries";
import { diagnose } from "@/lib/diagnosis";
import { getOrCreateShareLink } from "@/lib/share-tokens";
import { getSiteOrigin } from "@/lib/site-url";
import { ShareLinkControls } from "@/components/share-link-controls";
import { regenerateShareLinkAction, revokeShareLinkAction } from "../../../actions";
import {
  AttemptMix,
  BelowMinimumBanner,
  DiagnosisPanel,
  CompositeMetricCards,
  DispositionBreakdownTable,
  RecycledActivityNote,
  ResearchNislNote,
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
  searchParams: Promise<{ range?: string; recycled?: string }>;
}) {
  const { id } = await params;
  const { range: rangeParam, recycled: recycledParam } = await searchParams;
  const excludeRecycled = recycledParam === "exclude";
  const range: Range = rangeParam === "30d" || rangeParam === "7d" ? rangeParam : "all";

  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [{ counts, dials, totalCompleted: completed, recycled, attempts, researchNisl }, allTime, segmentBreakdown, liveLink, origin] =
    await Promise.all([
      getEngagementCounts(id, range, { excludeRecycled }),
      range === "all" ? Promise.resolve(null) : getEngagementCounts(id, "all", { excludeRecycled }),
      getSegmentBreakdown(id),
      getOrCreateShareLink(id, "live"),
      getSiteOrigin(),
    ]);

  // The 200-conversation minimum is an all-time engagement maturity gate, not
  // a per-range one — otherwise it falsely fires on nearly every 7d/30d view.
  const allTimeCompleted = allTime ? allTime.totalCompleted : completed;

  // Each list is its own run per the framework, so the diagnosis is per list.
  // The by-rep split is only needed (and only fetched) when the
  // "interest isn't landing" rule fires for that list.
  const diagnosisItems = await Promise.all(
    segmentBreakdown.map(async (b) => {
      const diagnosis = diagnose(b.counts, b.researchNisl);
      const needsReps = diagnosis.findings.some((f) => f.id === "interest");
      const reps = needsReps ? await getRepBreakdown(id, b.segment.id) : [];
      return {
        id: b.segment.id,
        name: b.segment.name,
        recycledFrom: b.segment.isReallocation ? (b.sourceSegmentName ?? "") : undefined,
        diagnosis,
        reps,
      };
    })
  );

  const liveUrl = `${origin}/portal/live/${liveLink.token}`;
  const revokeLive = revokeShareLinkAction.bind(null, id, "live");
  const regenerateLive = regenerateShareLinkAction.bind(null, id, "live");

  return (
    <div>
      <div className="flex items-start justify-between mb-6 no-print">
        <div className="text-[12px] text-[var(--db-muted)]">
          Shared with the client via the Live View link below — dashboard + call recordings only.
        </div>
        <ShareLinkControls
          label="Copy Client Link"
          previewLabel="Preview Client View"
          url={liveUrl}
          revoked={!!liveLink.revokedAt}
          onRevoke={revokeLive}
          onRegenerate={regenerateLive}
        />
      </div>

      <div className="flex gap-1 mb-6 no-print">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`?range=${r.key}${excludeRecycled ? "&recycled=exclude" : ""}`}
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
      <RecycledActivityNote
        recycled={recycled}
        excludeRecycled={excludeRecycled}
        toggleHref={`?range=${range}${excludeRecycled ? "" : "&recycled=exclude"}`}
      />
      <ResearchNislNote count={researchNisl} />
      <AttemptMix attempts={attempts} />
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

      <div className="mb-8">
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-1">
          Diagnosis by List
        </h2>
        <p className="text-[12px] text-[var(--db-muted)] mb-3">
          Disposition Science IF/THEN matrix, run separately on each list (a list or message change is a
          fresh run). Priority when several fire: List, then Message, then Rep. Admin only.
        </p>
        <DiagnosisPanel items={diagnosisItems} />
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
        <SegmentBreakdownCards breakdown={segmentBreakdown} showLogic />
      </div>
    </div>
  );
}
