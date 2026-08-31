import {
  describe,
  expect,
  it,
} from "vitest";

import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type PerspectiveCamera,
} from "three";

import {
  createEmbodimentScene,
} from "../../src/rendering/embodimentScene.js";

import {
  isEmbodimentPointerNdcWithinViewport,
  raycastEmbodimentFloorToWorldPosition,
} from "../../src/rendering/embodimentFloorRaycast.js";

import {
  createM3AcquisitionState,
  serializeM3AcquisitionState,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

/*
 * Positions the camera directly above the given
 * world x/z, looking straight down. With a
 * symmetric perspective frustum, NDC (0, 0) is
 * therefore the principal ray straight down
 * through that exact point, which lets these
 * tests assert an exact expected floor hit rather
 * than an approximate one.
 */
function pointCameraStraightDownAt(
  camera:
    PerspectiveCamera,

  worldX:
    number,

  worldZ:
    number,
): void {
  camera.position.set(
    worldX,
    5,
    worldZ,
  );

  /*
   * A straight-down view direction is parallel to
   * the default (0, 1, 0) up vector, which would
   * otherwise leave the camera orientation
   * degenerate.
   */
  camera.up.set(
    0,
    0,
    -1,
  );

  camera.lookAt(
    worldX,
    0,
    worldZ,
  );

  camera.updateMatrixWorld(
    true,
  );
}

describe(
  "embodiment floor raycast",
  () => {
    it(
      "converts a straight-down floor hit's scene x/z to the exact expected M3 world x/y",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.floor.updateMatrixWorld(
          true,
        );

        /*
         * Deliberately avoids the exact
         * mathematical corners of the floor mesh
         * (e.g. precisely (0, 0)): a perfectly
         * straight-down ray whose origin lines up
         * exactly with a finite mesh's vertex can
         * graze just outside that mesh's face by a
         * sub-nanometer floating-point amount and
         * miss entirely, which is an inherent
         * property of finite-precision raycasting
         * geometry rather than anything this
         * module could or should compensate for.
         * Real pointer input, quantized to device
         * pixels and never perfectly vertical,
         * cannot reproduce that exact degeneracy.
         */
        const cases = [
          { x: 3, y: 6 },
          { x: 0.25, y: 0.25 },
          { x: 9.75, y: 9.75 },
          { x: 7.25, y: 1.5 },
        ];

        for (
          const expected of
          cases
        ) {
          pointCameraStraightDownAt(
            bundle.camera,
            expected.x,
            expected.y,
          );

          const result =
            raycastEmbodimentFloorToWorldPosition(
              bundle.camera,
              bundle.floor,

              {
                x: 0,
                y: 0,
              },
            );

          expect(
            result,
          ).not.toBeNull();

          expect(
            result?.x,
          ).toBeCloseTo(
            expected.x,
            10,
          );

          expect(
            result?.y,
          ).toBeCloseTo(
            expected.y,
            10,
          );
        }
      },
    );

    it(
      "returns null and emits no placement intent when the ray misses the floor entirely",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.floor.updateMatrixWorld(
          true,
        );

        /*
         * Camera looks straight up, away from the
         * floor plane; the principal ray can never
         * intersect it.
         */
        bundle.camera.position.set(
          5,
          5,
          5,
        );

        bundle.camera.up.set(
          0,
          1,
          0,
        );

        bundle.camera.lookAt(
          5,
          100,
          5,
        );

        bundle.camera.updateMatrixWorld(
          true,
        );

        const result =
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            bundle.floor,

            {
              x: 0,
              y: 0,
            },
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    it(
      "returns null rather than bypassing the habitat coordinate boundary when a hit lands outside authoritative bounds",
      () => {
        /*
         * A deliberately oversized floor mesh, used
         * only to prove that a hit outside the real
         * habitat cannot slip past
         * embodimentScenePlanarPositionToM3WorldPosition(...)'s
         * bounds check. The real application floor
         * is always sized exactly to the
         * authoritative habitat and could not
         * itself produce such a hit; this is a
         * defensive-boundary test, not a claim
         * about the real floor's geometry.
         */
        const oversizedFloor =
          new Mesh(
            new PlaneGeometry(
              1000,
              1000,
            ),

            new MeshStandardMaterial(),
          );

        oversizedFloor.rotation.x =
          -Math.PI /
          2;

        oversizedFloor.position.set(
          5,
          0,
          5,
        );

        oversizedFloor.updateMatrixWorld(
          true,
        );

        const bundle =
          createEmbodimentScene(
            1,
          );

        pointCameraStraightDownAt(
          bundle.camera,
          500,
          500,
        );

        const result =
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            oversizedFloor,

            {
              x: 0,
              y: 0,
            },
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    describe(
      "pointer NDC viewport boundary",
      () => {
        it(
          "recognizes NDC exactly at the viewport edges and corners as within the viewport",
          () => {
            const edgesAndCorners = [
              { x: -1, y: -1 },
              { x: 1, y: 1 },
              { x: -1, y: 1 },
              { x: 1, y: -1 },
              { x: 0, y: 0 },
            ];

            for (
              const ndc of
              edgesAndCorners
            ) {
              expect(
                isEmbodimentPointerNdcWithinViewport(
                  ndc,
                ),
              ).toBe(
                true,
              );
            }
          },
        );

        it(
          "recognizes NDC beyond the viewport as outside it",
          () => {
            const outside = [
              { x: -1.01, y: 0 },
              { x: 1.01, y: 0 },
              { x: 0, y: -1.01 },
              { x: 0, y: 1.01 },
            ];

            for (
              const ndc of
              outside
            ) {
              expect(
                isEmbodimentPointerNdcWithinViewport(
                  ndc,
                ),
              ).toBe(
                false,
              );
            }
          },
        );

        it(
          "returns null instead of raycasting when the pointer NDC lies outside the canvas viewport",
          () => {
            /*
             * Simulates a pointerup delivered after
             * the pointer left the canvas while
             * OrbitControls held capture during a
             * drag - the resulting client position
             * converts to an NDC component beyond
             * +-1. This must never be treated as a
             * legitimate floor tap, however the
             * camera happens to be aimed.
             */
            const bundle =
              createEmbodimentScene(
                1,
              );

            bundle.floor.updateMatrixWorld(
              true,
            );

            pointCameraStraightDownAt(
              bundle.camera,
              5,
              5,
            );

            const result =
              raycastEmbodimentFloorToWorldPosition(
                bundle.camera,
                bundle.floor,

                {
                  x: 1.4,
                  y: 0,
                },
              );

            expect(
              result,
            ).toBeNull();
          },
        );
      },
    );

    it(
      "rejects non-finite pointer coordinates instead of raycasting with them",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        expect(() =>
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            bundle.floor,

            {
              x:
                Number.NaN,

              y: 0,
            },
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            bundle.floor,

            {
              x: 0,

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
      "leaves authoritative simulation state completely unchanged across many hits and misses",
      () => {
        const state =
          createM3AcquisitionState(
            {
              seed:
                M3_PRIMARY_BRANCH_A_SEED,

              learningEnabled:
                true,

              explorationEnabled:
                true,
            },
          );

        const before =
          serializeM3AcquisitionState(
            state,
          );

        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.floor.updateMatrixWorld(
          true,
        );

        for (
          let i = 0;
          i < 25;
          i += 1
        ) {
          pointCameraStraightDownAt(
            bundle.camera,

            (
              i %
              10
            ),

            5,
          );

          /*
           * Results are intentionally discarded.
           * Raycasting has no route back into
           * `state` at all: this function never
           * receives it.
           */
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            bundle.floor,

            {
              x: 0,
              y: 0,
            },
          );
        }

        expect(
          serializeM3AcquisitionState(
            state,
          ),
        ).toBe(
          before,
        );
      },
    );

    it(
      "returns only plain, inert position data rather than anything capable of side effects",
      () => {
        const bundle =
          createEmbodimentScene(
            1,
          );

        bundle.floor.updateMatrixWorld(
          true,
        );

        pointCameraStraightDownAt(
          bundle.camera,
          4,
          4,
        );

        const result =
          raycastEmbodimentFloorToWorldPosition(
            bundle.camera,
            bundle.floor,

            {
              x: 0,
              y: 0,
            },
          );

        expect(
          result,
        ).not.toBeNull();

        expect(
          JSON.parse(
            JSON.stringify(
              result,
            ),
          ),
        ).toEqual(
          result,
        );

        expect(
          Object.keys(
            result ??
              {},
          ).sort(),
        ).toEqual(
          [
            "x",
            "y",
          ],
        );
      },
    );
  },
);
