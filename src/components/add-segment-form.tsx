"use client";

import { useState } from "react";
import { Field, inputClass, Button } from "@/components/ui";

type Option = { id: string; name: string };
type Mode = "new" | "recycled";

export function AddSegmentForm({
  action,
  existingSegments,
}: {
  action: (formData: FormData) => Promise<void>;
  existingSegments: Option[];
}) {
  const [mode, setMode] = useState<Mode>("new");
  const isReallocation = mode === "recycled";

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-[1.2fr_2fr_0.8fr_auto_auto] gap-3 items-end">
        <Field label="Name">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Logic">
          <input name="logic" className={inputClass} />
        </Field>
        <Field label="List Size">
          <input name="listTotal" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>
        <div className="flex rounded-full border border-[var(--db-line)] p-0.5" role="group" aria-label="List type">
          <button
            type="button"
            onClick={() => setMode("new")}
            aria-pressed={mode === "new"}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mode === "new"
                ? "bg-[var(--db-primary)] text-white"
                : "text-[var(--db-ink-soft)] hover:text-[var(--db-primary)]"
            }`}
          >
            New List
          </button>
          <button
            type="button"
            onClick={() => setMode("recycled")}
            aria-pressed={mode === "recycled"}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mode === "recycled"
                ? "bg-[var(--db-primary)] text-white"
                : "text-[var(--db-ink-soft)] hover:text-[var(--db-primary)]"
            }`}
          >
            Recycled List
          </button>
        </div>
        <Button type="submit" variant="outline">
          + Add List
        </Button>
      </div>

      {isReallocation && (
        <div className="flex items-end gap-3 bg-[var(--db-tint-blue)] border border-[var(--db-line)] rounded-[var(--db-radius)] px-4 py-3">
          <input type="hidden" name="isReallocation" value="on" />
          <div className="max-w-xs">
            <Field label="Source List">
              <select name="sourceSegmentId" required className={inputClass}>
                <option value="">Select a list&hellip;</option>
                {existingSegments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-[11px] text-[var(--db-ink-soft)] leading-relaxed pb-2">
            Tracked on its own card, but excluded from the engagement&rsquo;s headline
            Dashboard/Report totals so a different message tested on a known subset doesn&rsquo;t
            dilute the read on the original list.
          </p>
        </div>
      )}
    </form>
  );
}
