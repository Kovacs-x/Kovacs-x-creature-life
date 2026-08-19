import type {
  M3AcquisitionMovementSource,
  M3AcquisitionState,
  M3AcquisitionTickEvidence,
} from "../simulation/core/m3Acquisition.js";

import {
  deriveM3DirectFoodPerception,
} from "../simulation/core/m3Discovery.js";

export const M3_PRESENTATION_MODEL_SCHEMA_VERSION =
  1 as const;

export type M3CreatureMotionState =
  | "stationary"
  | "moving";

export type M3CreatureActivityState =
  | "idle"
  | "exploring"
  | "seeking"
  | "eating";

export type M3FoodPerceptionState =
  | "visible"
  | "occluded"
  | "out-of-range"
  | "consumed";

export interface M3PresentationVector {
  readonly x:
    number;

  readonly y:
    number;
}

export interface M3CreaturePresentation {
  /*
   * Authoritative simulation position copied
   * outward for rendering.
   *
   * The renderer may transform this into screen
   * coordinates.
   *
   * It may not maintain an independent
   * authoritative Creature position.
   */
  readonly position:
    M3PresentationVector;

  /*
   * Physical motion is derived only from
   * displacement between authoritative states.
   */
  readonly motionState:
    M3CreatureMotionState;

  readonly distanceMoved:
    number;

  /*
   * Facing comes only from genuine displacement.
   *
   * It is never inferred from:
   *
   * - food coordinates;
   * - hidden objects;
   * - perception direction;
   * - exploratory heading;
   * - remembered targets.
   */
  readonly facingDirection:
    M3PresentationVector | null;

  /*
   * Visible activity is deliberately
   * conservative.
   *
   * "exploring" means EXPLORE actually won.
   *
   * "seeking" means SEEK actually won.
   *
   * "eating" means eating physically succeeded,
   * not merely that EAT was selected.
   */
  readonly activityState:
    M3CreatureActivityState;

  /*
   * Physical movement provenance copied from
   * completed authoritative tick evidence.
   *
   * null includes:
   *
   * - IDLE;
   * - successful stationary EAT;
   * - external world-only updates;
   * - initial presentation.
   */
  readonly movementSource:
    M3AcquisitionMovementSource;

  readonly energy:
    number;

  readonly maxEnergy:
    number;

  readonly energyFraction:
    number;

  readonly hungerFraction:
    number;
}

export interface M3FoodPresentation {
  /*
   * Physical world truth is available to the
   * renderer because the food must be drawn.
   *
   * This coordinate never flows back into
   * Creature cognition from presentation.
   */
  readonly position:
    M3PresentationVector;

  readonly consumed:
    boolean;

  readonly available:
    boolean;
}

export interface M3SensoryOccluderPresentation {
  readonly active:
    boolean;

  readonly x:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;
}

export interface M3EnvironmentPresentation {
  /*
   * Current legitimate sensory relationship
   * between Creature and food.
   *
   * Presentation obtains this by invoking the
   * same pure world/sensory transformation used
   * by M3 cognition.
   *
   * It does not independently approximate sight.
   */
  readonly foodPerceptionState:
    M3FoodPerceptionState;

  readonly foodDirectlyPerceived:
    boolean;

  readonly sensoryOccluder:
    M3SensoryOccluderPresentation;
}

export interface M3PresentationModel {
  readonly schemaVersion:
    typeof M3_PRESENTATION_MODEL_SCHEMA_VERSION;

  readonly tickIndex:
    number;

  readonly simulationTimeSeconds:
    number;

  readonly creature:
    M3CreaturePresentation;

  readonly food:
    M3FoodPresentation;

  readonly environment:
    M3EnvironmentPresentation;
}

/*
 * M3 PURE PRESENTATION BOUNDARY
 *
 * authoritative M3 state
 *      ↓
 * optional completed transition evidence
 *      ↓
 * deriveM3PresentationModel(...)
 *      ↓
 * presentation-only facts
 *
 * This function cannot:
 *
 * - advance simulation;
 * - evaluate the brain;
 * - choose an action;
 * - alter exploration pressure;
 * - sample RNG;
 * - create memory;
 * - modify learning;
 * - move the Creature;
 * - move food;
 * - produce reward.
 *
 * Three presentation situations are supported.
 *
 * 1. Initial / independent state render:
 *
 * previous = null
 * evidence = null
 *
 * 2. Completed authoritative simulation tick:
 *
 * previous tick N
 * current tick N + 1
 * evidence for tick N
 *
 * 3. External world-only update:
 *
 * previous tick N
 * current tick N
 * evidence = null
 *
 * Situation 3 is required by M3.8 because the
 * player may relocate food without advancing
 * simulation time or directly changing the
 * Creature.
 */
export function deriveM3PresentationModel(
  current:
    M3AcquisitionState,

  previous:
    M3AcquisitionState | null =
      null,

  evidence:
    M3AcquisitionTickEvidence | null =
      null,
): M3PresentationModel {
  validatePresentationTransition(
    current,
    previous,
    evidence,
  );

  const displacement =
    deriveAuthoritativeDisplacement(
      current,
      previous,
    );

  const distanceMoved =
    Math.hypot(
      displacement.x,
      displacement.y,
    );

  const facingDirection =
    distanceMoved ===
      0
      ? null
      : {
          x:
            displacement.x /
            distanceMoved,

          y:
            displacement.y /
            distanceMoved,
        };

  const energyFraction =
    current.hunger.energy /
    current.hunger.maxEnergy;

  const perception =
    deriveM3DirectFoodPerception(
      current.position,
      current.food,
      current.sensoryOccluder,
    );

  const foodPerceptionState =
    deriveFoodPerceptionState(
      current,
      perception.occluded,
      perception.foodSignal !==
        null,
    );

  return {
    schemaVersion:
      M3_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      current.tickIndex,

    simulationTimeSeconds:
      current.simulationTimeSeconds,

    creature: {
      position: {
        x:
          current.position.x,

        y:
          current.position.y,
      },

      motionState:
        distanceMoved >
        0
          ? "moving"
          : "stationary",

      distanceMoved,

      facingDirection,

      activityState:
        deriveCreatureActivityState(
          evidence,
        ),

      movementSource:
        evidence
          ?.movementSource ??
        null,

      energy:
        current.hunger.energy,

      maxEnergy:
        current.hunger.maxEnergy,

      energyFraction,

      hungerFraction:
        1 -
        energyFraction,
    },

    food: {
      position: {
        x:
          current.food.position.x,

        y:
          current.food.position.y,
      },

      consumed:
        current.food.consumed,

      available:
        !current.food.consumed,
    },

    environment: {
      foodPerceptionState,

      foodDirectlyPerceived:
        perception.foodSignal !==
        null,

      sensoryOccluder: {
        active:
          current
            .sensoryOccluder
            .active,

        x:
          current
            .sensoryOccluder
            .x,

        minY:
          current
            .sensoryOccluder
            .minY,

        maxY:
          current
            .sensoryOccluder
            .maxY,
      },
    },
  };
}

function deriveCreatureActivityState(
  evidence:
    M3AcquisitionTickEvidence | null,
): M3CreatureActivityState {
  if (
    evidence ===
    null
  ) {
    return "idle";
  }

  /*
   * Eating animation/presentation is allowed
   * only after a genuine physical eating
   * consequence.
   *
   * Merely selecting EAT is not enough.
   */
  if (
    evidence.ate
  ) {
    return "eating";
  }

  switch (
    evidence.selectedActionId
  ) {
    case "explore":
      return "exploring";

    case "seek":
      return "seeking";

    case "idle":
    case "eat":
      return "idle";

    default:
      throw new Error(
        `Unknown M3 presentation action: ${evidence.selectedActionId}`,
      );
  }
}

function deriveFoodPerceptionState(
  current:
    M3AcquisitionState,

  occluded:
    boolean,

  directlyPerceived:
    boolean,
): M3FoodPerceptionState {
  if (
    current.food.consumed
  ) {
    return "consumed";
  }

  if (
    directlyPerceived
  ) {
    return "visible";
  }

  if (
    occluded
  ) {
    return "occluded";
  }

  return "out-of-range";
}

function deriveAuthoritativeDisplacement(
  current:
    M3AcquisitionState,

  previous:
    M3AcquisitionState | null,
): M3PresentationVector {
  if (
    previous ===
    null
  ) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x:
      current.position.x -
      previous.position.x,

    y:
      current.position.y -
      previous.position.y,
  };
}

function validatePresentationTransition(
  current:
    M3AcquisitionState,

  previous:
    M3AcquisitionState | null,

  evidence:
    M3AcquisitionTickEvidence | null,
): void {
  if (
    previous ===
    null
  ) {
    if (
      evidence !==
      null
    ) {
      throw new Error(
        "M3 presentation cannot attach tick evidence without a previous authoritative state.",
      );
    }

    return;
  }

  const tickDelta =
    current.tickIndex -
    previous.tickIndex;

  /*
   * Same-tick transition is an external
   * world-only update such as M3.8 food
   * placement.
   */
  if (
    tickDelta ===
    0
  ) {
    if (
      evidence !==
      null
    ) {
      throw new Error(
        "M3 same-tick presentation updates must not contain simulation-tick evidence.",
      );
    }

    if (
      current
        .simulationTimeSeconds !==
      previous
        .simulationTimeSeconds
    ) {
      throw new Error(
        "M3 same-tick presentation update cannot advance simulation time.",
      );
    }

    if (
      !samePosition(
        current.position,
        previous.position,
      )
    ) {
      throw new Error(
        "M3 external world presentation update cannot move the Creature.",
      );
    }

    return;
  }

  /*
   * Ordinary simulation presentation requires
   * exactly one authoritative tick.
   */
  if (
    tickDelta !==
    1
  ) {
    throw new Error(
      "M3 presentation motion requires either consecutive simulation states or a same-tick external world update.",
    );
  }

  if (
    evidence ===
    null
  ) {
    throw new Error(
      "M3 consecutive presentation states require completed tick evidence.",
    );
  }

  if (
    evidence.tickIndex !==
    previous.tickIndex
  ) {
    throw new Error(
      "M3 presentation tick evidence does not match the previous authoritative tick.",
    );
  }

  if (
    evidence
      .simulationTimeSeconds !==
    previous
      .simulationTimeSeconds
  ) {
    throw new Error(
      "M3 presentation tick evidence does not match previous simulation time.",
    );
  }

  if (
    !samePosition(
      evidence.positionBefore,
      previous.position,
    )
  ) {
    throw new Error(
      "M3 presentation evidence positionBefore does not match previous authoritative position.",
    );
  }

  if (
    !samePosition(
      evidence.positionAfter,
      current.position,
    )
  ) {
    throw new Error(
      "M3 presentation evidence positionAfter does not match current authoritative position.",
    );
  }

  const authoritativeDistance =
    Math.hypot(
      current.position.x -
        previous.position.x,

      current.position.y -
        previous.position.y,
    );

  if (
    !approximatelyEqual(
      evidence.distanceMoved,
      authoritativeDistance,
    )
  ) {
    throw new Error(
      "M3 presentation movement evidence does not match authoritative displacement.",
    );
  }
}

function samePosition(
  left: {
    readonly x:
      number;

    readonly y:
      number;
  },

  right: {
    readonly x:
      number;

    readonly y:
      number;
  },
): boolean {
  return (
    approximatelyEqual(
      left.x,
      right.x,
    ) &&
    approximatelyEqual(
      left.y,
      right.y,
    )
  );
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {
  return (
    Math.abs(
      left -
      right,
    ) <=
    1e-12
  );
}