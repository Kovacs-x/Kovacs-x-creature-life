import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  BrainState,
} from "../../src/simulation/core/contracts.js";

import {
  SeededRng,
} from "../../src/simulation/core/rng.js";

import {
  createM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  deriveM3DirectFoodPerception,
} from "../../src/simulation/core/m3Discovery.js";

import {
  createM3AcquisitionState,
  runM3AcquisitionBranch,
  runM3ExperienceAcquisitionExperiment,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  M3_ACQUISITION_CREATURE_START,
  M3_ACQUISITION_MAX_TICKS_PER_ROUND,
  M3_ACQUISITION_ROUNDS,
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
  M3_PRIMARY_BRANCH_B_SEED,
} from "../../src/simulation/core/m3Contract.js";

function getConnectionWeight(
  brain:
    BrainState,

  connectionId:
    string,
): number {
  const connection =
    brain.connections.find(
      (candidate) =>
        candidate.id ===
        connectionId,
    );

  if (
    connection ===
    undefined
  ) {
    throw new Error(
      `Missing expected connection: ${connectionId}`,
    );
  }

  return connection.weight;
}

describe(
  "M3 experience acquisition experiment",
  () => {
    it(
      "creates the locked acquisition state with hidden food and no preloaded memory",
      () => {
        const state =
          createM3AcquisitionState({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        expect(
          state.tickIndex,
        ).toBe(
          0,
        );

        expect(
          state.simulationTimeSeconds,
        ).toBe(
          0,
        );

        expect(
          state.position,
        ).toEqual(
          M3_ACQUISITION_CREATURE_START,
        );

        expect(
          state.hunger,
        ).toEqual({
          energy:
            0.1,

          maxEnergy:
            1,
        });

        expect(
          state.memoryEnabled,
        ).toBe(
          false,
        );

        expect(
          state.explorationState
            .pressure,
        ).toBe(
          M3_EXPLORATION_INITIAL_PRESSURE,
        );

        expect(
          state.explorationState
            .activeHeading,
        ).toBeNull();

        expect(
          state.eligibilityTrace,
        ).toEqual(
          [],
        );

        expect(
          state.food.consumed,
        ).toBe(
          false,
        );

        const perception =
          deriveM3DirectFoodPerception(
            state.position,
            state.food,
            state.sensoryOccluder,
          );

        expect(
          perception.foodSignal,
        ).toBeNull();
      },
    );

    it(
      "demonstrates the prospectively locked Branch A discovery and consumption history",
      () => {
        const branch =
          runM3AcquisitionBranch({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        expect(
          branch.rounds,
        ).toHaveLength(
          M3_ACQUISITION_ROUNDS,
        );

        expect(
          branch.discoveryCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
        );

        expect(
          branch.consumptionCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
        );

        for (
          const round of
          branch.rounds
        ) {
          expect(
            round.ticks.length,
          ).toBeLessThanOrEqual(
            M3_ACQUISITION_MAX_TICKS_PER_ROUND,
          );

          expect(
            round.finalState
              .discoveryCount,
          ).toBe(
            1,
          );

          expect(
            round.finalState
              .consumptionCount,
          ).toBe(
            1,
          );

          expect(
            round.finalState
              .food.consumed,
          ).toBe(
            true,
          );

          expect(
            round.finalState
              .complete,
          ).toBe(
            true,
          );

          expect(
            round.finalState
              .cumulativeReward,
          ).toBeGreaterThan(
            0,
          );
        }
      },
    );

    it(
      "demonstrates the prospectively locked Branch B failure to acquire equivalent food experience",
      () => {
        const branch =
          runM3AcquisitionBranch({
            seed:
              M3_PRIMARY_BRANCH_B_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        expect(
          branch.discoveryCount,
        ).toBeLessThanOrEqual(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
        );

        expect(
          branch.consumptionCount,
        ).toBeLessThanOrEqual(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
        );

        expect(
          branch.discoveryCount,
        ).toBe(
          0,
        );

        expect(
          branch.consumptionCount,
        ).toBe(
          0,
        );

        expect(
          branch.cumulativeReward,
        ).toBe(
          0,
        );

        expect(
          branch.weightChanges,
        ).toEqual(
          [],
        );

        for (
          const round of
          branch.rounds
        ) {
          expect(
            round.ticks,
          ).toHaveLength(
            M3_ACQUISITION_MAX_TICKS_PER_ROUND,
          );

          expect(
            round.finalState
              .complete,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      "shows the complete causal chain inside each successful Branch A round",
      () => {
        const branch =
          runM3AcquisitionBranch({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        for (
          const round of
          branch.rounds
        ) {
          const discoveryIndex =
            round.ticks.findIndex(
              (tick) =>
                tick
                  .autonomousDiscoveryOccurred,
            );

          expect(
            discoveryIndex,
          ).toBeGreaterThanOrEqual(
            0,
          );

          const discovery =
            round.ticks[
              discoveryIndex
            ];

          expect(
            discovery,
          ).toBeDefined();

          expect(
            discovery!
              .selectedActionId,
          ).toBe(
            "explore",
          );

          expect(
            discovery!
              .movementSource,
          ).toBe(
            "exploration",
          );

          expect(
            discovery!
              .distanceMoved,
          ).toBeGreaterThan(
            0,
          );

          expect(
            discovery!
              .directFoodPerceptionBefore,
          ).toBeNull();

          expect(
            discovery!
              .directFoodPerceptionAfterMovement,
          ).not.toBeNull();

          const laterTicks =
            round.ticks.slice(
              discoveryIndex +
                1,
            );

          expect(
            laterTicks.some(
              (tick) =>
                tick
                  .selectedActionId ===
                "seek",
            ),
          ).toBe(
            true,
          );

          const eatingTick =
            laterTicks.find(
              (tick) =>
                tick.ate,
            );

          expect(
            eatingTick,
          ).toBeDefined();

          expect(
            eatingTick!
              .selectedActionId,
          ).toBe(
            "eat",
          );

          expect(
            eatingTick!
              .reward,
          ).toBeGreaterThan(
            0,
          );

          expect(
            eatingTick!
              .weightChanges
              .length,
          ).toBeGreaterThan(
            0,
          );
        }
      },
    );

    it(
      "produces persistent learned SEEK-state differences between the two legitimate experience histories",
      () => {
        const result =
          runM3ExperienceAcquisitionExperiment();

        const branchAHungerToSeek =
          getConnectionWeight(
            result.branchA
              .finalBrain,

            "hunger-to-seek",
          );

        const branchBHungerToSeek =
          getConnectionWeight(
            result.branchB
              .finalBrain,

            "hunger-to-seek",
          );

        const branchAFoodToSeek =
          getConnectionWeight(
            result.branchA
              .finalBrain,

            "food-to-seek",
          );

        const branchBFoodToSeek =
          getConnectionWeight(
            result.branchB
              .finalBrain,

            "food-to-seek",
          );

        expect(
          branchAHungerToSeek,
        ).toBeGreaterThan(
          branchBHungerToSeek,
        );

        expect(
          branchAFoodToSeek,
        ).toBeGreaterThan(
          branchBFoodToSeek,
        );

        expect(
          result.branchA
            .weightChanges
            .length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          result.branchB
            .weightChanges,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "allows genuine discovery and consumption with learning disabled but produces no neural weight changes",
      () => {
        const result =
          runM3ExperienceAcquisitionExperiment();

        const control =
          result
            .learningDisabledControl;

        expect(
          control.discoveryCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
        );

        expect(
          control.consumptionCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
        );

        expect(
          control.cumulativeReward,
        ).toBeGreaterThan(
          0,
        );

        expect(
          control.weightChanges,
        ).toEqual(
          [],
        );

        expect(
          control.finalBrain
            .connections,
        ).toEqual(
          createM3Brain()
            .connections,
        );
      },
    );

    it(
      "removes the experience-acquisition route when exploration is disabled",
      () => {
        const result =
          runM3ExperienceAcquisitionExperiment();

        const control =
          result
            .explorationDisabledControl;

        expect(
          control.discoveryCount,
        ).toBe(
          0,
        );

        expect(
          control.consumptionCount,
        ).toBe(
          0,
        );

        expect(
          control.cumulativeReward,
        ).toBe(
          0,
        );

        expect(
          control.weightChanges,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "preserves only the brain while resetting controlled round conditions",
      () => {
        const branch =
          runM3AcquisitionBranch({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        for (
          let roundIndex = 1;
          roundIndex <
            branch.rounds.length;
          roundIndex +=
            1
        ) {
          const previousRound =
            branch.rounds[
              roundIndex -
                1
            ];

          const currentRound =
            branch.rounds[
              roundIndex
            ];

          expect(
            previousRound,
          ).toBeDefined();

          expect(
            currentRound,
          ).toBeDefined();

          const previous =
            previousRound!
              .finalState;

          const current =
            currentRound!
              .initialState;

          /*
           * Persistent learned state.
           */
          expect(
            current.brain,
          ).toEqual(
            previous.brain,
          );

          /*
           * Controlled resets.
           */
          expect(
            current.position,
          ).toEqual(
            M3_ACQUISITION_CREATURE_START,
          );

          expect(
            current.hunger,
          ).toEqual({
            energy:
              0.1,

            maxEnergy:
              1,
          });

          expect(
            current.food.consumed,
          ).toBe(
            false,
          );

          expect(
            current.eligibilityTrace,
          ).toEqual(
            [],
          );

          expect(
            current.explorationState
              .pressure,
          ).toBe(
            M3_EXPLORATION_INITIAL_PRESSURE,
          );

          expect(
            current.explorationState
              .activeHeading,
          ).toBeNull();

          expect(
            current.tickIndex,
          ).toBe(
            0,
          );

          expect(
            current.simulationTimeSeconds,
          ).toBe(
            0,
          );

          expect(
            current.rngState,
          ).toEqual(
            new SeededRng(
              M3_PRIMARY_BRANCH_A_SEED,
            ).state,
          );

          expect(
            current.discoveryCount,
          ).toBe(
            0,
          );

          expect(
            current.consumptionCount,
          ).toBe(
            0,
          );

          expect(
            current.weightChanges,
          ).toEqual(
            [],
          );
        }
      },
    );

    it(
      "starts the two primary histories from equivalent learned state and controlled conditions",
      () => {
        const result =
          runM3ExperienceAcquisitionExperiment();

        const branchAInitial =
          result.branchA
            .rounds[0]
            ?.initialState;

        const branchBInitial =
          result.branchB
            .rounds[0]
            ?.initialState;

        expect(
          branchAInitial,
        ).toBeDefined();

        expect(
          branchBInitial,
        ).toBeDefined();

        expect(
          branchAInitial!
            .brain.connections,
        ).toEqual(
          branchBInitial!
            .brain.connections,
        );

        expect(
          branchAInitial!
            .position,
        ).toEqual(
          branchBInitial!
            .position,
        );

        expect(
          branchAInitial!
            .hunger,
        ).toEqual(
          branchBInitial!
            .hunger,
        );

        expect(
          branchAInitial!
            .food,
        ).toEqual(
          branchBInitial!
            .food,
        );

        expect(
          branchAInitial!
            .explorationState,
        ).toEqual(
          branchBInitial!
            .explorationState,
        );

        /*
         * The prospectively locked branch seed
         * is the intended causal difference.
         */
        expect(
          branchAInitial!
            .rngState,
        ).not.toEqual(
          branchBInitial!
            .rngState,
        );
      },
    );

    it(
      "replays the complete M3.6 experiment exactly",
      () => {
        const first =
          runM3ExperienceAcquisitionExperiment();

        const second =
          runM3ExperienceAcquisitionExperiment();

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);