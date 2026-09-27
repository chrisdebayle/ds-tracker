"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { dailyLogEntries, engagements, recordings, reps, segments } from "@/db/schema";
import { EMPTY_COUNTS, DISPOSITION_KEYS, type DispositionCounts } from "@/lib/disposition";
import { getOrCreateShareLink, regenerateShareLink, revokeShareLink } from "@/lib/share-tokens";
import { eq } from "drizzle-orm";
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

export async function createEngagement(formData: FormData) {
  const session = await requireAdmin();

  const [row] = await db
    .insert(engagements)
    .values({
      name: String(formData.get("name") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      status: (formData.get("status") as "active" | "paused" | "completed") ?? "active",
      startDate: String(formData.get("startDate") ?? new Date().toISOString().slice(0, 10)),
      endDate: formData.get("endDate") ? String(formData.get("endDate")) : null,
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
      startDate: String(formData.get("startDate") ?? ""),
      endDate: formData.get("endDate") ? String(formData.get("endDate")) : null,
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

export async function addLogEntry(engagementId: string, formData: FormData) {
  await requireAdmin();

  await db.insert(dailyLogEntries).values({
    engagementId,
    segmentId: String(formData.get("segmentId")),
    repId: String(formData.get("repId")),
    date: String(formData.get("date")),
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

  await db.insert(recordings).values({
    engagementId,
    date: String(formData.get("date")),
    repId: formData.get("repId") ? String(formData.get("repId")) : null,
    contact: String(formData.get("contact") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    durationMinutes: Math.max(0, parseInt(String(formData.get("duration") ?? "0"), 10) || 0),
    consent: formData.get("consent") === "on",
    notes: String(formData.get("notes") ?? "").trim(),
    url,
  });

  revalidatePath(`/engagements/${engagementId}/recordings`);
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
