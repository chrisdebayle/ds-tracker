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
          not count. The one exception is No Longer With Company: if any human being confirms by voice that the
          target contact has left, that call counts. An account you rule out from research without the target speaking is not a completed
          conversation either. Dispositions apply only once the target connects (the one exception is NISL
          judged from research, below); everything before that is tracked here, so the 10 dispositions stay
          clean. Log one field on every dial: <strong>Attempt Result</strong>.
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

        <h3 className="font-display text-[14px] font-semibold text-[var(--db-dark)] mt-6 mb-2">
          NISL Judged From Research (No Conversation)
        </h3>
        <p className="text-[13px] text-[var(--db-ink-soft)] mb-3">
          An account can be ruled out as outside your ICP from research (website, LinkedIn, firmographics)
          while you work the list, without the target contact ever speaking. The account is finished: it
          leaves cadence under the NISL follow-up rule. But no one said anything, so it is{" "}
          <strong>not a completed conversation</strong>. Log it as <strong>NISL (Research)</strong>. In this
          tracker, enter the day&rsquo;s <strong>Verbal Conversations</strong>; dispositions beyond it are
          treated as NISL (Research).
        </p>
        <Card>
          <RulesList
            items={[
              "Only NISL qualifies. Account fit is the one outcome that can be determined without the contact. Every other disposition records something the contact said or did on a call, so it requires a Connected attempt.",
              "Tracked beside the dispositions, not inside them. NISL (Research) is not counted in completed conversations, in the 200 / 500 sample thresholds, or in any disposition percentage, including the NISL rate used by the ICP rule.",
              "Still counts as worked. The contact leaves cadence, so it counts toward how far you are through the list. It has no Connected attempt, so it sits outside contact rate.",
              "Tally check. Dispositions beyond Verbal Conversations are NISL (Research). If the gap is larger than your NISL count, a non-NISL disposition was logged without a conversation; recheck it.",
              "NISL (Research) rate = NISL (Research) ÷ contacts worked (completed conversations + NISL (Research)), measured once 200+ contacts are worked. The floor is under 20% (also required for a HEALTHY status). 20% to 29%: the list could use further tightening. 30% to 49%: watch, bad-fit accounts are slipping through list building. 50% or more: list building is faulty, refine it immediately before pulling more contacts.",
            ]}
          />
        </Card>
        <p className="text-[12px] text-[var(--db-muted)] mt-3">
          Why the split matters: if research-judged accounts are logged as ordinary NISL dispositions, completed
          conversations are inflated, the NISL rate is overstated, the ICP rule can fire on accounts you never
          spoke to, and the 200-conversation minimum unlocks early.
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
              "Log before you hang up, or within 2 minutes of ending the call. End-of-day logging from memory produces inaccurate data that makes healthy campaigns look broken and broken campaigns look fine.",
              "One disposition per completed conversation. No call goes untagged. If your dialer auto-prompts for a disposition, treat it as mandatory before the next call.",
              "Log an Attempt Result on every dial. Only a Connected attempt opens a disposition, except NISL judged from research.",
              "When a call is ambiguous, use the Confused Pairs decision rules above rather than guessing.",
              "DNC is permanent: never re-engage a contact marked DNC, regardless of list or campaign.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
