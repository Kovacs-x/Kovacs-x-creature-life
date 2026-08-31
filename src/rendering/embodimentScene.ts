import {
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
} from "three";

import type {
  M3PresentationModel,
} from "./m3Presentation.js";

import {
  createEmbodimentActorGraph,
  type EmbodimentActorGraph,
} from "./embodimentActors.js";

import {
  EMBODIMENT_GROUND_Y,
  M3_EMBODIMENT_SCENE_BOUNDS,
} from "./embodimentCoordinates.js";

/*
 * EMBODIMENT THREE.JS SCENE
 *
 * The accepted M3 simulation remains the sole
 * authority for Creature/world state.
 *
 * Authoritative simulation
 *   ->
 * M3PresentationModel
 *   ->
 * updatePresentation(...)
 *   ->
 * Three.js actor transforms
 *
 * This module does not:
 *
 * - advance simulation;
 * - evaluate cognition;
 * - select actions;
 * - create memory;
 * - alter learning;
 * - inspect hidden targets for behaviour;
 * - consume simulation RNG.
 */

export const EMBODIMENT_CAMERA_FOV_DEGREES =
  45;

export const EMBODIMENT_CAMERA_NEAR =
  0.1;

export const EMBODIMENT_CAMERA_FAR =
  100;

export const EMBODIMENT_BOUNDARY_Y =
  EMBODIMENT_GROUND_Y +
  0.02;

export const EMBODIMENT_CAMERA_TARGET = {
  x:
    M3_EMBODIMENT_SCENE_BOUNDS.centerX,

  y:
    EMBODIMENT_GROUND_Y,

  z:
    M3_EMBODIMENT_SCENE_BOUNDS.centerZ,
} as const;

export const EMBODIMENT_DEFAULT_CAMERA_POSITION = {
  x:
    M3_EMBODIMENT_SCENE_BOUNDS.centerX +
    8,

  y:
    10,

  z:
    M3_EMBODIMENT_SCENE_BOUNDS.centerZ +
    12,
} as const;

export interface EmbodimentSceneBundle {
  readonly scene:
    Scene;

  readonly camera:
    PerspectiveCamera;

  readonly floor:
    Mesh<
      PlaneGeometry,
      MeshStandardMaterial
    >;

  readonly boundary:
    LineLoop<
      BufferGeometry,
      LineBasicMaterial
    >;

  readonly hemisphereLight:
    HemisphereLight;

  readonly directionalLight:
    DirectionalLight;

  /*
   * State-faithful Three.js Creature,
   * food and sensory-screen presentation.
   */
  readonly actors:
    EmbodimentActorGraph;

  /*
   * The browser supplies only an already-derived
   * presentation model.
   *
   * No authoritative simulation state is owned
   * here.
   */
  readonly updatePresentation:
    (
      model:
        M3PresentationModel,
    ) => void;

  /*
   * Release GPU-backed geometry/material
   * resources owned by this scene bundle.
   */
  readonly dispose:
    () => void;
}

export function createEmbodimentScene(
  aspectRatio:
    number,
): EmbodimentSceneBundle {
  assertValidAspectRatio(
    aspectRatio,
  );

  const scene =
    new Scene();

  scene.name =
    "creature-life-embodiment-scene";

  scene.background =
    new Color(
      0xe8eef1,
    );

  const camera =
    createCamera(
      aspectRatio,
    );

  const floor =
    createHabitatFloor();

  const boundary =
    createHabitatBoundary();

  const hemisphereLight =
    new HemisphereLight(
      0xffffff,
      0x5f6b63,
      1.4,
    );

  hemisphereLight.name =
    "embodiment-hemisphere-light";

  const directionalLight =
    new DirectionalLight(
      0xffffff,
      1.6,
    );

  directionalLight.name =
    "embodiment-directional-light";

  directionalLight.position.set(
    M3_EMBODIMENT_SCENE_BOUNDS.centerX +
      4,

    12,

    M3_EMBODIMENT_SCENE_BOUNDS.centerZ +
      3,
  );

  const actors =
    createEmbodimentActorGraph();

  scene.add(
    camera,
    floor,
    boundary,
    hemisphereLight,
    directionalLight,
    actors.root,
  );

  return {
    scene,
    camera,
    floor,
    boundary,
    hemisphereLight,
    directionalLight,
    actors,

    updatePresentation: (
      model,
    ) => {
      actors.updatePresentation(
        model,
      );
    },

    dispose: () => {
      actors.dispose();

      floor.geometry.dispose();
      floor.material.dispose();

      boundary.geometry.dispose();
      boundary.material.dispose();
    },
  };
}

function createCamera(
  aspectRatio:
    number,
): PerspectiveCamera {
  const camera =
    new PerspectiveCamera(
      EMBODIMENT_CAMERA_FOV_DEGREES,
      aspectRatio,
      EMBODIMENT_CAMERA_NEAR,
      EMBODIMENT_CAMERA_FAR,
    );

  camera.name =
    "embodiment-camera";

  camera.position.set(
    EMBODIMENT_DEFAULT_CAMERA_POSITION.x,
    EMBODIMENT_DEFAULT_CAMERA_POSITION.y,
    EMBODIMENT_DEFAULT_CAMERA_POSITION.z,
  );

  camera.lookAt(
    EMBODIMENT_CAMERA_TARGET.x,
    EMBODIMENT_CAMERA_TARGET.y,
    EMBODIMENT_CAMERA_TARGET.z,
  );

  camera.updateProjectionMatrix();

  return camera;
}

function createHabitatFloor():
  Mesh<
    PlaneGeometry,
    MeshStandardMaterial
  > {
  const geometry =
    new PlaneGeometry(
      M3_EMBODIMENT_SCENE_BOUNDS.width,
      M3_EMBODIMENT_SCENE_BOUNDS.depth,
    );

  const material =
    new MeshStandardMaterial(
      {
        color:
          0xc6d4c2,

        roughness:
          0.92,

        metalness:
          0,
      },
    );

  const floor =
    new Mesh(
      geometry,
      material,
    );

  floor.name =
    "embodiment-habitat-floor";

  /*
   * PlaneGeometry starts in the XY plane.
   *
   * Rotate it onto XZ so:
   *
   * simulation x -> scene x
   * simulation y -> scene z
   */
  floor.rotation.x =
    -Math.PI /
    2;

  floor.position.set(
    M3_EMBODIMENT_SCENE_BOUNDS.centerX,
    EMBODIMENT_GROUND_Y,
    M3_EMBODIMENT_SCENE_BOUNDS.centerZ,
  );

  return floor;
}

function createHabitatBoundary():
  LineLoop<
    BufferGeometry,
    LineBasicMaterial
  > {
  /*
   * These points correspond exactly to the
   * authoritative M3 habitat corners.
   *
   * The tiny positive Y offset only prevents
   * presentation z-fighting with the floor.
   */
  const points = [
    new Vector3(
      M3_EMBODIMENT_SCENE_BOUNDS.minX,
      EMBODIMENT_BOUNDARY_Y,
      M3_EMBODIMENT_SCENE_BOUNDS.minZ,
    ),

    new Vector3(
      M3_EMBODIMENT_SCENE_BOUNDS.maxX,
      EMBODIMENT_BOUNDARY_Y,
      M3_EMBODIMENT_SCENE_BOUNDS.minZ,
    ),

    new Vector3(
      M3_EMBODIMENT_SCENE_BOUNDS.maxX,
      EMBODIMENT_BOUNDARY_Y,
      M3_EMBODIMENT_SCENE_BOUNDS.maxZ,
    ),

    new Vector3(
      M3_EMBODIMENT_SCENE_BOUNDS.minX,
      EMBODIMENT_BOUNDARY_Y,
      M3_EMBODIMENT_SCENE_BOUNDS.maxZ,
    ),
  ];

  const geometry =
    new BufferGeometry()
      .setFromPoints(
        points,
      );

  const material =
    new LineBasicMaterial(
      {
        color:
          0x52615a,
      },
    );

  const boundary =
    new LineLoop(
      geometry,
      material,
    );

  boundary.name =
    "embodiment-habitat-boundary";

  return boundary;
}

function assertValidAspectRatio(
  aspectRatio:
    number,
): void {
  if (
    !Number.isFinite(
      aspectRatio,
    ) ||
    aspectRatio <=
      0
  ) {
    throw new RangeError(
      "Embodiment camera aspect ratio must be finite and greater than zero.",
    );
  }
}