import { CONFUSED_PAIRS, REFERENCE_DEFS, THREE_IS } from "@/lib/disposition";
import { Card, DataTable, RulesList } from "@/components/ui";

export default function ReferencePage() {
  return (
    <div className="flex flex-col gap-10 max-w-[960px]">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-[var(--db-dark)] mb-1">
          Disposition Reference
        </h1>
        <p className="text-sm text-[var(--db-muted)]">
          The Disposition Science framework (Ryan Reisert / Ronen R. Pessar) — always available for
          reps to self-serve without leaving the tool.
        </p>
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          The 10 Dispositions
        </h2>
        <DataTable
          columns={["Disposition", "Definition", "Benchmark"]}
          rows={REFERENCE_DEFS}
        />
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          The 3 I&rsquo;s
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {THREE_IS.map((i) => (
            <Card key={i.name}>
              <div className="font-display font-semibold text-[15px] mb-1">{i.name}</div>
              <div className="text-[13px] text-[var(--db-ink-soft)]">{i.def}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          6 Most-Confused Pairs
        </h2>
        <DataTable
          columns={["Pair", "Decision Rule"]}
          rows={CONFUSED_PAIRS}
        />
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-3">
          Logging Discipline
        </h2>
        <Card>
          <RulesList
            items={[
              "Log every completed conversation the same day it happens — same-day logging keeps the diagnostics accurate.",
              "When a call is ambiguous, use the Confused Pairs decision rules above rather than guessing.",
              "DNC is permanent — never re-engage a contact marked DNC, regardless of list or campaign.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
