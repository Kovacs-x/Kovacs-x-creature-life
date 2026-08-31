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
  advanceEmbodimentLocomotionState,
  createEmbodimentLocomotionState,
  sampleEmbodimentLocomotion,
  type EmbodimentLocomotionState,
} from "./embodimentLocomotion.js";

import {
  advanceEmbodimentAnimationState,
  createEmbodimentAnimationState,
  sampleEmbodimentAnimation,
  type EmbodimentAnimationState,
} from "./embodimentAnimation.js";

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
 * factual actor update
 *   ->
 * presentation interpolation / animation
 *   ->
 * Three.js transforms
 *
 * requestAnimationFrame-facing work here is
 * presentation only.
 *
 * It must never:
 *
 * - advance simulation;
 * - evaluate cognition;
 * - select actions;
 * - create memory;
 * - alter learning;
 * - alter biology;
 * - alter exploration;
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

  readonly actors:
    EmbodimentActorGraph;

  /*
   * Accept a newly derived authoritative
   * presentation model at an absolute browser
   * presentation timestamp.
   */
  readonly updatePresentation:
    (
      model:
        M3PresentationModel,

      presentationTimeSeconds:
        number,
    ) => void;

  /*
   * Sample presentation-only locomotion and
   * animation at an absolute browser timestamp.
   *
   * This never advances simulation time.
   */
  readonly updateFrame:
    (
      presentationTimeSeconds:
        number,
    ) => void;

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

  /*
   * Capture the authored primitive body's
   * neutral scale once.
   *
   * Animation samples are multipliers around
   * this authored presentation shape.
   *
   * This avoids duplicating geometry constants
   * in the animation system.
   */
  const creatureBodyNeutralScale = {
    x:
      actors
        .creatureBody
        .scale
        .x,

    y:
      actors
        .creatureBody
        .scale
        .y,

    z:
      actors
        .creatureBody
        .scale
        .z,
  } as const;

  scene.add(
    camera,
    floor,
    boundary,
    hemisphereLight,
    directionalLight,
    actors.root,
  );

  /*
   * Both states below are renderer-owned
   * presentation state only.
   *
   * Neither is serialized as Creature state or
   * fed into cognition.
   */
  let locomotionState:
    EmbodimentLocomotionState | null =
      null;

  let animationState:
    EmbodimentAnimationState | null =
      null;

  const updateFrame =
    (
      presentationTimeSeconds:
        number,
    ): void => {
      if (
        locomotionState ===
          null ||
        animationState ===
          null
      ) {
        return;
      }

      /*
       * performance.now() read during an
       * authoritative presentation update may be
       * infinitesimally later than the timestamp
       * delivered by the immediately following
       * RAF callback.
       *
       * Clamp only presentation sampling time so
       * browser scheduling cannot make visual
       * time move backwards.
       *
       * Simulation time is entirely unrelated to
       * this value.
       */
      const effectivePresentationTimeSeconds =
        Math.max(
          presentationTimeSeconds,
          animationState
            .lastPresentationTimeSeconds,
        );

      const locomotionSample =
        sampleEmbodimentLocomotion(
          locomotionState,
          effectivePresentationTimeSeconds,
        );

      const animationSample =
        sampleEmbodimentAnimation(
          animationState,
          effectivePresentationTimeSeconds,
          locomotionSample.transitioning,
        );

      /*
       * X/Z are the visually interpolated
       * presentation of authoritative planar
       * Creature movement.
       */
      actors.creatureRoot.position.x =
        locomotionSample
          .position
          .x;

      actors.creatureRoot.position.z =
        locomotionSample
          .position
          .z;

      /*
       * Scene Y remains presentation-only.
       *
       * Gait bob never becomes simulation
       * position.
       */
      actors.creatureRoot.position.y =
        EMBODIMENT_GROUND_Y +
        animationSample
          .locomotionBobY;

      /*
       * Breathing and successful-eating
       * compression alter only the visual
       * primitive body around its authored
       * neutral scale.
       */
      actors.creatureBody.scale.set(
        creatureBodyNeutralScale.x *
          animationSample
            .breathingScaleXZMultiplier,

        creatureBodyNeutralScale.y *
          animationSample
            .breathingScaleYMultiplier *
          animationSample
            .eatingCompressionYMultiplier,

        creatureBodyNeutralScale.z *
          animationSample
            .breathingScaleXZMultiplier,
      );

      /*
       * Facing remains exclusively rotation.y,
       * established by genuine displacement in
       * the actor graph.
       *
       * A successful eating event may add a
       * temporary presentation-only forward dip
       * on a separate Euler axis.
       */
      actors.creatureRoot.rotation.z =
        animationSample
          .eatingForwardDipRadians;
    };

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
      presentationTimeSeconds,
    ) => {
      if (
        locomotionState ===
        null
      ) {
        locomotionState =
          createEmbodimentLocomotionState(
            model,
            presentationTimeSeconds,
          );
      } else {
        locomotionState =
          advanceEmbodimentLocomotionState(
            locomotionState,
            model,
            presentationTimeSeconds,
          );
      }

      if (
        animationState ===
        null
      ) {
        animationState =
          createEmbodimentAnimationState(
            model,
            presentationTimeSeconds,
          );
      } else {
        animationState =
          advanceEmbodimentAnimationState(
            animationState,
            model,
            presentationTimeSeconds,
          );
      }

      /*
       * First apply factual current presentation:
       *
       * - authoritative Creature destination;
       * - genuine displacement-derived facing;
       * - authoritative food;
       * - authoritative sensory-screen state.
       */
      actors.updatePresentation(
        model,
      );

      /*
       * Then replace only presentation-enriched
       * transforms:
       *
       * - interpolated X/Z;
       * - visual Y gait bob;
       * - breathing;
       * - genuine-success eating reaction.
       */
      updateFrame(
        presentationTimeSeconds,
      );
    },

    updateFrame,

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