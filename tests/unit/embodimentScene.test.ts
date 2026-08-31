import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_BOUNDARY_Y,
  EMBODIMENT_CAMERA_FAR,
  EMBODIMENT_CAMERA_FOV_DEGREES,
  EMBODIMENT_CAMERA_NEAR,
  EMBODIMENT_CAMERA_TARGET,
  EMBODIMENT_DEFAULT_CAMERA_POSITION,
  createEmbodimentScene,
} from "../../src/rendering/embodimentScene.js";

import {
  EMBODIMENT_GROUND_Y,
  M3_EMBODIMENT_SCENE_BOUNDS,
} from "../../src/rendering/embodimentCoordinates.js";

import {
  EMBODIMENT_LOCOMOTION_DURATION_SECONDS,
} from "../../src/rendering/embodimentLocomotion.js";

import {
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3PresentationModel,
  type M3PresentationVector,
} from "../../src/rendering/m3Presentation.js";

interface PresentationOptions {
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

  readonly facingDirection?:
    M3PresentationVector;
}

function createPresentationModel(
  options:
    PresentationOptions = {},
): M3PresentationModel {
  const moving =
    options.moving ??
    true;

  return {
    schemaVersion:
      M3_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      options.tickIndex ??
      3,

    simulationTimeSeconds:
      options.simulationTimeSeconds ??
      3,

    creature: {
      position: {
        x:
          options.creatureX ??
          3,

        y:
          options.creatureY ??
          4,
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
          ? (
              options.facingDirection ??
              {
                x: 0,
                y: 1,
              }
            )
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
        77,

      maxEnergy:
        100,

      energyFraction:
        0.77,

      hungerFraction:
        0.23,
    },

    food: {
      position: {
        x: 8,
        y: 6,
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
        "decayed",

      foodMemoryConfidence:
        0.6,

      foodMemoryAgeSeconds:
        2,

      sensoryOccluder: {
        active:
          true,

        x:
          5,

        minY:
          2,

        maxY:
          7,
      },
    },
  };
}

describe(
  "embodiment Three.js scene",
  () => {
    it(
      "creates the required presentation scene components",
      () => {
        const bundle =
          createEmbodimentScene(
            16 /
            9,
          );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.camera,
        );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.floor,
        );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.boundary,
        );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.hemisphereLight,
        );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.directionalLight,
        );

        expect(
          bundle.scene.children,
        ).toContain(
          bundle.actors.root,
        );

        bundle.dispose();
      },
    );

    it(
      "creates a perspective camera centred on the authoritative habitat presentation",
      () => {
        const aspectRatio =
          4 /
          3;

        const bundle =
          createEmbodimentScene(
            aspectRatio,
          );

        expect(
          bundle.camera.fov,
        ).toBe(
          EMBODIMENT_CAMERA_FOV_DEGREES,
        );

        expect(
          bundle.camera.aspect,
        ).toBeCloseTo(
          aspectRatio,
        );

        expect(
          bundle.camera.near,
        ).toBe(
          EMBODIMENT_CAMERA_NEAR,
        );

        expect(
          bundle.camera.far,
        ).toBe(
          EMBODIMENT_CAMERA_FAR,
        );

        expect(
          bundle.camera.position.x,
        ).toBe(
          EMBODIMENT_DEFAULT_CAMERA_POSITION.x,
        );

        expect(
          bundle.camera.position.y,
        ).toBe(
          EMBODIMENT_DEFAULT_CAMERA_POSITION.y,
        );

        expect(
          bundle.camera.position.z,
        ).toBe(
          EMBODIMENT_DEFAULT_CAMERA_POSITION.z,
        );

        expect(
          EMBODIMENT_CAMERA_TARGET,
        ).toEqual(
          {
            x:
              M3_EMBODIMENT_SCENE_BOUNDS.centerX,

            y:
              EMBODIMENT_GROUND_Y,

            z:
              M3_EMBODIMENT_SCENE_BOUNDS.centerZ,
          },
        );

        bundle.dispose();
      },
    );

    it(
      "makes the floor exactly match the authoritative habitat dimensions",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        expect(
          bundle.floor.geometry.parameters.width,
        ).toBe(
          M3_EMBODIMENT_SCENE_BOUNDS.width,
        );

        expect(
          bundle.floor.geometry.parameters.height,
        ).toBe(
          M3_EMBODIMENT_SCENE_BOUNDS.depth,
        );

        expect(
          bundle.floor.position.x,
        ).toBe(
          M3_EMBODIMENT_SCENE_BOUNDS.centerX,
        );

        expect(
          bundle.floor.position.y,
        ).toBe(
          EMBODIMENT_GROUND_Y,
        );

        expect(
          bundle.floor.position.z,
        ).toBe(
          M3_EMBODIMENT_SCENE_BOUNDS.centerZ,
        );

        expect(
          bundle.floor.rotation.x,
        ).toBeCloseTo(
          -Math.PI /
          2,
        );

        bundle.dispose();
      },
    );

    it(
      "draws the habitat boundary at the exact four authoritative scene corners within Three.js float precision",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        const positions =
          bundle.boundary.geometry
            .getAttribute(
              "position",
            );

        expect(
          positions.count,
        ).toBe(
          4,
        );

        expect(
          positions.getX(
            0,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.minX,
        );

        expect(
          positions.getY(
            0,
          ),
        ).toBeCloseTo(
          EMBODIMENT_BOUNDARY_Y,
        );

        expect(
          positions.getZ(
            0,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.minZ,
        );

        expect(
          positions.getX(
            1,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.maxX,
        );

        expect(
          positions.getY(
            1,
          ),
        ).toBeCloseTo(
          EMBODIMENT_BOUNDARY_Y,
        );

        expect(
          positions.getZ(
            1,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.minZ,
        );

        expect(
          positions.getX(
            2,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.maxX,
        );

        expect(
          positions.getY(
            2,
          ),
        ).toBeCloseTo(
          EMBODIMENT_BOUNDARY_Y,
        );

        expect(
          positions.getZ(
            2,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.maxZ,
        );

        expect(
          positions.getX(
            3,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.minX,
        );

        expect(
          positions.getY(
            3,
          ),
        ).toBeCloseTo(
          EMBODIMENT_BOUNDARY_Y,
        );

        expect(
          positions.getZ(
            3,
          ),
        ).toBeCloseTo(
          M3_EMBODIMENT_SCENE_BOUNDS.maxZ,
        );

        bundle.dispose();
      },
    );

    it(
      "snaps the initial Creature presentation exactly to its authoritative position",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        const model =
          createPresentationModel();

        bundle.updatePresentation(
          model,
          10,
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

        expect(
          bundle
            .actors
            .foodRoot
            .position
            .x,
        ).toBeCloseTo(
          model.food.position.x,
        );

        expect(
          bundle
            .actors
            .foodRoot
            .position
            .z,
        ).toBeCloseTo(
          model.food.position.y,
        );

        expect(
          bundle
            .actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          true,
        );

        expect(
          bundle
            .actors
            .sensoryScreen
            .visible,
        ).toBe(
          true,
        );

        bundle.dispose();
      },
    );

    it(
      "interpolates displayed Creature X/Z between consecutive genuine authoritative movement positions",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                0,

              simulationTimeSeconds:
                0,

              creatureX:
                2,

              creatureY:
                3,

              moving:
                false,
            },
          ),
          0,
        );

        bundle.updatePresentation(
          createPresentationModel(
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

              facingDirection: {
                x: 1,
                y: 0,
              },
            },
          ),
          1,
        );

        /*
         * At the authoritative update instant,
         * the displayed Creature remains at the
         * visual transition start.
         */
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

        bundle.updateFrame(
          1 +
          EMBODIMENT_LOCOMOTION_DURATION_SECONDS /
            2,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          3,
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

        bundle.updateFrame(
          1 +
          EMBODIMENT_LOCOMOTION_DURATION_SECONDS,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          4,
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
      "does not accumulate additional Creature movement from repeated frame sampling",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                0,

              simulationTimeSeconds:
                0,

              creatureX:
                2,

              creatureY:
                3,

              moving:
                false,
            },
          ),
          0,
        );

        bundle.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creatureX:
                6,

              creatureY:
                3,

              moving:
                true,

              distanceMoved:
                4,

              facingDirection: {
                x: 1,
                y: 0,
              },
            },
          ),
          1,
        );

        const targetTime =
          1 +
          EMBODIMENT_LOCOMOTION_DURATION_SECONDS /
            2;

        for (
          let frame = 0;
          frame <= 15;
          frame += 1
        ) {
          bundle.updateFrame(
            1 +
            (
              targetTime -
              1
            ) *
            (
              frame /
              15
            ),
          );
        }

        const sampledAfterManyFrames = {
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

        /*
         * Re-sampling the same absolute time
         * cannot move the Creature any farther.
         */
        bundle.updateFrame(
          targetTime,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          sampledAfterManyFrames.x,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .z,
        ).toBeCloseTo(
          sampledAfterManyFrames.z,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          4,
        );

        bundle.dispose();
      },
    );

    it(
      "updates non-locomotion world presentation immediately while Creature locomotion is still interpolating",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                0,

              simulationTimeSeconds:
                0,

              creatureX:
                2,

              creatureY:
                3,

              moving:
                false,
            },
          ),
          0,
        );

        const moved =
          createPresentationModel(
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

              facingDirection: {
                x: 1,
                y: 0,
              },
            },
          );

        bundle.updatePresentation(
          moved,
          1,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          2,
        );

        /*
         * Food and sensory state are factual
         * current-world presentation and are not
         * locomotion-interpolated.
         */
        expect(
          bundle
            .actors
            .foodRoot
            .position
            .x,
        ).toBeCloseTo(
          moved.food.position.x,
        );

        expect(
          bundle
            .actors
            .foodRoot
            .position
            .z,
        ).toBeCloseTo(
          moved.food.position.y,
        );

        expect(
          bundle
            .actors
            .sensoryScreen
            .visible,
        ).toBe(
          true,
        );

        bundle.dispose();
      },
    );

    it(
      "places state-faithful actors in the presentation scene without adding cognition or simulation authority",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        expect(
          bundle.scene.getObjectByName(
            "embodiment-creature",
          ),
        ).toBe(
          bundle
            .actors
            .creatureRoot,
        );

        expect(
          bundle.scene.getObjectByName(
            "embodiment-food",
          ),
        ).toBe(
          bundle
            .actors
            .foodRoot,
        );

        expect(
          bundle.scene.getObjectByName(
            "embodiment-non-solid-sensory-screen",
          ),
        ).toBe(
          bundle
            .actors
            .sensoryScreen,
        );

        expect(
          bundle.scene.getObjectByName(
            "brain",
          ),
        ).toBeUndefined();

        expect(
          bundle.scene.getObjectByName(
            "simulation",
          ),
        ).toBeUndefined();

        bundle.dispose();
      },
    );

    it(
      "allows frame updates before the first presentation model without inventing a Creature transition",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
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

        bundle.updateFrame(
          100,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .x,
        ).toBe(
          positionBefore.x,
        );

        expect(
          bundle
            .actors
            .creatureRoot
            .position
            .z,
        ).toBe(
          positionBefore.z,
        );

        bundle.dispose();
      },
    );

    it(
      "rejects invalid camera aspect ratios",
      () => {
        expect(() =>
          createEmbodimentScene(
            0,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createEmbodimentScene(
            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createEmbodimentScene(
            Number.POSITIVE_INFINITY,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);