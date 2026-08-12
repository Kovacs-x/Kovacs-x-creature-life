export interface HungerState {
  readonly energy: number;
  readonly maxEnergy: number;
}

export interface HungerMetabolismConfig {
  readonly energyLossPerSecond: number;
}

export function createHungerState(
  energy: number,
  maxEnergy = 1,
): HungerState {
  if (
    !Number.isFinite(maxEnergy) ||
    maxEnergy <= 0
  ) {
    throw new RangeError(
      "maxEnergy must be a positive finite number.",
    );
  }

  if (
    !Number.isFinite(energy) ||
    energy < 0 ||
    energy > maxEnergy
  ) {
    throw new RangeError(
      "energy must be finite and between 0 and maxEnergy.",
    );
  }

  return {
    energy,
    maxEnergy,
  };
}

export function getHungerLevel(
  state: HungerState,
): number {
  return (
    1 -
    state.energy /
      state.maxEnergy
  );
}

export function consumeEnergy(
  state: HungerState,
  amount: number,
): HungerState {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new RangeError(
      "Energy consumption must be non-negative.",
    );
  }

  return {
    ...state,
    energy: Math.max(
      0,
      state.energy - amount,
    ),
  };
}

export function restoreEnergy(
  state: HungerState,
  amount: number,
): HungerState {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new RangeError(
      "Energy restoration must be non-negative.",
    );
  }

  return {
    ...state,
    energy: Math.min(
      state.maxEnergy,
      state.energy + amount,
    ),
  };
}

export function advanceHungerOverTime(
  state: HungerState,
  deltaSeconds: number,
  config: HungerMetabolismConfig,
): HungerState {
  if (
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds < 0
  ) {
    throw new RangeError(
      "deltaSeconds must be finite and non-negative.",
    );
  }

  if (
    !Number.isFinite(
      config.energyLossPerSecond,
    ) ||
    config.energyLossPerSecond < 0
  ) {
    throw new RangeError(
      "energyLossPerSecond must be finite and non-negative.",
    );
  }

  const energyCost =
    deltaSeconds *
    config.energyLossPerSecond;

  return consumeEnergy(
    state,
    energyCost,
  );
}