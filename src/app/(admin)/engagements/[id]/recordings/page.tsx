import Link from "next/link";
import { notFound } from "next/navigation";
import { getEngagement, getRecordings, getReps } from "@/db/queries";
import { addRecording } from "../../../actions";
import { DataTable, Field, inputClass, Button, Card } from "@/components/ui";
import { nameById } from "@/lib/lookup";

export default async function RecordingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [repList, recordingList] = await Promise.all([getReps(id), getRecordings(id)]);
  const repName = nameById(repList);
  const action = addRecording.bind(null, id);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-4">
          + Add Recording
        </h2>
        <form action={action} className="grid grid-cols-3 gap-4">
          <Field label="Date">
            <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="Rep">
            <select name="repId" className={inputClass}>
              <option value="">—</option>
              {repList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (min)">
            <input name="duration" type="number" min={0} defaultValue={0} className={inputClass} />
          </Field>
          <Field label="Contact">
            <input name="contact" className={inputClass} />
          </Field>
          <Field label="Company">
            <input name="company" className={inputClass} />
          </Field>
          <Field label="Recording Link (Drive / dialer URL)">
            <input name="url" type="url" required className={inputClass} />
          </Field>
          <Field label="Notes">
            <input name="notes" className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[var(--db-ink-soft)] mt-6">
            <input name="consent" type="checkbox" /> Consent given
          </label>
          <div className="flex items-end">
            <Button type="submit">Add Recording</Button>
          </div>
        </form>
      </Card>

      {recordingList.length === 0 ? (
        <p className="text-sm text-[var(--db-muted)]">No recordings logged yet.</p>
      ) : (
        <DataTable
          columns={["Date", "Rep", "Contact", "Company", "Duration (min)", "Consent", "Notes", "Link", ""]}
          rows={recordingList.map((r) => [
            r.date,
            repName(r.repId),
            r.contact,
            r.company,
            r.durationMinutes,
            r.consent ? "Yes" : "No",
            r.notes,
            <a key={`${r.id}-open`} href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--db-primary)] font-semibold">
              Open
            </a>,
            <Link
              key={`${r.id}-edit`}
              href={`/engagements/${id}/recordings/${r.id}/edit`}
              className="text-[var(--db-ink-soft)] font-semibold hover:text-[var(--db-primary)]"
            >
              Edit
            </Link>,
          ])}
        />
      )}
    </div>
  );
}
