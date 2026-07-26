/**
 * Rounds a number to a specific precision (default 2 decimal places)
 * to avoid floating-point math errors.
 */
export function preciseRound(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
