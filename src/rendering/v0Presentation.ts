import {
  M1_EPISODE_TICK_SECONDS,
  type M1EpisodeState,
} from "../simulation/core/m1Episode.js";

export const V0_PRESENTATION_MODEL_SCHEMA_VERSION =
  1 as const;

export type V0CreatureMotionState =
  | "stationary"
  | "moving";

export interface V0PresentationVector {
  readonly x:
    number;

  readonly y:
    number;
}

export interface V0CreaturePresentation {
  /*
   * Authoritative simulation position.
   *
   * A later renderer may transform these
   * coordinates into screen coordinates, but
   * this presentation model does not maintain
   * an independent physical position.
   */
  readonly position:
    V0PresentationVector;

  /*
   * Motion is derived only from actual
   * authoritative displacement between
   * consecutive simulation states.
   */
  readonly motionState:
    V0CreatureMotionState;

  readonly distanceMoved:
    number;

  /*
   * Unit direction of actual physical
   * displacement.
   *
   * null means there was no physical
   * displacement from which a facing
   * direction could legitimately be derived.
   *
   * Presentation must not invent facing from
   * hidden food position or remembered target
   * information.
   */
  readonly facingDirection:
    V0PresentationVector | null;

  readonly energy:
    number;

  readonly maxEnergy:
    number;

  /*
   * 0 = depleted
   * 1 = full biological energy
   */
  readonly energyFraction:
    number;

  /*
   * Presentation convenience derived from
   * genuine biological energy.
   *
   * This does not introduce another hunger
   * mechanism.
   */
  readonly hungerFraction:
    number;
}

export interface V0FoodPresentation {
  /*
   * World position is available to
   * presentation because the renderer must
   * draw the authoritative world.
   *
   * This information flows only outward.
   * Nothing in this module feeds coordinates
   * back into Creature cognition.
   */
  readonly position:
    V0PresentationVector;

  readonly consumed:
    boolean;

  readonly available:
    boolean;
}

export interface V0EnvironmentPresentation {
  /*
   * Current sensory accessibility of food
   * from the Creature's perspective.
   *
   * This remains distinct from whether the
   * physical food object exists.
   */
  readonly foodOccludedForCreature:
    boolean;
}

export interface V0PresentationModel {
  readonly schemaVersion:
    typeof V0_PRESENTATION_MODEL_SCHEMA_VERSION;

  readonly tickIndex:
    number;

  readonly simulationTimeSeconds:
    number;

  readonly creature:
    V0CreaturePresentation;

  readonly food:
    V0FoodPresentation;

  readonly environment:
    V0EnvironmentPresentation;
}

/*
 * V0.1 PURE PRESENTATION BOUNDARY
 *
 * authoritative simulation state
 *   ->
 * deriveV0PresentationModel
 *   ->
 * presentation-only data
 *
 * This function:
 *
 * - does not advance simulation;
 * - does not alter simulation state;
 * - does not evaluate cognition;
 * - does not choose an action;
 * - does not modify memory;
 * - does not move the Creature;
 * - does not inspect wall-clock time.
 *
 * The optional previous state exists only so
 * visible motion and facing can be derived
 * from actual authoritative displacement.
 */
export function deriveV0PresentationModel(
  current:
    M1EpisodeState,

  previous:
    M1EpisodeState | null =
      null,
): V0PresentationModel {
  if (
    previous !== null &&
    current.tickIndex !==
      previous.tickIndex + 1
  ) {
    throw new Error(
      "V0 presentation motion requires consecutive simulation states.",
    );
  }

  const simulationTimeSeconds =
    current.simulationTimeSeconds ??
    current.tickIndex *
      M1_EPISODE_TICK_SECONDS;

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
    distanceMoved === 0
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

  return {
    schemaVersion:
      V0_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      current.tickIndex,

    simulationTimeSeconds,

    creature: {
      position: {
        x:
          current.position.x,

        y:
          current.position.y,
      },

      motionState:
        distanceMoved > 0
          ? "moving"
          : "stationary",

      distanceMoved,

      facingDirection,

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
      foodOccludedForCreature:
        current.foodOccluded ??
        false,
    },
  };
}

function deriveAuthoritativeDisplacement(
  current:
    M1EpisodeState,

  previous:
    M1EpisodeState | null,
): V0PresentationVector {
  if (previous === null) {
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