"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  undoLastStatusChange,
  updateApplication,
} from "@/lib/db/queries";
import {
  applicationIdSchema,
  changeStatusSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/lib/validation/application";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  /** Submitted values, so the form can keep them after a failed submit. */
  values?: Record<string, string>;
};

const TRANSITION_MESSAGES = {
  NOT_FOUND: "That application no longer exists.",
  SAME_STATUS: "The application is already in that status.",
  TERMINAL_STATUS: "Rejected or withdrawn applications can't change status.",
  NOT_ALLOWED: "That status change isn't allowed.",
} as const;

function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

export async function createApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = createApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }
  const userId = await getCurrentUserId();
  await createApplication(userId, parsed.data);
  refresh();
  return { ok: true, message: "Application added." };
}

export async function updateApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = updateApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }
  const userId = await getCurrentUserId();
  const found = await updateApplication(userId, parsed.data);
  if (!found) return { ok: false, message: TRANSITION_MESSAGES.NOT_FOUND, values };
  redirect(`/applications/${parsed.data.applicationId}`);
}

export async function changeStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = changeStatusSchema.safeParse(formValues(formData));
  if (!parsed.success) return { ok: false, message: "Invalid status change." };

  const userId = await getCurrentUserId();
  const result = await changeApplicationStatus(
    userId,
    parsed.data.applicationId,
    parsed.data.toStatus,
  );
  if (!result.ok) return { ok: false, message: TRANSITION_MESSAGES[result.reason] };
  refresh();
  return { ok: true };
}

const UNDO_MESSAGES = {
  NOT_FOUND: TRANSITION_MESSAGES.NOT_FOUND,
  NOTHING_TO_UNDO: "There's no status change to undo.",
  OUT_OF_SYNC: "The history changed in the meantime. Reload and try again.",
} as const;

export async function undoStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = applicationIdSchema.safeParse(formValues(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  const userId = await getCurrentUserId();
  const result = await undoLastStatusChange(userId, parsed.data.applicationId);
  if (!result.ok) return { ok: false, message: UNDO_MESSAGES[result.reason] };
  refresh();
  return { ok: true };
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const parsed = applicationIdSchema.safeParse(formValues(formData));
  if (!parsed.success) return;

  const userId = await getCurrentUserId();
  await deleteApplication(userId, parsed.data.applicationId);
  // Works from both the list and the detail page (which no longer exists).
  redirect("/");
}
