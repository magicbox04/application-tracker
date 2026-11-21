import type { Status } from "@/lib/domain/status";

export type UndoableEvent = {
  fromStatus: Status | null;
  toStatus: Status;
};

export type UndoResult =
  | { ok: true; revertTo: Status }
  | { ok: false; reason: "NOTHING_TO_UNDO" | "OUT_OF_SYNC" };

/**
 * Undo = remove the most recent StatusEvent and go back to its fromStatus.
 * Removing (rather than adding a "correction" event) keeps the history equal
 * to what actually happened, so stats need no special cases. The creation
 * event (fromStatus: null) can't be undone; delete the application instead.
 * See docs/decisions.md (009).
 */
export function planUndo(current: Status, lastEvent: UndoableEvent | undefined): UndoResult {
  if (!lastEvent || lastEvent.fromStatus === null) {
    return { ok: false, reason: "NOTHING_TO_UNDO" };
  }
  if (lastEvent.toStatus !== current) {
    return { ok: false, reason: "OUT_OF_SYNC" };
  }
  return { ok: true, revertTo: lastEvent.fromStatus };
}
