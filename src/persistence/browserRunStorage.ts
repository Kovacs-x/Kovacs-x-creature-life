import {
  deserializeM3PersistentRun,
  serializeM3PersistentRun,
  type M3PersistentRunState,
} from "../simulation/core/m3Persistence.js";

/*
 * E5 BROWSER STORAGE TRANSPORT
 *
 * existing authoritative state
 *   -> existing M3PersistentRunState
 *   -> existing serializeM3PersistentRun(...)
 *   -> browser storage
 *   -> browser storage
 *   -> existing deserializeM3PersistentRun(...)
 *   -> existing M3PersistentRunState
 *
 * This module performs storage transport only.
 * It does not evaluate cognition, sample RNG,
 * advance simulation, alter memory/exploration
 * state or invent a second Creature save schema.
 * It never duplicates the validation already
 * performed by serializeM3PersistentRun(...)/
 * deserializeM3PersistentRun(...); it only calls
 * them.
 *
 * A narrow Storage-like interface (rather than
 * the real browser Storage type) lets this be
 * tested with a fake in-memory implementation,
 * without a real browser.
 */
export interface M3RunStorageLike {
  getItem(key: string): string | null;

  setItem(key: string, value: string): void;

  removeItem(key: string): void;
}

/*
 * One stable storage key for the single
 * persistent Creature run.
 */
export const M3_BROWSER_RUN_STORAGE_KEY =
  "creature-life:m3-persistent-run" as const;

export type M3RunStorageLoadResult =
  | {
      readonly status: "missing";
    }
  | {
      readonly status: "valid";
      readonly run: M3PersistentRunState;
    }
  | {
      readonly status: "invalid";
      readonly reason: string;
    };

/*
 * Distinguishes three explicit outcomes:
 *
 * - no save exists yet ("missing");
 * - a save exists and satisfies the existing
 *   persistence contract ("valid");
 * - a save exists but fails the existing
 *   persistence contract ("invalid").
 *
 * An invalid payload is never partially parsed
 * or partially used; deserializeM3PersistentRun(...)
 * either returns a complete valid run or this
 * function reports "invalid" and discards the
 * raw text entirely.
 */
export function loadM3PersistentRunFromStorage(
  storage: M3RunStorageLike,
): M3RunStorageLoadResult {
  const serialized = storage.getItem(M3_BROWSER_RUN_STORAGE_KEY);

  if (serialized === null) {
    return {
      status: "missing",
    };
  }

  try {
    const run = deserializeM3PersistentRun(serialized);

    return {
      status: "valid",
      run,
    };
  } catch (error) {
    return {
      status: "invalid",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/*
 * Writes the exact existing serialization of the
 * supplied run. This performs no simulation work
 * and never mutates the supplied run.
 */
export function saveM3PersistentRunToStorage(
  storage: M3RunStorageLike,
  run: M3PersistentRunState,
): void {
  storage.setItem(M3_BROWSER_RUN_STORAGE_KEY, serializeM3PersistentRun(run));
}
