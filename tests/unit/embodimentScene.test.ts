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

describe(
  "embodiment Three.js scene foundation",
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
      "does not create any Creature, food, cognition, or simulation object in the E1 scene foundation",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        expect(
          bundle.scene.getObjectByName(
            "creature",
          ),
        ).toBeUndefined();

        expect(
          bundle.scene.getObjectByName(
            "food",
          ),
        ).toBeUndefined();

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