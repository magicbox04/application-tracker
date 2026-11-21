import Link from "next/link";
import { Suspense } from "react";
import { BarList } from "@/components/bar-list";
import { STATUS_LABELS, StatusBadge } from "@/components/status-badge";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getStatsInput } from "@/lib/db/queries";
import { computeStats, FUNNEL_STAGES, type RejectionStage } from "@/lib/domain/stats";
import { STATUSES } from "@/lib/domain/status";

export const metadata = { title: "Stats · Job Application Tracker" };

const percent = (ratio: number | null) => (ratio === null ? "—" : `${Math.round(ratio * 100)}%`);

const REJECTION_LABELS: Record<RejectionStage, string> = {
  APPLIED: "After applying",
  SCREENING_PASSED: "After screening",
  INTERVIEW: "After interview",
  OFFER: "After offer",
  UNKNOWN: "Added as rejected",
};

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-zinc-500">{hint}</span>
    </div>
  );
}

async function StatsContent() {
  const userId = await getCurrentUserId();
  const stats = computeStats(await getStatsInput(userId));

  if (stats.total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No applications yet. <Link href="/" className="underline">Add one</Link> to see stats.
      </p>
    );
  }

  const applied = stats.funnel[0]?.count ?? 0;
  const rejectedTotal = stats.byStatus.REJECTED;

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Applied" value={String(applied)} hint={`of ${stats.total} tracked`} />
        <StatTile label="Response rate" value={percent(stats.responseRate)} hint="any reply, incl. rejections" />
        <StatTile
          label="Applied → interview"
          value={percent(stats.conversion.appliedToInterview)}
          hint={`interview → offer ${percent(stats.conversion.interviewToOffer)}`}
        />
        <StatTile
          label="Days to first reply"
          value={stats.avgDaysToFirstResponse === null ? "—" : String(stats.avgDaysToFirstResponse)}
          hint="average, from applying"
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pipeline funnel</h2>
          <p className="text-sm text-zinc-500">
            Applications that ever reached each stage, including ones that later ended.
          </p>
        </div>
        <BarList
          ariaLabel="Pipeline funnel"
          items={FUNNEL_STAGES.map((stage, i) => {
            const count = stats.funnel[i]?.count ?? 0;
            return {
              label: STATUS_LABELS[stage],
              value: count,
              detail: applied > 0 ? `${Math.round((count / applied) * 100)}% of applied` : undefined,
            };
          })}
        />
      </section>

      {rejectedTotal > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Where rejections happen</h2>
            <p className="text-sm text-zinc-500">
              {rejectedTotal} rejected application{rejectedTotal === 1 ? "" : "s"}, by the stage
              {rejectedTotal === 1 ? " it was" : " they were"} at when rejected.
            </p>
          </div>
          <BarList
            ariaLabel="Rejections by stage"
            items={(Object.keys(REJECTION_LABELS) as RejectionStage[])
              .filter((stage) => stage !== "UNKNOWN" || stats.rejectedAt.UNKNOWN > 0)
              .map((stage) => ({
                label: REJECTION_LABELS[stage],
                value: stats.rejectedAt[stage],
                detail: `${Math.round((stats.rejectedAt[stage] / rejectedTotal) * 100)}% of rejections`,
              }))}
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Current status</h2>
        <table className="w-full max-w-sm text-sm">
          <tbody>
            {STATUSES.map((status) => (
              <tr key={status} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="py-1.5">
                  <StatusBadge status={status} />
                </td>
                <td className="py-1.5 text-right font-medium tabular-nums">{stats.byStatus[status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function StatsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Computed from every status change you&apos;ve recorded.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <StatsContent />
      </Suspense>
    </main>
  );
}
