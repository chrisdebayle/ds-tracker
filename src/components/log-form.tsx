"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DISP_META, contactRate } from "@/lib/disposition";
import { Field, inputClass, Button, Card } from "@/components/ui";

type Option = { id: string; name: string };

export interface LogFormInitial {
  date: string;
  repId: string;
  segmentId: string;
  dials: number;
  talkTime: number;
  counts: Record<string, number>;
  // null = never recorded (entry predates the Attempt Layer)
  noAnswer: number | null;
  aiScreener: number | null;
  wrongNumber: number | null;
}

function emptyCounts() {
  return Object.fromEntries(DISP_META.map((d) => [d.key, "0"])) as Record<string, string>;
}

const ATTEMPT_FIELDS = [
  { key: "noAnswer", label: "No Answer", hint: "rang out, voicemail, or gatekeeper screened" },
  { key: "aiScreener", label: "AI Screener", hint: "call-screening tool answered" },
  { key: "wrongNumber", label: "Wrong Number", hint: "doesn't reach the target or company" },
] as const;

type AttemptKey = (typeof ATTEMPT_FIELDS)[number]["key"];

export function LogForm({
  action,
  reps,
  segments,
  initial,
  mode = "add",
  segmentTags = {},
}: {
  action: (formData: FormData) => Promise<void>;
  reps: Option[];
  segments: Option[];
  initial?: LogFormInitial;
  mode?: "add" | "edit";
  /** segment id -> short tag shown in the list dropdown, e.g. "recycled" */
  segmentTags?: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const attemptDefault = (v: number | null | undefined) => (v === null || v === undefined ? (isEdit ? "" : "0") : String(v));

  const [date, setDate] = useState(() => initial?.date ?? new Date().toISOString().slice(0, 10));
  const [repId, setRepId] = useState(initial?.repId ?? reps[0]?.id ?? "");
  const [segmentId, setSegmentId] = useState(initial?.segmentId ?? segments[0]?.id ?? "");
  const [dials, setDials] = useState(initial ? String(initial.dials) : "0");
  const [talkTime, setTalkTime] = useState(initial ? String(initial.talkTime) : "0");
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    initial
      ? Object.fromEntries(DISP_META.map((d) => [d.key, String(initial.counts[d.key] ?? 0)]))
      : emptyCounts()
  );
  const [attempts, setAttempts] = useState<Record<AttemptKey, string>>({
    noAnswer: attemptDefault(initial?.noAnswer),
    aiScreener: attemptDefault(initial?.aiScreener),
    wrongNumber: attemptDefault(initial?.wrongNumber),
  });

  const totalCompleted = DISP_META.reduce((sum, d) => sum + (parseInt(counts[d.key]) || 0), 0);
  const dialsNum = parseInt(dials) || 0;
  const rate = contactRate(totalCompleted, dialsNum);

  const anyAttemptFilled = ATTEMPT_FIELDS.some((f) => attempts[f.key] !== "");
  const classified =
    totalCompleted + ATTEMPT_FIELDS.reduce((sum, f) => sum + (parseInt(attempts[f.key]) || 0), 0);
  const gap = dialsNum - classified;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repId || !segmentId) return;

    const fd = new FormData();
    fd.set("date", date);
    fd.set("repId", repId);
    fd.set("segmentId", segmentId);
    fd.set("dials", dials);
    fd.set("talkTime", talkTime);
    for (const d of DISP_META) fd.set(`count_${d.key}`, counts[d.key] || "0");
    // Untouched (all blank) attempt fields stay "not recorded" instead of becoming zeros.
    if (anyAttemptFilled) {
      for (const f of ATTEMPT_FIELDS) fd.set(f.key, attempts[f.key] || "0");
    }

    startTransition(async () => {
      await action(fd);
      if (!isEdit) {
        setDials("0");
        setTalkTime("0");
        setCounts(emptyCounts());
        setAttempts({ noAnswer: "0", aiScreener: "0", wrongNumber: "0" });
        router.refresh();
      }
    });
  }

  if (reps.length === 0 || segments.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[var(--db-muted)]">
          Add at least one rep and one target list in{" "}
          <a href="../setup" className="text-[var(--db-primary)] font-semibold">
            Setup
          </a>{" "}
          before logging entries.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-5 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Rep">
            <select value={repId} onChange={(e) => setRepId(e.target.value)} className={inputClass}>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target List">
            <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className={inputClass}>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {segmentTags[s.id] ? ` (${segmentTags[s.id]})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total Dials (every attempt)">
            <input
              type="number"
              min={0}
              value={dials}
              onChange={(e) => setDials(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Talk Time (min)">
            <input
              type="number"
              min={0}
              value={talkTime}
              onChange={(e) => setTalkTime(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--db-ink-soft)] mb-2">
            Dispositions &mdash; Connected dials only
          </div>
          <div className="grid grid-cols-5 gap-3">
            {DISP_META.map((d) => (
              <Field key={d.key} label={d.label}>
                <input
                  type="number"
                  min={0}
                  value={counts[d.key]}
                  onChange={(e) => setCounts((c) => ({ ...c, [d.key]: e.target.value }))}
                  className={inputClass}
                />
                <span className="text-[10px] text-[var(--db-muted)]">{d.benchmark}</span>
              </Field>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--db-ink-soft)] mb-2">
            Attempt Result &mdash; dials that never became a conversation
          </div>
          <div className="grid grid-cols-5 gap-3">
            <Field label="Connected (auto)">
              <div className={`${inputClass} opacity-70`}>{totalCompleted}</div>
              <span className="text-[10px] text-[var(--db-muted)]">= completed conversations</span>
            </Field>
            {ATTEMPT_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  type="number"
                  min={0}
                  value={attempts[f.key]}
                  placeholder="n/a"
                  onChange={(e) => setAttempts((a) => ({ ...a, [f.key]: e.target.value }))}
                  className={inputClass}
                />
                <span className="text-[10px] text-[var(--db-muted)]">{f.hint}</span>
              </Field>
            ))}
            <div className="flex items-end pb-1 text-[11px] leading-snug">
              {!anyAttemptFilled ? (
                <span className="text-[var(--db-muted)]">Not recorded</span>
              ) : gap === 0 ? (
                <span className="text-[var(--db-pass)] font-semibold">
                  Reconciles: {classified} of {dialsNum} dials
                </span>
              ) : gap > 0 ? (
                <span className="text-[var(--db-accent-800)]">
                  {gap} dial{gap === 1 ? "" : "s"} still unclassified ({classified} of {dialsNum})
                </span>
              ) : (
                <span className="text-[var(--db-fail)] font-semibold">
                  Results exceed dials by {-gap} &mdash; check the counts
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--db-line)] pt-4">
          <div className="flex gap-8">
            <div>
              <div className="text-[10.5px] uppercase text-[var(--db-muted)] font-semibold">
                Total Completed Conversations
              </div>
              <div className="font-display text-[20px] font-semibold">{totalCompleted}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase text-[var(--db-muted)] font-semibold">
                Contact Rate
              </div>
              <div className="font-display text-[20px] font-semibold">{rate.toFixed(1)}%</div>
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "+ Log Entry"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
