import { getEngagementCounts, getProgressFacts } from "@/db/queries";
import { EARLY_MIN_SAMPLE } from "@/lib/diagnosis";
import { MIN_SAMPLE_SIZE } from "@/lib/disposition";
import { Card } from "@/components/ui";

const pctOf = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—");

/**
 * Plain-facts status for the client Live View: pace, reachability and list fit,
 * plus an optional note the admin writes. It never contains a diagnosis, rep
 * detail or coaching guidance. Always computed on all-time data.
 */
export async function ProgressUpdate({
  engagementId,
  note,
  preview = false,
}: {
  engagementId: string;
  note: string | null;
  preview?: boolean;
}) {
  const [all, facts] = await Promise.all([getEngagementCounts(engagementId, "all"), getProgressFacts(engagementId)]);
  const completed = all.totalCompleted;
  const perDay = facts.dialingDays > 0 ? completed / facts.dialingDays : 0;
  const toFull = Math.max(0, MIN_SAMPLE_SIZE - completed);
  const daysToFull = perDay > 0 && facts.dialingDays >= 3 ? Math.ceil(toFull / perDay) : null;
  const worked = completed + all.researchNisl;
  const a = all.attempts;
  const barPct = Math.min(100, (completed / MIN_SAMPLE_SIZE) * 100);

  return (
    <Card className="mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-[15px] font-semibold text-[var(--db-dark)]">Progress Update</h2>
        {preview && <span className="text-[11px] text-[var(--db-muted)]">Admin preview of what the client sees</span>}
      </div>

      {note && <p className="text-[13.5px] text-[var(--db-ink-soft)] leading-relaxed mb-4 whitespace-pre-line">{note}</p>}

      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          ["Completed conversations", String(completed)],
          ["Dials", String(all.dials)],
          ["Contact rate", pctOf(completed, all.dials)],
          ["Dialing days", String(facts.dialingDays)],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold">{label}</div>
            <div className="font-display text-[20px] font-semibold text-[var(--db-dark)]">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-1 flex justify-between text-[11px] text-[var(--db-muted)]">
        <span>0</span>
        <span>{EARLY_MIN_SAMPLE}: early read</span>
        <span>{MIN_SAMPLE_SIZE}: full diagnosis</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-[var(--db-line)] overflow-hidden mb-3">
        <div className="h-full bg-[var(--db-primary)]" style={{ width: `${barPct}%` }} />
        <div
          className="absolute top-0 h-full w-px bg-[var(--db-dark)] opacity-50"
          style={{ left: `${(EARLY_MIN_SAMPLE / MIN_SAMPLE_SIZE) * 100}%` }}
        />
      </div>

      <ul className="text-[13px] text-[var(--db-ink-soft)] flex flex-col gap-1.5 list-disc pl-5">
        <li>
          {completed >= MIN_SAMPLE_SIZE
            ? "The full-sample diagnosis is available."
            : completed >= EARLY_MIN_SAMPLE
              ? `An early read is available now. ${toFull} more completed conversations unlock the full diagnosis.`
              : `${EARLY_MIN_SAMPLE - completed} more completed conversations unlock an early read; ${toFull} unlock the full diagnosis.`}
          {daysToFull !== null &&
            completed < MIN_SAMPLE_SIZE &&
            ` At the current pace (about ${perDay.toFixed(1)} completed conversations per dialing day), the full sample is roughly ${daysToFull} dialing days away.`}
        </li>
        {a.dials > 0 && (
          <li>
            Of {a.dials} dials: {pctOf(a.noAnswer, a.dials)} went unanswered or to voicemail, {pctOf(a.aiScreener, a.dials)}{" "}
            were stopped by a call screener, {pctOf(a.wrongNumber, a.dials)} reached a wrong number, and{" "}
            {pctOf(a.connected, a.dials)} became conversations
            {a.unclassified > 0 && `; ${pctOf(a.unclassified, a.dials)} have no result recorded`}.
          </li>
        )}
        {all.researchNisl > 0 && (
          <li>
            {all.researchNisl} of {worked} contacts worked were ruled out as not a fit from research before anyone
            spoke ({pctOf(all.researchNisl, worked)}).
          </li>
        )}
      </ul>
    </Card>
  );
}
