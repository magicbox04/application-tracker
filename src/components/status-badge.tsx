import type { Status } from "@/lib/domain/status";

export const STATUS_LABELS: Record<Status, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING_PASSED: "Screening passed",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_STYLES: Record<Status, string> = {
  WISHLIST: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  APPLIED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  SCREENING_PASSED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  INTERVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OFFER: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  WITHDRAWN: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      data-testid="status-badge"
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
