export const SENSORY_OCCLUDER_KIND =
  "sensory-occluder" as const;

export interface WorldPoint2D {
  readonly x:
    number;

  readonly y:
    number;
}

/*
 * Deliberately narrow V0 world object.
 *
 * This is a vertical sensory screen.
 *
 * It is not:
 *
 * - a solid collision body;
 * - a navigation obstacle;
 * - a cognitive object;
 * - a memory object.
 *
 * Its only world-level function is to
 * interrupt a line of sight when active.
 */
export interface SensoryOccluderState {
  readonly kind:
    typeof SENSORY_OCCLUDER_KIND;

  readonly active:
    boolean;

  readonly x:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;
}

export function createSensoryOccluder(
  x:
    number,

  minY:
    number,

  maxY:
    number,

  active =
    true,
): SensoryOccluderState {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY)
  ) {
    throw new RangeError(
      "Sensory occluder geometry must use finite coordinates.",
    );
  }

  if (maxY < minY) {
    throw new RangeError(
      "Sensory occluder maxY must be greater than or equal to minY.",
    );
  }

  return {
    kind:
      SENSORY_OCCLUDER_KIND,

    active,

    x,

    minY,

    maxY,
  };
}

/*
 * Pure deterministic world-visibility test.
 *
 * observer
 *      \
 *       \
 *        | sensory screen
 *       /
 *      /
 * target
 *
 * This function has access to world geometry
 * because visibility is a world/sensory
 * transformation.
 *
 * Its output is only:
 *
 * true  = the sight line is blocked
 * false = the sight line is not blocked
 *
 * Target coordinates are never returned to
 * Creature cognition.
 */
export function isLineOfSightOccludedBySensoryOccluder(
  observer:
    WorldPoint2D,

  target:
    WorldPoint2D,

  occluder:
    SensoryOccluderState,
): boolean {
  assertFinitePoint(
    observer,
    "observer",
  );

  assertFinitePoint(
    target,
    "target",
  );

  if (!occluder.active) {
    return false;
  }

  const observerSide =
    observer.x -
    occluder.x;

  const targetSide =
    target.x -
    occluder.x;

  /*
   * An endpoint exactly on the sensory screen
   * is not treated as being hidden behind it.
   *
   * This prevents the screen from creating a
   * self-occlusion case while the Creature is
   * crossing its non-solid geometry.
   */
  if (
    observerSide === 0 ||
    targetSide === 0
  ) {
    return false;
  }

  /*
   * Both points on the same side means the
   * finite sight segment does not cross the
   * screen's X coordinate.
   */
  if (
    observerSide *
      targetSide >
    0
  ) {
    return false;
  }

  const deltaX =
    target.x -
    observer.x;

  if (deltaX === 0) {
    return false;
  }

  const intersectionFraction =
    (
      occluder.x -
      observer.x
    ) /
    deltaX;

  /*
   * We only care about an intersection
   * strictly between observer and target.
   */
  if (
    intersectionFraction <= 0 ||
    intersectionFraction >= 1
  ) {
    return false;
  }

  const intersectionY =
    observer.y +
    (
      target.y -
      observer.y
    ) *
      intersectionFraction;

  return (
    intersectionY >=
      occluder.minY &&
    intersectionY <=
      occluder.maxY
  );
}

function assertFinitePoint(
  point:
    WorldPoint2D,

  label:
    string,
): void {
  if (
    !Number.isFinite(
      point.x,
    ) ||
    !Number.isFinite(
      point.y,
    )
  ) {
    throw new RangeError(
      `Sensory occlusion ${label} must use finite coordinates.`,
    );
  }
}