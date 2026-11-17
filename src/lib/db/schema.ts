import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// Relative import: drizzle-kit loads this file without the "@/" path alias.
import { STATUSES } from "../domain/status";

export const statusEnum = pgEnum("application_status", STATUSES);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Text, not uuid: Auth.js user ids are strings. No FK until Auth.js lands.
    userId: text("user_id").notNull(),
    company: text("company").notNull(),
    role: text("role").notNull(),
    url: text("url"),
    location: text("location"),
    status: statusEnum("status").notNull(),
    appliedAt: date("applied_at"),
    deadline: date("deadline"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("applications_user_id_idx").on(t.userId)],
);

export const statusEvents = pgTable(
  "status_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    // Null on the first event, written when the application is created.
    fromStatus: statusEnum("from_status"),
    toStatus: statusEnum("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("status_events_application_id_idx").on(t.applicationId)],
);

export type Application = typeof applications.$inferSelect;
export type StatusEvent = typeof statusEvents.$inferSelect;
