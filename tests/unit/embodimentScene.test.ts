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
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

function createPresentationModel():
  M3PresentationModel {
  return {
    schemaVersion:
      M3_PRESENTATION_MODEL_SCHEMA_VERSION,

    tickIndex:
      3,

    simulationTimeSeconds:
      3,

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
      "forwards the existing presentation model into the scene actor graph",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        const model =
          createPresentationModel();

        bundle.updatePresentation(
          model,
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