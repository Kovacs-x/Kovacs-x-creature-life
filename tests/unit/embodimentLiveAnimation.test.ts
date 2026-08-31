import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_BREATHING_PERIOD_SECONDS,
  EMBODIMENT_BREATHING_XZ_AMPLITUDE,
  EMBODIMENT_BREATHING_Y_AMPLITUDE,
  EMBODIMENT_EATING_DIP_RADIANS,
  EMBODIMENT_EATING_DURATION_SECONDS,
  EMBODIMENT_GAIT_BOB_AMPLITUDE,
} from "../../src/rendering/embodimentAnimation.js";

import {
  createEmbodimentScene,
} from "../../src/rendering/embodimentScene.js";

import {
  EMBODIMENT_GROUND_Y,
} from "../../src/rendering/embodimentCoordinates.js";

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

  readonly creatureX?:
    number;

  readonly creatureY?:
    number;

  readonly moving?:
    boolean;

  readonly activityState?:
    M3CreatureActivityState;

  readonly facingX?:
    number;

  readonly facingY?:
    number;
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

  const eating =
    activityState ===
    "eating";

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
        moving
          ? 1
          : 0,

      facingDirection:
        moving
          ? {
              x:
                options.facingX ??
                1,

              y:
                options.facingY ??
                0,
            }
          : null,

      activityState,

      movementSource:
        moving
          ? "exploration"
          : null,

      energy:
        eating
          ? 95
          : 80,

      maxEnergy:
        100,

      energyFraction:
        eating
          ? 0.95
          : 0.8,

      hungerFraction:
        eating
          ? 0.05
          : 0.2,
    },

    food: {
      position: {
        x: 8,
        y: 7,
      },

      consumed:
        eating,

      available:
        !eating,
    },

    environment: {
      foodPerceptionState:
        eating
          ? "consumed"
          : "occluded",

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
  "live embodiment Creature animation",
  () => {
    it(
      "applies breathing around the authored neutral body scale without moving authoritative X/Z",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        const model =
          createModel();

        bundle.updatePresentation(
          model,
          0,
        );

        const neutralScale = {
          x:
            bundle
              .actors
              .creatureBody
              .scale
              .x,

          y:
            bundle
              .actors
              .creatureBody
              .scale
              .y,

          z:
            bundle
              .actors
              .creatureBody
              .scale
              .z,
        };

        /*
         * Quarter-cycle gives breathingWave = 1.
         */
        bundle.updateFrame(
          EMBODIMENT_BREATHING_PERIOD_SECONDS /
          4,
        );

        expect(
          bundle
            .actors
            .creatureBody
            .scale
            .x,
        ).toBeCloseTo(
          neutralScale.x *
          (
            1 -
            EMBODIMENT_BREATHING_XZ_AMPLITUDE
          ),
        );

        expect(
          bundle
            .actors
            .creatureBody
            .scale
            .y,
        ).toBeCloseTo(
          neutralScale.y *
          (
            1 +
            EMBODIMENT_BREATHING_Y_AMPLITUDE
          ),
        );

        expect(
          bundle
            .actors
            .creatureBody
            .scale
            .z,
        ).toBeCloseTo(
          neutralScale.z *
          (
            1 -
            EMBODIMENT_BREATHING_XZ_AMPLITUDE
          ),
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          model.creature.position.x,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .z,
        ).toBeCloseTo(
          model.creature.position.y,
        );

        bundle.dispose();
      },
    );

    it(
      "adds vertical gait bob only while genuine locomotion interpolation is active",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          0,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .y,
        ).toBeCloseTo(
          EMBODIMENT_GROUND_Y,
        );

        bundle.updatePresentation(
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

        /*
         * This timestamp remains inside the
         * locomotion interpolation window and
         * lands away from a gait-wave zero.
         */
        bundle.updateFrame(
          1.105,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .y,
        ).toBeGreaterThan(
          EMBODIMENT_GROUND_Y,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .y,
        ).toBeLessThanOrEqual(
          EMBODIMENT_GROUND_Y +
          EMBODIMENT_GAIT_BOB_AMPLITUDE,
        );

        /*
         * Once interpolation has completed, the
         * gait contribution is exactly neutral.
         */
        bundle.updateFrame(
          2,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .y,
        ).toBeCloseTo(
          EMBODIMENT_GROUND_Y,
        );

        bundle.dispose();
      },
    );

    it(
      "does not let breathing or gait alter genuine displacement-derived facing",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          0,
        );

        bundle.updatePresentation(
          createModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creatureX:
                2,

              creatureY:
                4,

              moving:
                true,

              facingX:
                0,

              facingY:
                1,
            },
          ),
          1,
        );

        const genuineFacingRotation =
          bundle
            .actors
            .creatureRoot
            .rotation
            .y;

        expect(
          genuineFacingRotation,
        ).toBeCloseTo(
          -Math.PI /
          2,
        );

        bundle.updateFrame(
          1.1,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          genuineFacingRotation,
        );

        bundle.updateFrame(
          1.3,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          genuineFacingRotation,
        );

        bundle.dispose();
      },
    );

    it(
      "applies the eating dip only after an eating presentation event",
      () => {
        const eatingBundle =
          createEmbodimentScene(
            1,
          );

        const idleBundle =
          createEmbodimentScene(
            1,
          );

        eatingBundle.updatePresentation(
          createModel(),
          0,
        );

        idleBundle.updatePresentation(
          createModel(),
          0,
        );

        eatingBundle.updatePresentation(
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

        idleBundle.updatePresentation(
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
          2,
        );

        const halfwayTime =
          2 +
          EMBODIMENT_EATING_DURATION_SECONDS /
            2;

        eatingBundle.updateFrame(
          halfwayTime,
        );

        idleBundle.updateFrame(
          halfwayTime,
        );

        expect(
          eatingBundle
            .actors
            .creatureRoot
            .rotation
            .z,
        ).toBeCloseTo(
          -EMBODIMENT_EATING_DIP_RADIANS,
        );

        expect(
          idleBundle
            .actors
            .creatureRoot
            .rotation
            .z,
        ).toBeCloseTo(
          0,
        );

        /*
         * At the same breathing phase, genuine
         * eating additionally compresses the
         * body.
         */
        expect(
          eatingBundle
            .actors
            .creatureBody
            .scale
            .y,
        ).toBeLessThan(
          idleBundle
            .actors
            .creatureBody
            .scale
            .y,
        );

        eatingBundle.dispose();
        idleBundle.dispose();
      },
    );

    it(
      "returns the Creature to neutral eating posture when the presentation reaction ends",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          0,
        );

        bundle.updatePresentation(
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

        bundle.updateFrame(
          2 +
          EMBODIMENT_EATING_DURATION_SECONDS /
            2,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .rotation
            .z,
        ).not.toBeCloseTo(
          0,
        );

        bundle.updateFrame(
          2 +
          EMBODIMENT_EATING_DURATION_SECONDS,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .rotation
            .z,
        ).toBeCloseTo(
          0,
        );

        bundle.dispose();
      },
    );

    it(
      "produces identical visual transforms when the same absolute frame time is sampled repeatedly",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          0,
        );

        bundle.updatePresentation(
          createModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creatureX:
                4,

              moving:
                true,
            },
          ),
          1,
        );

        const sampleTime =
          1.2;

        bundle.updateFrame(
          sampleTime,
        );

        const first = {
          positionX:
            bundle
              .actors
              .creatureRoot
              .position
              .x,

          positionY:
            bundle
              .actors
              .creatureRoot
              .position
              .y,

          positionZ:
            bundle
              .actors
              .creatureRoot
              .position
              .z,

          rotationY:
            bundle
              .actors
              .creatureRoot
              .rotation
              .y,

          rotationZ:
            bundle
              .actors
              .creatureRoot
              .rotation
              .z,

          scaleX:
            bundle
              .actors
              .creatureBody
              .scale
              .x,

          scaleY:
            bundle
              .actors
              .creatureBody
              .scale
              .y,

          scaleZ:
            bundle
              .actors
              .creatureBody
              .scale
              .z,
        };

        for (
          let index = 0;
          index < 100;
          index += 1
        ) {
          bundle.updateFrame(
            sampleTime,
          );
        }

        const repeated = {
          positionX:
            bundle
              .actors
              .creatureRoot
              .position
              .x,

          positionY:
            bundle
              .actors
              .creatureRoot
              .position
              .y,

          positionZ:
            bundle
              .actors
              .creatureRoot
              .position
              .z,

          rotationY:
            bundle
              .actors
              .creatureRoot
              .rotation
              .y,

          rotationZ:
            bundle
              .actors
              .creatureRoot
              .rotation
              .z,

          scaleX:
            bundle
              .actors
              .creatureBody
              .scale
              .x,

          scaleY:
            bundle
              .actors
              .creatureBody
              .scale
              .y,

          scaleZ:
            bundle
              .actors
              .creatureBody
              .scale
              .z,
        };

        expect(
          repeated,
        ).toEqual(
          first,
        );

        bundle.dispose();
      },
    );

    it(
      "tolerates a RAF timestamp microscopically earlier than the latest presentation update",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          5,
        );

        expect(() => {
          bundle.updateFrame(
            4.999,
          );
        }).not.toThrow();

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          2,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .z,
        ).toBeCloseTo(
          3,
        );

        bundle.dispose();
      },
    );

    it(
      "does not create gait motion while the Creature is stationary",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createModel(),
          0,
        );

        for (
          const time
          of [
            0.1,
            0.25,
            0.5,
            1,
            2,
          ]
        ) {
          bundle.updateFrame(
            time,
          );

          expect(
            bundle
              .actors
              .creatureRoot
              .position
              .y,
          ).toBeCloseTo(
            EMBODIMENT_GROUND_Y,
          );
        }

        bundle.dispose();
      },
    );
  },
);