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

export async function getRecording(engagementId: string, recordingId: string) {
  const [row] = await db
    .select()
    .from(recordings)
    .where(and(eq(recordings.id, recordingId), eq(recordings.engagementId, engagementId)))
    .limit(1);
  return row ?? null;
}

function rangeStartDate(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : 7;
  // Do the subtraction in UTC (matching how `date` values are entered, e.g.
  // new Date().toISOString().slice(0, 10)) — mixing local-time subtraction
  // with a UTC serialization can shift the window by a day near midnight.
  const now = new Date();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(utcMidnight - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Total counts for an engagement across its non-reallocated segments: base +
 * logged entries, filtered by range. Reallocated lists (contacts recycled
 * from an existing list to test a different message) are deliberately left
 * out of these headline totals — see `segments.isReallocation` — so the
 * Dashboard/Report stay a clean read on the client's original target-list
 * performance. Their activity is still returned separately as `excluded`,
 * so it isn't hidden, just not blended into the quality benchmarks.
 */
export async function getEngagementCounts(engagementId: string, range: Range = "all") {
  const segs = await getSegments(engagementId);
  const start = rangeStartDate(range);
  const reallocatedIds = new Set(segs.filter((s) => s.isReallocation).map((s) => s.id));

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
  let excludedCounts: DispositionCounts = { ...EMPTY_COUNTS };
  let excludedDials = 0;

  // base counts/dials only apply to the all-time view (they represent pre-tool history)
  if (range === "all") {
    for (const seg of segs) {
      if (seg.isReallocation) {
        excludedCounts = sumCounts(excludedCounts, seg.baseCounts);
        excludedDials += seg.baseDials;
      } else {
        counts = sumCounts(counts, seg.baseCounts);
        dials += seg.baseDials;
      }
    }
  }
  for (const row of logRows) {
    if (reallocatedIds.has(row.segmentId)) {
      excludedCounts = sumCounts(excludedCounts, row.counts);
      excludedDials += row.dials;
    } else {
      counts = sumCounts(counts, row.counts);
      dials += row.dials;
      talkTime += row.talkTimeMinutes;
    }
  }

  return {
    counts,
    dials,
    talkTime,
    totalCompleted: totalCompleted(counts),
    excluded: { dials: excludedDials, totalCompleted: totalCompleted(excludedCounts) },
  };
}

/** Per-segment counts (base + all-time logged entries — segment cards are always all-time). */
export async function getSegmentBreakdown(engagementId: string) {
  const segs = await getSegments(engagementId);
  const logRows = await getDailyLog(engagementId);
  const nameById = new Map(segs.map((s) => [s.id, s.name]));

  return segs.map((seg) => {
    const segLogRows = logRows.filter((r) => r.segmentId === seg.id);
    let counts: DispositionCounts = { ...seg.baseCounts };
    let dials = seg.baseDials;
    for (const row of segLogRows) {
      counts = sumCounts(counts, row.counts);
      dials += row.dials;
    }
    const logged = totalCompleted(counts);
    return {
      segment: seg,
      sourceSegmentName: seg.sourceSegmentId ? (nameById.get(seg.sourceSegmentId) ?? null) : null,
      counts,
      dials,
      logged,
      total: logged,
      pctOfList: seg.listTotal ? Math.round((logged / seg.listTotal) * 100) : 0,
    };
  });
}
