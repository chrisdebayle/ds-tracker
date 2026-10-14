import { db } from "@/db";
import { dailyLogEntries, engagements, recordings, reps, segments } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  EMPTY_COUNTS,
  attemptTotals,
  conversationCounts,
  sumCounts,
  totalCompleted,
  type DispositionCounts,
} from "@/lib/disposition";

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
  let noAnswer = 0;
  let aiScreener = 0;
  let wrongNumber = 0;
  let researchNisl = 0;

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
    const conv = conversationCounts(row.counts, row.verbalConversations);
    if (isRecycled) {
      recycledCounts = sumCounts(recycledCounts, conv.counts);
      recycledDials += row.dials;
    }
    if (!(excludeRecycled && isRecycled)) {
      researchNisl += conv.researchNisl;
      counts = sumCounts(counts, conv.counts);
      dials += row.dials;
      talkTime += row.talkTimeMinutes;
      noAnswer += row.noAnswer ?? 0;
      aiScreener += row.aiScreener ?? 0;
      wrongNumber += row.wrongNumber ?? 0;
    }
  }

  return {
    counts,
    dials,
    talkTime,
    totalCompleted: totalCompleted(counts),
    attempts: attemptTotals({
      connected: totalCompleted(counts),
      dials,
      noAnswer,
      aiScreener,
      wrongNumber,
    }),
    researchNisl,
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
    let noAnswer = 0;
    let aiScreener = 0;
    let wrongNumber = 0;
    let researchNisl = 0;
    for (const row of segLogRows) {
      const conv = conversationCounts(row.counts, row.verbalConversations);
      counts = sumCounts(counts, conv.counts);
      researchNisl += conv.researchNisl;
      dials += row.dials;
      noAnswer += row.noAnswer ?? 0;
      aiScreener += row.aiScreener ?? 0;
      wrongNumber += row.wrongNumber ?? 0;
    }
    const completed = totalCompleted(counts);
    // "logged" = contacts worked on this list: real conversations plus NISL
    // accounts judged from research. Contact rate and benchmarks use only
    // `completed` (real conversations).
    const logged = completed + researchNisl;
    return {
      segment: seg,
      sourceSegmentName: seg.sourceSegmentId ? (nameById.get(seg.sourceSegmentId) ?? null) : null,
      counts,
      dials,
      attempts: attemptTotals({ connected: completed, dials, noAnswer, aiScreener, wrongNumber }),
      completed,
      researchNisl,
      logged,
      total: completed,
      pctOfList: seg.listTotal ? Math.round((logged / seg.listTotal) * 100) : 0,
    };
  });
}

/** Per-rep disposition counts for one list (all-time), for splitting Message vs. Rep problems. */
export async function getRepBreakdown(engagementId: string, segmentId: string) {
  const [repList, rows] = await Promise.all([
    getReps(engagementId),
    db
      .select()
      .from(dailyLogEntries)
      .where(and(eq(dailyLogEntries.engagementId, engagementId), eq(dailyLogEntries.segmentId, segmentId))),
  ]);
  const byRep = new Map<string, DispositionCounts>();
  for (const row of rows) {
    byRep.set(
      row.repId,
      sumCounts(byRep.get(row.repId) ?? { ...EMPTY_COUNTS }, conversationCounts(row.counts, row.verbalConversations).counts)
    );
  }
  return repList
    .filter((r) => byRep.has(r.id))
    .map((r) => ({ repId: r.id, name: r.name, counts: byRep.get(r.id)! }));
}
