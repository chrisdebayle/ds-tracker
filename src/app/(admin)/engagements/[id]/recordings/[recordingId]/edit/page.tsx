import Link from "next/link";
import { notFound } from "next/navigation";
import { getEngagement, getRecording, getReps } from "@/db/queries";
import { updateRecording } from "../../../../../actions";
import { Field, inputClass, Button, Card } from "@/components/ui";

export default async function EditRecordingPage({
  params,
}: {
  params: Promise<{ id: string; recordingId: string }>;
}) {
  const { id, recordingId } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [repList, recording] = await Promise.all([getReps(id), getRecording(id, recordingId)]);
  if (!recording) notFound();

  const action = updateRecording.bind(null, id, recordingId);

  return (
    <div className="max-w-[640px] flex flex-col gap-6">
      <div>
        <Link href={`/engagements/${id}/recordings`} className="text-[12px] text-[var(--db-primary)]">
          &larr; Call Recordings
        </Link>
        <h1 className="font-display text-[18px] font-semibold text-[var(--db-dark)] mt-1">
          Edit Recording
        </h1>
      </div>

      <Card>
        <form action={action} className="grid grid-cols-3 gap-4">
          <Field label="Date">
            <input name="date" type="date" required defaultValue={recording.date} className={inputClass} />
          </Field>
          <Field label="Rep">
            <select name="repId" defaultValue={recording.repId ?? ""} className={inputClass}>
              <option value="">&mdash;</option>
              {repList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (min)">
            <input
              name="duration"
              type="number"
              min={0}
              defaultValue={recording.durationMinutes}
              className={inputClass}
            />
          </Field>
          <Field label="Contact">
            <input name="contact" defaultValue={recording.contact ?? ""} className={inputClass} />
          </Field>
          <Field label="Company">
            <input name="company" defaultValue={recording.company ?? ""} className={inputClass} />
          </Field>
          <div className="col-span-3">
            <Field label="Recording Link (Drive / dialer URL)">
              <input name="url" type="url" required defaultValue={recording.url} className={inputClass} />
            </Field>
          </div>
          <div className="col-span-3">
            <Field label="Notes">
              <input name="notes" defaultValue={recording.notes ?? ""} className={inputClass} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--db-ink-soft)]">
            <input name="consent" type="checkbox" defaultChecked={recording.consent} /> Consent given
          </label>
          <div className="col-span-2 flex items-center justify-end gap-3">
            <Link
              href={`/engagements/${id}/recordings`}
              className="text-sm font-semibold text-[var(--db-muted)] hover:text-[var(--db-ink-soft)]"
            >
              Cancel
            </Link>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
