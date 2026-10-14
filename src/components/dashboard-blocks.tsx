import Link from "next/link";
import {
  ATTEMPT_CAP,
  type AttemptTotals,
  DispositionCounts,
  MIN_SAMPLE_SIZE,
  dispositionBreakdown,
  meetingActivatedPct,
  meetingActivatedStatus,
  notMeReferredPct,
  notMeReferredStatus,
  contactRate,
  totalCompleted,
} from "@/lib/disposition";
import { Card, DataTable, KpiCard, Pill, StatusPill } from "@/components/ui";
import type { Diagnosis } from "@/lib/diagnosis";
import { CONFIRM_SAMPLE_SIZE } from "@/lib/diagnosis";

export function BelowMinimumBanner({ completed }: { completed: number }) {
  if (completed >= MIN_SAMPLE_SIZE) return null;
  return (
    <Card className="bg-[var(--db-tint-warm)] border-[var(--db-accent-700)] mb-6">
      <div className="text-sm text-[var(--db-accent-800)] font-semibold">
        Below minimum sample size
      </div>
      <div className="text-[13px] text-[var(--db-ink-soft)] mt-1">
        This engagement has {completed} completed conversations. The Disposition Science framework
        recommends at least {MIN_SAMPLE_SIZE} before diagnostics are statistically meaningful.
      </div>
    </Card>
  );
}

export function ResearchNislNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="text-[12px] text-[var(--db-muted)] -mt-4 mb-6">
      Not counted above: {count} NISL account{count === 1 ? "" : "s"} judged from research without a verbal
      conversation. Completed conversations and every percentage here reflect only calls where the target spoke.
    </div>
  );
}

export function RecycledActivityNote({
  recycled,
  excludeRecycled,
  toggleHref,
}: {
  recycled: { dials: number; totalCompleted: number };
  excludeRecycled: boolean;
  toggleHref: string;
}) {
  if (recycled.dials === 0 && recycled.totalCompleted === 0) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px] text-[var(--db-muted)] -mt-4 mb-6">
      <span>
        {excludeRecycled ? "Not included above: " : "Includes "}
        {recycled.dials} dials / {recycled.totalCompleted} conversations from recycled lists
      </span>
      <Link
        href={toggleHref}
        className="rounded-full border border-[var(--db-line)] bg-[var(--db-paper)] px-3 py-1 font-semibold text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]"
      >
        {excludeRecycled ? "Include recycled lists" : "Exclude recycled lists"}
      </Link>
    </div>
  );
}

export function AttemptMix({ attempts }: { attempts: AttemptTotals }) {
  if (attempts.dials === 0) return null;
  const items = [
    { label: "Connected", value: attempts.connected },
    { label: "No Answer", value: attempts.noAnswer },
    { label: "AI Screener", value: attempts.aiScreener },
    { label: "Wrong Number", value: attempts.wrongNumber },
    { label: "Not recorded", value: attempts.unclassified },
  ];
  return (
    <Card className="mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-[14px] font-semibold text-[var(--db-dark)]">
          Where the dials went
        </h2>
        <span className="text-[11px] text-[var(--db-muted)]">
          {attempts.dials} dials &middot; reachability, kept separate from disposition math
        </span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--db-line)] mb-3">
        {items.map((it, i) => (
          <div
            key={it.label}
            title={`${it.label}: ${it.value}`}
            style={{
              width: `${(it.value / attempts.dials) * 100}%`,
              opacity: [1, 0.6, 0.4, 0.8, 0.15][i],
              background: i === 3 ? "var(--db-fail)" : "var(--db-primary)",
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold">
              {it.label}
            </div>
            <div className="font-display text-[18px] font-semibold text-[var(--db-dark)]">
              {it.value}
              <span className="text-[11px] font-normal text-[var(--db-muted)] ml-1.5">
                {((it.value / attempts.dials) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function KpiStrip({ counts, dials }: { counts: DispositionCounts; dials: number }) {
  const completed = totalCompleted(counts);
  const ma = meetingActivatedPct(counts);
  const nmr = notMeReferredPct(counts);
  return (
    <div className="grid grid-cols-6 gap-4 mb-6">
      <KpiCard label="Total Dials/Attempts" value={String(dials)} />
      <KpiCard label="Total Completed Conversations" value={String(completed)} />
      <KpiCard label="Meetings Booked" value={String(counts.meeting)} />
      <KpiCard
        label="Contact Rate"
        value={`${contactRate(completed, dials).toFixed(1)}%`}
        sub={<div className="text-[11px] text-[var(--db-muted)]">Connected &divide; dials &middot; no benchmark</div>}
      />
      <KpiCard
        label="Meeting + Activated %"
        value={`${ma.toFixed(1)}%`}
        sub={<StatusPill status={meetingActivatedStatus(counts)} label={ma >= 20 ? "On target" : "Flagged"} />}
      />
      <KpiCard
        label="Not Me + Referred %"
        value={`${nmr.toFixed(1)}%`}
        sub={<StatusPill status={notMeReferredStatus(counts)} label={nmr >= 20 ? "Flagged" : "On target"} />}
      />
    </div>
  );
}

export function DispositionBreakdownTable({ counts }: { counts: DispositionCounts }) {
  const rows = dispositionBreakdown(counts);
  return (
    <DataTable
      columns={["Disposition", "Count", "% of Completed", "Benchmark", "Status"]}
      rows={rows.map((r) => [
        r.label,
        r.count,
        r.pct,
        r.benchmark,
        <StatusPill key={r.key} status={r.status} label={r.statusLabel} />,
      ])}
    />
  );
}

export function CompositeMetricCards({ counts }: { counts: DispositionCounts }) {
  const ma = meetingActivatedPct(counts);
  const nmr = notMeReferredPct(counts);
  const maStatus = meetingActivatedStatus(counts);
  const nmrStatus = notMeReferredStatus(counts);
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <div className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold mb-1">
          Meeting + Activated
        </div>
        <div className="font-display text-[22px] font-semibold mb-1">{ma.toFixed(1)}%</div>
        <div className="text-[12px] text-[var(--db-muted)] mb-2">Floor 20% / Target 25%+</div>
        <StatusPill status={maStatus} label={maStatus === "good" ? "At/above floor" : "Below floor"} />
      </Card>
      <Card>
        <div className="text-[10.5px] uppercase tracking-wide text-[var(--db-muted)] font-semibold mb-1">
          Not Me + Referred
        </div>
        <div className="font-display text-[22px] font-semibold mb-1">{nmr.toFixed(1)}%</div>
        <div className="text-[12px] text-[var(--db-muted)] mb-2">&ge; 20% = titles off</div>
        <StatusPill status={nmrStatus} label={nmrStatus === "watch" ? "List signal" : "Healthy"} />
      </Card>
    </div>
  );
}

const TIER_LABEL = {
  insufficient: "Not enough data yet",
  directional: "Directional",
  confirmed: "Confirmed",
} as const;

export function DiagnosisPanel({
  items,
}: {
  items: {
    id: string;
    name: string;
    recycledFrom?: string | null;
    diagnosis: Diagnosis;
    reps: { name: string; counts: DispositionCounts }[];
  }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map(({ id, name, recycledFrom, diagnosis: d, reps }) => (
        <Card key={id}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div className="font-semibold text-[var(--db-dark)]">{name}</div>
            {recycledFrom !== undefined && <Pill tone="warm">Recycled{recycledFrom ? ` from: ${recycledFrom}` : ""}</Pill>}
            <Pill tone={d.tier === "confirmed" ? "good" : d.tier === "directional" ? "blue" : "neutral"}>
              {TIER_LABEL[d.tier]}
            </Pill>
          </div>
          <div className="text-[12px] text-[var(--db-muted)] mb-3">
            {d.completed} completed conversations
            {d.metrics.contactsWorked > d.completed &&
              ` \u00b7 ${d.metrics.contactsWorked - d.completed} NISL (Research) \u00b7 ${d.metrics.contactsWorked} contacts worked (${d.metrics.researchNislRate.toFixed(1)}% research NISL${d.metrics.contactsWorked < MIN_SAMPLE_SIZE ? ", too early to act on" : ""})`}
            {d.tier === "insufficient" && ` \u00b7 diagnosis unlocks at ${MIN_SAMPLE_SIZE} (${MIN_SAMPLE_SIZE - d.completed} to go)`}
            {d.tier === "directional" && ` \u00b7 confirm findings at ${CONFIRM_SAMPLE_SIZE}+ (${CONFIRM_SAMPLE_SIZE - d.completed} to go)`}
          </div>

          {d.tier === "insufficient" && (
            <p className="text-[13px] text-[var(--db-ink-soft)] mb-3">
              The framework says to draw no conclusions before {MIN_SAMPLE_SIZE} completed conversations. Keep
              logging; this list is its own run, so earlier data from other lists doesn&rsquo;t count toward it.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {d.tier !== "insufficient" && d.findings.length === 0 && (
              <p className="text-[13px] text-[var(--db-ink-soft)]">
                {d.healthy
                  ? "Healthy: executing across all pillars. Activate the bucket-specific follow-up sequences (Activated: hot sequence within 48 hours; Not Now: 30/60/90 day nurture; Referred: immediate outreach; Not Interested: dormant, new hook in 6 months)."
                  : `No diagnostic rule has fired, but Meeting + Activated is ${d.metrics.meetingActivated.toFixed(1)}% (floor 20%), so this isn't yet healthy.`}
              </p>
            )}
              {d.findings.map((f, i) => (
                <div key={f.id} className="border-l-[3px] border-[var(--db-primary)] pl-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--db-primary)]">
                      {f.pillar}
                    </span>
                    {f.severity && (
                      <Pill tone={f.severity === "critical" ? "fail" : f.severity === "watch" ? "warm" : "neutral"}>
                        {f.severity === "critical" ? "Faulty" : f.severity === "watch" ? "Watch" : "Tighten"}
                      </Pill>
                    )}
                    {i === 0 && d.findings.length > 1 && <Pill tone="fail">Fix first</Pill>}
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--db-dark)]">{f.title}</div>
                  <div className="text-[12px] text-[var(--db-muted)] mb-1">IF {f.rule}</div>
                  <div className="text-[12.5px] text-[var(--db-ink-soft)] mb-1">{f.meaning}</div>
                  <div className="text-[12.5px] text-[var(--db-ink-soft)]">
                    <span className="font-semibold">Action:</span> {f.action}
                  </div>
                  {f.note && <div className="text-[11.5px] text-[var(--db-muted)] mt-1">{f.note}</div>}
                  {f.id === "interest" && (
                    <div className="mt-2">
                      {reps.length < 2 ? (
                        <div className="text-[11.5px] text-[var(--db-muted)]">
                          Only {reps.length} rep has logged on this list, so rep vs. message can&rsquo;t be split yet.
                        </div>
                      ) : (
                        <DataTable
                          columns={["Rep", "Completed", "Not Interested", "Meeting + Activated"]}
                          rows={reps.map((r) => {
                            const c = totalCompleted(r.counts);
                            return [
                              r.name,
                              c,
                              `${((r.counts.notInterested / (c || 1)) * 100).toFixed(1)}%`,
                              `${meetingActivatedPct(r.counts).toFixed(1)}%`,
                            ];
                          })}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SegmentBreakdownCards({
  breakdown,
  showLogic,
}: {
  breakdown: {
    segment: {
      id: string;
      name: string;
      listTotal: number;
      logic: string | null;
      read: string | null;
      isReallocation: boolean;
    };
    sourceSegmentName?: string | null;
    counts: DispositionCounts;
    dials: number;
    attempts?: AttemptTotals;
    completed?: number;
    researchNisl?: number;
    logged: number;
    pctOfList: number;
  }[];
  showLogic: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {breakdown.map(({ segment, sourceSegmentName, counts, dials, attempts, completed: completedProp, researchNisl = 0, logged, pctOfList }) => {
        const completed = completedProp ?? logged;
        const rows = dispositionBreakdown(counts)
          .slice()
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
        const total = totalCompleted(counts);
        return (
          <Card key={segment.id}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-[var(--db-dark)]">{segment.name}</div>
              {segment.isReallocation && (
                <Pill tone="warm">Recycled{sourceSegmentName ? ` from: ${sourceSegmentName}` : ""}</Pill>
              )}
            </div>
            <div className="text-[12px] text-[var(--db-muted)] mb-2 leading-relaxed">
              {logged} of {segment.listTotal} logged &middot; {pctOfList}% &middot; {dials} dials &middot;{" "}
              {contactRate(completed, dials).toFixed(1)}% contact rate
              {researchNisl > 0 && (
                <>
                  <br />
                  {completed} verbal conversations + {researchNisl} NISL judged from research (not counted as
                  conversations)
                </>
              )}
              {segment.listTotal > 0 && (
                <>
                  <br />
                  {(dials / segment.listTotal).toFixed(1)} dials per list contact (cap {ATTEMPT_CAP})
                  {dials / segment.listTotal >= ATTEMPT_CAP && " \u2014 at the cap on average"}
                  {attempts && (attempts.wrongNumber > 0 || attempts.aiScreener > 0) && (
                    <>
                      {" "}&middot; {attempts.aiScreener} AI screener, {attempts.wrongNumber} wrong number
                    </>
                  )}
                </>
              )}
            </div>
            {showLogic && segment.logic && (
              <div className="text-[12px] italic text-[var(--db-ink-soft)] mb-3">{segment.logic}</div>
            )}
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <span className="text-[11px] w-24 shrink-0 text-[var(--db-ink-soft)]">{r.label}</span>
                  <div className="flex-1 h-2 bg-[var(--db-line)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--db-primary)]"
                      style={{ width: `${total ? (r.count / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] w-10 text-right text-[var(--db-muted)]">{r.pct}</span>
                </div>
              ))}
            </div>
            <div className="text-[11.5px] text-[var(--db-ink-soft)] leading-relaxed mt-3 pt-3 border-t border-[var(--db-line)]">
              {segment.read || "Not enough tagged calls yet to read this list."}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
