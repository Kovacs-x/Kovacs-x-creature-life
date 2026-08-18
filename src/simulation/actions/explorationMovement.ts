import type {
  RandomSource,
} from "../core/rng.js";

import {
  moveAlongDirection,
  type Position2D,
} from "./movement.js";

import {
  ensureExploratoryHeading,
  type ExplorationState,
} from "../drives/exploration.js";

import {
  M3_ACQUISITION_MOVE_DISTANCE,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
  M3_HABITAT_BOUNDS,
} from "../core/m3Contract.js";

export const M3_EXPLORATION_MOVEMENT_SOURCE =
  "exploration" as const;

export interface M3ExploratoryMovementResult {
  readonly position:
    Position2D;

  readonly explorationState:
    ExplorationState;

  readonly movementSource:
    typeof M3_EXPLORATION_MOVEMENT_SOURCE |
    null;

  readonly directionX:
    number | null;

  readonly directionY:
    number | null;

  readonly distanceMoved:
    number;

  readonly sampledNewHeading:
    boolean;
}

/*
 * M3.4 AUTONOMOUS EXPLORATORY MOVEMENT
 *
 * This function resolves only the physical
 * movement consequences of an already-selected
 * EXPLORE action.
 *
 * It does not:
 *
 * - evaluate the brain;
 * - select EXPLORE;
 * - inspect food;
 * - inspect perception;
 * - inspect memory;
 * - inspect hidden target coordinates;
 * - update exploration pressure;
 * - implement discovery.
 *
 * The selected action must already have come
 * from ordinary neural/action competition.
 *
 * If EXPLORE did not win:
 *
 * - no heading is sampled;
 * - no RNG is consumed;
 * - no exploratory movement occurs.
 *
 * If EXPLORE did win:
 *
 * - the existing M3 heading is reused while
 *   valid;
 * - otherwise exactly one seeded heading is
 *   sampled by the M3 exploration primitive;
 * - the existing bounded movement executor is
 *   used for the physical consequence.
 */
export function executeM3ExploratoryMovement(
  position:
    Position2D,

  explorationState:
    ExplorationState,

  selectedActionId:
    string,

  randomSource:
    RandomSource,

  simulationTimeSeconds:
    number,
): M3ExploratoryMovementResult {
  validatePosition(
    position,
  );

  validateSimulationTime(
    simulationTimeSeconds,
  );

  /*
   * A non-EXPLORE winner has no exploratory
   * motor consequence.
   *
   * Most importantly, authoritative RNG is not
   * touched merely because an exploratory
   * heading could theoretically exist.
   */
  if (
    selectedActionId !==
    "explore"
  ) {
    return {
      position,

      explorationState,

      movementSource:
        null,

      directionX:
        null,

      directionY:
        null,

      distanceMoved:
        0,

      sampledNewHeading:
        false,
    };
  }

  const previousHeading =
    explorationState.activeHeading;

  /*
   * Heading generation remains entirely inside
   * the target-independent exploration
   * primitive.
   *
   * This action resolver supplies:
   *
   * - Creature-owned exploration state;
   * - seeded RNG;
   * - explicit simulation time;
   * - prospectively locked persistence.
   *
   * No world object or target coordinate is
   * available here.
   */
  const stateWithHeading =
    ensureExploratoryHeading(
      explorationState,

      randomSource,

      simulationTimeSeconds,

      M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
    );

  const heading =
    stateWithHeading.activeHeading;

  if (
    heading === null
  ) {
    throw new Error(
      "EXPLORE movement requires an active exploratory heading.",
    );
  }

  /*
   * A reused heading remains the exact heading
   * object already present in exploration
   * state.
   *
   * A newly sampled heading is a new object.
   */
  const sampledNewHeading =
    heading !==
    previousHeading;

  const movement =
    moveAlongDirection(
      position,

      heading.directionX,

      heading.directionY,

      M3_ACQUISITION_MOVE_DISTANCE,

      M3_HABITAT_BOUNDS,
    );

  return {
    position:
      movement.position,

    explorationState:
      stateWithHeading,

    movementSource:
      M3_EXPLORATION_MOVEMENT_SOURCE,

    directionX:
      heading.directionX,

    directionY:
      heading.directionY,

    distanceMoved:
      movement.distanceMoved,

    sampledNewHeading,
  };
}

function validatePosition(
  position:
    Position2D,
): void {
  if (
    !Number.isFinite(
      position.x,
    ) ||
    !Number.isFinite(
      position.y,
    )
  ) {
    throw new RangeError(
      "M3 exploratory movement position must use finite coordinates.",
    );
  }

  if (
    position.x <
      M3_HABITAT_BOUNDS.minX ||
    position.x >
      M3_HABITAT_BOUNDS.maxX ||
    position.y <
      M3_HABITAT_BOUNDS.minY ||
    position.y >
      M3_HABITAT_BOUNDS.maxY
  ) {
    throw new RangeError(
      "M3 exploratory movement position must begin inside habitat bounds.",
    );
  }
}

function validateSimulationTime(
  simulationTimeSeconds:
    number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new RangeError(
      "M3 exploratory movement simulation time must be finite and non-negative.",
    );
  }
}