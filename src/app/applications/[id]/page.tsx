import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { STATUS_LABELS, StatusBadge } from "@/components/status-badge";
import { StatusSelect } from "@/components/status-select";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getApplicationWithEvents } from "@/lib/db/queries";
import { getAllowedTransitions } from "@/lib/domain/transitions";
import { applicationIdSchema } from "@/lib/validation/application";

const dateTime = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ApplicationPage({
  params,
}: PageProps<"/applications/[id]">) {
  const { id } = await params;
  // Not a UUID → treat as not found instead of letting Postgres throw.
  if (!applicationIdSchema.safeParse({ applicationId: id }).success) notFound();

  const userId = await getCurrentUserId();
  const data = await getApplicationWithEvents(userId, id);
  if (!data) notFound();
  const { application: app, events } = data;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← All applications
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {app.company} — {app.role}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={app.status} />
          <StatusSelect applicationId={app.id} allowed={getAllowedTransitions(app.status)} />
        </div>
      </header>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-zinc-500">Location</dt>
        <dd>{app.location ?? "—"}</dd>
        <dt className="text-zinc-500">Applied on</dt>
        <dd>{app.appliedAt ?? "—"}</dd>
        <dt className="text-zinc-500">Deadline</dt>
        <dd>{app.deadline ?? "—"}</dd>
        <dt className="text-zinc-500">Posting</dt>
        <dd className="break-all">
          {app.url ? (
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="underline">
              {app.url}
            </a>
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-zinc-500">Notes</dt>
        <dd className="whitespace-pre-wrap">{app.notes ?? "—"}</dd>
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Status history</h2>
        <ol data-testid="status-history" className="flex flex-col gap-2 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="flex flex-wrap items-center gap-2">
              <time className="w-40 text-zinc-500" dateTime={ev.changedAt.toISOString()}>
                {dateTime.format(ev.changedAt)}
              </time>
              <span>
                {ev.fromStatus
                  ? `${STATUS_LABELS[ev.fromStatus]} → ${STATUS_LABELS[ev.toStatus]}`
                  : `Added as ${STATUS_LABELS[ev.toStatus]}`}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex items-center gap-2">
        <Link
          href={`/applications/${app.id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Edit
        </Link>
        <DeleteButton applicationId={app.id} label={`${app.company} — ${app.role}`} />
      </div>
    </main>
  );
}
