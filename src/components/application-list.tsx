import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import { StatusSelect } from "@/components/status-select";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listApplications } from "@/lib/db/queries";
import { getAllowedTransitions } from "@/lib/domain/transitions";

export async function ApplicationList() {
  const userId = await getCurrentUserId();
  const items = await listApplications(userId);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No applications yet. Add your first one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {items.map((app) => (
        <li
          key={app.id}
          data-testid="application-row"
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <Link
              href={`/applications/${app.id}`}
              className="font-medium hover:underline"
            >
              {app.company} — {app.role}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <StatusBadge status={app.status} />
              {app.location && <span>{app.location}</span>}
              {app.deadline && <span>Deadline {app.deadline}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusSelect
              applicationId={app.id}
              allowed={getAllowedTransitions(app.status)}
            />
            <DeleteButton
              applicationId={app.id}
              label={`${app.company} — ${app.role}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
