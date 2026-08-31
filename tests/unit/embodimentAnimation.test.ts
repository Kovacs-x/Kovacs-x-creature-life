import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_BLINK_DURATION_SECONDS,
  EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS,
  EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
  EMBODIMENT_BLINK_PERIOD_SECONDS,
  EMBODIMENT_BREATHING_XZ_AMPLITUDE,
  EMBODIMENT_BREATHING_Y_AMPLITUDE,
  EMBODIMENT_EATING_COMPRESSION,
  EMBODIMENT_EATING_DIP_RADIANS,
  EMBODIMENT_EATING_DURATION_SECONDS,
  EMBODIMENT_GAIT_BOB_AMPLITUDE,
  advanceEmbodimentAnimationState,
  createEmbodimentAnimationState,
  sampleEmbodimentAnimation,
} from "../../src/rendering/embodimentAnimation.js";

import {
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3CreatureActivityState,
  type M3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

interface ModelOptions {
  readonly tickIndex?:
    number;

  readonly simulationTimeSeconds?:
    number;

  readonly activityState?:
    M3CreatureActivityState;

  readonly moving?:
    boolean;
}

function createModel(
  options:
    ModelOptions = {},
): M3PresentationModel {
  const moving =
    options.moving ??
    false;

  const activityState =
    options.activityState ??
    (
      moving
        ? "exploring"
        : "idle"
    );

  return {
    schemaVersion:
      M3_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      options.tickIndex ??
      0,

    simulationTimeSeconds:
      options.simulationTimeSeconds ??
      0,

    creature: {
      position: {
        x: 2,
        y: 3,
      },

      motionState:
        moving
          ? "moving"
          : "stationary",

      distanceMoved:
        moving
          ? 1
          : 0,

      facingDirection:
        moving
          ? {
              x: 1,
              y: 0,
            }
          : null,

      activityState,

      movementSource:
        moving
          ? "exploration"
          : null,

      energy:
        80,

      maxEnergy:
        100,

      energyFraction:
        0.8,

      hungerFraction:
        0.2,
    },

    food: {
      position: {
        x: 8,
        y: 7,
      },

      consumed:
        false,

      available:
        true,
    },

    environment: {
      foodPerceptionState:
        "occluded",

      foodDirectlyPerceived:
        false,

      foodMemoryState:
        "none",

      foodMemoryConfidence:
        null,

      foodMemoryAgeSeconds:
        null,

      sensoryOccluder: {
        active:
          true,

        x: 5,

        minY: 2,

        maxY: 8,
      },
    },
  };
}

describe(
  "embodiment presentation animation",
  () => {
    it(
      "starts in neutral non-eating open-eyed state for ordinary idle presentation",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const sample =
          sampleEmbodimentAnimation(
            state,
            0,
            false,
          );

        expect(
          sample.eatingActive,
        ).toBe(
          false,
        );

        expect(
          sample.eatingProgress,
        ).toBeNull();

        expect(
          sample
            .eatingCompressionYMultiplier,
        ).toBe(
          1,
        );

        expect(
          sample
            .eatingForwardDipRadians,
        ).toBe(
          0,
        );

        expect(
          sample.locomotionBobY,
        ).toBe(
          0,
        );

        expect(
          sample
            .blinkEyeScaleYMultiplier,
        ).toBe(
          1,
        );
      },
    );

    it(
      "provides bounded deterministic breathing from presentation time alone",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const sample =
          sampleEmbodimentAnimation(
            state,
            0.8,
            false,
          );

        expect(
          sample
            .breathingScaleYMultiplier,
        ).toBeGreaterThanOrEqual(
          1 -
          EMBODIMENT_BREATHING_Y_AMPLITUDE,
        );

        expect(
          sample
            .breathingScaleYMultiplier,
        ).toBeLessThanOrEqual(
          1 +
          EMBODIMENT_BREATHING_Y_AMPLITUDE,
        );

        expect(
          sample
            .breathingScaleXZMultiplier,
        ).toBeGreaterThanOrEqual(
          1 -
          EMBODIMENT_BREATHING_XZ_AMPLITUDE,
        );

        expect(
          sample
            .breathingScaleXZMultiplier,
        ).toBeLessThanOrEqual(
          1 +
          EMBODIMENT_BREATHING_XZ_AMPLITUDE,
        );

        const repeated =
          sampleEmbodimentAnimation(
            state,
            0.8,
            false,
          );

        expect(
          repeated,
        ).toEqual(
          sample,
        );
      },
    );

    it(
      "keeps the eyes open before the deterministic first-blink delay",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const sample =
          sampleEmbodimentAnimation(
            state,
            EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS /
              2,
            false,
          );

        expect(
          sample
            .blinkEyeScaleYMultiplier,
        ).toBe(
          1,
        );
      },
    );

    it(
      "closes and reopens the eyes during the deterministic blink window",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const blinkStart =
          sampleEmbodimentAnimation(
            state,
            EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS,
            false,
          );

        const blinkMidpoint =
          sampleEmbodimentAnimation(
            state,
            EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
            EMBODIMENT_BLINK_DURATION_SECONDS /
              2,
            false,
          );

        const blinkEnd =
          sampleEmbodimentAnimation(
            state,
            EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
            EMBODIMENT_BLINK_DURATION_SECONDS,
            false,
          );

        expect(
          blinkStart
            .blinkEyeScaleYMultiplier,
        ).toBe(
          1,
        );

        expect(
          blinkMidpoint
            .blinkEyeScaleYMultiplier,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );

        expect(
          blinkEnd
            .blinkEyeScaleYMultiplier,
        ).toBe(
          1,
        );
      },
    );

    it(
      "repeats blinking from absolute presentation time without RNG or accumulated frame state",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const firstBlinkMidpoint =
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2;

        const secondBlinkMidpoint =
          firstBlinkMidpoint +
          EMBODIMENT_BLINK_PERIOD_SECONDS;

        const first =
          sampleEmbodimentAnimation(
            state,
            firstBlinkMidpoint,
            false,
          );

        const second =
          sampleEmbodimentAnimation(
            state,
            secondBlinkMidpoint,
            false,
          );

        expect(
          second
            .blinkEyeScaleYMultiplier,
        ).toBeCloseTo(
          first
            .blinkEyeScaleYMultiplier,
        );

        expect(
          second
            .blinkEyeScaleYMultiplier,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );
      },
    );

    it(
      "keeps deterministic blink eye scale within its presentation bounds",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        for (
          let step = 0;
          step <= 200;
          step += 1
        ) {
          const sample =
            sampleEmbodimentAnimation(
              state,
              step /
                20,
              false,
            );

          expect(
            sample
              .blinkEyeScaleYMultiplier,
          ).toBeGreaterThanOrEqual(
            EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
          );

          expect(
            sample
              .blinkEyeScaleYMultiplier,
          ).toBeLessThanOrEqual(
            1,
          );
        }
      },
    );

    it(
      "adds locomotion bob only while visual locomotion is actually transitioning",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(
              {
                moving:
                  true,
              },
            ),
            0,
          );

        const stationarySample =
          sampleEmbodimentAnimation(
            state,
            0.085,
            false,
          );

        const movingSample =
          sampleEmbodimentAnimation(
            state,
            0.085,
            true,
          );

        expect(
          stationarySample
            .locomotionBobY,
        ).toBe(
          0,
        );

        expect(
          movingSample
            .locomotionBobY,
        ).toBeGreaterThan(
          0,
        );

        expect(
          movingSample
            .locomotionBobY,
        ).toBeLessThanOrEqual(
          EMBODIMENT_GAIT_BOB_AMPLITUDE,
        );
      },
    );

    it(
      "does not create an eating reaction from ordinary idle or movement presentation",
      () => {
        const idle =
          createEmbodimentAnimationState(
            createModel(
              {
                activityState:
                  "idle",
              },
            ),
            1,
          );

        const exploring =
          createEmbodimentAnimationState(
            createModel(
              {
                activityState:
                  "exploring",

                moving:
                  true,
              },
            ),
            1,
          );

        expect(
          sampleEmbodimentAnimation(
            idle,
            1.1,
            false,
          ).eatingActive,
        ).toBe(
          false,
        );

        expect(
          sampleEmbodimentAnimation(
            exploring,
            1.1,
            true,
          ).eatingActive,
        ).toBe(
          false,
        );
      },
    );

    it(
      "starts an eating reaction only from the presentation contract's genuine eating state",
      () => {
        const initial =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const eatingModel =
          createModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              activityState:
                "eating",
            },
          );

        const eatingState =
          advanceEmbodimentAnimationState(
            initial,
            eatingModel,
            2,
          );

        const halfway =
          sampleEmbodimentAnimation(
            eatingState,
            2 +
            EMBODIMENT_EATING_DURATION_SECONDS /
              2,
            false,
          );

        expect(
          halfway.eatingActive,
        ).toBe(
          true,
        );

        expect(
          halfway.eatingProgress,
        ).toBeCloseTo(
          0.5,
        );

        expect(
          halfway
            .eatingCompressionYMultiplier,
        ).toBeCloseTo(
          1 -
          EMBODIMENT_EATING_COMPRESSION,
        );

        expect(
          halfway
            .eatingForwardDipRadians,
        ).toBeCloseTo(
          -EMBODIMENT_EATING_DIP_RADIANS,
        );
      },
    );

    it(
      "does not restart eating when the same genuine eating presentation is rendered again",
      () => {
        const initial =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const eatingModel =
          createModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              activityState:
                "eating",
            },
          );

        const started =
          advanceEmbodimentAnimationState(
            initial,
            eatingModel,
            2,
          );

        const repeated =
          advanceEmbodimentAnimationState(
            started,
            eatingModel,
            2.2,
          );

        expect(
          repeated
            .eatingStartPresentationTimeSeconds,
        ).toBe(
          2,
        );

        const sample =
          sampleEmbodimentAnimation(
            repeated,
            2.325,
            false,
          );

        expect(
          sample.eatingProgress,
        ).toBeCloseTo(
          0.5,
        );
      },
    );

    it(
      "allows a legitimately started eating reaction to finish after a later idle presentation update",
      () => {
        const initial =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const started =
          advanceEmbodimentAnimationState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                activityState:
                  "eating",
              },
            ),

            2,
          );

        const sameTickIdle =
          advanceEmbodimentAnimationState(
            started,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                activityState:
                  "idle",
              },
            ),

            2.1,
          );

        expect(
          sampleEmbodimentAnimation(
            sameTickIdle,
            2.2,
            false,
          ).eatingActive,
        ).toBe(
          true,
        );

        expect(
          sampleEmbodimentAnimation(
            sameTickIdle,
            2 +
            EMBODIMENT_EATING_DURATION_SECONDS,
            false,
          ).eatingActive,
        ).toBe(
          false,
        );
      },
    );

    it(
      "clears the previous run's eating event on authoritative reset",
      () => {
        const eating =
          createEmbodimentAnimationState(
            createModel(
              {
                tickIndex:
                  5,

                simulationTimeSeconds:
                  5,

                activityState:
                  "eating",
              },
            ),
            10,
          );

        expect(
          sampleEmbodimentAnimation(
            eating,
            10.1,
            false,
          ).eatingActive,
        ).toBe(
          true,
        );

        const reset =
          advanceEmbodimentAnimationState(
            eating,

            createModel(
              {
                tickIndex:
                  0,

                simulationTimeSeconds:
                  0,

                activityState:
                  "idle",
              },
            ),

            10.2,
          );

        expect(
          reset
            .eatingStartPresentationTimeSeconds,
        ).toBeNull();

        expect(
          sampleEmbodimentAnimation(
            reset,
            10.3,
            false,
          ).eatingActive,
        ).toBe(
          false,
        );
      },
    );

    it(
      "produces the same animation at the same timestamp regardless of frame sampling frequency",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(
              {
                moving:
                  true,
              },
            ),
            0,
          );

        for (
          let frame = 0;
          frame < 30;
          frame += 1
        ) {
          sampleEmbodimentAnimation(
            state,
            frame /
              30,
            true,
          );
        }

        const lowFrequency =
          sampleEmbodimentAnimation(
            state,
            1,
            true,
          );

        for (
          let frame = 0;
          frame < 120;
          frame += 1
        ) {
          sampleEmbodimentAnimation(
            state,
            frame /
              120,
            true,
          );
        }

        const highFrequency =
          sampleEmbodimentAnimation(
            state,
            1,
            true,
          );

        expect(
          highFrequency,
        ).toEqual(
          lowFrequency,
        );
      },
    );

    it(
      "produces the same blink at the same timestamp regardless of prior frame sampling",
      () => {
        const state =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const blinkMidpoint =
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2;

        for (
          let frame = 0;
          frame < 60;
          frame += 1
        ) {
          sampleEmbodimentAnimation(
            state,
            (
              blinkMidpoint *
              frame
            ) /
            60,
            false,
          );
        }

        const afterManySamples =
          sampleEmbodimentAnimation(
            state,
            blinkMidpoint,
            false,
          );

        const directState =
          createEmbodimentAnimationState(
            createModel(),
            0,
          );

        const direct =
          sampleEmbodimentAnimation(
            directState,
            blinkMidpoint,
            false,
          );

        expect(
          afterManySamples
            .blinkEyeScaleYMultiplier,
        ).toBeCloseTo(
          direct
            .blinkEyeScaleYMultiplier,
        );

        expect(
          direct
            .blinkEyeScaleYMultiplier,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );
      },
    );

    it(
      "does not mutate presentation input or animation state while sampling",
      () => {
        const model =
          createModel(
            {
              activityState:
                "eating",
            },
          );

        const modelBefore =
          JSON.stringify(
            model,
          );

        const state =
          createEmbodimentAnimationState(
            model,
            1,
          );

        const stateBefore =
          JSON.stringify(
            state,
          );

        sampleEmbodimentAnimation(
          state,
          1.2,
          false,
        );

        expect(
          JSON.stringify(
            model,
          ),
        ).toBe(
          modelBefore,
        );

        expect(
          JSON.stringify(
            state,
          ),
        ).toBe(
          stateBefore,
        );
      },
    );

    it(
      "rejects invalid or backwards presentation time",
      () => {
        expect(() =>
          createEmbodimentAnimationState(
            createModel(),
            -1,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createEmbodimentAnimationState(
            createModel(),
            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );

        const state =
          createEmbodimentAnimationState(
            createModel(),
            5,
          );

        expect(() =>
          advanceEmbodimentAnimationState(
            state,
            createModel(),
            4,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          sampleEmbodimentAnimation(
            state,
            4,
            false,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);