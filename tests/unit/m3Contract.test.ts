import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  BrainState,
} from "../../src/simulation/core/contracts.js";

import {
  createM1Brain,
  evaluateM1Brain,
} from "../../src/simulation/brain/m1Brain.js";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  senseHunger,
} from "../../src/simulation/senses/hungerSense.js";

import {
  perceiveFood,
} from "../../src/simulation/senses/foodPerception.js";

import {
  senseFoodContact,
} from "../../src/simulation/senses/foodContact.js";

import {
  createFoodObject,
} from "../../src/world/food.js";

import {
  createSensoryOccluder,
  isLineOfSightOccludedBySensoryOccluder,
} from "../../src/world/sensoryOccluder.js";

import {
  moveAlongDirection,
} from "../../src/simulation/actions/movement.js";

import {
  SeededRng,
} from "../../src/simulation/core/rng.js";

import {
  createExplorationState,
  ensureExploratoryHeading,
} from "../../src/simulation/drives/exploration.js";

import {
  runM1Trial,
} from "../../src/simulation/core/m1Trial.js";

import {
  M1_EXPERIMENT_TRAINING_TRIALS,
} from "../../src/simulation/core/m1Experiment.js";

import {
  M3_ACQUISITION_CREATURE_START,
  M3_ACQUISITION_FOOD,
  M3_ACQUISITION_INTERACTION_RANGE,
  M3_ACQUISITION_MAX_TICKS_PER_ROUND,
  M3_ACQUISITION_MEMORY_ENABLED,
  M3_ACQUISITION_MOVE_DISTANCE,
  M3_ACQUISITION_OCCLUDER,
  M3_ACQUISITION_PERCEPTION_RANGE,
  M3_ACQUISITION_RNG_POLICY,
  M3_ACQUISITION_ROUNDS,
  M3_AUTONOMOUS_DISCOVERY_CONTRACT,
  M3_EXPERIENCE_STATE_SWAP_FIELD,
  M3_EXPERIENCE_STATE_SWAP_EXPECTATION,
  M3_EXPLORATION_DISABLED_CONTROL,
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_EXPLORATION_PRESSURE_CONFIG,
  M3_EXPLORATION_PRESSURE_UPDATE_ORDER,
  M3_EXPLORATION_TO_EXPLORE_WEIGHT,
  M3_EXPLORATORY_BOUNDARY_POLICY,
  M3_EXPLORATORY_HEADING_ALGORITHM,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
  M3_EXPLORATORY_RNG_CONSUMPTION_RULE,
  M3_HABITAT_BOUNDS,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_LEARNING_DISABLED_CONTROL,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
  M3_PRIMARY_BRANCH_B_SEED,
  M3_PRIMARY_PROBE_METRIC,
  M3_SAME_SEED_REPLAY_SEED,
  M3_STANDARDIZED_PROBE,
  M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
  M3_STANDARDIZED_PROBE_PRESERVED_STATE,
} from "../../src/simulation/core/m3Contract.js";

function getConnectionWeight(
  brain: BrainState,
  connectionId: string,
): number {
  const connection =
    brain.connections.find(
      (candidate) =>
        candidate.id ===
        connectionId,
    );

  if (connection === undefined) {
    throw new Error(
      `Missing expected brain connection: ${connectionId}`,
    );
  }

  return connection.weight;
}

function sampleFirstThreeHeadings(
  seed: number,
): readonly {
  readonly directionX: number;
  readonly directionY: number;
}[] {
  const rng =
    new SeededRng(
      seed,
    );

  let state =
    createExplorationState(
      M3_EXPLORATION_INITIAL_PRESSURE,
      M3_EXPLORATION_PRESSURE_CONFIG,
    );

  const headings:
    Array<{
      readonly directionX: number;
      readonly directionY: number;
    }> = [];

  const samplingTimes = [
    0,
    M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
    M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS *
      2,
  ];

  for (
    const simulationTimeSeconds of
    samplingTimes
  ) {
    state =
      ensureExploratoryHeading(
        state,
        rng,
        simulationTimeSeconds,
        M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
      );

    const heading =
      state.activeHeading;

    if (heading === null) {
      throw new Error(
        "Expected a sampled exploratory heading.",
      );
    }

    headings.push({
      directionX:
        heading.directionX,

      directionY:
        heading.directionY,
    });
  }

  return headings;
}

function applyFiveLockedExplorationMoves(
  seed: number,
): {
  readonly x: number;
  readonly y: number;
} {
  const headings =
    sampleFirstThreeHeadings(
      seed,
    );

  const movementHeadingIndexes = [
    0,
    0,
    1,
    1,
    2,
  ] as const;

  /*
   * Explicit numeric coordinate type is
   * important here.
   *
   * M3_ACQUISITION_CREATURE_START is an
   * `as const` contract value, so without
   * this annotation TypeScript would infer
   * position as exactly:
   *
   * { x: 0; y: 0 }
   *
   * moveAlongDirection correctly returns
   * general numeric coordinates, which must
   * therefore be assignable here.
   */
  let position: {
    x: number;
    y: number;
  } = {
    x:
      M3_ACQUISITION_CREATURE_START.x,

    y:
      M3_ACQUISITION_CREATURE_START.y,
  };

  for (
    const headingIndex of
    movementHeadingIndexes
  ) {
    const heading =
      headings[
        headingIndex
      ];

    if (heading === undefined) {
      throw new Error(
        "Missing prospectively locked exploratory heading.",
      );
    }

    position =
      moveAlongDirection(
        position,
        heading.directionX,
        heading.directionY,
        M3_ACQUISITION_MOVE_DISTANCE,
        M3_HABITAT_BOUNDS,
      ).position;
  }

  return position;
}

function evaluateLockedStandardizedProbe(
  brain: BrainState,
) {
  const creaturePosition = {
    x:
      M3_STANDARDIZED_PROBE
        .creaturePosition.x,

    y:
      M3_STANDARDIZED_PROBE
        .creaturePosition.y,
  };

  const hunger =
    createHungerState(
      M3_STANDARDIZED_PROBE
        .hungerEnergy,

      M3_STANDARDIZED_PROBE
        .maxEnergy,
    );

  const food =
    createFoodObject(
      M3_STANDARDIZED_PROBE
        .food.id,

      M3_STANDARDIZED_PROBE
        .food.x,

      M3_STANDARDIZED_PROBE
        .food.y,

      M3_STANDARDIZED_PROBE
        .food.nutrition,
    );

  const foodSignal =
    perceiveFood(
      creaturePosition,
      food,
      {
        maxRange:
          M3_STANDARDIZED_PROBE
            .perceptionRange,
      },
      {
        occluded:
          false,
      },
    );

  const hungerSignal =
    senseHunger(
      hunger,
    );

  const contactSignal =
    senseFoodContact(
      creaturePosition,
      food,
      M3_STANDARDIZED_PROBE
        .interactionRange,
    );

  return evaluateM1Brain(
    brain,
    hungerSignal,
    foodSignal,
    contactSignal,
    null,
  );
}

describe(
  "M3.2 prospective behavioural contract",
  () => {
    it(
      "locks exploration activation below IDLE initially but above existing no-food competition at high pressure",
      () => {
        const brain =
          createM1Brain();

        const idleWeight =
          getConnectionWeight(
            brain,
            "bias-to-idle",
          );

        const hungerToSeekWeight =
          getConnectionWeight(
            brain,
            "hunger-to-seek",
          );

        expect(
          idleWeight,
        ).toBeCloseTo(
          0.35,
        );

        expect(
          hungerToSeekWeight,
        ).toBeCloseTo(
          0.3,
        );

        const initialExploreActivation =
          M3_EXPLORATION_INITIAL_PRESSURE *
          M3_EXPLORATION_TO_EXPLORE_WEIGHT;

        const highPressureExploreActivation =
          0.8 *
          M3_EXPLORATION_TO_EXPLORE_WEIGHT;

        expect(
          initialExploreActivation,
        ).toBeLessThan(
          idleWeight,
        );

        expect(
          initialExploreActivation,
        ).toBeLessThan(
          hungerToSeekWeight,
        );

        expect(
          highPressureExploreActivation,
        ).toBeGreaterThan(
          idleWeight,
        );

        expect(
          highPressureExploreActivation,
        ).toBeGreaterThan(
          hungerToSeekWeight,
        );
      },
    );

    it(
      "locks the intended primitive pressure rhythm before neural integration",
      () => {
        expect(
          M3_EXPLORATION_PRESSURE_CONFIG,
        ).toEqual({
          minPressure: 0,
          maxPressure: 1,
          accumulationPerSecond:
            0.1,
          reductionPerSecondWhileExploring:
            0.3,
        });

        expect(
          M3_EXPLORATION_INITIAL_PRESSURE,
        ).toBe(
          0.2,
        );

        expect(
          M3_EXPLORATION_TO_EXPLORE_WEIGHT,
        ).toBe(
          0.5,
        );

        expect(
          M3_EXPLORATION_PRESSURE_UPDATE_ORDER,
        ).toBe(
          "after-action-resolution",
        );
      },
    );

    it(
      "locks seeded heading generation and RNG consumption policy",
      () => {
        expect(
          M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
        ).toBe(
          5,
        );

        expect(
          M3_EXPLORATORY_HEADING_ALGORITHM,
        ).toBe(
          "uniform-full-turn-from-one-nextFloat",
        );

        expect(
          M3_EXPLORATORY_RNG_CONSUMPTION_RULE,
        ).toBe(
          "one-nextFloat-only-when-sampling-new-heading",
        );

        expect(
          M3_EXPLORATORY_BOUNDARY_POLICY,
        ).toBe(
          "clamp-to-habitat-bounds",
        );
      },
    );

    it(
      "prospectively locks strongly different isolated heading streams for the two primary seeds",
      () => {
        const branchA =
          sampleFirstThreeHeadings(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const branchB =
          sampleFirstThreeHeadings(
            M3_PRIMARY_BRANCH_B_SEED,
          );

        expect(
          branchA,
        ).toHaveLength(
          3,
        );

        expect(
          branchB,
        ).toHaveLength(
          3,
        );

        for (
          const heading of
          branchA
        ) {
          expect(
            heading.directionX,
          ).toBeGreaterThan(
            0.9,
          );

          expect(
            Math.hypot(
              heading.directionX,
              heading.directionY,
            ),
          ).toBeCloseTo(
            1,
          );
        }

        for (
          const heading of
          branchB
        ) {
          expect(
            heading.directionX,
          ).toBeLessThan(
            -0.5,
          );

          expect(
            Math.hypot(
              heading.directionX,
              heading.directionY,
            ),
          ).toBeCloseTo(
            1,
          );
        }
      },
    );

    it(
      "locks a motor-history contrast without querying food position",
      () => {
        const branchAPosition =
          applyFiveLockedExplorationMoves(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const branchBPosition =
          applyFiveLockedExplorationMoves(
            M3_PRIMARY_BRANCH_B_SEED,
          );

        expect(
          branchAPosition.x,
        ).toBeGreaterThan(
          M3_ACQUISITION_OCCLUDER.x,
        );

        expect(
          branchBPosition.x,
        ).toBe(
          M3_HABITAT_BOUNDS.minX,
        );
      },
    );

    it(
      "locks an initially hidden food opportunity that is physically within sensory range",
      () => {
        const food =
          createFoodObject(
            M3_ACQUISITION_FOOD.id,
            M3_ACQUISITION_FOOD.x,
            M3_ACQUISITION_FOOD.y,
            M3_ACQUISITION_FOOD.nutrition,
          );

        const occluder =
          createSensoryOccluder(
            M3_ACQUISITION_OCCLUDER.x,
            M3_ACQUISITION_OCCLUDER.minY,
            M3_ACQUISITION_OCCLUDER.maxY,
            M3_ACQUISITION_OCCLUDER.active,
          );

        const geometricallyOccluded =
          isLineOfSightOccludedBySensoryOccluder(
            M3_ACQUISITION_CREATURE_START,
            food.position,
            occluder,
          );

        expect(
          geometricallyOccluded,
        ).toBe(
          true,
        );

        const visibleWithoutOcclusion =
          perceiveFood(
            M3_ACQUISITION_CREATURE_START,
            food,
            {
              maxRange:
                M3_ACQUISITION_PERCEPTION_RANGE,
            },
            {
              occluded:
                false,
            },
          );

        expect(
          visibleWithoutOcclusion,
        ).not.toBeNull();

        const hiddenThroughRealSensoryGate =
          perceiveFood(
            M3_ACQUISITION_CREATURE_START,
            food,
            {
              maxRange:
                M3_ACQUISITION_PERCEPTION_RANGE,
            },
            {
              occluded:
                geometricallyOccluded,
            },
          );

        expect(
          hiddenThroughRealSensoryGate,
        ).toBeNull();
      },
    );

    it(
      "locks geometry where crossing the sensory screen can legitimately reveal food",
      () => {
        const food =
          createFoodObject(
            M3_ACQUISITION_FOOD.id,
            M3_ACQUISITION_FOOD.x,
            M3_ACQUISITION_FOOD.y,
            M3_ACQUISITION_FOOD.nutrition,
          );

        const occluder =
          createSensoryOccluder(
            M3_ACQUISITION_OCCLUDER.x,
            M3_ACQUISITION_OCCLUDER.minY,
            M3_ACQUISITION_OCCLUDER.maxY,
            M3_ACQUISITION_OCCLUDER.active,
          );

        const positionAfterCrossing = {
          x: 5,
          y: 0,
        };

        const occludedAfterCrossing =
          isLineOfSightOccludedBySensoryOccluder(
            positionAfterCrossing,
            food.position,
            occluder,
          );

        expect(
          occludedAfterCrossing,
        ).toBe(
          false,
        );

        const perceptionAfterCrossing =
          perceiveFood(
            positionAfterCrossing,
            food,
            {
              maxRange:
                M3_ACQUISITION_PERCEPTION_RANGE,
            },
            {
              occluded:
                occludedAfterCrossing,
            },
          );

        expect(
          perceptionAfterCrossing,
        ).not.toBeNull();
      },
    );

    it(
      "locks an alternate hidden target that remains occluded initially",
      () => {
        const alternateFood =
          createFoodObject(
            M3_HIDDEN_TARGET_ALTERNATE_FOOD.id,
            M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,
            M3_HIDDEN_TARGET_ALTERNATE_FOOD.y,
            M3_HIDDEN_TARGET_ALTERNATE_FOOD.nutrition,
          );

        const occluder =
          createSensoryOccluder(
            M3_ACQUISITION_OCCLUDER.x,
            M3_ACQUISITION_OCCLUDER.minY,
            M3_ACQUISITION_OCCLUDER.maxY,
            M3_ACQUISITION_OCCLUDER.active,
          );

        expect(
          isLineOfSightOccludedBySensoryOccluder(
            M3_ACQUISITION_CREATURE_START,
            alternateFood.position,
            occluder,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "locks three controlled acquisition rounds and their reset policy",
      () => {
        expect(
          M3_ACQUISITION_ROUNDS,
        ).toBe(
          M1_EXPERIMENT_TRAINING_TRIALS,
        );

        expect(
          M3_ACQUISITION_ROUNDS,
        ).toBe(
          3,
        );

        expect(
          M3_ACQUISITION_MAX_TICKS_PER_ROUND,
        ).toBe(
          32,
        );

        expect(
          M3_ACQUISITION_RNG_POLICY,
        ).toBe(
          "reset-to-branch-seed-each-controlled-round",
        );

        expect(
          M3_ACQUISITION_MEMORY_ENABLED,
        ).toBe(
          false,
        );
      },
    );

    it(
      "locks explicit primary acquisition expectations before integration",
      () => {
        expect(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
        ).toBe(
          3,
        );

        expect(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
        ).toBe(
          3,
        );

        expect(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
        ).toBe(
          0,
        );

        expect(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
        ).toBe(
          0,
        );
      },
    );

    it(
      "locks exploration-disabled and learning-disabled causal controls",
      () => {
        expect(
          M3_EXPLORATION_DISABLED_CONTROL,
        ).toEqual({
          explorationEnabled:
            false,

          learningEnabled:
            true,

          memoryEnabled:
            false,

          seed:
            M3_PRIMARY_BRANCH_A_SEED,
        });

        expect(
          M3_LEARNING_DISABLED_CONTROL,
        ).toEqual({
          explorationEnabled:
            true,

          learningEnabled:
            false,

          memoryEnabled:
            false,

          seed:
            M3_PRIMARY_BRANCH_A_SEED,
        });
      },
    );

    it(
      "locks the autonomous discovery definition before behaviour exists",
      () => {
        expect(
          M3_AUTONOMOUS_DISCOVERY_CONTRACT,
        ).toEqual({
          beforeDirectFoodPerception:
            "absent",

          requiredSelectedAction:
            "explore",

          requiredMovementSource:
            "exploration",

          afterDirectFoodPerception:
            "present",

          allowConcurrentExternalFoodMove:
            false,
        });
      },
    );

    it(
      "reuses the accepted M1 harder probe as the standardized M3 probe",
      () => {
        expect(
          M3_STANDARDIZED_PROBE
            .creaturePosition,
        ).toEqual({
          x: 0,
          y: 0,
        });

        expect(
          M3_STANDARDIZED_PROBE
            .hungerEnergy,
        ).toBe(
          0.5,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .food.x,
        ).toBe(
          6,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .food.y,
        ).toBe(
          0,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .perceptionRange,
        ).toBe(
          10,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .interactionRange,
        ).toBe(
          M3_ACQUISITION_INTERACTION_RANGE,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .memoryEnabled,
        ).toBe(
          false,
        );

        expect(
          M3_STANDARDIZED_PROBE
            .explorationEnabled,
        ).toBe(
          false,
        );
      },
    );

    it(
      "confirms the locked standardized probe already distinguishes naive from established trained M1 state",
      () => {
        const naiveBrain =
          createM1Brain();

        const naiveProbe =
          evaluateLockedStandardizedProbe(
            naiveBrain,
          );

        expect(
          naiveProbe.selectedActionId,
        ).toBe(
          "idle",
        );

        let trainedBrain =
          createM1Brain();

        for (
          let trial = 0;
          trial <
          M3_ACQUISITION_ROUNDS;
          trial += 1
        ) {
          const result =
            runM1Trial({
              learningEnabled:
                true,

              brain:
                trainedBrain,
            });

          trainedBrain =
            result.brainAfter;
        }

        const trainedProbe =
          evaluateLockedStandardizedProbe(
            trainedBrain,
          );

        expect(
          trainedProbe.seekActivation,
        ).toBeGreaterThan(
          naiveProbe.seekActivation,
        );

        expect(
          trainedProbe.selectedActionId,
        ).toBe(
          "seek",
        );
      },
    );

    it(
      "locks the standardized probe to preserve learned weights and normalize competing immediate causes",
      () => {
        expect(
          M3_STANDARDIZED_PROBE_PRESERVED_STATE,
        ).toEqual([
          "learnedBrainConnectionWeights",
        ]);

        expect(
          M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
        ).toContain(
          "foodMemory",
        );

        expect(
          M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
        ).toContain(
          "eligibilityTrace",
        );

        expect(
          M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
        ).toContain(
          "explorationPressure",
        );

        expect(
          M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
        ).toContain(
          "activeExploratoryHeading",
        );

        expect(
          M3_STANDARDIZED_PROBE_NORMALIZED_STATE,
        ).toContain(
          "rngState",
        );
      },
    );

    it(
      "locks the central M3 behavioural outcome before integrated implementation",
      () => {
        expect(
          M3_PRIMARY_PROBE_METRIC,
        ).toEqual({
          internalMetric:
            "learned-neural-connection-weights",

          neuralMetric:
            "seek-activation",

          behaviouralMetric:
            "selected-action",

          expectedBranchAAction:
            "seek",

          expectedBranchBAction:
            "idle",

          expectedLearningDisabledAction:
            "idle",

          expectedExplorationDisabledAction:
            "idle",
        });
      },
    );

    it(
      "locks the experience-state swap to learned weights rather than identity",
      () => {
        expect(
          M3_EXPERIENCE_STATE_SWAP_FIELD,
        ).toBe(
          "learned-neural-connection-weights",
        );

        expect(
          M3_EXPERIENCE_STATE_SWAP_EXPECTATION,
        ).toBe(
          "behaviour-follows-learned-state-not-creature-id",
        );
      },
    );

    it(
      "locks same-seed deterministic replay to the primary Branch A seed",
      () => {
        expect(
          M3_SAME_SEED_REPLAY_SEED,
        ).toBe(
          M3_PRIMARY_BRANCH_A_SEED,
        );

        expect(
          M3_PRIMARY_BRANCH_A_SEED,
        ).not.toBe(
          M3_PRIMARY_BRANCH_B_SEED,
        );
      },
    );
  },
);