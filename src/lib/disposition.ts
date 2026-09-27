// Disposition Science framework — single source of truth for benchmarks,
// status thresholds, and aggregation math. Ported verbatim from the design
// prototype (reference/Disposition Tracker.dc.html, ~lines 594-657) so the
// Daily Log form, Dashboard, Report, and both client portal views never
// compute a benchmark differently from one another.

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
  ["No Longer With Company", "Right company, but the target contact has left", "< 5%"],
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

export function statusFor(key: DispositionKey, p: number): Status {
  switch (key) {
    case "meeting":
      return p >= 8 ? "good" : "watch";
    case "activated":
      return "neutral";
    case "notNow":
      return p >= 10 && p <= 20 ? "good" : "watch";
    case "notMe":
    case "referred":
      return p < 10 ? "good" : "watch";
    case "noLongerWith":
    case "nurture":
    case "nisl":
      return p < 5 ? "good" : "watch";
    case "notInterested":
      return p < 15 ? "good" : "watch";
    case "dnc":
      return p <= 3 ? "good" : "watch";
    default:
      return "neutral";
  }
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

export function belowMinimum(counts: DispositionCounts): boolean {
  return totalCompleted(counts) < MIN_SAMPLE_SIZE;
}

/** Meeting + Activated (positive outcome rate). Floor 20% / target 25%+. */
export function meetingActivatedPct(counts: DispositionCounts): number {
  const total = totalCompleted(counts);
  return pctNum(counts.meeting + counts.activated, total);
}

export function meetingActivatedStatus(counts: DispositionCounts): Status {
  return meetingActivatedPct(counts) >= 20 ? "good" : "watch";
}

/** Not Me + Referred (wrong-contact rate). >= 20% signals list/titles are off. */
export function notMeReferredPct(counts: DispositionCounts): number {
  const total = totalCompleted(counts);
  return pctNum(counts.notMe + counts.referred, total);
}

export function notMeReferredStatus(counts: DispositionCounts): Status {
  return notMeReferredPct(counts) >= 20 ? "watch" : "good";
}

export function rawConnectRate(completed: number, dials: number): number {
  return pctNum(completed, dials);
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
    const p = pctNum(count, total);
    const status = statusFor(d.key, p);
    return {
      key: d.key,
      label: d.label,
      count,
      pct: pctStr(count, total),
      benchmark: d.benchmark,
      status,
      statusLabel: STATUS_LABEL[status],
      pillar: PILLAR_MAP[d.key],
    };
  });
}
