import { STATUSES, type Status } from "@/lib/domain/status";

/**
 * Allowed status changes. Anything not listed is blocked.
 *
 * - The pipeline only moves forward; there are no backward moves.
 * - APPLIED -> INTERVIEW is allowed because some companies skip screening.
 * - Repeated interview rounds stay in INTERVIEW (no self-transition).
 * - From OFFER: REJECTED = offer rescinded, WITHDRAWN = offer declined.
 * - REJECTED and WITHDRAWN are final.
 */
const TRANSITIONS: Record<Status, ReadonlySet<Status>> = {
  WISHLIST: new Set(["APPLIED", "WITHDRAWN"]),
  APPLIED: new Set(["SCREENING_PASSED", "INTERVIEW", "REJECTED", "WITHDRAWN"]),
  SCREENING_PASSED: new Set(["INTERVIEW", "REJECTED", "WITHDRAWN"]),
  INTERVIEW: new Set(["OFFER", "REJECTED", "WITHDRAWN"]),
  OFFER: new Set(["REJECTED", "WITHDRAWN"]),
  REJECTED: new Set(),
  WITHDRAWN: new Set(),
};

export type TransitionError = "SAME_STATUS" | "TERMINAL_STATUS" | "NOT_ALLOWED";

export type TransitionResult =
  | { ok: true }
  | { ok: false; reason: TransitionError };

export function canTransition(from: Status, to: Status): boolean {
  return TRANSITIONS[from].has(to);
}

/** Next statuses reachable from `from`, in pipeline order. */
export function getAllowedTransitions(from: Status): readonly Status[] {
  return STATUSES.filter((to) => TRANSITIONS[from].has(to));
}

export function isTerminal(status: Status): boolean {
  return TRANSITIONS[status].size === 0;
}

/** Like `canTransition`, but says why a move is blocked (for error messages). */
export function validateTransition(from: Status, to: Status): TransitionResult {
  if (from === to) return { ok: false, reason: "SAME_STATUS" };
  if (isTerminal(from)) return { ok: false, reason: "TERMINAL_STATUS" };
  if (!canTransition(from, to)) return { ok: false, reason: "NOT_ALLOWED" };
  return { ok: true };
}
