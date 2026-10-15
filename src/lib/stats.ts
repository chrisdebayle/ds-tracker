/**
 * Wilson score interval for a proportion k / n, returned as percentages.
 * Used by the Early Read tier: below the full sample minimum a rate is only
 * treated as past a threshold when the WHOLE interval is past it, which lets
 * extreme results speak early while borderline ones stay locked.
 */
export function wilson(k: number, n: number, z = 1.96): { low: number; high: number } {
  if (n <= 0) return { low: 0, high: 100 };
  const p = k / n;
  const z2 = z * z;
  const d = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / d;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return { low: Math.max(0, (center - margin) * 100), high: Math.min(100, (center + margin) * 100) };
}
