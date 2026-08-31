import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";

import type {
  M3PresentationModel,
} from "./m3Presentation.js";

import {
  EMBODIMENT_GROUND_Y,
  m3WorldPositionToEmbodimentScenePosition,
} from "./embodimentCoordinates.js";

/*
 * EMBODIMENT ACTOR GRAPH
 *
 * This module converts the already-authoritative
 * M3 presentation model into Three.js objects.
 *
 * It is downstream of:
 *
 * authoritative simulation
 *   ->
 * M3 presentation model
 *   ->
 * this actor graph
 *
 * It does not:
 *
 * - advance simulation;
 * - evaluate cognition;
 * - select an action;
 * - create memory;
 * - alter learning;
 * - inspect hidden targets for steering;
 * - consume simulation RNG;
 * - create an independent authoritative
 *   Creature position.
 *
 * Three.js object transforms here are
 * presentation state only.
 */

export const EMBODIMENT_CREATURE_BODY_HEIGHT =
  0.54;

export const EMBODIMENT_FOOD_HEIGHT =
  0.24;

export const EMBODIMENT_SENSORY_SCREEN_HEIGHT =
  1.6;

export interface EmbodimentActorGraph {
  readonly root:
    Group;

  readonly creatureRoot:
    Group;

  readonly creatureBody:
    Mesh;

  /*
   * Contains the directional anatomy:
   *
   * - head;
   * - eyes;
   * - tail;
   * - crest.
   *
   * It remains hidden until genuine
   * authoritative displacement establishes
   * facing.
   */
  readonly creatureDirectionalRoot:
    Group;

  /*
   * Exposed narrowly so presentation-only blink
   * animation can change visual eye scale.
   *
   * Eye transforms never influence Creature
   * sensing or cognition.
   */
  readonly leftEye:
    Mesh;

  readonly rightEye:
    Mesh;

  readonly foodRoot:
    Group;

  /*
   * This is deliberately rendered as a
   * translucent wireframe sensory screen rather
   * than a solid wall.
   *
   * The current simulation does not provide
   * collision against this object.
   */
  readonly sensoryScreen:
    Mesh;

  readonly updatePresentation:
    (
      model:
        M3PresentationModel,
    ) => void;

  readonly dispose:
    () => void;
}

export function createEmbodimentActorGraph():
  EmbodimentActorGraph {
  const root =
    new Group();

  root.name =
    "embodiment-actors";

  const geometries:
    BufferGeometry[] = [];

  const materials:
    Material[] = [];

  const creatureRoot =
    new Group();

  creatureRoot.name =
    "embodiment-creature";

  /*
   * The base body is intentionally symmetric in
   * the horizontal X/Z plane.
   *
   * Before genuine movement establishes facing,
   * this avoids inventing an initial heading.
   */
  const creatureBodyGeometry =
    ownGeometry(
      geometries,
      new SphereGeometry(
        0.55,
        24,
        16,
      ),
    );

  const creatureBodyMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x668f76,

          roughness:
            0.78,

          metalness:
            0,
        },
      ),
    );

  const creatureBody =
    new Mesh(
      creatureBodyGeometry,
      creatureBodyMaterial,
    );

  creatureBody.name =
    "embodiment-creature-body";

  creatureBody.scale.set(
    1,
    0.72,
    1,
  );

  creatureBody.position.y =
    EMBODIMENT_CREATURE_BODY_HEIGHT;

  creatureRoot.add(
    creatureBody,
  );

  const creatureDirectionalRoot =
    new Group();

  creatureDirectionalRoot.name =
    "embodiment-creature-directional-anatomy";

  /*
   * No direction has been established at
   * creation time.
   */
  creatureDirectionalRoot.visible =
    false;

  creatureRoot.add(
    creatureDirectionalRoot,
  );

  const headGeometry =
    ownGeometry(
      geometries,
      new SphereGeometry(
        0.34,
        20,
        14,
      ),
    );

  const headMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x78a486,

          roughness:
            0.72,

          metalness:
            0,
        },
      ),
    );

  const head =
    new Mesh(
      headGeometry,
      headMaterial,
    );

  head.name =
    "embodiment-creature-head";

  head.position.set(
    0.66,
    0.6,
    0,
  );

  creatureDirectionalRoot.add(
    head,
  );

  const eyeGeometry =
    ownGeometry(
      geometries,
      new SphereGeometry(
        0.065,
        12,
        8,
      ),
    );

  const eyeMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x18231d,

          roughness:
            0.5,

          metalness:
            0,
        },
      ),
    );

  const leftEye =
    new Mesh(
      eyeGeometry,
      eyeMaterial,
    );

  leftEye.name =
    "embodiment-creature-eye-left";

  leftEye.position.set(
    0.91,
    0.7,
    0.16,
  );

  const rightEye =
    new Mesh(
      eyeGeometry,
      eyeMaterial,
    );

  rightEye.name =
    "embodiment-creature-eye-right";

  rightEye.position.set(
    0.91,
    0.7,
    -0.16,
  );

  creatureDirectionalRoot.add(
    leftEye,
    rightEye,
  );

  const tailGeometry =
    ownGeometry(
      geometries,
      new ConeGeometry(
        0.14,
        0.55,
        10,
      ),
    );

  const tailMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x587a67,

          roughness:
            0.8,

          metalness:
            0,
        },
      ),
    );

  const tail =
    new Mesh(
      tailGeometry,
      tailMaterial,
    );

  tail.name =
    "embodiment-creature-tail";

  tail.position.set(
    -0.78,
    0.52,
    0,
  );

  /*
   * ConeGeometry points along local Y.
   * Rotate it so the presentation tail extends
   * behind the Creature along local -X.
   */
  tail.rotation.z =
    -Math.PI /
    2;

  creatureDirectionalRoot.add(
    tail,
  );

  const crestGeometry =
    ownGeometry(
      geometries,
      new ConeGeometry(
        0.11,
        0.3,
        8,
      ),
    );

  const crestMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x466858,

          roughness:
            0.78,

          metalness:
            0,
        },
      ),
    );

  const crest =
    new Mesh(
      crestGeometry,
      crestMaterial,
    );

  crest.name =
    "embodiment-creature-crest";

  crest.position.set(
    0.3,
    1.02,
    0,
  );

  creatureDirectionalRoot.add(
    crest,
  );

  const foodRoot =
    new Group();

  foodRoot.name =
    "embodiment-food";

  const foodGeometry =
    ownGeometry(
      geometries,
      new SphereGeometry(
        0.23,
        18,
        12,
      ),
    );

  const foodMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0xbc5d46,

          roughness:
            0.68,

          metalness:
            0,
        },
      ),
    );

  const food =
    new Mesh(
      foodGeometry,
      foodMaterial,
    );

  food.name =
    "embodiment-food-body";

  food.position.y =
    EMBODIMENT_FOOD_HEIGHT;

  foodRoot.add(
    food,
  );

  const stemGeometry =
    ownGeometry(
      geometries,
      new CylinderGeometry(
        0.025,
        0.03,
        0.2,
        8,
      ),
    );

  const stemMaterial =
    ownMaterial(
      materials,
      new MeshStandardMaterial(
        {
          color:
            0x566b45,

          roughness:
            0.85,

          metalness:
            0,
        },
      ),
    );

  const stem =
    new Mesh(
      stemGeometry,
      stemMaterial,
    );

  stem.name =
    "embodiment-food-stem";

  stem.position.y =
    EMBODIMENT_FOOD_HEIGHT +
    0.22;

  foodRoot.add(
    stem,
  );

  /*
   * Unit-depth geometry.
   *
   * updatePresentation(...) scales local Z to
   * match the authoritative sensory-occluder
   * minY/maxY interval.
   */
  const sensoryScreenGeometry =
    ownGeometry(
      geometries,
      new BoxGeometry(
        0.06,
        EMBODIMENT_SENSORY_SCREEN_HEIGHT,
        1,
      ),
    );

  const sensoryScreenMaterial =
    ownMaterial(
      materials,
      new MeshBasicMaterial(
        {
          color:
            0x688fa0,

          transparent:
            true,

          opacity:
            0.28,

          wireframe:
            true,

          depthWrite:
            false,
        },
      ),
    );

  const sensoryScreen =
    new Mesh(
      sensoryScreenGeometry,
      sensoryScreenMaterial,
    );

  sensoryScreen.name =
    "embodiment-non-solid-sensory-screen";

  sensoryScreen.position.y =
    EMBODIMENT_GROUND_Y +
    EMBODIMENT_SENSORY_SCREEN_HEIGHT /
      2;

  root.add(
    creatureRoot,
    foodRoot,
    sensoryScreen,
  );

  /*
   * Presentation-only orientation continuity.
   *
   * Once actual authoritative displacement has
   * established facing, the visual Creature may
   * retain that genuine orientation while
   * stationary.
   *
   * This value never enters cognition.
   */
  let facingEstablished =
    false;

  let previousTickIndex:
    number | null =
      null;

  let previousSimulationTimeSeconds:
    number | null =
      null;

  const updatePresentation =
    (
      model:
        M3PresentationModel,
    ): void => {
      /*
       * A backwards tick/time transition means a
       * new/reset presentation run.
       *
       * A fresh Creature must not inherit the
       * presentation orientation of the
       * previous run.
       */
      const presentationReset =
        (
          previousTickIndex !==
            null &&
          model.tickIndex <
            previousTickIndex
        ) ||
        (
          previousSimulationTimeSeconds !==
            null &&
          model.simulationTimeSeconds <
            previousSimulationTimeSeconds
        );

      if (
        presentationReset
      ) {
        facingEstablished =
          false;

        creatureDirectionalRoot.visible =
          false;

        creatureRoot.rotation.y =
          0;
      }

      const creaturePosition =
        m3WorldPositionToEmbodimentScenePosition(
          model.creature.position,
          EMBODIMENT_GROUND_Y,
        );

      creatureRoot.position.set(
        creaturePosition.x,
        creaturePosition.y,
        creaturePosition.z,
      );

      const facing =
        model.creature
          .facingDirection;

      if (
        facing !==
        null
      ) {
        /*
         * The Creature's local front is +X.
         *
         * Simulation:
         *
         * x -> scene X
         * y -> scene Z
         *
         * Three.js positive Y rotation turns
         * local +X toward negative Z, therefore
         * the sign is inverted.
         */
        creatureRoot.rotation.y =
          -Math.atan2(
            facing.y,
            facing.x,
          );

        creatureDirectionalRoot.visible =
          true;

        facingEstablished =
          true;
      } else if (
        !facingEstablished
      ) {
        /*
         * No genuine displacement has ever
         * established orientation during this
         * presentation run.
         */
        creatureDirectionalRoot.visible =
          false;
      }

      const foodPosition =
        m3WorldPositionToEmbodimentScenePosition(
          model.food.position,
          EMBODIMENT_GROUND_Y,
        );

      foodRoot.position.set(
        foodPosition.x,
        foodPosition.y,
        foodPosition.z,
      );

      /*
       * Physical world availability alone
       * controls whether food is drawn.
       *
       * Direct perception does not control this:
       * the player may see food that the Creature
       * cannot currently perceive.
       */
      foodRoot.visible =
        model.food.available;

      updateSensoryScreen(
        sensoryScreen,
        model.environment
          .sensoryOccluder,
      );

      previousTickIndex =
        model.tickIndex;

      previousSimulationTimeSeconds =
        model.simulationTimeSeconds;
    };

  return {
    root,
    creatureRoot,
    creatureBody,
    creatureDirectionalRoot,
    leftEye,
    rightEye,
    foodRoot,
    sensoryScreen,
    updatePresentation,

    dispose: () => {
      for (
        const geometry
        of geometries
      ) {
        geometry.dispose();
      }

      for (
        const material
        of materials
      ) {
        material.dispose();
      }
    },
  };
}

function updateSensoryScreen(
  screen:
    Mesh,

  occluder:
    M3PresentationModel[
      "environment"
    ][
      "sensoryOccluder"
    ],
): void {
  /*
   * Passing both endpoints through the accepted
   * coordinate boundary validates that the
   * presentation screen still lies inside the
   * authoritative habitat.
   */
  const minimum =
    m3WorldPositionToEmbodimentScenePosition(
      {
        x:
          occluder.x,

        y:
          occluder.minY,
      },
      EMBODIMENT_GROUND_Y,
    );

  const maximum =
    m3WorldPositionToEmbodimentScenePosition(
      {
        x:
          occluder.x,

        y:
          occluder.maxY,
      },
      EMBODIMENT_GROUND_Y,
    );

  const depth =
    Math.max(
      0,
      maximum.z -
      minimum.z,
    );

  screen.position.x =
    minimum.x;

  screen.position.z =
    (
      minimum.z +
      maximum.z
    ) /
    2;

  screen.scale.z =
    depth;

  /*
   * active is authoritative occluder state.
   *
   * The mesh is still explicitly wireframe and
   * translucent so it does not imply a solid
   * collision wall.
   */
  screen.visible =
    occluder.active;
}

function ownGeometry<
  T extends BufferGeometry,
>(
  collection:
    BufferGeometry[],

  geometry:
    T,
): T {
  collection.push(
    geometry,
  );

  return geometry;
}

function ownMaterial<
  T extends Material,
>(
  collection:
    Material[],

  material:
    T,
): T {
  collection.push(
    material,
  );

  return material;
}