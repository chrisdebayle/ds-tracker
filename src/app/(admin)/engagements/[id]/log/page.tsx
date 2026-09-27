import { notFound } from "next/navigation";
import { getDailyLog, getEngagement, getReps, getSegments } from "@/db/queries";
import { addLogEntry } from "../../../actions";
import { LogForm } from "@/components/log-form";
import { DataTable } from "@/components/ui";
import { DISP_META, rawConnectRate, totalCompleted } from "@/lib/disposition";

export default async function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const [repList, segmentList, entries] = await Promise.all([
    getReps(id),
    getSegments(id),
    getDailyLog(id),
  ]);

  const repName = (repId: string) => repList.find((r) => r.id === repId)?.name ?? "—";
  const segName = (segId: string) => segmentList.find((s) => s.id === segId)?.name ?? "—";

  const action = addLogEntry.bind(null, id);

  const columns = [
    "Date",
    "Rep",
    "List",
    "Dials",
    "Completed",
    "Connect Rate",
    ...DISP_META.map((d) => d.label),
    "Talk (min)",
  ];

  const rows = entries.map((entry) => {
    const completed = totalCompleted(entry.counts);
    return [
      entry.date,
      repName(entry.repId),
      segName(entry.segmentId),
      entry.dials,
      completed,
      `${rawConnectRate(completed, entry.dials).toFixed(1)}%`,
      ...DISP_META.map((d) => entry.counts[d.key] ?? 0),
      entry.talkTimeMinutes,
    ];
  });

  return (
    <div className="flex flex-col gap-8">
      <LogForm
        action={action}
        reps={repList.map((r) => ({ id: r.id, name: r.name }))}
        segments={segmentList.map((s) => ({ id: s.id, name: s.name }))}
      />

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">History</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--db-muted)]">No entries logged yet.</p>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </div>
    </div>
  );
}
