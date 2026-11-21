import { z } from "zod";
import { STATUSES } from "@/lib/domain/status";

/** FormData sends "" for empty inputs; treat blank strings as "not provided". */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const requiredText = (max: number) => z.string().trim().min(1).max(max);

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalDate = z.preprocess(blankToUndefined, z.iso.date().optional());

// http(s) only, so a stored link can never be a javascript: URL.
const optionalUrl = z.preprocess(
  blankToUndefined,
  z.url({ protocol: /^https?$/ }).max(2000).optional(),
);

/** For edits: blank or missing means "clear this field", stored as null. */
const clearable = <T extends z.ZodType>(schema: T) =>
  schema.transform((value) => value ?? null);

export const statusSchema = z.enum(STATUSES);

export const createApplicationSchema = z.object({
  company: requiredText(200),
  role: requiredText(200),
  status: statusSchema,
  url: optionalUrl,
  location: optionalText(200),
  appliedAt: optionalDate,
  deadline: optionalDate,
  notes: optionalText(5000),
});

/**
 * Edits every field except status. Status only changes through
 * changeStatusSchema so every change is validated and logged as a StatusEvent.
 */
export const updateApplicationSchema = z.object({
  applicationId: z.uuid(),
  company: requiredText(200),
  role: requiredText(200),
  url: clearable(optionalUrl),
  location: clearable(optionalText(200)),
  appliedAt: clearable(optionalDate),
  deadline: clearable(optionalDate),
  notes: clearable(optionalText(5000)),
});

export const changeStatusSchema = z.object({
  applicationId: z.uuid(),
  toStatus: statusSchema,
});

export const applicationIdSchema = z.object({
  applicationId: z.uuid(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
