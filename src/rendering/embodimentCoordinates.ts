import {
  M3_HABITAT_BOUNDS,
} from "../simulation/core/m3Contract.js";

/*
 * EMBODIMENT SCENE COORDINATE BOUNDARY
 *
 * The accepted M3 simulation remains planar:
 *
 * simulation x -> scene x
 * simulation y -> scene z
 *
 * Scene Y is presentation-only vertical height.
 *
 * This module is deliberately independent of
 * Three.js so the coordinate contract can be
 * tested without a renderer, browser, camera,
 * WebGL context, or presentation frame loop.
 *
 * It does not:
 *
 * - simulate;
 * - evaluate cognition;
 * - move the Creature;
 * - move food;
 * - inspect hidden targets;
 * - consume simulation RNG.
 */

export const EMBODIMENT_GROUND_Y =
  0;

export interface EmbodimentWorldPosition {
  readonly x:
    number;

  readonly y:
    number;
}

export interface EmbodimentScenePlanarPosition {
  readonly x:
    number;

  readonly z:
    number;
}

export interface EmbodimentScenePosition
  extends EmbodimentScenePlanarPosition {
  /*
   * Presentation-only vertical coordinate.
   *
   * This value never becomes an authoritative
   * Creature/world coordinate.
   */
  readonly y:
    number;
}

/*
 * The scene floor uses the authoritative M3
 * habitat bounds directly.
 *
 * No scale factor or hidden padding is applied.
 * This keeps future rendering and raycasting
 * reversible at the presentation boundary.
 */
export const M3_EMBODIMENT_SCENE_BOUNDS = {
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
} as const;

/*
 * Convert an authoritative planar M3 position
 * into presentation-space 3D coordinates.
 *
 * visualHeight is deliberately explicit and
 * presentation-only. Changing it cannot change
 * the authoritative world position.
 */
export function m3WorldPositionToEmbodimentScenePosition(
  position:
    EmbodimentWorldPosition,

  visualHeight:
    number =
      EMBODIMENT_GROUND_Y,
): EmbodimentScenePosition {
  assertFiniteWorldPosition(
    position,
  );

  assertWorldPositionWithinHabitat(
    position,
  );

  assertFiniteNumber(
    visualHeight,
    "Embodiment visual height",
  );

  return {
    x:
      position.x,

    y:
      visualHeight,

    z:
      position.y,
  };
}

/*
 * Convert a point on the presentation scene
 * plane back into an authoritative planar
 * coordinate.
 *
 * Scene Y is intentionally absent from the
 * input because vertical presentation geometry
 * has no authoritative simulation meaning.
 *
 * Future floor raycasting may call this after
 * obtaining an intersection on the bounded
 * habitat floor.
 */
export function embodimentScenePlanarPositionToM3WorldPosition(
  position:
    EmbodimentScenePlanarPosition,
): EmbodimentWorldPosition {
  assertFiniteScenePlanarPosition(
    position,
  );

  const worldPosition:
    EmbodimentWorldPosition = {
      x:
        position.x,

      y:
        position.z,
    };

  assertWorldPositionWithinHabitat(
    worldPosition,
  );

  return worldPosition;
}

function assertFiniteWorldPosition(
  position:
    EmbodimentWorldPosition,
): void {
  assertFiniteNumber(
    position.x,
    "M3 world X",
  );

  assertFiniteNumber(
    position.y,
    "M3 world Y",
  );
}

function assertFiniteScenePlanarPosition(
  position:
    EmbodimentScenePlanarPosition,
): void {
  assertFiniteNumber(
    position.x,
    "Embodiment scene X",
  );

  assertFiniteNumber(
    position.z,
    "Embodiment scene Z",
  );
}

function assertWorldPositionWithinHabitat(
  position:
    EmbodimentWorldPosition,
): void {
  if (
    position.x <
      M3_HABITAT_BOUNDS.minX ||
    position.x >
      M3_HABITAT_BOUNDS.maxX ||
    position.y <
      M3_HABITAT_BOUNDS.minY ||
    position.y >
      M3_HABITAT_BOUNDS.maxY
  ) {
    throw new RangeError(
      "Embodiment position must remain within the authoritative M3 habitat bounds.",
    );
  }
}

function assertFiniteNumber(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      `${label} must be finite.`,
    );
  }
}