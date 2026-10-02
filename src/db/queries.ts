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
 * Total counts for an engagement: base + logged entries, filtered by range.
 * Recycled lists (`segments.isReallocation`) are INCLUDED by default so every
 * logged call shows up in the headline. Pass `excludeRecycled` to leave them
 * out for a clean read on the original target lists. Either way the recycled
 * lists' own activity is returned as `recycled`, so the UI can say what is
 * (or isn't) in the totals.
 */
export async function getEngagementCounts(
  engagementId: string,
  range: Range = "all",
  opts: { excludeRecycled?: boolean } = {}
) {
  const excludeRecycled = opts.excludeRecycled ?? false;
  const segs = await getSegments(engagementId);
  const start = rangeStartDate(range);
  const recycledIds = new Set(segs.filter((s) => s.isReallocation).map((s) => s.id));

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
  let recycledCounts: DispositionCounts = { ...EMPTY_COUNTS };
  let recycledDials = 0;

  // base counts/dials only apply to the all-time view (they represent pre-tool history)
  if (range === "all") {
    for (const seg of segs) {
      if (seg.isReallocation) {
        recycledCounts = sumCounts(recycledCounts, seg.baseCounts);
        recycledDials += seg.baseDials;
      }
      if (!(excludeRecycled && seg.isReallocation)) {
        counts = sumCounts(counts, seg.baseCounts);
        dials += seg.baseDials;
      }
    }
  }
  for (const row of logRows) {
    const isRecycled = recycledIds.has(row.segmentId);
    if (isRecycled) {
      recycledCounts = sumCounts(recycledCounts, row.counts);
      recycledDials += row.dials;
    }
    if (!(excludeRecycled && isRecycled)) {
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
    recycled: { dials: recycledDials, totalCompleted: totalCompleted(recycledCounts) },
    excludeRecycled,
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
