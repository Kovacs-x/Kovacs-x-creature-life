import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_LOCOMOTION_DURATION_SECONDS,
  advanceEmbodimentLocomotionState,
  createEmbodimentLocomotionState,
  sampleEmbodimentLocomotion,
} from "../../src/rendering/embodimentLocomotion.js";

import {
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

interface ModelOptions {
  readonly tickIndex?:
    number;

  readonly simulationTimeSeconds?:
    number;

  readonly creatureX?:
    number;

  readonly creatureY?:
    number;

  readonly moving?:
    boolean;

  readonly distanceMoved?:
    number;
}

function createModel(
  options:
    ModelOptions = {},
): M3PresentationModel {
  const moving =
    options.moving ??
    false;

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
        x:
          options.creatureX ??
          2,

        y:
          options.creatureY ??
          3,
      },

      motionState:
        moving
          ? "moving"
          : "stationary",

      distanceMoved:
        options.distanceMoved ??
        (
          moving
            ? 1
            : 0
        ),

      facingDirection:
        moving
          ? {
              x: 1,
              y: 0,
            }
          : null,

      activityState:
        moving
          ? "exploring"
          : "idle",

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

        x:
          5,

        minY:
          2,

        maxY:
          8,
      },
    },
  };
}

describe(
  "embodiment locomotion interpolation",
  () => {
    it(
      "starts exactly at the initial authoritative Creature position",
      () => {
        const model =
          createModel(
            {
              creatureX:
                2.5,

              creatureY:
                4.5,
            },
          );

        const state =
          createEmbodimentLocomotionState(
            model,
            10,
          );

        const sample =
          sampleEmbodimentLocomotion(
            state,
            10,
          );

        expect(
          sample.position,
        ).toEqual(
          {
            x: 2.5,
            z: 4.5,
          },
        );

        expect(
          sample.progress,
        ).toBe(
          1,
        );

        expect(
          sample.transitioning,
        ).toBe(
          false,
        );
      },
    );

    it(
      "interpolates only after a genuine moving presentation reaches a new authoritative destination",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const moved =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  4,

                creatureY:
                  3,

                moving:
                  true,

                distanceMoved:
                  2,
              },
            ),

            1,
          );

        const start =
          sampleEmbodimentLocomotion(
            moved,
            1,
          );

        expect(
          start.position,
        ).toEqual(
          {
            x: 2,
            z: 3,
          },
        );

        expect(
          start.progress,
        ).toBe(
          0,
        );

        expect(
          start.transitioning,
        ).toBe(
          true,
        );

        const halfway =
          sampleEmbodimentLocomotion(
            moved,
            1 +
            EMBODIMENT_LOCOMOTION_DURATION_SECONDS /
              2,
          );

        expect(
          halfway.position.x,
        ).toBeCloseTo(
          3,
        );

        expect(
          halfway.position.z,
        ).toBeCloseTo(
          3,
        );

        expect(
          halfway.progress,
        ).toBeCloseTo(
          0.5,
        );
      },
    );

    it(
      "finishes exactly at the authoritative destination",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const moved =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  5,

                creatureY:
                  6,

                moving:
                  true,
              },
            ),

            2,
          );

        const finished =
          sampleEmbodimentLocomotion(
            moved,
            2 +
            EMBODIMENT_LOCOMOTION_DURATION_SECONDS,
          );

        expect(
          finished.position,
        ).toEqual(
          {
            x: 5,
            z: 6,
          },
        );

        expect(
          finished.progress,
        ).toBe(
          1,
        );

        expect(
          finished.transitioning,
        ).toBe(
          false,
        );
      },
    );

    it(
      "does not restart locomotion when a same-position presentation update occurs",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const moved =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  4,

                creatureY:
                  3,

                moving:
                  true,
              },
            ),

            1,
          );

        const repeated =
          advanceEmbodimentLocomotionState(
            moved,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  4,

                creatureY:
                  3,

                moving:
                  false,
              },
            ),

            1.2,
          );

        expect(
          repeated
            .transitionStartPresentationTimeSeconds,
        ).toBe(
          moved
            .transitionStartPresentationTimeSeconds,
        );

        expect(
          repeated.from,
        ).toEqual(
          moved.from,
        );

        expect(
          repeated.to,
        ).toEqual(
          moved.to,
        );

        const sample =
          sampleEmbodimentLocomotion(
            repeated,
            1.25,
          );

        expect(
          sample.progress,
        ).toBeCloseTo(
          0.5,
        );
      },
    );

    it(
      "snaps rather than inventing locomotion when a changed position is labelled stationary",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const inconsistent =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  7,

                creatureY:
                  7,

                moving:
                  false,

                distanceMoved:
                  0,
              },
            ),

            1,
          );

        const sample =
          sampleEmbodimentLocomotion(
            inconsistent,
            1,
          );

        expect(
          sample.position,
        ).toEqual(
          {
            x: 7,
            z: 7,
          },
        );

        expect(
          sample.transitioning,
        ).toBe(
          false,
        );
      },
    );

    it(
      "snaps to a reset run instead of animating from the previous run",
      () => {
        const previousRun =
          createEmbodimentLocomotionState(
            createModel(
              {
                tickIndex:
                  8,

                simulationTimeSeconds:
                  8,

                creatureX:
                  9,

                creatureY:
                  9,
              },
            ),
            5,
          );

        const reset =
          advanceEmbodimentLocomotionState(
            previousRun,

            createModel(
              {
                tickIndex:
                  0,

                simulationTimeSeconds:
                  0,

                creatureX:
                  2,

                creatureY:
                  3,
              },
            ),

            6,
          );

        const sample =
          sampleEmbodimentLocomotion(
            reset,
            6,
          );

        expect(
          sample.position,
        ).toEqual(
          {
            x: 2,
            z: 3,
          },
        );

        expect(
          sample.transitioning,
        ).toBe(
          false,
        );
      },
    );

    it(
      "uses the currently displayed position when a new authoritative movement arrives before the previous visual transition finishes",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const firstMove =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  4,

                creatureY:
                  3,

                moving:
                  true,
              },
            ),

            1,
          );

        const halfwayTime =
          1 +
          EMBODIMENT_LOCOMOTION_DURATION_SECONDS /
            2;

        const halfway =
          sampleEmbodimentLocomotion(
            firstMove,
            halfwayTime,
          );

        const secondMove =
          advanceEmbodimentLocomotionState(
            firstMove,

            createModel(
              {
                tickIndex:
                  2,

                simulationTimeSeconds:
                  2,

                creatureX:
                  6,

                creatureY:
                  3,

                moving:
                  true,
              },
            ),

            halfwayTime,
          );

        expect(
          secondMove.from.x,
        ).toBeCloseTo(
          halfway.position.x,
        );

        expect(
          secondMove.from.z,
        ).toBeCloseTo(
          halfway.position.z,
        );

        expect(
          secondMove.to,
        ).toEqual(
          {
            x: 6,
            z: 3,
          },
        );
      },
    );

    it(
      "produces the same displayed position at the same absolute time regardless of frame sampling frequency",
      () => {
        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const moved =
          advanceEmbodimentLocomotionState(
            initial,

            createModel(
              {
                tickIndex:
                  1,

                simulationTimeSeconds:
                  1,

                creatureX:
                  8,

                creatureY:
                  3,

                moving:
                  true,
              },
            ),

            1,
          );

        /*
         * Simulate many render samples at two
         * different frame rates.
         *
         * sampleEmbodimentLocomotion(...) is
         * side-effect free, so these calls cannot
         * accumulate movement.
         */
        for (
          let frame = 0;
          frame <= 15;
          frame += 1
        ) {
          sampleEmbodimentLocomotion(
            moved,
            1 +
            frame /
              30,
          );
        }

        const thirtyFpsResult =
          sampleEmbodimentLocomotion(
            moved,
            1.25,
          );

        for (
          let frame = 0;
          frame <= 60;
          frame += 1
        ) {
          sampleEmbodimentLocomotion(
            moved,
            1 +
            frame /
              120,
          );
        }

        const oneTwentyFpsResult =
          sampleEmbodimentLocomotion(
            moved,
            1.25,
          );

        expect(
          oneTwentyFpsResult,
        ).toEqual(
          thirtyFpsResult,
        );
      },
    );

    it(
      "does not mutate authoritative presentation input or interpolation state while sampling",
      () => {
        const model =
          createModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creatureX:
                4,

              creatureY:
                5,

              moving:
                true,
            },
          );

        const initial =
          createEmbodimentLocomotionState(
            createModel(),
            0,
          );

        const modelBefore =
          JSON.stringify(
            model,
          );

        const moved =
          advanceEmbodimentLocomotionState(
            initial,
            model,
            1,
          );

        const stateBefore =
          JSON.stringify(
            moved,
          );

        sampleEmbodimentLocomotion(
          moved,
          1.25,
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
            moved,
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
          createEmbodimentLocomotionState(
            createModel(),
            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createEmbodimentLocomotionState(
            createModel(),
            -1,
          ),
        ).toThrow(
          RangeError,
        );

        const state =
          createEmbodimentLocomotionState(
            createModel(),
            5,
          );

        expect(() =>
          advanceEmbodimentLocomotionState(
            state,
            createModel(),
            4,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);