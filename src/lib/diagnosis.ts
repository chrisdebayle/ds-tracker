// Implements the Disposition Science "Diagnostic Logic: IF / THEN Matrix"
// exactly as written in the framework. All percentages are measured against
// completed conversations (never dials). Multiple diagnoses can fire at once;
// they are returned in the framework's priority order: List -> Message -> Rep.

import {
  DispositionCounts,
  MIN_SAMPLE_SIZE,
  meetingActivatedPct,
  notMeReferredPct,
  pctNum,
  totalCompleted,
} from "@/lib/disposition";

export const CONFIRM_SAMPLE_SIZE = 500;

// NISL (Research) rate = NISL (Research) / contacts worked, where contacts
// worked = completed conversations + NISL (Research).
export const RESEARCH_FLOOR_PCT = 20;
export const RESEARCH_WATCH_PCT = 30;
export const RESEARCH_FAULTY_PCT = 50;

export type ConfidenceTier = "insufficient" | "directional" | "confirmed";

export function confidenceTier(completed: number): ConfidenceTier {
  if (completed < MIN_SAMPLE_SIZE) return "insufficient";
  if (completed < CONFIRM_SAMPLE_SIZE) return "directional";
  return "confirmed";
}

export type PillarKey = "list" | "message" | "rep";

export interface DiagnosticFinding {
  id: "titles" | "interest" | "ask" | "icp" | "channel" | "sourcing";
  /** Only set on the research-NISL rule: how loudly to read it. */
  severity?: "info" | "watch" | "critical";
  pillar: string; // display label, e.g. "LIST" or "MESSAGE or REP"
  rank: number; // priority rank: 0 = List, 1 = Message, 2 = Rep
  title: string;
  rule: string; // the IF condition with the actual values
  meaning: string; // the THEN statement
  action: string;
  note?: string;
}

export interface Diagnosis {
  completed: number;
  tier: ConfidenceTier;
  findings: DiagnosticFinding[];
  healthy: boolean;
  /** Share of each metric used, so the UI can show the numbers behind the rules. */
  metrics: {
    meetingActivated: number;
    notMeReferred: number;
    meeting: number;
    activated: number;
    notInterested: number;
    nisl: number;
    nurture: number;
    contactsWorked: number;
    researchNislRate: number;
  };
}

const f1 = (n: number) => `${n.toFixed(1)}%`;

const SEVERITY_ORDER = { critical: 0, watch: 1, undefined: 2, info: 3 } as const;

// Framework priority (List -> Message -> Rep); within a pillar, a faulty
// list-building signal leads and the soft "tighten" note trails.
function sortFindings(a: DiagnosticFinding, b: DiagnosticFinding) {
  return (
    a.rank - b.rank ||
    SEVERITY_ORDER[String(a.severity) as keyof typeof SEVERITY_ORDER] -
      SEVERITY_ORDER[String(b.severity) as keyof typeof SEVERITY_ORDER]
  );
}

export function diagnose(counts: DispositionCounts, researchNisl = 0): Diagnosis {
  const completed = totalCompleted(counts);
  const contactsWorked = completed + researchNisl;
  const pct = (n: number) => pctNum(n, completed);

  const metrics = {
    meetingActivated: meetingActivatedPct(counts),
    notMeReferred: notMeReferredPct(counts),
    meeting: pct(counts.meeting),
    activated: pct(counts.activated),
    notInterested: pct(counts.notInterested),
    nisl: pct(counts.nisl),
    nurture: pct(counts.nurture),
    contactsWorked,
    researchNislRate: pctNum(researchNisl, contactsWorked),
  };

  const tier = confidenceTier(completed);
  const findings: DiagnosticFinding[] = [];

  // LIST: bad-fit accounts getting through list building. Measured against
  // contacts worked, so it is independent of the conversation-based tier.
  if (contactsWorked >= MIN_SAMPLE_SIZE && metrics.researchNislRate >= RESEARCH_FLOOR_PCT) {
    const rate = metrics.researchNislRate;
    const severity = rate >= RESEARCH_FAULTY_PCT ? "critical" : rate >= RESEARCH_WATCH_PCT ? "watch" : "info";
    findings.push({
      id: "sourcing",
      pillar: "LIST",
      rank: 0,
      severity,
      title:
        severity === "critical"
          ? "List building is faulty: refine immediately"
          : severity === "watch"
            ? "Bad-fit accounts are getting through list building"
            : "List could use further tightening",
      rule: `NISL (Research) is ${f1(rate)} of contacts worked (${researchNisl} of ${contactsWorked}; floor ${RESEARCH_FLOOR_PCT}%, watch \u2265 ${RESEARCH_WATCH_PCT}%, faulty \u2265 ${RESEARCH_FAULTY_PCT}%)`,
      meaning:
        severity === "critical"
          ? "The list-building process is faulty. Refine it immediately before pulling more contacts."
          : severity === "watch"
            ? "Account fit is failing upstream of the call: a large share of pulled accounts have to be ruled out from research before anyone speaks. Tighten criteria before the next pull."
            : "Some accounts are still being ruled out from research. Not a diagnosis on its own.",
      action:
        "Pull the accounts ruled out from research and compare their firmographics to your positive-outcome accounts (Meeting, Activated, Not Now). Identify the filter that should have excluded them, and fix it at the source before the next list build.",
    });
  }

  if (tier === "insufficient") {
    findings.sort(sortFindings);
    return { completed, tier, findings, healthy: false, metrics };
  }

  // LIST: titles are off
  if (metrics.notMeReferred >= 20) {
    findings.push({
      id: "titles",
      pillar: "LIST",
      rank: 0,
      title: "Titles are off",
      rule: `Not Me + Referred is ${f1(metrics.notMeReferred)} (threshold ≥ 20%)`,
      meaning:
        "You're reaching the wrong contacts. Accounts may be correct (check NISL to confirm), but titles are off.",
      action:
        "Pull all Referred dispositions. Map the title you called to the title you were referred to. Rebuild the next list around the referred-to titles and deprioritize the called titles.",
      note:
        metrics.nisl < 8
          ? `NISL is ${f1(metrics.nisl)} (low), which confirms a contact-level problem (titles), not an account-level one.`
          : `NISL is ${f1(metrics.nisl)}, so account fit may also be part of this.`,
    });
  }

  // LIST: account ICP misalignment
  if (metrics.nisl >= 8) {
    findings.push({
      id: "icp",
      pillar: "LIST",
      rank: 0,
      title: "Account ICP misalignment",
      rule: `NISL is ${f1(metrics.nisl)} (threshold ≥ 8%)`,
      meaning:
        "A meaningful share of accounts fall outside your ICP: wrong vertical, company size, or tech stack.",
      action:
        "Pull firmographics on all positive-outcome accounts (Meeting, Activated, Not Now) versus NISL accounts. Identify the differentiating filters and tighten ICP criteria before the next list build.",
    });
  }

  // LIST / REP: channel mismatch
  if (metrics.nurture >= 10) {
    findings.push({
      id: "channel",
      pillar: "LIST / REP",
      rank: 0,
      title: "Channel mismatch",
      rule: `Nurture is ${f1(metrics.nurture)} (threshold ≥ 10%)`,
      meaning:
        "A material share of contacts don't want to be reached by phone: phone-averse personas in the target titles (list), or a rep triggering defensive \"just email me\" responses (rep).",
      action:
        "Pull the Nurture calls. If one title/persona keeps landing here, shift those contacts to an email or LinkedIn sequence. If it's spread across titles, review opener tone.",
    });
  }

  // MESSAGE or REP: interest isn't landing
  if (metrics.notMeReferred < 20 && metrics.notInterested >= 20) {
    findings.push({
      id: "interest",
      pillar: "MESSAGE or REP",
      rank: 1,
      title: "Interest isn't landing",
      rule: `Not Me + Referred is ${f1(metrics.notMeReferred)} (< 20%) and Not Interested is ${f1(metrics.notInterested)} (threshold ≥ 20%)`,
      meaning:
        "You're reaching the right people but not generating interest. This is a message problem, a rep problem, or both.",
      action:
        "Compare Not Interested by rep: one rep outlying high is a coaching issue, systemic across reps means a messaging overhaul. Pull 10+ call recordings and listen for weak openers, an absent pattern interrupt, a value prop not connecting to persona pain, or a premature feature pitch.",
      note:
        metrics.notMeReferred >= 15
          ? "At Not Me + Referred of 15–19%, wrong titles may still be partially inflating Not Interested. If fixing titles doesn't move it on the next run, investigate messaging."
          : undefined,
    });
  }

  // REP: ask isn't converting interest to meetings
  if (metrics.meeting < 5 && metrics.activated > 10) {
    findings.push({
      id: "ask",
      pillar: "REP",
      rank: 2,
      title: "Ask isn't converting interest to meetings",
      rule: `Meeting is ${f1(metrics.meeting)} (< 5%) and Activated is ${f1(metrics.activated)} (> 10%)`,
      meaning:
        "The core message is working: interest is being generated but not converting to the calendar.",
      action:
        "Pull calls where Activated was logged. The rep is generating intrigue but stopping short of the ask. Drill the calendar close: a specific date/time offer, assumptive language, urgency framing.",
    });
  }

  findings.sort(sortFindings);

  const healthy =
    metrics.meetingActivated >= 20 &&
    metrics.notMeReferred < 20 &&
    metrics.notInterested < 20 &&
    metrics.nisl < 8 &&
    metrics.researchNislRate < RESEARCH_FLOOR_PCT;

  return { completed, tier, findings, healthy, metrics };
}
