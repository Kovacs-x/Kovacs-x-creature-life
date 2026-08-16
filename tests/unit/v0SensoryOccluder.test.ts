import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createSensoryOccluder,
  isLineOfSightOccludedBySensoryOccluder,
} from "../../src/world/sensoryOccluder.js";

describe(
  "V0.4 sensory occluder geometry",
  () => {
    it("does not occlude while the sensory screen is inactive", () => {
      const occluder =
        createSensoryOccluder(
          2.5,
          0,
          2,
          false,
        );

      expect(
        isLineOfSightOccludedBySensoryOccluder(
          {
            x: 1,
            y: 0,
          },

          {
            x: 4,
            y: 0,
          },

          occluder,
        ),
      ).toBe(false);
    });

    it("occludes when the sight segment crosses the active screen", () => {
      const occluder =
        createSensoryOccluder(
          2.5,
          0,
          2,
          true,
        );

      expect(
        isLineOfSightOccludedBySensoryOccluder(
          {
            x: 1,
            y: 0,
          },

          {
            x: 4,
            y: 0,
          },

          occluder,
        ),
      ).toBe(true);
    });

    it("does not occlude when observer and target are on the same side", () => {
      const occluder =
        createSensoryOccluder(
          2.5,
          0,
          2,
          true,
        );

      expect(
        isLineOfSightOccludedBySensoryOccluder(
          {
            x: 3,
            y: 0,
          },

          {
            x: 4,
            y: 0,
          },

          occluder,
        ),
      ).toBe(false);
    });

    it("does not occlude when the crossing occurs outside the finite screen height", () => {
      const occluder =
        createSensoryOccluder(
          2.5,
          0,
          2,
          true,
        );

      expect(
        isLineOfSightOccludedBySensoryOccluder(
          {
            x: 1,
            y: 3,
          },

          {
            x: 4,
            y: 3,
          },

          occluder,
        ),
      ).toBe(false);
    });

    it("does not treat an observer on the non-solid screen as hidden behind itself", () => {
      const occluder =
        createSensoryOccluder(
          2.5,
          0,
          2,
          true,
        );

      expect(
        isLineOfSightOccludedBySensoryOccluder(
          {
            x: 2.5,
            y: 0,
          },

          {
            x: 4,
            y: 0,
          },

          occluder,
        ),
      ).toBe(false);
    });

    it("rejects invalid screen geometry", () => {
      expect(() =>
        createSensoryOccluder(
          Number.NaN,
          0,
          2,
        ),
      ).toThrow(
        "Sensory occluder geometry must use finite coordinates.",
      );

      expect(() =>
        createSensoryOccluder(
          2.5,
          3,
          2,
        ),
      ).toThrow(
        "Sensory occluder maxY must be greater than or equal to minY.",
      );
    });
  },
);