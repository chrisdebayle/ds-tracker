import {
  ATTEMPT_CAP,
  ATTEMPT_RESULTS,
  CONFUSED_PAIRS,
  DORMANCY_DAYS,
  REFERENCE_DEFS,
  THREE_IS,
} from "@/lib/disposition";
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
        <h2 className="font-display text-[16px] font-semibold text-[var(--db-dark)] mb-2">
          The Attempt Layer: Before a Disposition
        </h2>
        <p className="text-sm text-[var(--db-ink-soft)] mb-3">
          A <strong>completed conversation</strong> is any call where you spoke directly with the target
          contact, however short. Gatekeepers, voicemails, no-answers, AI call screeners and wrong numbers do
          not count. Dispositions apply only once the target connects; everything before that is tracked here,
          so the 10 dispositions stay clean. Log one field on every dial: <strong>Attempt Result</strong>.
        </p>
        <DataTable
          columns={["Attempt Result", "Meaning", "What Happens Next"]}
          rows={ATTEMPT_RESULTS.map((r) => [r.label, r.meaning, r.next])}
        />
        <p className="text-[13px] text-[var(--db-ink-soft)] mt-3">
          If an AI screener passes you through and the target contact then says something, the attempt is{" "}
          <strong>Connected</strong>.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card>
            <div className="font-display font-semibold text-[14px] mb-1">Contact rate</div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">
              Connected dials &divide; total dials. A reachability check on your list and dialing windows. It
              has its own denominator and never mixes with disposition percentages. No benchmark is set yet:
              track it against your own baseline.
            </div>
          </Card>
          <Card>
            <div className="font-display font-semibold text-[14px] mb-1">The {ATTEMPT_CAP}-attempt cap</div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">
              A contact with {ATTEMPT_CAP} attempts and none Connected is <strong>Exhausted</strong>: dormant,
              re-entering cadence after {DORMANCY_DAYS} days with a fresh count. The cap applies to the initial
              cadence only. Attempt Count and Cadence Status (In Cadence, Dispositioned, Exhausted) are derived,
              not logged.
            </div>
          </Card>
          <Card>
            <div className="font-display font-semibold text-[14px] mb-1">Wrong Number vs. Not Me</div>
            <div className="text-[13px] text-[var(--db-ink-soft)]">
              If the number doesn&rsquo;t reach the target&rsquo;s company, log <strong>Wrong Number</strong>. If
              it reaches the right company but the wrong person, log <strong>Not Me</strong> (or{" "}
              <strong>Referred</strong> if they point you to the right person).
            </div>
          </Card>
        </div>
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
              "Log before you hang up, or within 2 minutes of ending the call. End-of-day logging from memory produces inaccurate data that makes healthy campaigns look broken and broken campaigns look fine.",
              "One disposition per completed conversation. No call goes untagged. If your dialer auto-prompts for a disposition, treat it as mandatory before the next call.",
              "Log an Attempt Result on every dial. Only a Connected attempt opens a disposition.",
              "When a call is ambiguous, use the Confused Pairs decision rules above rather than guessing.",
              "DNC is permanent: never re-engage a contact marked DNC, regardless of list or campaign.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
