import { describe, expect, it } from "vitest";
import { planUndo } from "@/lib/domain/undo";

describe("planUndo", () => {
  it("reverts the most recent change to its previous status", () => {
    expect(planUndo("REJECTED", { fromStatus: "INTERVIEW", toStatus: "REJECTED" })).toEqual({
      ok: true,
      revertTo: "INTERVIEW",
    });
  });

  it("can undo out of a final status (that's the point)", () => {
    expect(planUndo("WITHDRAWN", { fromStatus: "OFFER", toStatus: "WITHDRAWN" })).toEqual({
      ok: true,
      revertTo: "OFFER",
    });
  });

  it("works step by step back through the pipeline", () => {
    expect(planUndo("INTERVIEW", { fromStatus: "APPLIED", toStatus: "INTERVIEW" })).toEqual({
      ok: true,
      revertTo: "APPLIED",
    });
  });

  it("has nothing to undo when there are no events", () => {
    expect(planUndo("APPLIED", undefined)).toEqual({ ok: false, reason: "NOTHING_TO_UNDO" });
  });

  it("does not undo the creation event (from: null)", () => {
    expect(planUndo("APPLIED", { fromStatus: null, toStatus: "APPLIED" })).toEqual({
      ok: false,
      reason: "NOTHING_TO_UNDO",
    });
  });

  it("refuses when the last event doesn't match the current status", () => {
    expect(planUndo("OFFER", { fromStatus: "APPLIED", toStatus: "INTERVIEW" })).toEqual({
      ok: false,
      reason: "OUT_OF_SYNC",
    });
  });
});
