import {
  DispositionCounts,
  MIN_SAMPLE_SIZE,
  dispositionBreakdown,
  listDrivenOutcomesPct,
  meetingActivatedPct,
  totalCompleted,
} from "@/lib/disposition";
import { Callout, Card, DataTable, KpiCard, Section, StatusPill } from "@/components/ui";
import { SegmentBreakdownCards } from "@/components/dashboard-blocks";
import { ThemeToggle } from "@/components/theme-toggle";

export interface ReportSegment {
  segment: { id: string; name: string; listTotal: number; logic: string | null; read: string | null };
  counts: DispositionCounts;
  logged: number;
  pctOfList: number;
}

export function ReportView({
  eyebrow,
  clientName,
  window,
  counts,
  headlineQuote,
  findings,
  nextSteps,
  segmentBreakdown,
  showThemeToggle = false,
}: {
  eyebrow: string;
  clientName: string;
  window: string;
  counts: DispositionCounts;
  headlineQuote?: string | null;
  findings?: string[] | null;
  nextSteps?: string[] | null;
  segmentBreakdown: ReportSegment[];
  /** Only the standalone client-facing portal report has no surrounding
   * chrome to host a toggle — the admin report page has one in its sidebar,
   * and the print route should never show one. */
  showThemeToggle?: boolean;
}) {
  const completed = totalCompleted(counts);
  const below = completed < MIN_SAMPLE_SIZE;
  const rows = dispositionBreakdown(counts).sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-[960px] mx-auto">
      <header className="mb-10 border-b border-[var(--db-line)] pb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--db-primary)] font-semibold mb-2">
            {eyebrow}
          </div>
          <h1 className="font-display text-[26px] font-semibold text-[var(--db-dark)]">{clientName}</h1>
          <div className="text-[13px] text-[var(--db-muted)] mt-1">{window}</div>
        </div>
        {showThemeToggle && (
          <span className="no-print">
            <ThemeToggle />
          </span>
        )}
      </header>

      <Section number="01" label="Snapshot" title="Engagement at a glance">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KpiCard
            label="List-Driven Outcomes"
            value={`${listDrivenOutcomesPct(counts).toFixed(1)}%`}
            sub={<div className="text-[11px] text-[var(--db-muted)]">of every logged conversation</div>}
          />
          <KpiCard
            label="Meeting + Activated"
            value={`${meetingActivatedPct(counts).toFixed(1)}%`}
            sub={<div className="text-[11px] text-[var(--db-muted)]">floor 20% &middot; target 25%+</div>}
          />
          <KpiCard
            label="Meetings Booked"
            value={`${counts.meeting} of ${completed}`}
            sub={<div className="text-[11px] text-[var(--db-muted)]">logged conversations</div>}
          />
        </div>
        <Callout>
          {headlineQuote ||
            "Keep logging — the diagnostic read will sharpen as the sample grows past 200 completed conversations."}
        </Callout>
      </Section>

      <Section number="02" label="Distribution" title="Disposition breakdown">
        <DataTable
          columns={["Disposition", "Count", "% of Completed", "Benchmark", "Status", "Signal"]}
          rows={rows.map((r) => [
            r.label,
            r.count,
            r.pct,
            r.benchmark,
            <StatusPill key={r.key} status={r.status} label={r.statusLabel} />,
            r.pillar,
          ])}
        />
      </Section>

      {below ? (
        <Card className="bg-[var(--db-tint-warm)] border-[var(--db-accent-700)]">
          <div className="text-sm font-semibold text-[var(--db-accent-800)]">
            Build sample size first
          </div>
          <div className="text-[13px] text-[var(--db-ink-soft)] mt-1">
            This engagement has {completed} completed conversations, below the framework&rsquo;s
            {` ${MIN_SAMPLE_SIZE}`}-conversation minimum. Failure-mode analysis, segment reads, and
            recommendations require a larger sample before they&rsquo;re statistically meaningful.
          </div>
        </Card>
      ) : (
        <>
          {findings && findings.length > 0 && (
            <Section number="03" label="Failure Modes" title="Ranked findings">
              <ol className="flex flex-col gap-2">
                {findings.map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--db-ink-soft)]">
                    <span className="font-display font-semibold text-[var(--db-primary)]">{i + 1}</span>
                    {f}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <Section number="04" label="Segments" title="Target list performance">
            <SegmentBreakdownCards breakdown={segmentBreakdown} showLogic={false} />
          </Section>

          {nextSteps && nextSteps.length > 0 && (
            <Section number="05" label="Next Steps" title="Recommendations">
              <ul className="flex flex-col gap-2">
                {nextSteps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--db-ink-soft)]">
                    <span className="font-display font-semibold text-[var(--db-primary)]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
