import { describe, expect, it } from "vitest";
import {
  applicationIdSchema,
  changeStatusSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/lib/validation/application";

const ID = "3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b";

describe("createApplicationSchema", () => {
  it("accepts the minimum: company, role, status", () => {
    const result = createApplicationSchema.parse({
      company: "Acme",
      role: "Frontend Engineer",
      status: "APPLIED",
    });
    expect(result).toEqual({
      company: "Acme",
      role: "Frontend Engineer",
      status: "APPLIED",
    });
  });

  it("accepts every optional field", () => {
    const result = createApplicationSchema.parse({
      company: "Acme",
      role: "Frontend Engineer",
      status: "WISHLIST",
      url: "https://acme.example/jobs/1",
      location: "Seoul",
      appliedAt: "2026-11-01",
      deadline: "2026-11-30",
      notes: "Referral from Kim",
    });
    expect(result.url).toBe("https://acme.example/jobs/1");
    expect(result.deadline).toBe("2026-11-30");
  });

  it("trims text fields", () => {
    const result = createApplicationSchema.parse({
      company: "  Acme  ",
      role: " Dev ",
      status: "APPLIED",
      location: "  Seoul ",
    });
    expect(result.company).toBe("Acme");
    expect(result.role).toBe("Dev");
    expect(result.location).toBe("Seoul");
  });

  it("treats empty form fields as missing (FormData sends empty strings)", () => {
    const result = createApplicationSchema.parse({
      company: "Acme",
      role: "Dev",
      status: "APPLIED",
      url: "",
      location: "   ",
      appliedAt: "",
      deadline: "",
      notes: "",
    });
    expect(result).toEqual({ company: "Acme", role: "Dev", status: "APPLIED" });
  });

  it("requires company and role", () => {
    expect(
      createApplicationSchema.safeParse({ company: "", role: "Dev", status: "APPLIED" })
        .success,
    ).toBe(false);
    expect(
      createApplicationSchema.safeParse({ company: "Acme", role: "  ", status: "APPLIED" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(
      createApplicationSchema.safeParse({ company: "A", role: "B", status: "HIRED" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid URL or one that is not http(s)", () => {
    const base = { company: "A", role: "B", status: "APPLIED" };
    expect(createApplicationSchema.safeParse({ ...base, url: "not a url" }).success).toBe(
      false,
    );
    expect(
      createApplicationSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success,
    ).toBe(false);
  });

  it("rejects dates that are not YYYY-MM-DD", () => {
    const base = { company: "A", role: "B", status: "APPLIED" };
    expect(createApplicationSchema.safeParse({ ...base, deadline: "30/11/2026" }).success).toBe(
      false,
    );
    expect(createApplicationSchema.safeParse({ ...base, appliedAt: "2026-02-30" }).success).toBe(
      false,
    );
  });

  it("limits field lengths", () => {
    const base = { company: "A", role: "B", status: "APPLIED" };
    expect(
      createApplicationSchema.safeParse({ ...base, company: "x".repeat(201) }).success,
    ).toBe(false);
    expect(
      createApplicationSchema.safeParse({ ...base, notes: "x".repeat(5001) }).success,
    ).toBe(false);
  });
});

describe("updateApplicationSchema", () => {
  const full = {
    applicationId: ID,
    company: "Acme",
    role: "Frontend Engineer",
    url: "https://acme.example/jobs/1",
    location: "Seoul",
    appliedAt: "2026-11-01",
    deadline: "2026-11-30",
    notes: "Referral",
  };

  it("accepts every editable field", () => {
    expect(updateApplicationSchema.parse(full)).toEqual(full);
  });

  it("turns blank optional fields into null, so editing can clear a value", () => {
    const result = updateApplicationSchema.parse({
      ...full,
      url: "",
      location: "  ",
      appliedAt: "",
      deadline: "",
      notes: "",
    });
    expect(result).toEqual({
      applicationId: ID,
      company: "Acme",
      role: "Frontend Engineer",
      url: null,
      location: null,
      appliedAt: null,
      deadline: null,
      notes: null,
    });
  });

  it("treats missing optional fields as cleared too (the form sends every field)", () => {
    const result = updateApplicationSchema.parse({
      applicationId: ID,
      company: "Acme",
      role: "Dev",
    });
    expect(result.location).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("does not let the edit form change status", () => {
    const result = updateApplicationSchema.parse({ ...full, status: "OFFER" });
    expect(result).not.toHaveProperty("status");
  });

  it("applies the same rules as create", () => {
    expect(updateApplicationSchema.safeParse({ ...full, company: " " }).success).toBe(false);
    expect(updateApplicationSchema.safeParse({ ...full, url: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(updateApplicationSchema.safeParse({ ...full, deadline: "2026-02-30" }).success).toBe(
      false,
    );
    expect(updateApplicationSchema.safeParse({ ...full, applicationId: "1" }).success).toBe(false);
  });
});

describe("changeStatusSchema", () => {
  it("accepts an application id and a known status", () => {
    expect(changeStatusSchema.parse({ applicationId: ID, toStatus: "INTERVIEW" })).toEqual({
      applicationId: ID,
      toStatus: "INTERVIEW",
    });
  });

  it("rejects a non-UUID id or unknown status", () => {
    expect(
      changeStatusSchema.safeParse({ applicationId: "123", toStatus: "INTERVIEW" }).success,
    ).toBe(false);
    expect(changeStatusSchema.safeParse({ applicationId: ID, toStatus: "DONE" }).success).toBe(
      false,
    );
  });
});

describe("applicationIdSchema", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(applicationIdSchema.safeParse({ applicationId: ID }).success).toBe(true);
    expect(applicationIdSchema.safeParse({ applicationId: "../etc" }).success).toBe(false);
  });
});
