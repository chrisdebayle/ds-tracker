import { Button, Card, Field, inputClass, Pill } from "@/components/ui";

export function ProgressUpdateControls({
  action,
  enabled,
  note,
}: {
  action: (formData: FormData) => Promise<void>;
  enabled: boolean;
  note: string | null;
}) {
  return (
    <Card className="mb-6 no-print">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display text-[15px] font-semibold text-[var(--db-dark)]">Client Progress Update</h2>
        <Pill tone={enabled ? "good" : "neutral"}>{enabled ? "Visible to client" : "Hidden from client"}</Pill>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--db-ink-soft)]">
          <input type="checkbox" name="showProgressUpdate" defaultChecked={enabled} />
          Show the Progress Update on the client Live View
        </label>
        <Field label="Status note (shown at the top of the update; leave blank for none)">
          <textarea name="progressNote" rows={3} defaultValue={note ?? ""} className={inputClass} />
        </Field>
        <p className="text-[11px] text-[var(--db-muted)]">
          The update shows only facts (conversations, dials, contact rate, pace, where dials went, list fit). It never
          includes diagnoses, rep detail or coaching. Off by default; nothing reaches the client until you turn it on.
        </p>
        <div>
          <Button type="submit" variant="outline">
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
}
