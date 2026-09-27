"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DISP_META, rawConnectRate } from "@/lib/disposition";
import { Field, inputClass, Button, Card } from "@/components/ui";

type Option = { id: string; name: string };

function emptyCounts() {
  return Object.fromEntries(DISP_META.map((d) => [d.key, "0"])) as Record<string, string>;
}

export function LogForm({
  action,
  reps,
  segments,
}: {
  action: (formData: FormData) => Promise<void>;
  reps: Option[];
  segments: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repId, setRepId] = useState(reps[0]?.id ?? "");
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "");
  const [dials, setDials] = useState("0");
  const [talkTime, setTalkTime] = useState("0");
  const [counts, setCounts] = useState<Record<string, string>>(emptyCounts);

  const totalCompleted = DISP_META.reduce((sum, d) => sum + (parseInt(counts[d.key]) || 0), 0);
  const connectRate = rawConnectRate(totalCompleted, parseInt(dials) || 0);

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

    startTransition(async () => {
      await action(fd);
      setDials("0");
      setTalkTime("0");
      setCounts(emptyCounts());
      router.refresh();
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
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total Dials/Attempts">
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
                Raw Connect Rate
              </div>
              <div className="font-display text-[20px] font-semibold">{connectRate.toFixed(1)}%</div>
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging…" : "+ Log Entry"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
