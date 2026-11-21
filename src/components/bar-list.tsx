/**
 * Single-series horizontal bar list: label, bar, value at the tip.
 * Follows the dataviz mark spec: <=24px bars, 4px rounded data end (square at
 * the baseline), one hue, text in text colours, hover shows the details.
 */
export type BarItem = {
  label: string;
  value: number;
  /** Extra context for the hover tooltip, e.g. "50% of applied". */
  detail?: string;
};

export function BarList({ items, ariaLabel }: { items: BarItem[]; ariaLabel: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-3">
      {items.map((item) => {
        const tooltip = `${item.label}: ${item.value}${item.detail ? ` (${item.detail})` : ""}`;
        return (
          <li
            key={item.label}
            title={tooltip}
            aria-label={tooltip}
            className="group grid grid-cols-[8.5rem_1fr] items-center gap-3 text-sm"
          >
            <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className="h-5 flex-1 rounded-r-sm bg-chart-track">
                {item.value > 0 && (
                  <div
                    className="h-5 rounded-r-[4px] bg-chart-bar transition-opacity group-hover:opacity-80"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                )}
              </div>
              <span className="w-8 text-right font-medium tabular-nums">{item.value}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
