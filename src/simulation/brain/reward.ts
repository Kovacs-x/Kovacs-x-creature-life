import type { HungerState } from "../biology/hunger.js";

export interface RewardSignal {
  readonly value: number;
  readonly energyChange: number;
}

export function deriveEnergyReward(
  before: HungerState,
  after: HungerState,
): RewardSignal {
  validateComparableStates(before, after);

  const beforeRatio = before.energy / before.maxEnergy;
  const afterRatio = after.energy / after.maxEnergy;

  const energyChange = afterRatio - beforeRatio;

  return {
    value: clampReward(energyChange),
    energyChange,
  };
}

function validateComparableStates(
  before: HungerState,
  after: HungerState,
): void {
  if (
    !Number.isFinite(before.energy) ||
    !Number.isFinite(before.maxEnergy) ||
    !Number.isFinite(after.energy) ||
    !Number.isFinite(after.maxEnergy)
  ) {
    throw new RangeError("Reward states must contain finite energy values.");
  }

  if (before.maxEnergy <= 0 || after.maxEnergy <= 0) {
    throw new RangeError("Reward states must have positive maximum energy.");
  }

  if (before.maxEnergy !== after.maxEnergy) {
    throw new Error(
      "Cannot derive M1 energy reward across incompatible maximum-energy states.",
    );
  }
}

function clampReward(value: number): number {
  return Math.min(1, Math.max(-1, value));
}