"use client";

import { deleteApplicationAction } from "@/app/actions";

export function DeleteButton({
  applicationId,
  label,
}: {
  applicationId: string;
  label: string;
}) {
  return (
    <form
      action={deleteApplicationAction}
      onSubmit={(event) => {
        if (!confirm(`Delete ${label}? This also deletes its status history.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <button
        type="submit"
        aria-label={`Delete ${label}`}
        className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}
