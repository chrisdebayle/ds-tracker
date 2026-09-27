import { notFound } from "next/navigation";
import { getEngagement, getEngagementCounts, getSegmentBreakdown } from "@/db/queries";
import { ReportView } from "@/components/report-view";

export default async function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [{ counts }, segmentBreakdown] = await Promise.all([
    getEngagementCounts(id, "all"),
    getSegmentBreakdown(id),
  ]);

  return (
    <ReportView
      eyebrow="Diagnostic Report"
      clientName={engagement.name}
      window={`${engagement.startDate} – ${engagement.endDate ?? "Ongoing"}`}
      counts={counts}
      headlineQuote={engagement.headlineQuote}
      findings={engagement.findings}
      nextSteps={engagement.nextSteps}
      segmentBreakdown={segmentBreakdown}
    />
  );
}
