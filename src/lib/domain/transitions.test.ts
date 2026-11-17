import { describe, expect, it } from "vitest";
import { STATUSES, type Status } from "@/lib/domain/status";
import {
  canTransition,
  getAllowedTransitions,
  isTerminal,
  validateTransition,
} from "@/lib/domain/transitions";

/**
 * The expected rules, written out independently of the implementation.
 * Anything not listed here must be rejected.
 */
const EXPECTED: Record<Status, readonly Status[]> = {
  // Not applied yet: can apply, or drop the idea.
  WISHLIST: ["APPLIED", "WITHDRAWN"],
  // Some companies skip screening and go straight to interview.
  APPLIED: ["SCREENING_PASSED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SCREENING_PASSED: ["INTERVIEW", "REJECTED", "WITHDRAWN"],
  // Multiple interview rounds stay in INTERVIEW (no self-transition).
  INTERVIEW: ["OFFER", "REJECTED", "WITHDRAWN"],
  // REJECTED = offer rescinded, WITHDRAWN = offer declined.
  OFFER: ["REJECTED", "WITHDRAWN"],
  // Final states.
  REJECTED: [],
  WITHDRAWN: [],
};

describe("canTransition", () => {
  // Every one of the 7 x 7 = 49 pairs is checked against the table above.
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const allowed = EXPECTED[from].includes(to);
      it(`${from} -> ${to} is ${allowed ? "allowed" : "blocked"}`, () => {
        expect(canTransition(from, to)).toBe(allowed);
      });
    }
  }

  it("blocks REJECTED -> INTERVIEW", () => {
    expect(canTransition("REJECTED", "INTERVIEW")).toBe(false);
  });

  it("blocks moving backwards, e.g. INTERVIEW -> APPLIED", () => {
    expect(canTransition("INTERVIEW", "APPLIED")).toBe(false);
  });

  it("blocks rejection before applying (WISHLIST -> REJECTED)", () => {
    expect(canTransition("WISHLIST", "REJECTED")).toBe(false);
  });

  it("blocks skipping the interview (APPLIED -> OFFER)", () => {
    expect(canTransition("APPLIED", "OFFER")).toBe(false);
  });
});

describe("getAllowedTransitions", () => {
  it.each(STATUSES)("returns the allowed next statuses for %s", (from) => {
    expect([...getAllowedTransitions(from)].sort()).toEqual(
      [...EXPECTED[from]].sort(),
    );
  });

  it("returns them in pipeline order (for UI dropdowns)", () => {
    expect(getAllowedTransitions("APPLIED")).toEqual([
      "SCREENING_PASSED",
      "INTERVIEW",
      "REJECTED",
      "WITHDRAWN",
    ]);
  });
});

describe("isTerminal", () => {
  it.each(["REJECTED", "WITHDRAWN"] as const)("%s is terminal", (status) => {
    expect(isTerminal(status)).toBe(true);
  });

  it.each(["WISHLIST", "APPLIED", "SCREENING_PASSED", "INTERVIEW", "OFFER"] as const)(
    "%s is not terminal",
    (status) => {
      expect(isTerminal(status)).toBe(false);
    },
  );
});

describe("validateTransition", () => {
  it("returns ok for an allowed transition", () => {
    expect(validateTransition("APPLIED", "INTERVIEW")).toEqual({ ok: true });
  });

  it("reports SAME_STATUS when nothing changes", () => {
    expect(validateTransition("INTERVIEW", "INTERVIEW")).toEqual({
      ok: false,
      reason: "SAME_STATUS",
    });
  });

  it("reports TERMINAL_STATUS when leaving a final state", () => {
    expect(validateTransition("REJECTED", "INTERVIEW")).toEqual({
      ok: false,
      reason: "TERMINAL_STATUS",
    });
  });

  it("reports NOT_ALLOWED for any other blocked move", () => {
    expect(validateTransition("INTERVIEW", "APPLIED")).toEqual({
      ok: false,
      reason: "NOT_ALLOWED",
    });
  });
});
