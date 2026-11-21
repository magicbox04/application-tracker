"use client";

import { useActionState } from "react";
import { type FormState, undoStatusAction } from "@/app/actions";

const initialState: FormState = { ok: true };

/** `change` describes the change being undone, e.g. "Interview → Rejected". */
export function UndoStatusButton({
  applicationId,
  change,
}: {
  applicationId: string;
  change: string;
}) {
  const [state, action, pending] = useActionState(undoStatusAction, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(`Undo the last status change (${change})? It will be removed from the history.`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {pending ? "Undoing…" : `Undo last change (${change})`}
      </button>
      {!state.ok && state.message && (
        <span role="alert" className="text-xs text-red-600">
          {state.message}
        </span>
      )}
    </form>
  );
}
