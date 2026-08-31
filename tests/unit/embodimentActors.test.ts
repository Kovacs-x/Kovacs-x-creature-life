import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MeshBasicMaterial,
} from "three";

import {
  createEmbodimentActorGraph,
  EMBODIMENT_SENSORY_SCREEN_HEIGHT,
} from "../../src/rendering/embodimentActors.js";

import {
  EMBODIMENT_GROUND_Y,
} from "../../src/rendering/embodimentCoordinates.js";

import {
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
  type M3PresentationModel,
} from "../../src/rendering/m3Presentation.js";

function createPresentationModel(
  overrides:
    Partial<M3PresentationModel> =
      {},
): M3PresentationModel {
  const base:
    M3PresentationModel = {
      schemaVersion:
        M3_PRESENTATION_MODEL_SCHEMA_VERSION,

      tickIndex:
        0,

      simulationTimeSeconds:
        0,

      creature: {
        position: {
          x: 2,
          y: 3,
        },

        motionState:
          "stationary",

        distanceMoved:
          0,

        facingDirection:
          null,

        activityState:
          "idle",

        movementSource:
          null,

        energy:
          80,

        maxEnergy:
          100,

        energyFraction:
          0.8,

        hungerFraction:
          0.2,
      },

      food: {
        position: {
          x: 8,
          y: 7,
        },

        consumed:
          false,

        available:
          true,
      },

      environment: {
        foodPerceptionState:
          "occluded",

        foodDirectlyPerceived:
          false,

        foodMemoryState:
          "none",

        foodMemoryConfidence:
          null,

        foodMemoryAgeSeconds:
          null,

        sensoryOccluder: {
          active:
            true,

          x:
            5,

          minY:
            2,

          maxY:
            8,
        },
      },
    };

  return {
    ...base,
    ...overrides,

    creature: {
      ...base.creature,
      ...overrides.creature,
    },

    food: {
      ...base.food,
      ...overrides.food,
    },

    environment: {
      ...base.environment,
      ...overrides.environment,

      sensoryOccluder: {
        ...base
          .environment
          .sensoryOccluder,

        ...overrides
          .environment
          ?.sensoryOccluder,
      },
    },
  };
}

describe(
  "embodiment state-faithful actor graph",
  () => {
    it(
      "creates Creature, food and a non-solid sensory-screen presentation graph",
      () => {
        const actors =
          createEmbodimentActorGraph();

        expect(
          actors.root.children,
        ).toContain(
          actors.creatureRoot,
        );

        expect(
          actors.root.children,
        ).toContain(
          actors.foodRoot,
        );

        expect(
          actors.root.children,
        ).toContain(
          actors.sensoryScreen,
        );

        expect(
          actors.creatureRoot.name,
        ).toBe(
          "embodiment-creature",
        );

        expect(
          actors.foodRoot.name,
        ).toBe(
          "embodiment-food",
        );

        expect(
          actors.sensoryScreen.name,
        ).toBe(
          "embodiment-non-solid-sensory-screen",
        );

        actors.dispose();
      },
    );

    it(
      "maps authoritative Creature and food positions into scene X/Z without creating another coordinate system",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(),
        );

        expect(
          actors
            .creatureRoot
            .position
            .x,
        ).toBeCloseTo(
          2,
        );

        expect(
          actors
            .creatureRoot
            .position
            .y,
        ).toBeCloseTo(
          EMBODIMENT_GROUND_Y,
        );

        expect(
          actors
            .creatureRoot
            .position
            .z,
        ).toBeCloseTo(
          3,
        );

        expect(
          actors
            .foodRoot
            .position
            .x,
        ).toBeCloseTo(
          8,
        );

        expect(
          actors
            .foodRoot
            .position
            .y,
        ).toBeCloseTo(
          EMBODIMENT_GROUND_Y,
        );

        expect(
          actors
            .foodRoot
            .position
            .z,
        ).toBeCloseTo(
          7,
        );

        actors.dispose();
      },
    );

    it(
      "does not invent directional anatomy before genuine displacement establishes facing",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(
            {
              creature: {
                position: {
                  x: 2,
                  y: 3,
                },

                motionState:
                  "stationary",

                distanceMoved:
                  0,

                facingDirection:
                  null,

                activityState:
                  "idle",

                movementSource:
                  null,

                energy:
                  80,

                maxEnergy:
                  100,

                energyFraction:
                  0.8,

                hungerFraction:
                  0.2,
              },
            },
          ),
        );

        expect(
          actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          false,
        );

        /*
         * The neutral body itself remains
         * visible.
         */
        expect(
          actors
            .creatureBody
            .visible,
        ).toBe(
          true,
        );

        actors.dispose();
      },
    );

    it(
      "reveals and orients directional anatomy only from genuine presentation facing",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creature: {
                position: {
                  x: 2,
                  y: 4,
                },

                motionState:
                  "moving",

                distanceMoved:
                  1,

                facingDirection: {
                  x: 0,
                  y: 1,
                },

                activityState:
                  "exploring",

                movementSource:
                  "exploration",

                energy:
                  79,

                maxEnergy:
                  100,

                energyFraction:
                  0.79,

                hungerFraction:
                  0.21,
              },
            },
          ),
        );

        expect(
          actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          true,
        );

        expect(
          actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          -Math.PI /
          2,
        );

        actors.dispose();
      },
    );

    it(
      "retains the last genuine displacement-derived orientation while stationary",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                1,

              simulationTimeSeconds:
                1,

              creature: {
                position: {
                  x: 3,
                  y: 3,
                },

                motionState:
                  "moving",

                distanceMoved:
                  1,

                facingDirection: {
                  x: 1,
                  y: 0,
                },

                activityState:
                  "exploring",

                movementSource:
                  "exploration",

                energy:
                  79,

                maxEnergy:
                  100,

                energyFraction:
                  0.79,

                hungerFraction:
                  0.21,
              },
            },
          ),
        );

        const establishedAngle =
          actors
            .creatureRoot
            .rotation
            .y;

        actors.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                2,

              simulationTimeSeconds:
                2,

              creature: {
                position: {
                  x: 3,
                  y: 3,
                },

                motionState:
                  "stationary",

                distanceMoved:
                  0,

                facingDirection:
                  null,

                activityState:
                  "idle",

                movementSource:
                  null,

                energy:
                  78,

                maxEnergy:
                  100,

                energyFraction:
                  0.78,

                hungerFraction:
                  0.22,
              },
            },
          ),
        );

        expect(
          actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          true,
        );

        expect(
          actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          establishedAngle,
        );

        actors.dispose();
      },
    );

    it(
      "clears retained presentation orientation when a new run resets simulation time",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                5,

              simulationTimeSeconds:
                5,

              creature: {
                position: {
                  x: 4,
                  y: 3,
                },

                motionState:
                  "moving",

                distanceMoved:
                  1,

                facingDirection: {
                  x: 1,
                  y: 0,
                },

                activityState:
                  "exploring",

                movementSource:
                  "exploration",

                energy:
                  75,

                maxEnergy:
                  100,

                energyFraction:
                  0.75,

                hungerFraction:
                  0.25,
              },
            },
          ),
        );

        expect(
          actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          true,
        );

        actors.updatePresentation(
          createPresentationModel(
            {
              tickIndex:
                0,

              simulationTimeSeconds:
                0,

              creature: {
                position: {
                  x: 2,
                  y: 3,
                },

                motionState:
                  "stationary",

                distanceMoved:
                  0,

                facingDirection:
                  null,

                activityState:
                  "idle",

                movementSource:
                  null,

                energy:
                  80,

                maxEnergy:
                  100,

                energyFraction:
                  0.8,

                hungerFraction:
                  0.2,
              },
            },
          ),
        );

        expect(
          actors
            .creatureDirectionalRoot
            .visible,
        ).toBe(
          false,
        );

        expect(
          actors
            .creatureRoot
            .rotation
            .y,
        ).toBeCloseTo(
          0,
        );

        actors.dispose();
      },
    );

    it(
      "shows food from authoritative world availability rather than Creature perception",
      () => {
        const actors =
          createEmbodimentActorGraph();

        /*
         * The player can see physical food even
         * though the Creature's direct sensory
         * relationship is occluded.
         */
        actors.updatePresentation(
          createPresentationModel(
            {
              environment: {
                foodPerceptionState:
                  "occluded",

                foodDirectlyPerceived:
                  false,

                foodMemoryState:
                  "none",

                foodMemoryConfidence:
                  null,

                foodMemoryAgeSeconds:
                  null,

                sensoryOccluder: {
                  active:
                    true,

                  x:
                    5,

                  minY:
                    2,

                  maxY:
                    8,
                },
              },
            },
          ),
        );

        expect(
          actors
            .foodRoot
            .visible,
        ).toBe(
          true,
        );

        actors.updatePresentation(
          createPresentationModel(
            {
              food: {
                position: {
                  x: 8,
                  y: 7,
                },

                consumed:
                  true,

                available:
                  false,
              },

              environment: {
                foodPerceptionState:
                  "consumed",

                foodDirectlyPerceived:
                  false,

                foodMemoryState:
                  "none",

                foodMemoryConfidence:
                  null,

                foodMemoryAgeSeconds:
                  null,

                sensoryOccluder: {
                  active:
                    true,

                  x:
                    5,

                  minY:
                    2,

                  maxY:
                    8,
                },
              },
            },
          ),
        );

        expect(
          actors
            .foodRoot
            .visible,
        ).toBe(
          false,
        );

        actors.dispose();
      },
    );

    it(
      "represents the sensory occluder as a translucent wireframe screen rather than a solid collision wall",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(),
        );

        expect(
          actors
            .sensoryScreen
            .visible,
        ).toBe(
          true,
        );

        expect(
          actors
            .sensoryScreen
            .position
            .x,
        ).toBeCloseTo(
          5,
        );

        expect(
          actors
            .sensoryScreen
            .position
            .y,
        ).toBeCloseTo(
          EMBODIMENT_GROUND_Y +
          EMBODIMENT_SENSORY_SCREEN_HEIGHT /
            2,
        );

        expect(
          actors
            .sensoryScreen
            .position
            .z,
        ).toBeCloseTo(
          5,
        );

        expect(
          actors
            .sensoryScreen
            .scale
            .z,
        ).toBeCloseTo(
          6,
        );

        const material =
          actors
            .sensoryScreen
            .material;

        expect(
          material,
        ).toBeInstanceOf(
          MeshBasicMaterial,
        );

        if (
          !(
            material
            instanceof
            MeshBasicMaterial
          )
        ) {
          throw new Error(
            "Expected the sensory-screen presentation material to be MeshBasicMaterial.",
          );
        }

        expect(
          material.transparent,
        ).toBe(
          true,
        );

        expect(
          material.wireframe,
        ).toBe(
          true,
        );

        expect(
          material.opacity,
        ).toBeLessThan(
          1,
        );

        actors.dispose();
      },
    );

    it(
      "hides the sensory-screen presentation when the authoritative occluder is inactive",
      () => {
        const actors =
          createEmbodimentActorGraph();

        actors.updatePresentation(
          createPresentationModel(
            {
              environment: {
                foodPerceptionState:
                  "out-of-range",

                foodDirectlyPerceived:
                  false,

                foodMemoryState:
                  "none",

                foodMemoryConfidence:
                  null,

                foodMemoryAgeSeconds:
                  null,

                sensoryOccluder: {
                  active:
                    false,

                  x:
                    5,

                  minY:
                    2,

                  maxY:
                    8,
                },
              },
            },
          ),
        );

        expect(
          actors
            .sensoryScreen
            .visible,
        ).toBe(
          false,
        );

        actors.dispose();
      },
    );

    it(
      "does not expose brain, memory target coordinates, RNG or simulation authority through the actor graph",
      () => {
        const actors =
          createEmbodimentActorGraph();

        expect(
          actors,
        ).not.toHaveProperty(
          "brain",
        );

        expect(
          actors,
        ).not.toHaveProperty(
          "rngState",
        );

        expect(
          actors,
        ).not.toHaveProperty(
          "target",
        );

        expect(
          actors,
        ).not.toHaveProperty(
          "advanceSimulation",
        );

        expect(
          actors,
        ).not.toHaveProperty(
          "selectAction",
        );

        actors.dispose();
      },
    );
  },
);