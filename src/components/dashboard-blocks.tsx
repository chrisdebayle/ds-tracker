import {
  DispositionCounts,
  MIN_SAMPLE_SIZE,
  dispositionBreakdown,
  meetingActivatedPct,
  meetingActivatedStatus,
  notMeReferredPct,
  notMeReferredStatus,
  rawConnectRate,
  totalCompleted,
} from "@/lib/disposition";
import { Card, DataTable, KpiCard, Pill, StatusPill } from "@/components/ui";

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

export function ExcludedActivityNote({
  excluded,
}: {
  excluded: { dials: number; totalCompleted: number };
}) {
  if (excluded.dials === 0 && excluded.totalCompleted === 0) return null;
  return (
    <div className="text-[12px] text-[var(--db-muted)] -mt-4 mb-6">
      + {excluded.dials} dials / {excluded.totalCompleted} conversations across reallocated lists
      (not included above)
    </div>
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
      <KpiCard label="Raw Connect Rate" value={`${rawConnectRate(completed, dials).toFixed(1)}%`} />
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
    logged: number;
    pctOfList: number;
  }[];
  showLogic: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {breakdown.map(({ segment, sourceSegmentName, counts, dials, logged, pctOfList }) => {
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
            <div className="text-[12px] text-[var(--db-muted)] mb-2">
              {logged} of {segment.listTotal} logged &middot; {pctOfList}% &middot; {dials} dials &middot;{" "}
              {rawConnectRate(logged, dials).toFixed(1)}% connect
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
