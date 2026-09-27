import { db } from "@/db";
import { dailyLogEntries, engagements, recordings, reps, segments } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { EMPTY_COUNTS, sumCounts, totalCompleted, type DispositionCounts } from "@/lib/disposition";

export type Range = "all" | "30d" | "7d";

export async function listEngagements() {
  return db.select().from(engagements).orderBy(desc(engagements.createdAt));
}

export async function getEngagement(id: string) {
  const [row] = await db.select().from(engagements).where(eq(engagements.id, id)).limit(1);
  return row ?? null;
}

export async function getReps(engagementId: string) {
  return db.select().from(reps).where(eq(reps.engagementId, engagementId)).orderBy(reps.name);
}

export async function getSegments(engagementId: string) {
  return db
    .select()
    .from(segments)
    .where(eq(segments.engagementId, engagementId))
    .orderBy(segments.name);
}

export async function getDailyLog(engagementId: string) {
  return db
    .select()
    .from(dailyLogEntries)
    .where(eq(dailyLogEntries.engagementId, engagementId))
    .orderBy(desc(dailyLogEntries.date), desc(dailyLogEntries.createdAt));
}

export async function getRecordings(engagementId: string) {
  return db
    .select()
    .from(recordings)
    .where(eq(recordings.engagementId, engagementId))
    .orderBy(desc(recordings.date));
}

function rangeStartDate(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : 7;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Total counts for an engagement across all segments: base + logged entries, filtered by range. */
export async function getEngagementCounts(engagementId: string, range: Range = "all") {
  const segs = await getSegments(engagementId);
  const start = rangeStartDate(range);

  const logRows = await db
    .select()
    .from(dailyLogEntries)
    .where(
      start
        ? and(eq(dailyLogEntries.engagementId, engagementId), gte(dailyLogEntries.date, start))
        : eq(dailyLogEntries.engagementId, engagementId)
    );

  let counts: DispositionCounts = { ...EMPTY_COUNTS };
  let dials = 0;
  let talkTime = 0;

  // base counts/dials only apply to the all-time view (they represent pre-tool history)
  if (range === "all") {
    for (const seg of segs) {
      counts = sumCounts(counts, seg.baseCounts);
      dials += seg.baseDials;
    }
  }
  for (const row of logRows) {
    counts = sumCounts(counts, row.counts);
    dials += row.dials;
    talkTime += row.talkTimeMinutes;
  }

  return { counts, dials, talkTime, totalCompleted: totalCompleted(counts) };
}

/** Per-segment counts (base + all-time logged entries — segment cards are always all-time). */
export async function getSegmentBreakdown(engagementId: string) {
  const segs = await getSegments(engagementId);
  const logRows = await getDailyLog(engagementId);

  return segs.map((seg) => {
    const segLogRows = logRows.filter((r) => r.segmentId === seg.id);
    let counts: DispositionCounts = { ...seg.baseCounts };
    for (const row of segLogRows) {
      counts = sumCounts(counts, row.counts);
    }
    const logged = totalCompleted(counts);
    return {
      segment: seg,
      counts,
      logged,
      total: logged,
      pctOfList: seg.listTotal ? Math.round((logged / seg.listTotal) * 100) : 0,
    };
  });
}
