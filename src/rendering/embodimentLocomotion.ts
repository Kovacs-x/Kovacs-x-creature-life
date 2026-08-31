import type {
  M3PresentationModel,
} from "./m3Presentation.js";

import {
  m3WorldPositionToEmbodimentScenePosition,
  type EmbodimentScenePlanarPosition,
} from "./embodimentCoordinates.js";

/*
 * EMBODIMENT LOCOMOTION INTERPOLATION
 *
 * This module smooths presentation between
 * already-authoritative Creature positions.
 *
 * It does not create additional simulation
 * movement.
 *
 * Authoritative position N
 *   ->
 * authoritative position N + 1
 *   ->
 * presentation interpolation
 *
 * The interpolation is driven by absolute
 * presentation time supplied by the renderer.
 *
 * It is not driven by:
 *
 * - frame count;
 * - simulation RNG;
 * - Creature cognition;
 * - food position;
 * - memory;
 * - exploration heading;
 * - camera state.
 */

export const EMBODIMENT_LOCOMOTION_DURATION_SECONDS =
  0.5;

export interface EmbodimentLocomotionState {
  /*
   * Presentation start and end positions for the
   * currently active visual transition.
   *
   * Neither is authoritative simulation state.
   */
  readonly from:
    EmbodimentScenePlanarPosition;

  readonly to:
    EmbodimentScenePlanarPosition;

  readonly transitionStartPresentationTimeSeconds:
    number;

  readonly transitionDurationSeconds:
    number;

  /*
   * These values exist only to detect a
   * presentation run reset.
   */
  readonly lastTickIndex:
    number;

  readonly lastSimulationTimeSeconds:
    number;
}

export interface EmbodimentLocomotionSample {
  readonly position:
    EmbodimentScenePlanarPosition;

  /*
   * 0 = beginning of the visual transition.
   * 1 = authoritative destination displayed.
   */
  readonly progress:
    number;

  readonly transitioning:
    boolean;
}

/*
 * Initial presentation snaps exactly to the
 * authoritative Creature position.
 *
 * There is no invented movement from an
 * arbitrary scene origin.
 */
export function createEmbodimentLocomotionState(
  model:
    M3PresentationModel,

  presentationTimeSeconds:
    number,
): EmbodimentLocomotionState {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  const position =
    deriveAuthoritativeScenePosition(
      model,
    );

  return {
    from:
      position,

    to:
      position,

    transitionStartPresentationTimeSeconds:
      presentationTimeSeconds,

    transitionDurationSeconds:
      0,

    lastTickIndex:
      model.tickIndex,

    lastSimulationTimeSeconds:
      model.simulationTimeSeconds,
  };
}

/*
 * Accept a newly derived authoritative
 * presentation model.
 *
 * This function never modifies the model.
 *
 * If the authoritative Creature destination has
 * not changed, an existing visual transition is
 * preserved instead of restarting.
 *
 * This is important for same-tick external world
 * updates such as player food placement.
 */
export function advanceEmbodimentLocomotionState(
  current:
    EmbodimentLocomotionState,

  model:
    M3PresentationModel,

  presentationTimeSeconds:
    number,
): EmbodimentLocomotionState {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  if (
    presentationTimeSeconds <
    current
      .transitionStartPresentationTimeSeconds
  ) {
    throw new RangeError(
      "Embodiment presentation time must not move backwards.",
    );
  }

  const authoritativeTarget =
    deriveAuthoritativeScenePosition(
      model,
    );

  const presentationReset =
    model.tickIndex <
      current.lastTickIndex ||
    model.simulationTimeSeconds <
      current.lastSimulationTimeSeconds;

  if (
    presentationReset
  ) {
    /*
     * A new/reset run must not visually travel
     * from the previous Creature's last position
     * into the reset position.
     */
    return {
      from:
        authoritativeTarget,

      to:
        authoritativeTarget,

      transitionStartPresentationTimeSeconds:
        presentationTimeSeconds,

      transitionDurationSeconds:
        0,

      lastTickIndex:
        model.tickIndex,

      lastSimulationTimeSeconds:
        model.simulationTimeSeconds,
    };
  }

  /*
   * Re-rendering the same authoritative Creature
   * position must not restart interpolation.
   *
   * A food placement can legitimately produce
   * another presentation model on the same tick
   * while the Creature remains unchanged.
   */
  if (
    samePlanarPosition(
      authoritativeTarget,
      current.to,
    )
  ) {
    return {
      ...current,

      lastTickIndex:
        model.tickIndex,

      lastSimulationTimeSeconds:
        model.simulationTimeSeconds,
    };
  }

  /*
   * A changed Creature destination is allowed to
   * animate only when the presentation contract
   * says genuine physical movement occurred.
   *
   * If an inconsistent caller supplies a changed
   * position while claiming the Creature was
   * stationary, presentation snaps rather than
   * manufacturing locomotion.
   */
  if (
    model.creature.motionState !==
      "moving" ||
    model.creature.distanceMoved <=
      0
  ) {
    return {
      from:
        authoritativeTarget,

      to:
        authoritativeTarget,

      transitionStartPresentationTimeSeconds:
        presentationTimeSeconds,

      transitionDurationSeconds:
        0,

      lastTickIndex:
        model.tickIndex,

      lastSimulationTimeSeconds:
        model.simulationTimeSeconds,
    };
  }

  /*
   * Begin from the Creature's currently displayed
   * visual position, not necessarily the previous
   * target.
   *
   * This keeps rapid successive presentation
   * updates visually continuous without creating
   * another authoritative position.
   */
  const currentlyDisplayed =
    sampleEmbodimentLocomotion(
      current,
      presentationTimeSeconds,
    ).position;

  return {
    from:
      currentlyDisplayed,

    to:
      authoritativeTarget,

    transitionStartPresentationTimeSeconds:
      presentationTimeSeconds,

    transitionDurationSeconds:
      EMBODIMENT_LOCOMOTION_DURATION_SECONDS,

    lastTickIndex:
      model.tickIndex,

    lastSimulationTimeSeconds:
      model.simulationTimeSeconds,
  };
}

/*
 * Sample visual position at an absolute
 * presentation time.
 *
 * Sampling is side-effect free.
 *
 * Calling this function 30 times or 120 times
 * before the same timestamp produces exactly the
 * same result at that timestamp.
 */
export function sampleEmbodimentLocomotion(
  state:
    EmbodimentLocomotionState,

  presentationTimeSeconds:
    number,
): EmbodimentLocomotionSample {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  const duration =
    state.transitionDurationSeconds;

  if (
    duration <=
    0
  ) {
    return {
      position: {
        x:
          state.to.x,

        z:
          state.to.z,
      },

      progress:
        1,

      transitioning:
        false,
    };
  }

  const elapsed =
    presentationTimeSeconds -
    state
      .transitionStartPresentationTimeSeconds;

  const progress =
    clamp(
      elapsed /
      duration,
      0,
      1,
    );

  return {
    position: {
      x:
        lerp(
          state.from.x,
          state.to.x,
          progress,
        ),

      z:
        lerp(
          state.from.z,
          state.to.z,
          progress,
        ),
    },

    progress,

    transitioning:
      progress <
        1 &&
      !samePlanarPosition(
        state.from,
        state.to,
      ),
  };
}

function deriveAuthoritativeScenePosition(
  model:
    M3PresentationModel,
): EmbodimentScenePlanarPosition {
  const scenePosition =
    m3WorldPositionToEmbodimentScenePosition(
      model.creature.position,
    );

  return {
    x:
      scenePosition.x,

    z:
      scenePosition.z,
  };
}

function samePlanarPosition(
  left:
    EmbodimentScenePlanarPosition,

  right:
    EmbodimentScenePlanarPosition,
): boolean {
  return (
    left.x ===
      right.x &&
    left.z ===
      right.z
  );
}

function lerp(
  from:
    number,

  to:
    number,

  progress:
    number,
): number {
  return (
    from +
    (
      to -
      from
    ) *
    progress
  );
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function assertPresentationTime(
  value:
    number,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      "Embodiment presentation time must be finite and non-negative.",
    );
  }
}