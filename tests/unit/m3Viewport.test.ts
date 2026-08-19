import {
  describe,
  expect,
  it,
} from "vitest";

import {
  clampM3WorldPositionToHabitatBounds,
  m3ViewportFractionToWorldPosition,
  worldXToViewportPercent,
  worldYToViewportPercent,
} from "../../src/ui/m3Viewport.js";

import {
  M3_HABITAT_BOUNDS,
} from "../../src/simulation/core/m3Contract.js";

describe(
  "M3 viewport <-> world coordinate transform",
  () => {
    it(
      "maps the habitat centre fraction to the world centre",
      () => {
        const position =
          m3ViewportFractionToWorldPosition(
            {
              fractionX: 0.5,
              fractionY: 0.5,
            },
          );

        const worldCentreX =
          (
            M3_HABITAT_BOUNDS.minX +
            M3_HABITAT_BOUNDS.maxX
          ) /
          2;

        const worldCentreY =
          (
            M3_HABITAT_BOUNDS.minY +
            M3_HABITAT_BOUNDS.maxY
          ) /
          2;

        expect(
          position.x,
        ).toBeCloseTo(
          worldCentreX,
        );

        expect(
          position.y,
        ).toBeCloseTo(
          worldCentreY,
        );
      },
    );

    it(
      "inverts Y because the habitat renders with bottom positioning",
      () => {
        const top =
          m3ViewportFractionToWorldPosition(
            {
              fractionX: 0.5,
              fractionY: 0,
            },
          );

        const bottom =
          m3ViewportFractionToWorldPosition(
            {
              fractionX: 0.5,
              fractionY: 1,
            },
          );

        expect(
          top.y,
        ).toBeGreaterThan(
          bottom.y,
        );

        expect(
          top.y,
        ).toBeCloseTo(
          M3_HABITAT_BOUNDS.maxY,
        );

        expect(
          bottom.y,
        ).toBeCloseTo(
          M3_HABITAT_BOUNDS.minY,
        );
      },
    );

    it(
      "clamps out-of-range fractions to the habitat bounds",
      () => {
        const beyondLeft =
          m3ViewportFractionToWorldPosition(
            {
              fractionX: -1,
              fractionY: 0.5,
            },
          );

        const beyondRight =
          m3ViewportFractionToWorldPosition(
            {
              fractionX: 2,
              fractionY: 0.5,
            },
          );

        expect(
          beyondLeft.x,
        ).toBe(
          M3_HABITAT_BOUNDS.minX,
        );

        expect(
          beyondRight.x,
        ).toBe(
          M3_HABITAT_BOUNDS.maxX,
        );
      },
    );

    it(
      "clamps an arbitrary world position to the habitat bounds",
      () => {
        const clamped =
          clampM3WorldPositionToHabitatBounds(
            {
              x:
                M3_HABITAT_BOUNDS.maxX +
                50,

              y:
                M3_HABITAT_BOUNDS.minY -
                50,
            },
          );

        expect(
          clamped,
        ).toEqual(
          {
            x:
              M3_HABITAT_BOUNDS.maxX,

            y:
              M3_HABITAT_BOUNDS.minY,
          },
        );
      },
    );

    it(
      "round-trips world -> viewport -> world for an interior point",
      () => {
        const worldX = 6;
        const worldY = 2;

        const percentX =
          worldXToViewportPercent(
            worldX,
          );

        const percentY =
          worldYToViewportPercent(
            worldY,
          );

        const position =
          m3ViewportFractionToWorldPosition(
            {
              fractionX:
                percentX /
                100,

              fractionY:
                1 -
                percentY /
                  100,
            },
          );

        expect(
          position.x,
        ).toBeCloseTo(
          worldX,
        );

        expect(
          position.y,
        ).toBeCloseTo(
          worldY,
        );
      },
    );

    it(
      "rejects non-finite viewport fractions",
      () => {
        expect(() =>
          m3ViewportFractionToWorldPosition(
            {
              fractionX:
                Number.NaN,

              fractionY: 0.5,
            },
          ),
        ).toThrow();
      },
    );
  },
);
