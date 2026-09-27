import { notFound } from "next/navigation";
import { getEngagement, getEngagementCounts, getSegmentBreakdown } from "@/db/queries";
import { getOrCreateShareLink } from "@/lib/share-tokens";
import { getSiteOrigin } from "@/lib/site-url";
import { ShareLinkControls } from "@/components/share-link-controls";
import { ReportView } from "@/components/report-view";
import { regenerateShareLinkAction, revokeShareLinkAction, updateReportContent } from "../../../actions";
import { Field, inputClass, Button, Card } from "@/components/ui";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [{ counts }, segmentBreakdown, reportLink, origin] = await Promise.all([
    getEngagementCounts(id, "all"),
    getSegmentBreakdown(id),
    getOrCreateShareLink(id, "report"),
    getSiteOrigin(),
  ]);

  const reportUrl = `${origin}/portal/report/${reportLink.token}`;
  const action = updateReportContent.bind(null, id);
  const revokeReport = revokeShareLinkAction.bind(null, id, "report");
  const regenerateReport = regenerateShareLinkAction.bind(null, id, "report");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-end gap-2 no-print">
        <ShareLinkControls
          label="Copy Report Link"
          previewLabel="Preview Report"
          url={reportUrl}
          revoked={!!reportLink.revokedAt}
          onRevoke={revokeReport}
          onRegenerate={regenerateReport}
        />
        <a
          href={`/engagements/${id}/report/print`}
          target="_blank"
          className="rounded-[var(--db-radius)] border border-dashed border-[var(--db-line)] px-4 py-2 text-sm font-semibold text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]"
        >
          Export PDF
        </a>
      </div>

      <Card className="no-print">
        <h2 className="font-display text-[15px] font-semibold text-[var(--db-dark)] mb-4">
          Closeout Content
        </h2>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Headline Quote (Section 01 callout)">
            <input name="headlineQuote" defaultValue={engagement.headlineQuote ?? ""} className={inputClass} />
          </Field>
          <Field label="Failure Modes (one per line, ranked)">
            <textarea
              name="findings"
              rows={4}
              defaultValue={(engagement.findings ?? []).join("\n")}
              className={inputClass}
            />
          </Field>
          <Field label="Next Steps (one per line, ranked)">
            <textarea
              name="nextSteps"
              rows={4}
              defaultValue={(engagement.nextSteps ?? []).join("\n")}
              className={inputClass}
            />
          </Field>
          <div>
            <Button type="submit">Save Report Content</Button>
          </div>
        </form>
      </Card>

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
    </div>
  );
}
