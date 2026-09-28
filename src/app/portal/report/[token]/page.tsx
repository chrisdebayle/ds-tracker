import { notFound } from "next/navigation";
import { resolveShareToken } from "@/lib/share-tokens";
import { getEngagement, getEngagementCounts, getSegmentBreakdown } from "@/db/queries";
import { ReportView } from "@/components/report-view";

export default async function ReportPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveShareToken(token, "report");
  if (!link) notFound();

  const engagement = await getEngagement(link.engagementId);
  if (!engagement) notFound();

  const [{ counts }, segmentBreakdown] = await Promise.all([
    getEngagementCounts(engagement.id, "all"),
    getSegmentBreakdown(engagement.id),
  ]);

  return (
    <div className="min-h-screen bg-[var(--db-light)] px-8 py-10">
      <ReportView
        eyebrow="Engagement Closeout Report"
        clientName={engagement.name}
        window={`${engagement.startDate} – ${engagement.endDate ?? "Ongoing"}`}
        counts={counts}
        headlineQuote={engagement.headlineQuote}
        findings={engagement.findings}
        nextSteps={engagement.nextSteps}
        segmentBreakdown={segmentBreakdown}
        showThemeToggle
      />
    </div>
  );
}
