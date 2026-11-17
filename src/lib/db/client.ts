import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// Reuse one connection pool across dev hot reloads instead of opening a new
// pool every time a module is re-evaluated.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};
const client = globalForDb.pgClient ?? postgres(url);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
