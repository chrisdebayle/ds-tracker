import { createEngagement } from "../../actions";
import { Field, inputClass, Button } from "@/components/ui";

export default function NewEngagementPage() {
  return (
    <div className="max-w-[720px]">
      <h1 className="font-display text-[22px] font-semibold text-[var(--db-dark)] mb-6">
        New Engagement
      </h1>
      <form action={createEngagement} className="flex flex-col gap-5">
        <Field label="Client / Engagement Name">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Location">
          <input name="location" className={inputClass} placeholder="City, State" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <input name="startDate" type="date" required className={inputClass} />
          </Field>
          <Field label="End Date (blank = Ongoing)">
            <input name="endDate" type="date" className={inputClass} />
          </Field>
        </div>
        <Field label="Status">
          <select name="status" defaultValue="active" className={inputClass}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <Field label="Primary Internal Owner">
          <input name="owner" className={inputClass} />
        </Field>
        <Field label="Dialer(s) in Use">
          <input name="dialers" className={inputClass} />
        </Field>
        <Field label="SOW Reference">
          <input name="sowReference" className={inputClass} />
        </Field>
        <Field label="Notes">
          <textarea name="notes" rows={4} className={inputClass} />
        </Field>
        <div>
          <Button type="submit">Create Engagement</Button>
        </div>
      </form>
    </div>
  );
}
