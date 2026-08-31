import type {
  M3PresentationModel,
} from "./m3Presentation.js";

/*
 * EMBODIMENT PRESENTATION ANIMATION
 *
 * Lightweight visual life is derived only from:
 *
 * - already-derived M3 presentation facts;
 * - absolute browser presentation time;
 * - whether visual locomotion interpolation is
 *   currently in progress.
 *
 * This module cannot:
 *
 * - advance simulation;
 * - choose actions;
 * - alter cognition;
 * - alter memory;
 * - alter learning;
 * - alter hunger;
 * - alter exploration;
 * - consume simulation RNG;
 * - invent successful eating.
 *
 * Breathing, blinking and gait are deterministic
 * functions of absolute presentation time.
 *
 * They do not have independent simulation state.
 *
 * In particular:
 *
 * model.creature.activityState === "eating"
 *
 * is already guaranteed by the M3 presentation
 * boundary to mean genuine physical eating
 * succeeded.
 */

export const EMBODIMENT_BREATHING_PERIOD_SECONDS =
  3.2;

export const EMBODIMENT_BREATHING_Y_AMPLITUDE =
  0.025;

export const EMBODIMENT_BREATHING_XZ_AMPLITUDE =
  0.008;

export const EMBODIMENT_BLINK_PERIOD_SECONDS =
  4.8;

export const EMBODIMENT_BLINK_DURATION_SECONDS =
  0.18;

/*
 * Avoid blinking immediately when the page
 * mounts.
 *
 * This is a fixed presentation offset, not
 * randomness.
 */
export const EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS =
  2.4;

/*
 * Eyes never become mathematically flat.
 *
 * A small positive scale avoids degenerate
 * geometry while still reading visually as a
 * closed blink.
 */
export const EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y =
  0.08;

export const EMBODIMENT_GAIT_PERIOD_SECONDS =
  0.34;

export const EMBODIMENT_GAIT_BOB_AMPLITUDE =
  0.065;

export const EMBODIMENT_EATING_DURATION_SECONDS =
  0.65;

export const EMBODIMENT_EATING_COMPRESSION =
  0.12;

export const EMBODIMENT_EATING_DIP_RADIANS =
  0.22;

/*
 * Numerical tolerance only.
 *
 * Browser presentation times and decimal
 * durations are IEEE-754 floating-point values.
 * Expressions such as:
 *
 * start + duration
 *
 * may therefore subtract back to a value
 * infinitesimally below duration.
 *
 * This tolerance prevents that representation
 * error from extending a presentation animation
 * past its defined endpoint.
 *
 * It has no simulation or behavioural meaning.
 */
const EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS =
  1e-9;

export interface EmbodimentAnimationState {
  /*
   * Used only to detect a new/reset presentation
   * run.
   */
  readonly lastTickIndex:
    number;

  readonly lastSimulationTimeSeconds:
    number;

  /*
   * Browser presentation time is not simulation
   * time.
   *
   * It is retained only so presentation sampling
   * cannot accidentally run backwards.
   */
  readonly lastPresentationTimeSeconds:
    number;

  /*
   * Identifies the most recent genuine eating
   * presentation event.
   *
   * A repeated render of the same authoritative
   * tick must not restart the animation.
   */
  readonly eatingEventTickIndex:
    number | null;

  readonly eatingEventSimulationTimeSeconds:
    number | null;

  readonly eatingStartPresentationTimeSeconds:
    number | null;
}

export interface EmbodimentAnimationSample {
  /*
   * Multipliers around the authored primitive
   * Creature body scale.
   */
  readonly breathingScaleYMultiplier:
    number;

  readonly breathingScaleXZMultiplier:
    number;

  /*
   * Deterministic presentation-only eye scale.
   *
   * 1 = fully open.
   *
   * EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y =
   * visually closed.
   */
  readonly blinkEyeScaleYMultiplier:
    number;

  /*
   * Presentation-only vertical bob.
   *
   * This never becomes an authoritative scene
   * Y coordinate in simulation.
   */
  readonly locomotionBobY:
    number;

  /*
   * Genuine-success eating reaction.
   *
   * These return neutral values whenever no
   * genuine eating animation is active.
   */
  readonly eatingActive:
    boolean;

  readonly eatingProgress:
    number | null;

  readonly eatingCompressionYMultiplier:
    number;

  readonly eatingForwardDipRadians:
    number;
}

export function createEmbodimentAnimationState(
  model:
    M3PresentationModel,

  presentationTimeSeconds:
    number,
): EmbodimentAnimationState {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  const eating =
    model.creature.activityState ===
    "eating";

  return {
    lastTickIndex:
      model.tickIndex,

    lastSimulationTimeSeconds:
      model.simulationTimeSeconds,

    lastPresentationTimeSeconds:
      presentationTimeSeconds,

    eatingEventTickIndex:
      eating
        ? model.tickIndex
        : null,

    eatingEventSimulationTimeSeconds:
      eating
        ? model.simulationTimeSeconds
        : null,

    eatingStartPresentationTimeSeconds:
      eating
        ? presentationTimeSeconds
        : null,
  };
}

export function advanceEmbodimentAnimationState(
  current:
    EmbodimentAnimationState,

  model:
    M3PresentationModel,

  presentationTimeSeconds:
    number,
): EmbodimentAnimationState {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  if (
    presentationTimeSeconds +
      EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS <
    current.lastPresentationTimeSeconds
  ) {
    throw new RangeError(
      "Embodiment animation presentation time must not move backwards.",
    );
  }

  const presentationReset =
    model.tickIndex <
      current.lastTickIndex ||
    model.simulationTimeSeconds <
      current.lastSimulationTimeSeconds;

  if (
    presentationReset
  ) {
    /*
     * Presentation animation does not persist
     * between authoritative runs.
     *
     * This prevents a newly reset Creature from
     * inheriting an eating event from the
     * previous run.
     *
     * Periodic breathing/blinking/gait remain
     * deterministic browser-time presentation
     * functions and carry no Creature state.
     */
    return createEmbodimentAnimationState(
      model,
      presentationTimeSeconds,
    );
  }

  const genuineEatingPresentation =
    model.creature.activityState ===
    "eating";

  const sameEatingEvent =
    genuineEatingPresentation &&
    current.eatingEventTickIndex ===
      model.tickIndex &&
    current
      .eatingEventSimulationTimeSeconds ===
      model.simulationTimeSeconds;

  if (
    genuineEatingPresentation &&
    !sameEatingEvent
  ) {
    return {
      lastTickIndex:
        model.tickIndex,

      lastSimulationTimeSeconds:
        model.simulationTimeSeconds,

      lastPresentationTimeSeconds:
        presentationTimeSeconds,

      eatingEventTickIndex:
        model.tickIndex,

      eatingEventSimulationTimeSeconds:
        model.simulationTimeSeconds,

      eatingStartPresentationTimeSeconds:
        presentationTimeSeconds,
    };
  }

  /*
   * Do not clear an already-triggered eating
   * reaction merely because another same-tick
   * presentation update is factual "idle".
   *
   * For example, a player-world update may occur
   * immediately after genuine eating.
   *
   * The visual reaction is allowed to finish on
   * presentation time once legitimately started.
   */
  return {
    ...current,

    lastTickIndex:
      model.tickIndex,

    lastSimulationTimeSeconds:
      model.simulationTimeSeconds,

    lastPresentationTimeSeconds:
      presentationTimeSeconds,
  };
}

export function sampleEmbodimentAnimation(
  state:
    EmbodimentAnimationState,

  presentationTimeSeconds:
    number,

  locomotionTransitioning:
    boolean,
): EmbodimentAnimationSample {
  assertPresentationTime(
    presentationTimeSeconds,
  );

  if (
    presentationTimeSeconds +
      EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS <
    state.lastPresentationTimeSeconds
  ) {
    throw new RangeError(
      "Embodiment animation sampling cannot precede the latest presentation update.",
    );
  }

  const breathingPhase =
    normalizedCyclePhase(
      presentationTimeSeconds,
      EMBODIMENT_BREATHING_PERIOD_SECONDS,
    );

  const breathingWave =
    Math.sin(
      breathingPhase *
      Math.PI *
      2,
    );

  const breathingScaleYMultiplier =
    1 +
    breathingWave *
    EMBODIMENT_BREATHING_Y_AMPLITUDE;

  const breathingScaleXZMultiplier =
    1 -
    breathingWave *
    EMBODIMENT_BREATHING_XZ_AMPLITUDE;

  const blinkEyeScaleYMultiplier =
    deriveBlinkEyeScaleYMultiplier(
      presentationTimeSeconds,
    );

  const locomotionBobY =
    locomotionTransitioning
      ? deriveLocomotionBob(
          presentationTimeSeconds,
        )
      : 0;

  const eating =
    deriveEatingSample(
      state,
      presentationTimeSeconds,
    );

  return {
    breathingScaleYMultiplier,

    breathingScaleXZMultiplier,

    blinkEyeScaleYMultiplier,

    locomotionBobY,

    eatingActive:
      eating.active,

    eatingProgress:
      eating.progress,

    eatingCompressionYMultiplier:
      eating.compressionYMultiplier,

    eatingForwardDipRadians:
      eating.forwardDipRadians,
  };
}

interface EatingSample {
  readonly active:
    boolean;

  readonly progress:
    number | null;

  readonly compressionYMultiplier:
    number;

  readonly forwardDipRadians:
    number;
}

function deriveBlinkEyeScaleYMultiplier(
  presentationTimeSeconds:
    number,
): number {
  /*
   * The first blink begins only after a fixed
   * presentation delay.
   *
   * There is no RNG and no Creature-side blink
   * state.
   */
  if (
    presentationTimeSeconds <
    EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS
  ) {
    return 1;
  }

  const cycleTime =
    (
      presentationTimeSeconds -
      EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS
    ) %
    EMBODIMENT_BLINK_PERIOD_SECONDS;

  /*
   * Outside the short blink window, eyes remain
   * fully open.
   *
   * Numerical tolerance keeps the exact start
   * and end of the blink neutral.
   */
  if (
    cycleTime <=
      EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS ||
    cycleTime +
      EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS >=
      EMBODIMENT_BLINK_DURATION_SECONDS
  ) {
    return 1;
  }

  const blinkProgress =
    clamp(
      cycleTime /
      EMBODIMENT_BLINK_DURATION_SECONDS,
      0,
      1,
    );

  /*
   * One symmetric eyelid-like pulse:
   *
   * open
   *   ->
   * closed
   *   ->
   * open
   *
   * The eyes are never given authority over
   * sensing; this is visual geometry only.
   */
  const closure =
    Math.sin(
      blinkProgress *
      Math.PI,
    );

  return (
    1 -
    closure *
    (
      1 -
      EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y
    )
  );
}

function deriveEatingSample(
  state:
    EmbodimentAnimationState,

  presentationTimeSeconds:
    number,
): EatingSample {
  const start =
    state
      .eatingStartPresentationTimeSeconds;

  if (
    start ===
    null
  ) {
    return createNeutralEatingSample();
  }

  const elapsed =
    presentationTimeSeconds -
    start;

  /*
   * Treat values within numerical floating-point
   * tolerance of the defined endpoint as
   * complete.
   *
   * This avoids an extra active sample caused
   * solely by IEEE-754 representation error.
   */
  if (
    elapsed <
      -EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS ||
    elapsed +
      EMBODIMENT_PRESENTATION_TIME_EPSILON_SECONDS >=
      EMBODIMENT_EATING_DURATION_SECONDS
  ) {
    return createNeutralEatingSample();
  }

  const progress =
    clamp(
      elapsed /
      EMBODIMENT_EATING_DURATION_SECONDS,
      0,
      1,
    );

  /*
   * One smooth visual dip:
   *
   * neutral
   *   ->
   * maximum compression/dip
   *   ->
   * neutral
   *
   * There is no animation FSM and no artificial
   * simulation event.
   */
  const pulse =
    Math.sin(
      progress *
      Math.PI,
    );

  return {
    active:
      true,

    progress,

    compressionYMultiplier:
      1 -
      pulse *
      EMBODIMENT_EATING_COMPRESSION,

    forwardDipRadians:
      -pulse *
      EMBODIMENT_EATING_DIP_RADIANS,
  };
}

function createNeutralEatingSample():
  EatingSample {
  return {
    active:
      false,

    progress:
      null,

    compressionYMultiplier:
      1,

    forwardDipRadians:
      0,
  };
}

function deriveLocomotionBob(
  presentationTimeSeconds:
    number,
): number {
  const gaitPhase =
    normalizedCyclePhase(
      presentationTimeSeconds,
      EMBODIMENT_GAIT_PERIOD_SECONDS,
    );

  /*
   * abs(sin(...)) keeps the Creature on or above
   * its neutral presentation height.
   *
   * No vertical motion is introduced into the
   * authoritative simulation.
   */
  return (
    Math.abs(
      Math.sin(
        gaitPhase *
        Math.PI *
        2,
      ),
    ) *
    EMBODIMENT_GAIT_BOB_AMPLITUDE
  );
}

function normalizedCyclePhase(
  presentationTimeSeconds:
    number,

  periodSeconds:
    number,
): number {
  return (
    presentationTimeSeconds %
    periodSeconds
  ) /
  periodSeconds;
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
      "Embodiment animation presentation time must be finite and non-negative.",
    );
  }
}