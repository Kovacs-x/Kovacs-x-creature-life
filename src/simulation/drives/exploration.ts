import type {
  RandomSource,
} from "../core/rng.js";

export const EXPLORATION_STATE_SCHEMA_VERSION =
  1 as const;

export const EXPLORATION_STATE_KIND =
  "exploration" as const;

export const EXPLORATORY_HEADING_KIND =
  "exploration-heading" as const;

const FULL_TURN_RADIANS =
  Math.PI * 2;

const UNIT_VECTOR_TOLERANCE =
  1e-9;

export interface ExplorationPressureConfig {
  readonly minPressure: number;

  readonly maxPressure: number;

  readonly accumulationPerSecond: number;

  readonly reductionPerSecondWhileExploring:
    number;
}

export interface ExploratoryHeadingState {
  readonly kind:
    typeof EXPLORATORY_HEADING_KIND;

  readonly directionX: number;

  readonly directionY: number;

  readonly sampledAtSimulationTimeSeconds:
    number;

  readonly expiresAtSimulationTimeSeconds:
    number;
}

export interface ExplorationState {
  readonly schemaVersion:
    typeof EXPLORATION_STATE_SCHEMA_VERSION;

  readonly kind:
    typeof EXPLORATION_STATE_KIND;

  /*
   * Normalized primitive exploration pressure.
   *
   * M3.2 will prospectively lock the actual
   * operating range and rates used by the
   * behavioural experiment.
   */
  readonly pressure: number;

  /*
   * Motor variation belonging only to an
   * already-selected exploratory action.
   *
   * This field does not itself select
   * EXPLORE and does not cause movement.
   */
  readonly activeHeading:
    ExploratoryHeadingState | null;
}

/*
 * Create pure Creature-owned exploration
 * state.
 *
 * No behavioural integration occurs here.
 * In particular this module has no access
 * to food, world objects, perception,
 * memory, the brain or action competition.
 */
export function createExplorationState(
  initialPressure: number,
  config: ExplorationPressureConfig,
): ExplorationState {
  validateExplorationPressureConfig(
    config,
  );

  validateNormalizedPressure(
    initialPressure,
    "initialPressure",
  );

  validatePressureWithinConfig(
    initialPressure,
    config,
  );

  return {
    schemaVersion:
      EXPLORATION_STATE_SCHEMA_VERSION,

    kind:
      EXPLORATION_STATE_KIND,

    pressure:
      initialPressure,

    activeHeading:
      null,
  };
}

/*
 * Advance primitive homeostatic exploration
 * pressure through explicit simulation time.
 *
 * When exploratory activity is absent,
 * pressure accumulates.
 *
 * When legitimate exploratory activity is
 * occurring, pressure is reduced.
 *
 * M3.1 deliberately accepts the activity
 * condition as an input. A later integration
 * stage may supply true only when EXPLORE has
 * actually won normal action competition.
 *
 * This function does not decide whether the
 * Creature explores.
 */
export function advanceExplorationPressure(
  state: ExplorationState,
  deltaSeconds: number,
  isExploring: boolean,
  config: ExplorationPressureConfig,
): ExplorationState {
  assertExplorationState(
    state,
  );

  validateExplorationPressureConfig(
    config,
  );

  validateDeltaSeconds(
    deltaSeconds,
  );

  if (
    typeof isExploring !==
    "boolean"
  ) {
    throw new TypeError(
      "isExploring must be a boolean.",
    );
  }

  validatePressureWithinConfig(
    state.pressure,
    config,
  );

  if (deltaSeconds === 0) {
    return state;
  }

  const pressureDelta =
    isExploring
      ? -config
          .reductionPerSecondWhileExploring *
        deltaSeconds
      : config.accumulationPerSecond *
        deltaSeconds;

  const nextPressure =
    clamp(
      state.pressure +
        pressureDelta,
      config.minPressure,
      config.maxPressure,
    );

  if (
    Object.is(
      nextPressure,
      state.pressure,
    )
  ) {
    return state;
  }

  return {
    ...state,

    pressure:
      nextPressure,
  };
}

/*
 * Ensure that an already-selected
 * exploratory action has an active seeded
 * heading.
 *
 * IMPORTANT:
 *
 * This function does not decide whether
 * EXPLORE should occur.
 *
 * Future behavioural integration may call
 * this only after EXPLORE wins normal action
 * competition.
 *
 * The function has deliberately narrow
 * inputs:
 *
 * - current exploration state;
 * - authoritative simulation RNG;
 * - explicit simulation time;
 * - heading persistence duration.
 *
 * It has no world or target information and
 * therefore cannot steer toward hidden food.
 *
 * A valid unexpired heading is reused
 * without consuming RNG.
 *
 * A new heading consumes exactly one
 * nextFloat() result.
 */
export function ensureExploratoryHeading(
  state: ExplorationState,
  randomSource: RandomSource,
  simulationTimeSeconds: number,
  persistenceSeconds: number,
): ExplorationState {
  assertExplorationState(
    state,
  );

  validateSimulationTime(
    simulationTimeSeconds,
  );

  validatePositiveFiniteNumber(
    persistenceSeconds,
    "persistenceSeconds",
  );

  const expiresAtSimulationTimeSeconds =
    simulationTimeSeconds +
    persistenceSeconds;

  if (
    !Number.isFinite(
      expiresAtSimulationTimeSeconds,
    )
  ) {
    throw new RangeError(
      "Exploratory heading expiration time must be finite.",
    );
  }

  const currentHeading =
    state.activeHeading;

  if (
    currentHeading !== null
  ) {
    if (
      simulationTimeSeconds <
      currentHeading
        .sampledAtSimulationTimeSeconds
    ) {
      throw new RangeError(
        "Exploratory heading cannot be evaluated before its sampling time.",
      );
    }

    if (
      simulationTimeSeconds <
      currentHeading
        .expiresAtSimulationTimeSeconds
    ) {
      return state;
    }
  }

  const randomValue =
    randomSource.nextFloat();

  if (
    !Number.isFinite(
      randomValue,
    ) ||
    randomValue < 0 ||
    randomValue >= 1
  ) {
    throw new RangeError(
      "RandomSource.nextFloat() must return a finite value greater than or equal to 0 and less than 1.",
    );
  }

  const angleRadians =
    randomValue *
    FULL_TURN_RADIANS;

  const activeHeading:
    ExploratoryHeadingState = {
      kind:
        EXPLORATORY_HEADING_KIND,

      directionX:
        Math.cos(
          angleRadians,
        ),

      directionY:
        Math.sin(
          angleRadians,
        ),

      sampledAtSimulationTimeSeconds:
        simulationTimeSeconds,

      expiresAtSimulationTimeSeconds,
    };

  return {
    ...state,

    activeHeading,
  };
}

export function serializeExplorationState(
  state: ExplorationState,
): string {
  assertExplorationState(
    state,
  );

  return JSON.stringify(
    state,
  );
}

export function deserializeExplorationState(
  serialized: string,
): ExplorationState {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "Exploration state is not valid JSON.",
      {
        cause: error,
      },
    );
  }

  assertExplorationState(
    parsed,
  );

  return parsed;
}

function assertExplorationState(
  value: unknown,
): asserts value is ExplorationState {
  if (!isRecord(value)) {
    throw new Error(
      "Exploration state must be an object.",
    );
  }

  if (
    value.schemaVersion !==
    EXPLORATION_STATE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported exploration state schema version.",
    );
  }

  if (
    value.kind !==
    EXPLORATION_STATE_KIND
  ) {
    throw new Error(
      "Exploration state kind is invalid.",
    );
  }

  if (
    typeof value.pressure !==
    "number"
  ) {
    throw new Error(
      "Exploration pressure must be a number.",
    );
  }

  validateNormalizedPressure(
    value.pressure,
    "pressure",
  );

  if (
    value.activeHeading !==
    null
  ) {
    assertExploratoryHeading(
      value.activeHeading,
    );
  }
}

function assertExploratoryHeading(
  value: unknown,
): asserts value is ExploratoryHeadingState {
  if (!isRecord(value)) {
    throw new Error(
      "Exploratory heading must be an object.",
    );
  }

  if (
    value.kind !==
    EXPLORATORY_HEADING_KIND
  ) {
    throw new Error(
      "Exploratory heading kind is invalid.",
    );
  }

  if (
    typeof value.directionX !==
      "number" ||
    typeof value.directionY !==
      "number"
  ) {
    throw new Error(
      "Exploratory heading direction must contain numeric components.",
    );
  }

  validateDirectionComponent(
    value.directionX,
    "directionX",
  );

  validateDirectionComponent(
    value.directionY,
    "directionY",
  );

  const magnitude =
    Math.hypot(
      value.directionX,
      value.directionY,
    );

  if (
    Math.abs(
      magnitude - 1,
    ) >
    UNIT_VECTOR_TOLERANCE
  ) {
    throw new RangeError(
      "Exploratory heading direction must be a unit vector.",
    );
  }

  if (
    typeof value
      .sampledAtSimulationTimeSeconds !==
      "number"
  ) {
    throw new Error(
      "Exploratory heading sampling time must be numeric.",
    );
  }

  if (
    typeof value
      .expiresAtSimulationTimeSeconds !==
      "number"
  ) {
    throw new Error(
      "Exploratory heading expiration time must be numeric.",
    );
  }

  validateSimulationTime(
    value
      .sampledAtSimulationTimeSeconds,
  );

  validateSimulationTime(
    value
      .expiresAtSimulationTimeSeconds,
  );

  if (
    value
      .expiresAtSimulationTimeSeconds <=
    value
      .sampledAtSimulationTimeSeconds
  ) {
    throw new RangeError(
      "Exploratory heading expiration time must be after its sampling time.",
    );
  }
}

function validateExplorationPressureConfig(
  config: ExplorationPressureConfig,
): void {
  validateNormalizedPressure(
    config.minPressure,
    "minPressure",
  );

  validateNormalizedPressure(
    config.maxPressure,
    "maxPressure",
  );

  if (
    config.minPressure >
    config.maxPressure
  ) {
    throw new RangeError(
      "minPressure must not exceed maxPressure.",
    );
  }

  validateNonNegativeFiniteNumber(
    config.accumulationPerSecond,
    "accumulationPerSecond",
  );

  validateNonNegativeFiniteNumber(
    config
      .reductionPerSecondWhileExploring,
    "reductionPerSecondWhileExploring",
  );
}

function validatePressureWithinConfig(
  pressure: number,
  config: ExplorationPressureConfig,
): void {
  if (
    pressure <
      config.minPressure ||
    pressure >
      config.maxPressure
  ) {
    throw new RangeError(
      "Exploration pressure must be within the configured pressure bounds.",
    );
  }
}

function validateNormalizedPressure(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new RangeError(
      `${name} must be finite and between 0 and 1.`,
    );
  }
}

function validateDirectionComponent(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < -1 ||
    value > 1
  ) {
    throw new RangeError(
      `${name} must be finite and between -1 and 1.`,
    );
  }
}

function validateDeltaSeconds(
  deltaSeconds: number,
): void {
  if (
    !Number.isFinite(
      deltaSeconds,
    ) ||
    deltaSeconds < 0
  ) {
    throw new RangeError(
      "deltaSeconds must be finite and non-negative.",
    );
  }
}

function validateSimulationTime(
  simulationTimeSeconds: number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new RangeError(
      "Simulation time must be finite and non-negative.",
    );
  }
}

function validatePositiveFiniteNumber(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new RangeError(
      `${name} must be a positive finite number.`,
    );
  }
}

function validateNonNegativeFiniteNumber(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new RangeError(
      `${name} must be finite and non-negative.`,
    );
  }
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}