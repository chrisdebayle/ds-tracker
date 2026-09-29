"use client";

import { useState } from "react";
import { Field, inputClass, Button } from "@/components/ui";

type Option = { id: string; name: string };

export function AddSegmentForm({
  action,
  existingSegments,
}: {
  action: (formData: FormData) => Promise<void>;
  existingSegments: Option[];
}) {
  const [isReallocation, setIsReallocation] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-[1.2fr_2fr_0.8fr_auto] gap-3 items-end">
        <Field label="Name">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Logic">
          <input name="logic" className={inputClass} />
        </Field>
        <Field label="List Size">
          <input name="listTotal" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>
        <Button type="submit" variant="outline">
          + Add List
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--db-line)] pt-4">
        <label className="flex items-center gap-2 text-sm text-[var(--db-ink-soft)]">
          <input
            type="checkbox"
            name="isReallocation"
            checked={isReallocation}
            onChange={(e) => setIsReallocation(e.target.checked)}
          />
          This reuses contacts from an existing list (different messaging/signal, not a new pool)
        </label>

        {isReallocation && (
          <div className="max-w-xs">
            <Field label="Source List">
              <select name="sourceSegmentId" required={isReallocation} className={inputClass}>
                <option value="">Select a list&hellip;</option>
                {existingSegments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-[11px] text-[var(--db-muted)] mt-1">
              This list&rsquo;s dials/dispositions will be tracked on its own card, but excluded
              from the engagement&rsquo;s headline Dashboard/Report totals so a different message
              being tested on a known subset doesn&rsquo;t dilute the read on the original list.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
