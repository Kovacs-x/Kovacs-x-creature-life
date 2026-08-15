import {
  describe,
  expect,
  it,
} from "vitest";

import {
  V0_VIEW_PADDING_PERCENT,
  worldCoordinateToViewportPercent,
} from "../../src/ui/v0Habitat.js";

describe(
  "V0.2 habitat viewport mapping",
  () => {
    it("maps the lower world boundary to the presentation margin", () => {
      expect(
        worldCoordinateToViewportPercent(
          0,
        ),
      ).toBe(
        V0_VIEW_PADDING_PERCENT,
      );
    });

    it("maps the world midpoint to the visual midpoint", () => {
      expect(
        worldCoordinateToViewportPercent(
          5,
        ),
      ).toBe(50);
    });

    it("maps the upper world boundary symmetrically inside the presentation margin", () => {
      expect(
        worldCoordinateToViewportPercent(
          10,
        ),
      ).toBe(
        100 -
          V0_VIEW_PADDING_PERCENT,
      );
    });

    it("preserves proportional world displacement in screen-space mapping", () => {
      const atTwo =
        worldCoordinateToViewportPercent(
          2,
        );

      const atThree =
        worldCoordinateToViewportPercent(
          3,
        );

      const atFour =
        worldCoordinateToViewportPercent(
          4,
        );

      expect(
        atThree -
          atTwo,
      ).toBeCloseTo(
        atFour -
          atThree,
      );
    });

    it("does not silently accept non-finite coordinates", () => {
      expect(() =>
        worldCoordinateToViewportPercent(
          Number.NaN,
        ),
      ).toThrow(
        "V0 viewport coordinate must be finite.",
      );

      expect(() =>
        worldCoordinateToViewportPercent(
          Number.POSITIVE_INFINITY,
        ),
      ).toThrow(
        "V0 viewport coordinate must be finite.",
      );
    });
  },
);