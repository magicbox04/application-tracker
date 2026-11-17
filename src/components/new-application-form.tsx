"use client";

import { useActionState } from "react";
import { createApplicationAction, type FormState } from "@/app/actions";
import { STATUS_LABELS } from "@/components/status-badge";
import { STATUSES } from "@/lib/domain/status";

const initialState: FormState = { ok: true };

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    // Label sits beside (not around) the control, so a <select>'s accessible
    // name is just the label, not the label plus every option's text.
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={name} className="font-medium">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-600">{error[0]}</span>}
    </div>
  );
}

export function NewApplicationForm() {
  const [state, action, pending] = useActionState(createApplicationAction, initialState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form
      // React resets the form after each action; inputs then fall back to
      // defaultValue, i.e. empty after success and the submitted values after
      // a validation error.
      action={action}
      className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
    >
      <Field label="Company *" name="company" error={e.company}>
        <input id="company" name="company" required defaultValue={v.company} className={inputClass} />
      </Field>
      <Field label="Role *" name="role" error={e.role}>
        <input id="role" name="role" required defaultValue={v.role} className={inputClass} />
      </Field>
      <Field label="Status" name="status" error={e.status}>
        <select id="status" name="status" defaultValue={v.status ?? "APPLIED"} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Job posting URL" name="url" error={e.url}>
        <input id="url" name="url" type="url" defaultValue={v.url} className={inputClass} />
      </Field>
      <Field label="Location" name="location" error={e.location}>
        <input id="location" name="location" defaultValue={v.location} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Applied on" name="appliedAt" error={e.appliedAt}>
          <input id="appliedAt" name="appliedAt" type="date" defaultValue={v.appliedAt} className={inputClass} />
        </Field>
        <Field label="Deadline" name="deadline" error={e.deadline}>
          <input id="deadline" name="deadline" type="date" defaultValue={v.deadline} className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Notes" name="notes" error={e.notes}>
          <textarea id="notes" name="notes" rows={2} defaultValue={v.notes} className={inputClass} />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Adding…" : "Add application"}
        </button>
        {state.message && (
          <p role="status" className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
