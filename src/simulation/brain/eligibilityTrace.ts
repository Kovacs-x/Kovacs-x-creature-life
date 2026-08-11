import type { ConnectionEligibility } from "./plasticity.js";

export interface EligibilityTraceConfig {
  readonly decay: number;
}

export function mergeEligibilityTrace(
  previous: readonly ConnectionEligibility[],
  current: readonly ConnectionEligibility[],
  config: EligibilityTraceConfig,
): readonly ConnectionEligibility[] {
  if (
    !Number.isFinite(config.decay) ||
    config.decay < 0 ||
    config.decay > 1
  ) {
    throw new RangeError(
      "Eligibility trace decay must be between 0 and 1.",
    );
  }

  const merged = new Map<string, number>();

  for (const entry of previous) {
    if (!Number.isFinite(entry.eligibility)) {
      throw new RangeError(
        `Previous eligibility must be finite: ${entry.connectionId}`,
      );
    }

    merged.set(
      entry.connectionId,
      entry.eligibility * config.decay,
    );
  }

  for (const entry of current) {
    if (!Number.isFinite(entry.eligibility)) {
      throw new RangeError(
        `Current eligibility must be finite: ${entry.connectionId}`,
      );
    }

    const existing =
      merged.get(entry.connectionId) ?? 0;

    merged.set(
      entry.connectionId,
      Math.max(existing, entry.eligibility),
    );
  }

  return Array.from(
    merged.entries(),
    ([connectionId, eligibility]) => ({
      connectionId,
      eligibility,
    }),
  );
}