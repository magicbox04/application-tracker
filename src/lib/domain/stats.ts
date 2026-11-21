import { STATUSES, type Status } from "@/lib/domain/status";

/**
 * Pipeline statistics, computed only from StatusEvent history (CLAUDE.md:
 * "stats are computed from this table") plus the user-entered appliedAt.
 * See docs/decisions.md (010) for the definitions.
 */

export type StatsEvent = {
  fromStatus: Status | null;
  toStatus: Status;
  changedAt: Date;
};

export type StatsApplication = {
  status: Status;
  /** YYYY-MM-DD, as entered by the user. */
  appliedAt: string | null;
  events: StatsEvent[];
};

export const FUNNEL_STAGES = ["APPLIED", "SCREENING_PASSED", "INTERVIEW", "OFFER"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export type RejectionStage = FunnelStage | "UNKNOWN";

export type PipelineStats = {
  total: number;
  byStatus: Record<Status, number>;
  /** How many applications ever reached each stage (or a later one). */
  funnel: { stage: FunnelStage; count: number }[];
  /** Ratios 0..1, null when there's nothing to divide by. */
  conversion: { appliedToInterview: number | null; interviewToOffer: number | null };
  /** Share of applied applications that moved past APPLIED or were rejected. */
  responseRate: number | null;
  /** Rejected applications, by the stage they were rejected from. */
  rejectedAt: Record<RejectionStage, number>;
  /** Mean days from applying to the first response, one decimal. */
  avgDaysToFirstResponse: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pipeline depth of a status. A rejection implies the person had applied. */
const RANK: Record<Status, number> = {
  WISHLIST: 0,
  APPLIED: 1,
  SCREENING_PASSED: 2,
  INTERVIEW: 3,
  OFFER: 4,
  REJECTED: 1,
  WITHDRAWN: 0,
};

const RESPONSES: ReadonlySet<Status> = new Set([
  "SCREENING_PASSED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]);

const ratio = (part: number, whole: number) => (whole === 0 ? null : part / whole);

const byTime = (a: StatsEvent, b: StatsEvent) => a.changedAt.getTime() - b.changedAt.getTime();

function reachedRank(app: StatsApplication): number {
  return Math.max(0, ...app.events.map((e) => RANK[e.toStatus]));
}

function rejectionStage(app: StatsApplication): RejectionStage {
  const rejection = [...app.events].sort(byTime).findLast((e) => e.toStatus === "REJECTED");
  const from = rejection?.fromStatus;
  return from && (FUNNEL_STAGES as readonly Status[]).includes(from)
    ? (from as FunnelStage)
    : "UNKNOWN";
}

/** Days from applying to the first response, or null if it can't be measured. */
function daysToFirstResponse(app: StatsApplication): number | null {
  const events = [...app.events].sort(byTime);
  const appliedIndex = events.findIndex((e) => e.toStatus === "APPLIED");
  const appliedEvent = events[appliedIndex];
  if (!appliedEvent) return null;

  const response = events.slice(appliedIndex + 1).find((e) => RESPONSES.has(e.toStatus));
  if (!response) return null;

  const start = app.appliedAt ? Date.parse(`${app.appliedAt}T00:00:00Z`) : appliedEvent.changedAt.getTime();
  return Math.max(0, (response.changedAt.getTime() - start) / DAY_MS);
}

export function computeStats(apps: readonly StatsApplication[]): PipelineStats {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  const funnelCounts = [0, 0, 0, 0];
  const rejectedAt: Record<RejectionStage, number> = {
    APPLIED: 0,
    SCREENING_PASSED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    UNKNOWN: 0,
  };
  let responded = 0;
  const responseDays: number[] = [];

  for (const app of apps) {
    byStatus[app.status] += 1;

    const rank = reachedRank(app);
    FUNNEL_STAGES.forEach((stage, i) => {
      if (rank >= RANK[stage]) funnelCounts[i] = (funnelCounts[i] ?? 0) + 1;
    });

    if (rank >= RANK.APPLIED && app.events.some((e) => RESPONSES.has(e.toStatus))) {
      responded += 1;
    }

    if (app.status === "REJECTED") rejectedAt[rejectionStage(app)] += 1;

    const days = daysToFirstResponse(app);
    if (days !== null) responseDays.push(days);
  }

  const [applied = 0, , interview = 0, offer = 0] = funnelCounts;
  const avg =
    responseDays.length === 0
      ? null
      : Math.round((responseDays.reduce((a, b) => a + b, 0) / responseDays.length) * 10) / 10;

  return {
    total: apps.length,
    byStatus,
    funnel: FUNNEL_STAGES.map((stage, i) => ({ stage, count: funnelCounts[i] ?? 0 })),
    conversion: {
      appliedToInterview: ratio(interview, applied),
      interviewToOffer: ratio(offer, interview),
    },
    responseRate: ratio(responded, applied),
    rejectedAt,
    avgDaysToFirstResponse: avg,
  };
}
