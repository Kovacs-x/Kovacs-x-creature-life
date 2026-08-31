import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_GROUND_Y,
  M3_EMBODIMENT_SCENE_BOUNDS,
  embodimentScenePlanarPositionToM3WorldPosition,
  m3WorldPositionToEmbodimentScenePosition,
} from "../../src/rendering/embodimentCoordinates.js";

import {
  M3_HABITAT_BOUNDS,
} from "../../src/simulation/core/m3Contract.js";

describe(
  "embodiment simulation <-> scene coordinate boundary",
  () => {
    it(
      "derives the scene floor directly from the authoritative M3 habitat bounds",
      () => {
        expect(
          M3_EMBODIMENT_SCENE_BOUNDS,
        ).toEqual(
          {
            minX:
              M3_HABITAT_BOUNDS.minX,

            maxX:
              M3_HABITAT_BOUNDS.maxX,

            minZ:
              M3_HABITAT_BOUNDS.minY,

            maxZ:
              M3_HABITAT_BOUNDS.maxY,

            width:
              M3_HABITAT_BOUNDS.maxX -
              M3_HABITAT_BOUNDS.minX,

            depth:
              M3_HABITAT_BOUNDS.maxY -
              M3_HABITAT_BOUNDS.minY,

            centerX:
              (
                M3_HABITAT_BOUNDS.minX +
                M3_HABITAT_BOUNDS.maxX
              ) /
              2,

            centerZ:
              (
                M3_HABITAT_BOUNDS.minY +
                M3_HABITAT_BOUNDS.maxY
              ) /
              2,
          },
        );
      },
    );

    it(
      "maps simulation X to scene X and simulation Y to scene Z",
      () => {
        const scenePosition =
          m3WorldPositionToEmbodimentScenePosition(
            {
              x: 3,
              y: 7,
            },
          );

        expect(
          scenePosition,
        ).toEqual(
          {
            x: 3,
            y:
              EMBODIMENT_GROUND_Y,
            z: 7,
          },
        );
      },
    );

    it(
      "maps both authoritative habitat corners exactly",
      () => {
        const minimum =
          m3WorldPositionToEmbodimentScenePosition(
            {
              x:
                M3_HABITAT_BOUNDS.minX,

              y:
                M3_HABITAT_BOUNDS.minY,
            },
          );

        const maximum =
          m3WorldPositionToEmbodimentScenePosition(
            {
              x:
                M3_HABITAT_BOUNDS.maxX,

              y:
                M3_HABITAT_BOUNDS.maxY,
            },
          );

        expect(
          minimum,
        ).toEqual(
          {
            x:
              M3_EMBODIMENT_SCENE_BOUNDS.minX,

            y:
              EMBODIMENT_GROUND_Y,

            z:
              M3_EMBODIMENT_SCENE_BOUNDS.minZ,
          },
        );

        expect(
          maximum,
        ).toEqual(
          {
            x:
              M3_EMBODIMENT_SCENE_BOUNDS.maxX,

            y:
              EMBODIMENT_GROUND_Y,

            z:
              M3_EMBODIMENT_SCENE_BOUNDS.maxZ,
          },
        );
      },
    );

    it(
      "allows presentation-only vertical height without changing planar coordinates",
      () => {
        const scenePosition =
          m3WorldPositionToEmbodimentScenePosition(
            {
              x: 4,
              y: 6,
            },
            2.5,
          );

        expect(
          scenePosition,
        ).toEqual(
          {
            x: 4,
            y: 2.5,
            z: 6,
          },
        );

        const worldPosition =
          embodimentScenePlanarPositionToM3WorldPosition(
            {
              x:
                scenePosition.x,

              z:
                scenePosition.z,
            },
          );

        expect(
          worldPosition,
        ).toEqual(
          {
            x: 4,
            y: 6,
          },
        );
      },
    );

    it(
      "round-trips an interior authoritative position exactly",
      () => {
        const original = {
          x: 6.25,
          y: 1.75,
        };

        const scenePosition =
          m3WorldPositionToEmbodimentScenePosition(
            original,
          );

        const restored =
          embodimentScenePlanarPositionToM3WorldPosition(
            {
              x:
                scenePosition.x,

              z:
                scenePosition.z,
            },
          );

        expect(
          restored,
        ).toEqual(
          original,
        );
      },
    );

    it(
      "rejects non-finite world coordinates",
      () => {
        expect(() =>
          m3WorldPositionToEmbodimentScenePosition(
            {
              x:
                Number.NaN,

              y: 5,
            },
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          m3WorldPositionToEmbodimentScenePosition(
            {
              x: 5,

              y:
                Number.POSITIVE_INFINITY,
            },
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "rejects non-finite presentation height",
      () => {
        expect(() =>
          m3WorldPositionToEmbodimentScenePosition(
            {
              x: 5,
              y: 5,
            },
            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "rejects authoritative positions outside the habitat instead of silently hiding them",
      () => {
        expect(() =>
          m3WorldPositionToEmbodimentScenePosition(
            {
              x:
                M3_HABITAT_BOUNDS.maxX +
                0.01,

              y: 5,
            },
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          embodimentScenePlanarPositionToM3WorldPosition(
            {
              x: 5,

              z:
                M3_HABITAT_BOUNDS.minY -
                0.01,
            },
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);