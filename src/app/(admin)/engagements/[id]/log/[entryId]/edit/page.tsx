import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dailyLogEntries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getEngagement, getReps, getSegments } from "@/db/queries";
import { updateLogEntry } from "../../../../../actions";
import { LogForm } from "@/components/log-form";

export default async function EditLogEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id, entryId } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [entry] = await db
    .select()
    .from(dailyLogEntries)
    .where(and(eq(dailyLogEntries.id, entryId), eq(dailyLogEntries.engagementId, id)))
    .limit(1);
  if (!entry) notFound();

  const [repList, segmentList] = await Promise.all([getReps(id), getSegments(id)]);
  const segmentTags = Object.fromEntries(
    segmentList.filter((s) => s.isReallocation).map((s) => [s.id, "recycled"])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/engagements/${id}/log`} className="text-[12px] text-[var(--db-primary)]">
          &larr; Daily Log
        </Link>
        <h1 className="font-display text-[18px] font-semibold text-[var(--db-dark)] mt-1">
          Edit Log Entry &mdash; {entry.date}
        </h1>
      </div>
      <LogForm
        mode="edit"
        action={updateLogEntry.bind(null, id, entryId)}
        reps={repList.map((r) => ({ id: r.id, name: r.name }))}
        segments={segmentList.map((s) => ({ id: s.id, name: s.name }))}
        segmentTags={segmentTags}
        initial={{
          date: entry.date,
          repId: entry.repId,
          segmentId: entry.segmentId,
          dials: entry.dials,
          talkTime: entry.talkTimeMinutes,
          counts: entry.counts,
          verbalConversations: entry.verbalConversations,
          noAnswer: entry.noAnswer,
          aiScreener: entry.aiScreener,
          wrongNumber: entry.wrongNumber,
        }}
      />
    </div>
  );
}
