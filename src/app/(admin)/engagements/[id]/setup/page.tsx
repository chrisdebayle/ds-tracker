import { notFound } from "next/navigation";
import { getEngagement, getReps, getSegments } from "@/db/queries";
import { addRep, addSegment, updateEngagement } from "../../../actions";
import { Field, inputClass, Button, Card, Pill } from "@/components/ui";

export default async function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [repList, segmentList] = await Promise.all([getReps(id), getSegments(id)]);
  const updateAction = updateEngagement.bind(null, id);
  const addRepAction = addRep.bind(null, id);
  const addSegmentAction = addSegment.bind(null, id);

  return (
    <div className="max-w-[720px] flex flex-col gap-10">
      <section>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-4">
          Engagement Details
        </h2>
        <form action={updateAction} className="flex flex-col gap-5">
          <Field label="Client / Engagement Name">
            <input name="name" defaultValue={engagement.name} required className={inputClass} />
          </Field>
          <Field label="Location">
            <input name="location" defaultValue={engagement.location ?? ""} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input name="startDate" type="date" defaultValue={engagement.startDate} required className={inputClass} />
            </Field>
            <Field label="End Date (blank = Ongoing)">
              <input name="endDate" type="date" defaultValue={engagement.endDate ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Status">
            <select name="status" defaultValue={engagement.status} className={inputClass}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Primary Internal Owner">
            <input name="owner" defaultValue={engagement.owner ?? ""} className={inputClass} />
          </Field>
          <Field label="Dialer(s) in Use">
            <input name="dialers" defaultValue={engagement.dialers ?? ""} className={inputClass} />
          </Field>
          <Field label="SOW Reference">
            <input name="sowReference" defaultValue={engagement.sowReference ?? ""} className={inputClass} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={4} defaultValue={engagement.notes ?? ""} className={inputClass} />
          </Field>
          <div>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-4">
          Reps on this Engagement
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {repList.map((rep) => (
            <Pill key={rep.id} tone="blue">
              {rep.name}
            </Pill>
          ))}
          {repList.length === 0 && (
            <span className="text-sm text-[var(--db-muted)]">No reps added yet.</span>
          )}
        </div>
        <form action={addRepAction} className="flex gap-2">
          <input name="name" placeholder="Rep name" required className={`${inputClass} max-w-xs`} />
          <Button type="submit" variant="outline">
            + Add rep
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-4">
          Target Lists / Segments
        </h2>
        <div className="flex flex-col gap-3 mb-5">
          {segmentList.map((seg) => (
            <Card key={seg.id}>
              <div className="font-semibold text-[var(--db-dark)]">{seg.name}</div>
              <div className="text-[12px] text-[var(--db-muted)] mb-1">List size: {seg.listTotal}</div>
              {seg.logic && (
                <div className="text-[13px] italic text-[var(--db-ink-soft)]">{seg.logic}</div>
              )}
            </Card>
          ))}
          {segmentList.length === 0 && (
            <span className="text-sm text-[var(--db-muted)]">No target lists added yet.</span>
          )}
        </div>
        <form action={addSegmentAction} className="grid grid-cols-[1.2fr_2fr_0.8fr_auto] gap-3 items-end">
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
        </form>
      </section>
    </div>
  );
}
