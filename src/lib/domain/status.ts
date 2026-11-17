/**
 * Every status an application can be in, in pipeline order.
 * Single source of truth: the DB enum and Zod schemas derive from this list.
 */
export const STATUSES = [
  "WISHLIST",
  "APPLIED",
  "SCREENING_PASSED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type Status = (typeof STATUSES)[number];

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
