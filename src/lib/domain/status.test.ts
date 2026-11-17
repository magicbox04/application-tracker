import { describe, expect, it } from "vitest";
import { isStatus, STATUSES } from "@/lib/domain/status";

describe("STATUSES", () => {
  it("lists every status in pipeline order", () => {
    expect(STATUSES).toEqual([
      "WISHLIST",
      "APPLIED",
      "SCREENING_PASSED",
      "INTERVIEW",
      "OFFER",
      "REJECTED",
      "WITHDRAWN",
    ]);
  });
});

describe("isStatus", () => {
  it("accepts a known status", () => {
    expect(isStatus("INTERVIEW")).toBe(true);
  });

  it("rejects unknown or differently cased values", () => {
    expect(isStatus("interview")).toBe(false);
    expect(isStatus("HIRED")).toBe(false);
    expect(isStatus("")).toBe(false);
  });
});
