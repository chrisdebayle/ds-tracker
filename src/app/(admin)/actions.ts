"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { dailyLogEntries, engagements, recordings, reps, segments } from "@/db/schema";
import { EMPTY_COUNTS, DISPOSITION_KEYS, type DispositionCounts } from "@/lib/disposition";
import { getOrCreateShareLink, regenerateShareLink, revokeShareLink } from "@/lib/share-tokens";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

function countsFromForm(formData: FormData): DispositionCounts {
  const counts = { ...EMPTY_COUNTS };
  for (const key of DISPOSITION_KEYS) {
    const raw = formData.get(`count_${key}`);
    counts[key] = raw ? Math.max(0, parseInt(String(raw), 10) || 0) : 0;
  }
  return counts;
}

const SAFE_URL_SCHEME = /^https?:\/\//i;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: FormDataEntryValue | null, field: string): string {
  const str = String(value ?? "");
  if (!DATE_FORMAT.test(str)) throw new Error(`${field} must be a valid date`);
  return str;
}

async function assertBelongsToEngagement(
  table: typeof segments | typeof reps | typeof recordings,
  id: string,
  engagementId: string,
  what: string
) {
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.engagementId, engagementId)))
    .limit(1);
  if (!row) throw new Error(`${what} does not belong to this engagement`);
}

export async function createEngagement(formData: FormData) {
  const session = await requireAdmin();

  const [row] = await db
    .insert(engagements)
    .values({
      name: String(formData.get("name") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      status: (formData.get("status") as "active" | "paused" | "completed") ?? "active",
      startDate: formData.get("startDate")
        ? requireDate(formData.get("startDate"), "Start date")
        : new Date().toISOString().slice(0, 10),
      endDate: formData.get("endDate") ? requireDate(formData.get("endDate"), "End date") : null,
      owner: String(formData.get("owner") ?? "").trim(),
      dialers: String(formData.get("dialers") ?? "").trim(),
      sowReference: String(formData.get("sowReference") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      createdById: session.user?.id ? String((session.user as { id?: string }).id) : null,
    })
    .returning();

  revalidatePath("/engagements");
  redirect(`/engagements/${row.id}/setup`);
}

export async function updateEngagement(engagementId: string, formData: FormData) {
  await requireAdmin();

  await db
    .update(engagements)
    .set({
      name: String(formData.get("name") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      status: (formData.get("status") as "active" | "paused" | "completed") ?? "active",
      startDate: requireDate(formData.get("startDate"), "Start date"),
      endDate: formData.get("endDate") ? requireDate(formData.get("endDate"), "End date") : null,
      owner: String(formData.get("owner") ?? "").trim(),
      dialers: String(formData.get("dialers") ?? "").trim(),
      sowReference: String(formData.get("sowReference") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      updatedAt: new Date(),
    })
    .where(eq(engagements.id, engagementId));

  revalidatePath(`/engagements/${engagementId}/setup`);
  revalidatePath("/engagements");
}

export async function addRep(engagementId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.insert(reps).values({ engagementId, name });
  revalidatePath(`/engagements/${engagementId}/setup`);
  revalidatePath(`/engagements/${engagementId}/log`);
}

export async function addSegment(engagementId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.insert(segments).values({
    engagementId,
    name,
    logic: String(formData.get("logic") ?? "").trim(),
    listTotal: Math.max(0, parseInt(String(formData.get("listTotal") ?? "0"), 10) || 0),
    baseCounts: { ...EMPTY_COUNTS },
  });
  revalidatePath(`/engagements/${engagementId}/setup`);
  revalidatePath(`/engagements/${engagementId}/log`);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
}

export async function updateSegmentRead(engagementId: string, segmentId: string, formData: FormData) {
  await requireAdmin();
  await assertBelongsToEngagement(segments, segmentId, engagementId, "Target list");

  await db
    .update(segments)
    .set({ read: String(formData.get("read") ?? "").trim() })
    .where(eq(segments.id, segmentId));

  revalidatePath(`/engagements/${engagementId}/setup`);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath(`/engagements/${engagementId}/report`);
}

export async function addLogEntry(engagementId: string, formData: FormData) {
  await requireAdmin();

  const segmentId = String(formData.get("segmentId") ?? "");
  const repId = String(formData.get("repId") ?? "");
  if (!segmentId || !repId) throw new Error("Rep and target list are required");
  const date = requireDate(formData.get("date"), "Date");

  await assertBelongsToEngagement(segments, segmentId, engagementId, "Target list");
  await assertBelongsToEngagement(reps, repId, engagementId, "Rep");

  await db.insert(dailyLogEntries).values({
    engagementId,
    segmentId,
    repId,
    date,
    dials: Math.max(0, parseInt(String(formData.get("dials") ?? "0"), 10) || 0),
    talkTimeMinutes: Math.max(0, parseInt(String(formData.get("talkTime") ?? "0"), 10) || 0),
    counts: countsFromForm(formData),
  });

  revalidatePath(`/engagements/${engagementId}/log`);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath(`/engagements/${engagementId}/report`);
}

export async function addRecording(engagementId: string, formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return;
  if (!SAFE_URL_SCHEME.test(url)) throw new Error("Recording link must be an http(s) URL");
  const date = requireDate(formData.get("date"), "Date");

  const repId = formData.get("repId") ? String(formData.get("repId")) : null;
  if (repId) await assertBelongsToEngagement(reps, repId, engagementId, "Rep");

  await db.insert(recordings).values({
    engagementId,
    date,
    repId,
    contact: String(formData.get("contact") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    durationMinutes: Math.max(0, parseInt(String(formData.get("duration") ?? "0"), 10) || 0),
    consent: formData.get("consent") === "on",
    notes: String(formData.get("notes") ?? "").trim(),
    url,
  });

  revalidatePath(`/engagements/${engagementId}/recordings`);
}

export async function updateRecording(engagementId: string, recordingId: string, formData: FormData) {
  await requireAdmin();
  await assertBelongsToEngagement(recordings, recordingId, engagementId, "Recording");

  const url = String(formData.get("url") ?? "").trim();
  if (!url) throw new Error("Recording link is required");
  if (!SAFE_URL_SCHEME.test(url)) throw new Error("Recording link must be an http(s) URL");
  const date = requireDate(formData.get("date"), "Date");

  const repId = formData.get("repId") ? String(formData.get("repId")) : null;
  if (repId) await assertBelongsToEngagement(reps, repId, engagementId, "Rep");

  await db
    .update(recordings)
    .set({
      date,
      repId,
      contact: String(formData.get("contact") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim(),
      durationMinutes: Math.max(0, parseInt(String(formData.get("duration") ?? "0"), 10) || 0),
      consent: formData.get("consent") === "on",
      notes: String(formData.get("notes") ?? "").trim(),
      url,
    })
    .where(eq(recordings.id, recordingId));

  revalidatePath(`/engagements/${engagementId}/recordings`);
  redirect(`/engagements/${engagementId}/recordings`);
}

export async function updateReportContent(engagementId: string, formData: FormData) {
  await requireAdmin();

  const findings = String(formData.get("findings") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const nextSteps = String(formData.get("nextSteps") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await db
    .update(engagements)
    .set({
      headlineQuote: String(formData.get("headlineQuote") ?? "").trim(),
      findings: findings.length ? findings : null,
      nextSteps: nextSteps.length ? nextSteps : null,
      updatedAt: new Date(),
    })
    .where(eq(engagements.id, engagementId));

  revalidatePath(`/engagements/${engagementId}/report`);
}

export async function createShareLinkAction(engagementId: string, kind: "live" | "report") {
  await requireAdmin();
  await getOrCreateShareLink(engagementId, kind);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath(`/engagements/${engagementId}/report`);
}

export async function regenerateShareLinkAction(engagementId: string, kind: "live" | "report") {
  await requireAdmin();
  await regenerateShareLink(engagementId, kind);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath(`/engagements/${engagementId}/report`);
}

export async function revokeShareLinkAction(engagementId: string, kind: "live" | "report") {
  await requireAdmin();
  await revokeShareLink(engagementId, kind);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath(`/engagements/${engagementId}/report`);
}
