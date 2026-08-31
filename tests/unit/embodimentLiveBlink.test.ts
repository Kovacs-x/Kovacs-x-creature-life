import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_BLINK_DURATION_SECONDS,
  EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS,
  EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
} from "../../src/rendering/embodimentAnimation.js";

import {
  createEmbodimentScene,
} from "../../src/rendering/embodimentScene.js";

import {
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

function createMovingPresentationModel():
  M3PresentationModel {
  return {
    schemaVersion:
      M3_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      1,

    simulationTimeSeconds:
      1,

    creature: {
      position: {
        x: 3,
        y: 4,
      },

      motionState:
        "moving",

      distanceMoved:
        1,

      facingDirection: {
        x: 0,
        y: 1,
      },

      activityState:
        "exploring",

      movementSource:
        "exploration",

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
  "live embodiment blinking",
  () => {
    it(
      "keeps both eye meshes at their authored neutral scale before the blink window",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createMovingPresentationModel(),
          0,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .x,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .y,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .z,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .x,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .y,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .z,
        ).toBeCloseTo(
          1,
        );

        bundle.dispose();
      },
    );

    it(
      "visually closes both eyes at the deterministic blink midpoint",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createMovingPresentationModel(),
          0,
        );

        const blinkMidpoint =
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2;

        bundle.updateFrame(
          blinkMidpoint,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .y,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .y,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );

        /*
         * Blinking compresses only visual eye Y.
         */
        expect(
          bundle
            .actors
            .leftEye
            .scale
            .x,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .z,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .x,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .z,
        ).toBeCloseTo(
          1,
        );

        bundle.dispose();
      },
    );

    it(
      "reopens both eyes after the deterministic blink duration",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createMovingPresentationModel(),
          0,
        );

        const blinkMidpoint =
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2;

        bundle.updateFrame(
          blinkMidpoint,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .y,
        ).toBeLessThan(
          1,
        );

        bundle.updateFrame(
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .y,
        ).toBeCloseTo(
          1,
        );

        expect(
          bundle
            .actors
            .rightEye
            .scale
            .y,
        ).toBeCloseTo(
          1,
        );

        bundle.dispose();
      },
    );

    it(
      "does not let blinking alter authoritative planar presentation or genuine facing",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        const model =
          createMovingPresentationModel();

        bundle.updatePresentation(
          model,
          0,
        );

        const positionBefore = {
          x:
            bundle
              .actors
              .creatureRoot
              .position
              .x,

          z:
            bundle
              .actors
              .creatureRoot
              .position
              .z,
        };

        const facingBefore =
          bundle
            .actors
            .creatureRoot
            .rotation
            .y;

        bundle.updateFrame(
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2,
        );

        expect(
          bundle
            .actors
            .leftEye
            .scale
            .y,
        ).toBeCloseTo(
          EMBODIMENT_BLINK_MINIMUM_EYE_SCALE_Y,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          positionBefore.x,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .z,
        ).toBeCloseTo(
          positionBefore.z,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          facingBefore,
        );

        expect(
          positionBefore,
        ).toEqual(
          {
            x:
              model.creature.position.x,

            z:
              model.creature.position.y,
          },
        );

        expect(
          facingBefore,
        ).toBeCloseTo(
          -Math.PI /
          2,
        );

        bundle.dispose();
      },
    );

    it(
      "produces identical live eye transforms when the same absolute blink time is sampled repeatedly",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createMovingPresentationModel(),
          0,
        );

        const blinkMidpoint =
          EMBODIMENT_BLINK_INITIAL_DELAY_SECONDS +
          EMBODIMENT_BLINK_DURATION_SECONDS /
            2;

        bundle.updateFrame(
          blinkMidpoint,
        );

        const first = {
          leftX:
            bundle
              .actors
              .leftEye
              .scale
              .x,

          leftY:
            bundle
              .actors
              .leftEye
              .scale
              .y,

          leftZ:
            bundle
              .actors
              .leftEye
              .scale
              .z,

          rightX:
            bundle
              .actors
              .rightEye
              .scale
              .x,

          rightY:
            bundle
              .actors
              .rightEye
              .scale
              .y,

          rightZ:
            bundle
              .actors
              .rightEye
              .scale
              .z,
        };

        for (
          let index = 0;
          index < 100;
          index += 1
        ) {
          bundle.updateFrame(
            blinkMidpoint,
          );
        }

        const repeated = {
          leftX:
            bundle
              .actors
              .leftEye
              .scale
              .x,

          leftY:
            bundle
              .actors
              .leftEye
              .scale
              .y,

          leftZ:
            bundle
              .actors
              .leftEye
              .scale
              .z,

          rightX:
            bundle
              .actors
              .rightEye
              .scale
              .x,

          rightY:
            bundle
              .actors
              .rightEye
              .scale
              .y,

          rightZ:
            bundle
              .actors
              .rightEye
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
  },
);