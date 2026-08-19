import type {
  M3PlayerWorldPosition,
} from "../simulation/core/m3PlayerWorld.js";

import {
  M3_HABITAT_BOUNDS,
} from "../simulation/core/m3Contract.js";

/*
 * M3 PLAYER -> WORLD VIEWPORT TRANSFORM
 *
 * This module converts between the authoritative
 * M3 habitat coordinate space and normalized
 * on-screen fractions.
 *
 * It is pure presentation/input geometry:
 *
 * - it does not evaluate the brain;
 * - it does not select an action;
 * - it does not move the Creature;
 * - it does not inform cognition;
 * - it does not consume simulation RNG.
 *
 * The same padding convention is used both to
 * position rendered entities and to convert a
 * player tap/click back into a world position,
 * so a tap visually lands where it places food.
 */

/*
 * A small screen-space margin keeps entities
 * centred on the world boundaries from being
 * visually clipped. This is presentation
 * geometry only.
 */
export const M3_VIEW_PADDING_PERCENT =
  7;

export interface M3ViewportFraction {
  /*
   * 0 = habitat left edge, 1 = habitat right
   * edge.
   */
  readonly fractionX:
    number;

  /*
   * 0 = habitat top edge, 1 = habitat bottom
   * edge (ordinary DOM pointer-event
   * convention).
   */
  readonly fractionY:
    number;
}

export function worldXToViewportPercent(
  x:
    number,
): number {
  return worldToViewportPercent(
    x,
    M3_HABITAT_BOUNDS.minX,
    M3_HABITAT_BOUNDS.maxX,
  );
}

export function worldYToViewportPercent(
  y:
    number,
): number {
  return worldToViewportPercent(
    y,
    M3_HABITAT_BOUNDS.minY,
    M3_HABITAT_BOUNDS.maxY,
  );
}

/*
 * Convert a normalized pointer fraction within
 * the habitat element into a clamped
 * authoritative M3 habitat position.
 *
 * fractionY follows ordinary top-down DOM
 * convention. World Y increases upward because
 * the habitat renders with CSS bottom
 * positioning, so this function inverts Y.
 */
export function m3ViewportFractionToWorldPosition(
  fraction:
    M3ViewportFraction,
): M3PlayerWorldPosition {
  if (
    !Number.isFinite(
      fraction.fractionX,
    ) ||
    !Number.isFinite(
      fraction.fractionY,
    )
  ) {
    throw new RangeError(
      "M3 viewport fraction must use finite components.",
    );
  }

  const worldX =
    viewportFractionToWorld(
      fraction.fractionX,
      M3_HABITAT_BOUNDS.minX,
      M3_HABITAT_BOUNDS.maxX,
    );

  const worldY =
    viewportFractionToWorld(
      1 -
        fraction.fractionY,
      M3_HABITAT_BOUNDS.minY,
      M3_HABITAT_BOUNDS.maxY,
    );

  return clampM3WorldPositionToHabitatBounds(
    {
      x:
        worldX,

      y:
        worldY,
    },
  );
}

export function clampM3WorldPositionToHabitatBounds(
  position:
    M3PlayerWorldPosition,
): M3PlayerWorldPosition {
  return {
    x:
      clamp(
        position.x,
        M3_HABITAT_BOUNDS.minX,
        M3_HABITAT_BOUNDS.maxX,
      ),

    y:
      clamp(
        position.y,
        M3_HABITAT_BOUNDS.minY,
        M3_HABITAT_BOUNDS.maxY,
      ),
  };
}

function worldToViewportPercent(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      "M3 viewport coordinate must be finite.",
    );
  }

  const span =
    maximum -
    minimum;

  const normalized =
    (
      value -
      minimum
    ) /
    span;

  const usablePercent =
    100 -
    M3_VIEW_PADDING_PERCENT *
      2;

  return (
    M3_VIEW_PADDING_PERCENT +
    normalized *
      usablePercent
  );
}

function viewportFractionToWorld(
  fraction:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  const paddingFraction =
    M3_VIEW_PADDING_PERCENT /
    100;

  const usableFraction =
    1 -
    paddingFraction *
      2;

  const normalized =
    (
      fraction -
      paddingFraction
    ) /
    usableFraction;

  return (
    minimum +
    normalized *
      (
        maximum -
        minimum
      )
  );
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
