"use client";

import { useActionState } from "react";
import { changeStatusAction, type FormState } from "@/app/actions";
import { STATUS_LABELS } from "@/components/status-badge";
import type { Status } from "@/lib/domain/status";

const initialState: FormState = { ok: true };

/**
 * Offers only the statuses reachable from the current one. The server
 * re-validates the transition anyway; this just keeps the UI honest.
 */
export function StatusSelect({
  applicationId,
  allowed,
}: {
  applicationId: string;
  allowed: readonly Status[];
}) {
  const [state, action, pending] = useActionState(changeStatusAction, initialState);

  if (allowed.length === 0) {
    return <span className="text-xs text-zinc-500">Final</span>;
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="toStatus"
        aria-label="New status"
        defaultValue=""
        required
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>
          Move to…
        </option>
        {allowed.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium disabled:opacity-50 dark:border-zinc-700"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {!state.ok && state.message && (
        <span role="alert" className="text-xs text-red-600">
          {state.message}
        </span>
      )}
    </form>
  );
}
