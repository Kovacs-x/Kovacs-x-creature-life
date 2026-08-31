import {
  Raycaster,
  Vector2,
  type Camera,
  type Object3D,
} from "three";

import {
  embodimentScenePlanarPositionToM3WorldPosition,
  type EmbodimentWorldPosition,
} from "./embodimentCoordinates.js";

/*
 * EMBODIMENT FLOOR RAYCAST
 *
 * Player-input interpretation only.
 *
 * canvas pointer
 *   -> normalized device coordinates
 *   -> reject anything outside the canvas viewport
 *   -> Three.js Raycaster
 *   -> intersect ONLY the supplied habitat floor
 *      presentation mesh
 *   -> intersection scene x/z
 *   -> embodimentScenePlanarPositionToM3WorldPosition(...)
 *   -> authoritative planar world position, or null
 *
 * This module:
 *
 * - never inspects food, the Creature, or any
 *   other scene object (the caller supplies only
 *   the floor, and intersectObject() is called
 *   with recursive = false against that one
 *   object);
 * - never selects an action;
 * - never consumes authoritative simulation RNG
 *   (Raycaster/Vector2 are pure geometry math);
 * - never calls the authoritative simulation tick;
 * - never writes to food/world state itself.
 *
 * It only answers "if the player's pointer means
 * anything on the authoritative floor, what
 * authoritative world position does it mean?". The
 * caller decides what, if anything, to do with that
 * answer (see embodimentThreeRenderer.ts, which is
 * the only place this may reach outward toward
 * M3ApplicationController.placeFood(...)).
 */
export interface EmbodimentPointerNdc {
  readonly x:
    number;

  readonly y:
    number;
}

/*
 * Valid normalized-device-coordinate range for a
 * point that genuinely lies within the renderer's
 * own viewport/canvas.
 *
 * A pointer released after being dragged outside
 * the canvas (for example while OrbitControls holds
 * pointer capture during an orbit gesture) still
 * delivers a pointerup with a client position, which
 * would otherwise convert to an NDC component
 * outside this range. Rejecting that here keeps a
 * release outside the canvas from ever being treated
 * as a legitimate floor tap.
 */
const EMBODIMENT_NDC_MIN =
  -1;

const EMBODIMENT_NDC_MAX =
  1;

export function isEmbodimentPointerNdcWithinViewport(
  pointerNdc:
    EmbodimentPointerNdc,
): boolean {
  return (
    pointerNdc.x >=
      EMBODIMENT_NDC_MIN &&
    pointerNdc.x <=
      EMBODIMENT_NDC_MAX &&
    pointerNdc.y >=
      EMBODIMENT_NDC_MIN &&
    pointerNdc.y <=
      EMBODIMENT_NDC_MAX
  );
}

export function raycastEmbodimentFloorToWorldPosition(
  camera:
    Camera,

  floor:
    Object3D,

  pointerNdc:
    EmbodimentPointerNdc,
): EmbodimentWorldPosition | null {
  assertFiniteNdcComponent(
    pointerNdc.x,
    "Embodiment pointer NDC x",
  );

  assertFiniteNdcComponent(
    pointerNdc.y,
    "Embodiment pointer NDC y",
  );

  if (
    !isEmbodimentPointerNdcWithinViewport(
      pointerNdc,
    )
  ) {
    return null;
  }

  const raycaster =
    new Raycaster();

  raycaster.setFromCamera(
    new Vector2(
      pointerNdc.x,
      pointerNdc.y,
    ),

    camera,
  );

  const intersections =
    raycaster.intersectObject(
      floor,

      /*
       * Never recurse into children. The floor
       * mesh is the entire authoritative
       * interaction surface; nothing else in the
       * scene graph is a legitimate placement
       * target.
       */
      false,
    );

  const hit =
    intersections[0];

  if (
    hit ===
    undefined
  ) {
    return null;
  }

  try {
    return embodimentScenePlanarPositionToM3WorldPosition(
      {
        x:
          hit.point.x,

        z:
          hit.point.z,
      },
    );
  } catch (
    error
  ) {
    /*
     * A floor hit outside the authoritative
     * habitat bounds must not bypass the
     * established coordinate boundary by producing
     * an out-of-bounds placement; it is simply
     * treated as not a valid placement intent.
     *
     * Only the specific, documented RangeError that
     * embodimentScenePlanarPositionToM3WorldPosition(...)
     * throws for an out-of-bounds position is
     * handled this way. Any other, unexpected
     * failure is a genuine defect and must not be
     * silently swallowed.
     */
    if (
      error instanceof
      RangeError
    ) {
      return null;
    }

    throw error;
  }
}

function assertFiniteNdcComponent(
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
