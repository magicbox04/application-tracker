import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Status } from "@/lib/domain/status";
import { type TransitionError, validateTransition } from "@/lib/domain/transitions";
import { db } from "@/lib/db/client";
import {
  type Application,
  applications,
  type StatusEvent,
  statusEvents,
} from "@/lib/db/schema";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/lib/validation/application";

// Every query takes the caller's userId and filters by it, so a user can only
// ever read or change their own records (CLAUDE.md rule 5).

export async function listApplications(userId: string): Promise<Application[]> {
  return db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
}

export async function getApplication(
  userId: string,
  applicationId: string,
): Promise<Application | null> {
  const [application] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));
  return application ?? null;
}

export async function getApplicationWithEvents(
  userId: string,
  applicationId: string,
): Promise<{ application: Application; events: StatusEvent[] } | null> {
  const application = await getApplication(userId, applicationId);
  if (!application) return null;

  const events = await db
    .select()
    .from(statusEvents)
    .where(eq(statusEvents.applicationId, applicationId))
    .orderBy(asc(statusEvents.changedAt));
  return { application, events };
}

/** Creates the application and its first StatusEvent (from: null) together. */
export async function createApplication(
  userId: string,
  input: CreateApplicationInput,
): Promise<Application> {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(applications)
      .values({ ...input, userId })
      .returning();
    if (!created) throw new Error("Insert returned no row");
    await tx.insert(statusEvents).values({
      applicationId: created.id,
      fromStatus: null,
      toStatus: created.status,
    });
    return created;
  });
}

/**
 * Updates the editable fields (never status). Returns false when the
 * application doesn't exist or isn't the user's.
 */
export async function updateApplication(
  userId: string,
  { applicationId, ...fields }: UpdateApplicationInput,
): Promise<boolean> {
  const updated = await db
    .update(applications)
    .set({ ...fields, updatedAt: new Date() })
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .returning({ id: applications.id });
  return updated.length > 0;
}

export type ChangeStatusResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | TransitionError };

/**
 * Validates the transition and writes the new status plus its StatusEvent in
 * one transaction. The row is locked (FOR UPDATE) so two concurrent changes
 * can't both pass validation against the same old status.
 */
export async function changeApplicationStatus(
  userId: string,
  applicationId: string,
  toStatus: Status,
): Promise<ChangeStatusResult> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: applications.status })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .for("update");
    if (!current) return { ok: false, reason: "NOT_FOUND" } as const;

    const check = validateTransition(current.status, toStatus);
    if (!check.ok) return check;

    await tx
      .update(applications)
      .set({ status: toStatus, updatedAt: new Date() })
      .where(eq(applications.id, applicationId));
    await tx.insert(statusEvents).values({
      applicationId,
      fromStatus: current.status,
      toStatus,
    });
    return { ok: true } as const;
  });
}

/** Returns false when the application doesn't exist or isn't the user's. */
export async function deleteApplication(
  userId: string,
  applicationId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .returning({ id: applications.id });
  return deleted.length > 0;
}
