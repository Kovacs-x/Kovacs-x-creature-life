import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmbodimentScene,
} from "../../src/rendering/embodimentScene.js";

import {
  deriveM3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  M3_ACQUISITION_MAX_TICKS_PER_ROUND,
  M3_ACQUISITION_TICK_SECONDS,
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

/*
 * E3 PRESENTATION-INVARIANCE CONTROL
 *
 * This test deliberately runs the real accepted
 * M3 authoritative transition.
 *
 * We compare:
 *
 * authoritative execution with no presentation
 *
 * against:
 *
 * authoritative execution
 * + 30 Hz presentation sampling
 *
 * against:
 *
 * authoritative execution
 * + 120 Hz presentation sampling.
 *
 * Rendering activity is allowed to change only
 * Three.js presentation transforms.
 *
 * It must not change:
 *
 * - authoritative Creature position;
 * - biology;
 * - food/world state;
 * - memory;
 * - exploration state;
 * - learned brain state;
 * - eligibility;
 * - RNG;
 * - reward;
 * - completed tick evidence.
 */

interface PresentationSnapshot {
  readonly creaturePosition: {
    readonly x:
      number;

    readonly y:
      number;

    readonly z:
      number;
  };

  readonly creatureRotation: {
    readonly x:
      number;

    readonly y:
      number;

    readonly z:
      number;
  };

  readonly creatureBodyScale: {
    readonly x:
      number;

    readonly y:
      number;

    readonly z:
      number;
  };

  readonly leftEyeScaleY:
    number;

  readonly rightEyeScaleY:
    number;
}

interface InvarianceRunResult {
  readonly finalState:
    M3AcquisitionState;

  readonly evidences:
    readonly M3AcquisitionTickEvidence[];

  readonly frameSampleCount:
    number;

  readonly presentationSnapshot:
    PresentationSnapshot | null;
}

function createAuthoritativeInitialState():
  M3AcquisitionState {
  /*
   * Use the prospectively locked primary M3
   * acquisition branch.
   *
   * No embodiment-specific behavioural tuning
   * is introduced here.
   */
  return createM3AcquisitionState(
    {
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        true,
    },
  );
}

function runAuthoritativeScenario(
  presentationFrameRateHz:
    number | null,
): InvarianceRunResult {
  let state =
    createAuthoritativeInitialState();

  const evidences:
    M3AcquisitionTickEvidence[] =
      [];

  const scene =
    presentationFrameRateHz ===
      null
      ? null
      : createEmbodimentScene(
          1,
        );

  let frameSampleCount =
    0;

  if (
    scene !==
    null
  ) {
    /*
     * Initial presentation observes state only.
     *
     * It cannot advance the simulation.
     */
    scene.updatePresentation(
      deriveM3PresentationModel(
        state,
      ),

      state.simulationTimeSeconds,
    );
  }

  for (
    let tick = 0;
    tick <
      M3_ACQUISITION_MAX_TICKS_PER_ROUND &&
    !state.complete;
    tick += 1
  ) {
    const previous =
      state;

    /*
     * Sole authoritative transition.
     */
    const result =
      advanceM3AcquisitionTick(
        previous,
      );

    state =
      result.state;

    evidences.push(
      result.evidence,
    );

    if (
      scene ===
        null ||
      presentationFrameRateHz ===
        null
    ) {
      continue;
    }

    const presentationTimeSeconds =
      state.simulationTimeSeconds;

    /*
     * Presentation receives only the pure model
     * derived from already-completed
     * authoritative state/evidence.
     */
    scene.updatePresentation(
      deriveM3PresentationModel(
        state,
        previous,
        result.evidence,
      ),

      presentationTimeSeconds,
    );

    /*
     * Simulate visual frame activity occurring
     * between this authoritative presentation
     * update and the next fixed simulation tick.
     *
     * The frame count changes dramatically
     * between the 30 Hz and 120 Hz controls.
     *
     * None of these calls may create an
     * authoritative transition or consume
     * authoritative RNG.
     */
    for (
      let frame = 1;
      frame <=
        presentationFrameRateHz;
      frame += 1
    ) {
      const frameOffsetSeconds =
        (
          frame /
          presentationFrameRateHz
        ) *
        M3_ACQUISITION_TICK_SECONDS;

      scene.updateFrame(
        presentationTimeSeconds +
        frameOffsetSeconds,
      );

      frameSampleCount +=
        1;
    }
  }

  const presentationSnapshot =
    scene ===
      null
      ? null
      : {
          creaturePosition: {
            x:
              scene
                .actors
                .creatureRoot
                .position
                .x,

            y:
              scene
                .actors
                .creatureRoot
                .position
                .y,

            z:
              scene
                .actors
                .creatureRoot
                .position
                .z,
          },

          creatureRotation: {
            x:
              scene
                .actors
                .creatureRoot
                .rotation
                .x,

            y:
              scene
                .actors
                .creatureRoot
                .rotation
                .y,

            z:
              scene
                .actors
                .creatureRoot
                .rotation
                .z,
          },

          creatureBodyScale: {
            x:
              scene
                .actors
                .creatureBody
                .scale
                .x,

            y:
              scene
                .actors
                .creatureBody
                .scale
                .y,

            z:
              scene
                .actors
                .creatureBody
                .scale
                .z,
          },

          leftEyeScaleY:
            scene
              .actors
              .leftEye
              .scale
              .y,

          rightEyeScaleY:
            scene
              .actors
              .rightEye
              .scale
              .y,
        };

  scene?.dispose();

  return {
    finalState:
      state,

    evidences,

    frameSampleCount,

    presentationSnapshot,
  };
}

describe(
  "embodiment presentation invariance",
  () => {
    it(
      "preserves the exact authoritative M3 execution with no presentation, 30 Hz presentation, and 120 Hz presentation",
      () => {
        const headless =
          runAuthoritativeScenario(
            null,
          );

        const thirtyHz =
          runAuthoritativeScenario(
            30,
          );

        const oneTwentyHz =
          runAuthoritativeScenario(
            120,
          );

        /*
         * Locked Branch A must actually exercise
         * autonomous exploration/RNG.
         *
         * Otherwise equal RNG state would be weak
         * evidence because no stochastic
         * simulation mechanism had run.
         */
        expect(
          headless.evidences.some(
            (
              evidence,
            ) =>
              evidence
                .sampledNewHeading,
          ),
        ).toBe(
          true,
        );

        expect(
          headless.evidences.some(
            (
              evidence,
            ) =>
              evidence
                .movementSource ===
              "exploration",
          ),
        ).toBe(
          true,
        );

        /*
         * Presentation activity genuinely differs.
         */
        expect(
          headless.frameSampleCount,
        ).toBe(
          0,
        );

        expect(
          thirtyHz.frameSampleCount,
        ).toBeGreaterThan(
          0,
        );

        expect(
          oneTwentyHz.frameSampleCount,
        ).toBe(
          thirtyHz.frameSampleCount *
          4,
        );

        /*
         * Strongest invariant:
         *
         * every authoritative state field remains
         * exactly equal.
         *
         * This includes:
         *
         * - tick/time;
         * - position;
         * - hunger;
         * - food;
         * - memory;
         * - exploration;
         * - brain;
         * - eligibility;
         * - RNG;
         * - learning;
         * - reward;
         * - completion state.
         */
        expect(
          thirtyHz.finalState,
        ).toEqual(
          headless.finalState,
        );

        expect(
          oneTwentyHz.finalState,
        ).toEqual(
          headless.finalState,
        );

        /*
         * Completed causal evidence must also be
         * byte-for-byte structurally equivalent.
         *
         * Renderer activity cannot change what
         * the simulation says happened.
         */
        expect(
          thirtyHz.evidences,
        ).toEqual(
          headless.evidences,
        );

        expect(
          oneTwentyHz.evidences,
        ).toEqual(
          headless.evidences,
        );
      },
    );

    it(
      "preserves authoritative RNG, learning, exploration and eligibility state despite dense presentation sampling",
      () => {
        const headless =
          runAuthoritativeScenario(
            null,
          );

        const heavilyRendered =
          runAuthoritativeScenario(
            120,
          );

        expect(
          heavilyRendered
            .finalState
            .rngState,
        ).toEqual(
          headless
            .finalState
            .rngState,
        );

        expect(
          heavilyRendered
            .finalState
            .brain,
        ).toEqual(
          headless
            .finalState
            .brain,
        );

        expect(
          heavilyRendered
            .finalState
            .eligibilityTrace,
        ).toEqual(
          headless
            .finalState
            .eligibilityTrace,
        );

        expect(
          heavilyRendered
            .finalState
            .explorationState,
        ).toEqual(
          headless
            .finalState
            .explorationState,
        );

        expect(
          heavilyRendered
            .finalState
            .weightChanges,
        ).toEqual(
          headless
            .finalState
            .weightChanges,
        );

        expect(
          heavilyRendered
            .finalState
            .cumulativeReward,
        ).toBe(
          headless
            .finalState
            .cumulativeReward,
        );
      },
    );

    it(
      "produces the same final presentation transforms at the same authoritative endpoint under 30 Hz and 120 Hz sampling",
      () => {
        const thirtyHz =
          runAuthoritativeScenario(
            30,
          );

        const oneTwentyHz =
          runAuthoritativeScenario(
            120,
          );

        expect(
          thirtyHz
            .presentationSnapshot,
        ).not.toBeNull();

        expect(
          oneTwentyHz
            .presentationSnapshot,
        ).not.toBeNull();

        expect(
          oneTwentyHz
            .presentationSnapshot,
        ).toEqual(
          thirtyHz
            .presentationSnapshot,
        );

        /*
         * After the final full presentation
         * interval, locomotion interpolation has
         * reached the genuine authoritative
         * planar endpoint.
         */
        expect(
          thirtyHz
            .presentationSnapshot
            ?.creaturePosition
            .x,
        ).toBeCloseTo(
          thirtyHz
            .finalState
            .position
            .x,
        );

        expect(
          thirtyHz
            .presentationSnapshot
            ?.creaturePosition
            .z,
        ).toBeCloseTo(
          thirtyHz
            .finalState
            .position
            .y,
        );
      },
    );
  },
);