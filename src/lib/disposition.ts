// Disposition Science framework — single source of truth for benchmarks,
// status thresholds, and aggregation math. Ported verbatim from the design
// prototype (reference/Disposition Tracker.dc.html, ~lines 594-657) so the
// Daily Log form, Dashboard, Report, and both client portal views never
// compute a benchmark differently from one another.

import { wilson } from "@/lib/stats";

export const DISPOSITION_KEYS = [
  "meeting",
  "activated",
  "notNow",
  "notMe",
  "referred",
  "noLongerWith",
  "notInterested",
  "dnc",
  "nurture",
  "nisl",
] as const;

export type DispositionKey = (typeof DISPOSITION_KEYS)[number];

export type DispositionCounts = Record<DispositionKey, number>;

export const EMPTY_COUNTS: DispositionCounts = {
  meeting: 0,
  activated: 0,
  notNow: 0,
  notMe: 0,
  referred: 0,
  noLongerWith: 0,
  notInterested: 0,
  dnc: 0,
  nurture: 0,
  nisl: 0,
};

export const DISP_META: { key: DispositionKey; label: string; benchmark: string }[] = [
  { key: "meeting", label: "Meeting", benchmark: "≥ 8%" },
  { key: "activated", label: "Activated", benchmark: "no benchmark" },
  { key: "notNow", label: "Not Now", benchmark: "10–20%" },
  { key: "notMe", label: "Not Me", benchmark: "< 10%" },
  { key: "referred", label: "Referred", benchmark: "< 10%" },
  { key: "noLongerWith", label: "No Longer w/ Co.", benchmark: "< 5%" },
  { key: "notInterested", label: "Not Interested", benchmark: "< 15%" },
  { key: "dnc", label: "DNC", benchmark: "flag if > 3%" },
  { key: "nurture", label: "Nurture", benchmark: "< 5%" },
  { key: "nisl", label: "NISL", benchmark: "< 5%" },
];

export const PILLAR_MAP: Record<DispositionKey, string> = {
  meeting: "Positive",
  activated: "Positive",
  notNow: "Timing",
  notMe: "List · Titles",
  referred: "List · Titles",
  noLongerWith: "List · Hygiene",
  notInterested: "Message / Rep",
  dnc: "List · Contact method",
  nurture: "List · Contact method",
  nisl: "List · Account fit",
};

export const REFERENCE_DEFS: [string, string, string][] = [
  ["Meeting", "Prospect booked on calendar", "≥ 8%"],
  ["Activated", "One of the 3 I's present (Intent, Interest, Intrigue); not yet booked", "no benchmark"],
  ["Not Now", "Timing isn't right; acknowledged fit but not buying now", "10–20%"],
  ["Not Me", "Right company, wrong person, and they don't know who the right person is", "< 10%"],
  ["Referred", "Right company, wrong person, and they gave you the right contact", "< 10%"],
  ["No Longer With Company", "Right company, but the target contact has left, confirmed by voice by anyone you speak with (gatekeeper, colleague, or replacement). Counts as a completed conversation", "< 5%"],
  ["Not Interested", "Conversation ran its course; no interest generated", "< 15%"],
  ["DNC", "Prospect explicitly requested removal; permanent, never re-engage", "honor all; flag if > 3%"],
  ["Nurture", "Wrong channel; prospect prefers email or LinkedIn over phone", "< 5%"],
  ["NISL", "Wrong account; this company doesn't fit your ICP", "< 5%"],
];

export const CONFUSED_PAIRS: [string, string][] = [
  ["Not Now vs. Not Interested", "Call back in 90 days with the same pitch, real conversation? Yes: Not Now. No: Not Interested."],
  ["Not Me vs. NISL", "Viable prospect for what you sell? Yes but wrong contact: Not Me. No, company doesn't fit: NISL."],
  ["Nurture vs. Not Interested", "Did they suggest how they prefer to be reached? Yes: Nurture. No: Not Interested."],
  ["Activated vs. Not Now", "Active, engaged signal in this call — a question, a pause, a tone shift? Yes: Activated. No: Not Now."],
  ["No Longer With Co. vs. Not Me", "Left the company, or just the wrong person? Left: No Longer With Company. Still there: Not Me."],
  ["DNC vs. Not Interested", "Asked to be removed, or just declined? Removal request: DNC. Decline only: Not Interested."],
];

export const THREE_IS: { name: string; def: string }[] = [
  { name: "Intent", def: "A stated need or active initiative your solution addresses right now. The strongest signal." },
  { name: "Interest", def: "Engaged and curious — follow-up questions, more than one-word answers, no stated initiative." },
  { name: "Intrigue", def: "You caught their attention; tone shifted, they paused, something you said landed." },
];

export type Status = "good" | "watch" | "neutral";

export function pctNum(n: number, total: number): number {
  return total ? (n / total) * 100 : 0;
}

export function pctStr(n: number, total: number): string {
  return total ? `${((n / total) * 100).toFixed(1)}%` : "—";
}

/** Completed conversations needed before any status is shown; below the full minimum it is provisional. */
export const EARLY_MIN_SAMPLE = 30;

type Rule =
  | { kind: "min"; t: number } // good when rate >= t
  | { kind: "maxExcl"; t: number } // good when rate < t
  | { kind: "maxIncl"; t: number } // good when rate <= t
  | { kind: "range"; lo: number; hi: number }; // good when lo <= rate <= hi

const DISPOSITION_RULES: Partial<Record<DispositionKey, Rule>> = {
  meeting: { kind: "min", t: 8 },
  notNow: { kind: "range", lo: 10, hi: 20 },
  notMe: { kind: "maxExcl", t: 10 },
  referred: { kind: "maxExcl", t: 10 },
  noLongerWith: { kind: "maxExcl", t: 5 },
  nurture: { kind: "maxExcl", t: 5 },
  nisl: { kind: "maxExcl", t: 5 },
  notInterested: { kind: "maxExcl", t: 15 },
  dnc: { kind: "maxIncl", t: 3 },
};

function pointGood(rule: Rule, p: number): boolean {
  switch (rule.kind) {
    case "min":
      return p >= rule.t;
    case "maxExcl":
      return p < rule.t;
    case "maxIncl":
      return p <= rule.t;
    case "range":
      return p >= rule.lo && p <= rule.hi;
  }
}

// Early read: a status is only given when the WHOLE 95% range is on one side.
function intervalVerdict(rule: Rule, low: number, high: number): "good" | "watch" | null {
  switch (rule.kind) {
    case "min":
      return low >= rule.t ? "good" : high < rule.t ? "watch" : null;
    case "maxExcl":
      return high < rule.t ? "good" : low >= rule.t ? "watch" : null;
    case "maxIncl":
      return high <= rule.t ? "good" : low > rule.t ? "watch" : null;
    case "range":
      return low >= rule.lo && high <= rule.hi ? "good" : high < rule.lo || low > rule.hi ? "watch" : null;
  }
}

/** How a benchmark status should be read at the current sample size. */
export interface StatusRead {
  status: Status;
  /** Decisive, but from fewer than the full minimum conversations. */
  provisional: boolean;
  /** Fewer than the early minimum: no status is given at all. */
  tooEarly: boolean;
}

function judge(rule: Rule | undefined, k: number, n: number): StatusRead {
  if (!rule) return { status: "neutral", provisional: false, tooEarly: false };
  if (n < EARLY_MIN_SAMPLE) return { status: "neutral", provisional: false, tooEarly: true };
  if (n >= MIN_SAMPLE_SIZE) {
    return { status: pointGood(rule, pctNum(k, n)) ? "good" : "watch", provisional: false, tooEarly: false };
  }
  const { low, high } = wilson(k, n);
  const verdict = intervalVerdict(rule, low, high);
  return { status: verdict ?? "neutral", provisional: true, tooEarly: false };
}

/** Display label for a read, e.g. "Flagged (provisional)", "Not yet clear", "Too early". */
export function readLabel(read: StatusRead, good = "On target", watch = "Flagged"): string {
  if (read.tooEarly) return "Too early";
  if (read.status === "neutral") return read.provisional ? "Not yet clear" : "\u2014";
  const base = read.status === "good" ? good : watch;
  return read.provisional ? `${base} (provisional)` : base;
}

export function dispositionRead(key: DispositionKey, count: number, total: number): StatusRead {
  return judge(DISPOSITION_RULES[key], count, total);
}

export const STATUS_COLOR: Record<Status, string> = {
  good: "var(--db-pass)",
  watch: "var(--db-fail)",
  neutral: "var(--db-muted)",
};

export const STATUS_LABEL: Record<Status, string> = {
  good: "On target",
  watch: "Flagged",
  neutral: "—",
};

export const MIN_SAMPLE_SIZE = 200;

export function sumCounts(a: DispositionCounts, b: Partial<DispositionCounts>): DispositionCounts {
  const out = { ...a };
  for (const key of DISPOSITION_KEYS) {
    out[key] = (out[key] ?? 0) + (b[key] ?? 0);
  }
  return out;
}

export function totalCompleted(counts: DispositionCounts): number {
  return DISPOSITION_KEYS.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
}

/**
 * Splits one log entry into real conversations and NISL accounts judged from
 * research. When `verbal` (verbal conversations) is recorded, any dispositions
 * beyond it are NISL judged without speaking to the target: they stay visible
 * as `researchNisl` but are removed from the conversation-based counts, since
 * a completed conversation means the target contact actually spoke. When
 * `verbal` is null (not recorded) every disposition counts, as before.
 */
export function conversationCounts(
  counts: DispositionCounts,
  verbal: number | null | undefined
): { counts: DispositionCounts; researchNisl: number } {
  if (verbal === null || verbal === undefined) return { counts, researchNisl: 0 };
  const excess = Math.min(Math.max(0, totalCompleted(counts) - verbal), counts.nisl);
  return { counts: { ...counts, nisl: counts.nisl - excess }, researchNisl: excess };
}

/** True when more dispositions exceed verbal conversations than NISL can explain. */
export function verbalMismatch(counts: DispositionCounts, verbal: number): boolean {
  return totalCompleted(counts) - verbal > counts.nisl;
}

export function belowMinimum(counts: DispositionCounts): boolean {
  return totalCompleted(counts) < MIN_SAMPLE_SIZE;
}

/** Meeting + Activated (positive outcome rate). Floor 20% / target 25%+. */
export function meetingActivatedPct(counts: DispositionCounts): number {
  const total = totalCompleted(counts);
  return pctNum(counts.meeting + counts.activated, total);
}

export function meetingActivatedRead(counts: DispositionCounts): StatusRead {
  return judge({ kind: "min", t: 20 }, counts.meeting + counts.activated, totalCompleted(counts));
}

/** Not Me + Referred (wrong-contact rate). >= 20% signals list/titles are off. */
export function notMeReferredPct(counts: DispositionCounts): number {
  const total = totalCompleted(counts);
  return pctNum(counts.notMe + counts.referred, total);
}

export function notMeReferredRead(counts: DispositionCounts): StatusRead {
  // good = healthy (< 20%), watch = list signal (>= 20%)
  return judge({ kind: "maxExcl", t: 20 }, counts.notMe + counts.referred, totalCompleted(counts));
}

/**
 * Contact rate = Connected dials / total dials. A Connected attempt is a
 * completed conversation, so this is completed / dials. It has its own
 * denominator (dials) and never mixes with disposition percentages, which are
 * always measured against completed conversations. No benchmark is set.
 */
export function contactRate(completed: number, dials: number): number {
  return pctNum(completed, dials);
}

// ---------------------------------------------------------------------------
// Attempt Layer: what happens on a dial BEFORE a disposition. Only a Connected
// attempt opens the 10 dispositions; the other three results have none.
// ---------------------------------------------------------------------------

export const ATTEMPT_CAP = 8;
export const DORMANCY_DAYS = 90;

export const ATTEMPT_RESULTS: { key: string; label: string; meaning: string; next: string }[] = [
  {
    key: "connected",
    label: "Connected",
    meaning:
      "Target contact picked up and said something, or any human confirmed by voice that the contact has left (No Longer With Company). Same test as a completed conversation",
    next: "Log one of the 10 dispositions",
  },
  {
    key: "noAnswer",
    label: "No Answer",
    meaning:
      "Rang out, went to voicemail, or a gatekeeper screened the call. If the gatekeeper confirms the contact has left, the attempt is Connected",
    next: "Stay in cadence; vary the time of day",
  },
  {
    key: "aiScreener",
    label: "AI Screener",
    meaning: "A call-screening tool answered; no human conversation",
    next: "Stay in cadence; try a different time or add a text or email touch",
  },
  {
    key: "wrongNumber",
    label: "Wrong Number",
    meaning: "The number doesn't belong to the target contact or company",
    next: "Pull from cadence; flag the record for a data fix",
  },
];

export interface AttemptTotals {
  /** Connected dials = completed conversations (derived from dispositions). */
  connected: number;
  noAnswer: number;
  aiScreener: number;
  wrongNumber: number;
  /** Dials with no Attempt Result recorded (e.g. logged before the layer existed). */
  unclassified: number;
  dials: number;
}

export function attemptTotals(input: {
  connected: number;
  dials: number;
  noAnswer: number;
  aiScreener: number;
  wrongNumber: number;
}): AttemptTotals {
  const classified = input.connected + input.noAnswer + input.aiScreener + input.wrongNumber;
  return { ...input, unclassified: Math.max(0, input.dials - classified) };
}

/**
 * Share of every logged conversation whose outcome was list/targeting-driven
 * (NISL + Not Interested + Nurture + DNC + Referred + Not Me + No Longer
 * With Company) rather than message/rep-driven. This is the report's
 * headline framing number: "it's the list, not the pitch."
 */
export function listDrivenOutcomesPct(counts: DispositionCounts): number {
  const total = totalCompleted(counts);
  const listDriven =
    counts.nisl +
    counts.notInterested +
    counts.nurture +
    counts.dnc +
    counts.referred +
    counts.notMe +
    counts.noLongerWith;
  return pctNum(listDriven, total);
}

export interface DispositionRow {
  key: DispositionKey;
  label: string;
  count: number;
  pct: string;
  benchmark: string;
  status: Status;
  statusLabel: string;
  pillar: string;
}

export function dispositionBreakdown(counts: DispositionCounts): DispositionRow[] {
  const total = totalCompleted(counts);
  return DISP_META.map((d) => {
    const count = counts[d.key] ?? 0;
    const read = dispositionRead(d.key, count, total);
    const status = read.status;
    return {
      key: d.key,
      label: d.label,
      count,
      pct: pctStr(count, total),
      benchmark: d.benchmark,
      status,
      statusLabel: d.key === "activated" ? STATUS_LABEL.neutral : readLabel(read),
      pillar: PILLAR_MAP[d.key],
    };
  });
}
