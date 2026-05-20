/** Format a date string or Date to locale-aware short date. */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString();
}

/** Format a number as GBP currency. */
export function formatGBP(value: number): string {
  return `\u00A3${value.toLocaleString()}`;
}
