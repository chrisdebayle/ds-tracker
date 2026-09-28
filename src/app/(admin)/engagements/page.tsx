import Link from "next/link";
import { listEngagements } from "@/db/queries";
import { getEngagementCounts } from "@/db/queries";
import { Pill } from "@/components/ui";
import { meetingActivatedPct } from "@/lib/disposition";

const STATUS_TONE = { active: "blue", paused: "warm", completed: "neutral" } as const;

export default async function EngagementsPage() {
  const engagementList = await listEngagements();
  const rows = await Promise.all(
    engagementList.map(async (e) => {
      const { counts, totalCompleted: completed } = await getEngagementCounts(e.id, "all");
      return { engagement: e, counts, completed };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[22px] font-semibold text-[var(--db-dark)]">Engagements</h1>
        <Link
          href="/engagements/new"
          className="rounded-[var(--db-radius)] bg-[var(--db-primary)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          + New Engagement
        </Link>
      </div>

      {rows.length === 0 && (
        <div className="text-sm text-[var(--db-muted)]">
          No engagements yet. Create your first one to get started.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rows.map(({ engagement, completed, counts }) => (
          <Link
            key={engagement.id}
            href={`/engagements/${engagement.id}/dashboard`}
            className="grid items-center gap-4 bg-[var(--db-paper)] border border-[var(--db-line)] rounded-[var(--db-radius)] px-5 py-4 hover:border-[var(--db-primary)] transition-colors"
            style={{ gridTemplateColumns: "2.2fr 1fr 1.5fr 1fr 1.1fr auto" }}
          >
            <div>
              <div className="font-semibold text-[var(--db-dark)]">{engagement.name}</div>
              <div className="text-[12px] text-[var(--db-muted)]">{engagement.location}</div>
            </div>
            <div>
              <Pill tone={STATUS_TONE[engagement.status]}>{engagement.status}</Pill>
            </div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">
              {engagement.startDate} &ndash; {engagement.endDate || "Ongoing"}
            </div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">{completed} conversations</div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">
              Meeting+Activated: {completed === 0 ? "—" : `${meetingActivatedPct(counts).toFixed(1)}%`}
            </div>
            <div className="text-[13px] text-[var(--db-primary)] font-semibold">Open &rarr;</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
