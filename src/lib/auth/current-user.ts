import "server-only";
import { connection } from "next/server";

/**
 * Prototype stand-in for authentication: every request acts as DEV_USER_ID.
 * When Auth.js is added, only this function changes (read the session and
 * throw if signed out); queries and actions already scope everything by it.
 * See docs/decisions.md (005).
 */
export async function getCurrentUserId(): Promise<string> {
  // Per-request value, like a real session: keep it out of prerendering.
  await connection();
  const userId = process.env.DEV_USER_ID;
  if (!userId) {
    throw new Error("DEV_USER_ID is not set. Copy .env.example to .env.local.");
  }
  return userId;
}
