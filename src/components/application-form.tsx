"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import {
  createApplicationAction,
  type FormState,
  updateApplicationAction,
} from "@/app/actions";
import { STATUS_LABELS } from "@/components/status-badge";
import { STATUSES } from "@/lib/domain/status";

const initialState: FormState = { ok: true };

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/** Editable fields as the form shows them (empty string = no value). */
export type ApplicationFormValues = {
  company: string;
  role: string;
  url: string;
  location: string;
  appliedAt: string;
  deadline: string;
  notes: string;
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; applicationId: string; initialValues: ApplicationFormValues };

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    // Label sits beside (not around) the control, so a <select>'s accessible
    // name is just the label, not the label plus every option's text.
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={htmlFor} className="font-medium">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-600">{error[0]}</span>}
    </div>
  );
}

/**
 * Add form (with a starting status) and edit form (without: status only
 * changes through the transition rules).
 */
export function ApplicationForm(props: Props) {
  const isEdit = props.mode === "edit";
  const [state, action, pending] = useActionState(
    isEdit ? updateApplicationAction : createApplicationAction,
    initialState,
  );
  // After a failed submit, show what was typed. Otherwise the saved values
  // (edit) or empty fields (create).
  const v: Partial<Record<string, string>> =
    state.values ?? (isEdit ? props.initialValues : {});
  const e = state.fieldErrors ?? {};
  // Unique ids per form: Next.js keeps the previous page in the DOM (hidden)
  // for instant back navigation, so the add and edit forms can coexist and
  // fixed ids like "company" would collide.
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  return (
    <form
      // React resets the form after each action; inputs then fall back to
      // defaultValue, i.e. empty after a successful add and the submitted
      // values after a validation error. A successful edit redirects.
      action={action}
      className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
    >
      {isEdit && <input type="hidden" name="applicationId" value={props.applicationId} />}
      <Field label="Company *" htmlFor={id("company")} error={e.company}>
        <input id={id("company")} name="company" required defaultValue={v.company} className={inputClass} />
      </Field>
      <Field label="Role *" htmlFor={id("role")} error={e.role}>
        <input id={id("role")} name="role" required defaultValue={v.role} className={inputClass} />
      </Field>
      {!isEdit && (
        <Field label="Status" htmlFor={id("status")} error={e.status}>
          <select id={id("status")} name="status" defaultValue={v.status ?? "APPLIED"} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Job posting URL" htmlFor={id("url")} error={e.url}>
        <input id={id("url")} name="url" type="url" defaultValue={v.url} className={inputClass} />
      </Field>
      <Field label="Location" htmlFor={id("location")} error={e.location}>
        <input id={id("location")} name="location" defaultValue={v.location} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Applied on" htmlFor={id("appliedAt")} error={e.appliedAt}>
          <input id={id("appliedAt")} name="appliedAt" type="date" defaultValue={v.appliedAt} className={inputClass} />
        </Field>
        <Field label="Deadline" htmlFor={id("deadline")} error={e.deadline}>
          <input id={id("deadline")} name="deadline" type="date" defaultValue={v.deadline} className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Notes" htmlFor={id("notes")} error={e.notes}>
          <textarea id={id("notes")} name="notes" rows={isEdit ? 5 : 2} defaultValue={v.notes} className={inputClass} />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isEdit ? (pending ? "Saving…" : "Save changes") : pending ? "Adding…" : "Add application"}
        </button>
        {isEdit && (
          <Link
            href={`/applications/${props.applicationId}`}
            className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        )}
        {state.message && (
          <p role="status" className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
