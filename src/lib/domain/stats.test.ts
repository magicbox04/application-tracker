import { describe, expect, it } from "vitest";
import type { Status } from "@/lib/domain/status";
import { computeStats, type StatsApplication } from "@/lib/domain/stats";

type Step = [from: Status | null, to: Status, at: string];

/** Builds an application from its event history; status = last event's toStatus. */
function app(steps: Step[], appliedAt: string | null = null): StatsApplication {
  const last = steps.at(-1);
  if (!last) throw new Error("need at least one step");
  return {
    status: last[1],
    appliedAt,
    events: steps.map(([fromStatus, toStatus, at]) => ({
      fromStatus,
      toStatus,
      changedAt: new Date(at),
    })),
  };
}

const T = (day: number, hour = 0) =>
  `2026-11-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00Z`;

// A small pipeline used by several tests
const interviewedThenRejected = app([
  [null, "APPLIED", T(1)],
  [ "APPLIED", "INTERVIEW", T(5)], // skipped screening
  ["INTERVIEW", "REJECTED", T(9)],
]);
const wishlistOnly = app([[null, "WISHLIST", T(1)]]);
const addedAsOffer = app([[null, "OFFER", T(2)]]); // backfilled
const rejectedAfterApplying = app([
  [null, "APPLIED", T(1)],
  ["APPLIED", "REJECTED", T(3)],
]);
const appliedNoAnswer = app([[null, "APPLIED", T(4)]]);

const sample = [
  interviewedThenRejected,
  wishlistOnly,
  addedAsOffer,
  rejectedAfterApplying,
  appliedNoAnswer,
];

describe("computeStats", () => {
  it("handles no applications", () => {
    const s = computeStats([]);
    expect(s.total).toBe(0);
    expect(s.byStatus.APPLIED).toBe(0);
    expect(s.funnel.map((f) => f.count)).toEqual([0, 0, 0, 0]);
    expect(s.conversion).toEqual({ appliedToInterview: null, interviewToOffer: null });
    expect(s.responseRate).toBeNull();
    expect(s.avgDaysToFirstResponse).toBeNull();
  });

  it("counts applications by current status", () => {
    const s = computeStats(sample);
    expect(s.total).toBe(5);
    expect(s.byStatus).toEqual({
      WISHLIST: 1,
      APPLIED: 1,
      SCREENING_PASSED: 0,
      INTERVIEW: 0,
      OFFER: 1,
      REJECTED: 2,
      WITHDRAWN: 0,
    });
  });

  describe("funnel (stages ever reached, from the history)", () => {
    it("counts each stage an application reached, even if it later ended", () => {
      const s = computeStats(sample);
      expect(s.funnel).toEqual([
        { stage: "APPLIED", count: 4 },
        { stage: "SCREENING_PASSED", count: 2 },
        { stage: "INTERVIEW", count: 2 },
        { stage: "OFFER", count: 1 },
      ]);
    });

    it("treats skipping screening as having passed it", () => {
      const s = computeStats([interviewedThenRejected]);
      expect(s.funnel.find((f) => f.stage === "SCREENING_PASSED")?.count).toBe(1);
    });

    it("leaves out wishlist items, including ones withdrawn before applying", () => {
      const withdrawnEarly = app([
        [null, "WISHLIST", T(1)],
        ["WISHLIST", "WITHDRAWN", T(2)],
      ]);
      const s = computeStats([wishlistOnly, withdrawnEarly]);
      expect(s.funnel.map((f) => f.count)).toEqual([0, 0, 0, 0]);
    });

    it("counts an application added as REJECTED as applied", () => {
      const s = computeStats([app([[null, "REJECTED", T(1)]])]);
      expect(s.funnel[0]).toEqual({ stage: "APPLIED", count: 1 });
    });
  });

  it("computes conversion rates from the funnel", () => {
    const s = computeStats(sample);
    expect(s.conversion.appliedToInterview).toBeCloseTo(2 / 4);
    expect(s.conversion.interviewToOffer).toBeCloseTo(1 / 2);
  });

  it("computes response rate: any move past APPLIED, or a rejection", () => {
    // applied: 4 (A, offer, rejected, no answer); responded: 3
    expect(computeStats(sample).responseRate).toBeCloseTo(3 / 4);
  });

  it("does not count withdrawing as a response", () => {
    const withdrew = app([
      [null, "APPLIED", T(1)],
      ["APPLIED", "WITHDRAWN", T(2)],
    ]);
    expect(computeStats([withdrew]).responseRate).toBe(0);
  });

  it("breaks rejections down by the stage they happened at", () => {
    const addedAsRejected = app([[null, "REJECTED", T(1)]]);
    const s = computeStats([...sample, addedAsRejected]);
    expect(s.rejectedAt).toEqual({
      APPLIED: 1,
      SCREENING_PASSED: 0,
      INTERVIEW: 1,
      OFFER: 0,
      UNKNOWN: 1,
    });
  });

  describe("average days to first response", () => {
    it("measures from the APPLIED event to the next response", () => {
      // 3 days (Nov 1 -> Nov 4)
      const s = computeStats([
        app([
          [null, "APPLIED", T(1)],
          ["APPLIED", "SCREENING_PASSED", T(4)],
        ]),
      ]);
      expect(s.avgDaysToFirstResponse).toBe(3);
    });

    it("uses appliedAt when set (applications added after the fact)", () => {
      // appliedAt Nov 1, recorded Nov 5, rejected Nov 11 -> 10 days
      const backfilled = app(
        [
          [null, "APPLIED", T(5)],
          ["APPLIED", "REJECTED", T(11)],
        ],
        "2026-11-01",
      );
      const quick = app([
        [null, "APPLIED", T(1)],
        ["APPLIED", "INTERVIEW", T(4)],
      ]);
      // (10 + 3) / 2
      expect(computeStats([backfilled, quick]).avgDaysToFirstResponse).toBe(6.5);
    });

    it("rounds to one decimal", () => {
      const a = app([
        [null, "APPLIED", T(1)],
        ["APPLIED", "INTERVIEW", T(2, 8)], // 1.333… days
      ]);
      expect(computeStats([a]).avgDaysToFirstResponse).toBe(1.3);
    });

    it("skips applications with no response yet, no APPLIED event, or a withdrawal", () => {
      const withdrew = app([
        [null, "APPLIED", T(1)],
        ["APPLIED", "WITHDRAWN", T(2)],
      ]);
      expect(
        computeStats([appliedNoAnswer, addedAsOffer, withdrew, wishlistOnly])
          .avgDaysToFirstResponse,
      ).toBeNull();
    });

    it("never goes negative when appliedAt is after the response", () => {
      const odd = app(
        [
          [null, "APPLIED", T(1)],
          ["APPLIED", "INTERVIEW", T(2)],
        ],
        "2026-11-20",
      );
      expect(computeStats([odd]).avgDaysToFirstResponse).toBe(0);
    });

    it("does not depend on the order events are passed in", () => {
      const shuffled: StatsApplication = {
        status: "INTERVIEW",
        appliedAt: null,
        events: [
          { fromStatus: "APPLIED", toStatus: "INTERVIEW", changedAt: new Date(T(4)) },
          { fromStatus: null, toStatus: "APPLIED", changedAt: new Date(T(1)) },
        ],
      };
      expect(computeStats([shuffled]).avgDaysToFirstResponse).toBe(3);
    });
  });
});
