import type {
  BrainConnectionState,
  BrainState,
} from "../core/contracts.js";

export interface ConnectionEligibility {
  readonly connectionId: string;
  readonly eligibility: number;
}

export interface PlasticityConfig {
  readonly learningRate: number;
  readonly minWeight: number;
  readonly maxWeight: number;
  readonly learningEnabled: boolean;
}

export interface WeightChange {
  readonly connectionId: string;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
}

export interface PlasticityResult {
  readonly brain: BrainState;
  readonly changes: readonly WeightChange[];
}

export function applyRewardPlasticity(
  brain: BrainState,
  eligibilities: readonly ConnectionEligibility[],
  reward: number,
  config: PlasticityConfig,
): PlasticityResult {
  validateConfig(config);

  if (!Number.isFinite(reward)) {
    throw new RangeError("Plasticity reward must be finite.");
  }

  if (!config.learningEnabled || reward === 0) {
    return {
      brain,
      changes: [],
    };
  }

  const eligibilityMap = new Map<string, number>();

  for (const entry of eligibilities) {
    if (!Number.isFinite(entry.eligibility)) {
      throw new RangeError(
        `Eligibility must be finite: ${entry.connectionId}`,
      );
    }

    eligibilityMap.set(entry.connectionId, entry.eligibility);
  }

  const changes: WeightChange[] = [];

  const connections: BrainConnectionState[] =
    brain.connections.map((connection) => {
      const eligibility =
        eligibilityMap.get(connection.id) ?? 0;

      if (!connection.enabled || eligibility === 0) {
        return { ...connection };
      }

      const delta =
        config.learningRate * reward * eligibility;

      const after = clamp(
        connection.weight + delta,
        config.minWeight,
        config.maxWeight,
      );

      if (after !== connection.weight) {
        changes.push({
          connectionId: connection.id,
          before: connection.weight,
          after,
          delta: after - connection.weight,
        });
      }

      return {
        ...connection,
        weight: after,
      };
    });

  return {
    brain: {
      ...brain,
      connections,
    },
    changes,
  };
}

function validateConfig(config: PlasticityConfig): void {
  if (
    !Number.isFinite(config.learningRate) ||
    config.learningRate < 0
  ) {
    throw new RangeError(
      "Learning rate must be finite and non-negative.",
    );
  }

  if (
    !Number.isFinite(config.minWeight) ||
    !Number.isFinite(config.maxWeight) ||
    config.minWeight > config.maxWeight
  ) {
    throw new RangeError("Plasticity weight bounds are invalid.");
  }
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value));
}