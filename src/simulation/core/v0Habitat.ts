import {
  advanceM1Episode,
  type M1EpisodeState,
} from "./m1Episode.js";

import {
  createSensoryOccluder,
  isLineOfSightOccludedBySensoryOccluder,
  type SensoryOccluderState,
} from "../../world/sensoryOccluder.js";

/*
 * V0 CONTROLLED EMBODIMENT ENVIRONMENT
 *
 * The screen occupies a fixed world location.
 *
 * It becomes sensory-active after the first
 * authoritative simulation tick.
 *
 * That schedule changes the environment,
 * not the Creature.
 *
 * The first tick therefore provides
 * legitimate direct food perception from
 * which M2 memory may form.
 *
 * Later sight can then be blocked through
 * world geometry.
 */
export const V0_SENSORY_OCCLUDER_ACTIVATION_TICK =
  1;

export const V0_SENSORY_OCCLUDER_X =
  2.5;

export const V0_SENSORY_OCCLUDER_MIN_Y =
  0;

export const V0_SENSORY_OCCLUDER_MAX_Y =
  2;

export interface V0HabitatEnvironmentSnapshot {
  readonly sensoryOccluder:
    SensoryOccluderState;

  /*
   * This is the environmental sensory input
   * supplied to the existing M1/M2 episode.
   *
   * It is not a direct perception signal.
   */
  readonly foodOccluded:
    boolean;
}

/*
 * Pure authoritative environment derivation.
 *
 * Creature position
 * +
 * physical food position
 * +
 * sensory-screen geometry
 * +
 * deterministic environment schedule
 *      ↓
 * foodOccluded boolean
 *
 * Nothing here:
 *
 * - recalls memory;
 * - chooses an action;
 * - changes neural activation;
 * - commands movement.
 */
export function deriveV0HabitatEnvironment(
  state:
    M1EpisodeState,
): V0HabitatEnvironmentSnapshot {
  const sensoryOccluder =
    createSensoryOccluder(
      V0_SENSORY_OCCLUDER_X,

      V0_SENSORY_OCCLUDER_MIN_Y,

      V0_SENSORY_OCCLUDER_MAX_Y,

      state.tickIndex >=
        V0_SENSORY_OCCLUDER_ACTIVATION_TICK,
    );

  const foodOccluded =
    !state.food.consumed &&
    isLineOfSightOccludedBySensoryOccluder(
      state.position,

      state.food.position,

      sensoryOccluder,
    );

  return {
    sensoryOccluder,
    foodOccluded,
  };
}

/*
 * Synchronize the immediate environmental
 * sensory condition carried by the accepted
 * episode state.
 *
 * This alters only foodOccluded.
 *
 * It does not alter:
 *
 * - position;
 * - food position;
 * - hunger;
 * - brain;
 * - memory;
 * - eligibility;
 * - action;
 * - reward.
 */
export function synchronizeV0HabitatEnvironment(
  state:
    M1EpisodeState,
): M1EpisodeState {
  const environment =
    deriveV0HabitatEnvironment(
      state,
    );

  const currentFoodOccluded =
    state.foodOccluded ??
    false;

  if (
    currentFoodOccluded ===
    environment.foodOccluded
  ) {
    return state;
  }

  return {
    ...state,

    foodOccluded:
      environment.foodOccluded,
  };
}

/*
 * ONE V0 AUTHORITATIVE TICK
 *
 * current V0 episode state
 *      ↓
 * synchronize legitimate environment input
 *      ↓
 * exactly one accepted advanceM1Episode tick
 *      ↓
 * synchronize environment at the resulting
 * simulation time
 *      ↓
 * new V0 episode state
 *
 * This is not another simulation loop.
 *
 * It is a reusable state → one tick → state
 * transition which delegates all Creature
 * behaviour to the accepted M1/M2 mechanism.
 */
export function advanceV0Habitat(
  state:
    M1EpisodeState,
): M1EpisodeState {
  const preparedState =
    synchronizeV0HabitatEnvironment(
      state,
    );

  const advancedState =
    advanceM1Episode(
      preparedState,
    );

  return synchronizeV0HabitatEnvironment(
    advancedState,
  );
}