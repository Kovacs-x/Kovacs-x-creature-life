import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  copyM3LearnedConnectionWeights,
  M3_PROBE_IDENTITY_A,
  M3_PROBE_IDENTITY_B,
  normalizeM3ProbeBrain,
  runM3IndividualityProbeExperiment,
  runM3StandardizedProbe,
} from "../../src/simulation/core/m3Probe.js";

import {
  M3_EXPERIENCE_STATE_SWAP_EXPECTATION,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
  M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
  M3_PRIMARY_PROBE_METRIC,
  M3_STANDARDIZED_PROBE,
} from "../../src/simulation/core/m3Contract.js";

const experiment =
  runM3IndividualityProbeExperiment();

describe(
  "M3 standardized individuality probe",
  () => {
    it(
      "normalizes current conditions across the two primary experience histories",
      () => {
        const branchA =
          experiment.branchA;

        const branchB =
          experiment.branchB;

        expect(
          branchA.normalizedState,
        ).toEqual(
          branchB.normalizedState,
        );

        expect(
          branchA.normalizedState
            .position,
        ).toEqual(
          M3_STANDARDIZED_PROBE
            .creaturePosition,
        );

        expect(
          branchA.normalizedState
            .hunger,
        ).toEqual({
          energy:
            M3_STANDARDIZED_PROBE
              .hungerEnergy,

          maxEnergy:
            M3_STANDARDIZED_PROBE
              .maxEnergy,
        });

        expect(
          branchA.normalizedState
            .food.position,
        ).toEqual({
          x:
            M3_STANDARDIZED_PROBE
              .food.x,

          y:
            M3_STANDARDIZED_PROBE
              .food.y,
        });

        expect(
          branchA.normalizedState
            .food.consumed,
        ).toBe(
          false,
        );

        expect(
          branchA.normalizedState
            .foodMemory,
        ).toBeNull();

        expect(
          branchA.normalizedState
            .eligibilityTrace,
        ).toEqual(
          [],
        );

        expect(
          branchA.normalizedState
            .explorationEnabled,
        ).toBe(
          false,
        );

        expect(
          branchA.normalizedState
            .explorationState
            .pressure,
        ).toBe(
          0,
        );

        expect(
          branchA.normalizedState
            .explorationState
            .activeHeading,
        ).toBeNull();

        expect(
          branchA.normalizedState
            .rngState,
        ).toEqual(
          branchB.normalizedState
            .rngState,
        );
      },
    );

    it(
      "uses legitimate equal direct perception in both primary probe branches",
      () => {
        const branchA =
          experiment.branchA;

        const branchB =
          experiment.branchB;

        expect(
          branchA.normalizedState
            .directPerceptionConditions
            .occluded,
        ).toBe(
          false,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception,
        ).toEqual(
          branchB.normalizedState
            .directFoodPerception,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception
            .foodId,
        ).toBe(
          M3_STANDARDIZED_PROBE
            .food.id,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception
            .distance,
        ).toBe(
          6,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception
            .directionX,
        ).toBeCloseTo(
          1,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception
            .directionY,
        ).toBeCloseTo(
          0,
        );

        expect(
          branchA.normalizedState
            .directFoodPerception
            .strength,
        ).toBeCloseTo(
          0.4,
        );

        expect(
          branchA.normalizedState
            .foodContactInRange,
        ).toBe(
          false,
        );

        expect(
          branchB.normalizedState
            .foodContactInRange,
        ).toBe(
          false,
        );
      },
    );

    it(
      "preserves learned connection weights while removing historical neural activation",
      () => {
        const acquiredBrain =
          experiment.acquisition
            .branchA
            .finalBrain;

        const normalized =
          normalizeM3ProbeBrain(
            acquiredBrain,
          );

        expect(
          normalized.connections,
        ).toEqual(
          acquiredBrain.connections,
        );

        expect(
          normalized.nodes.every(
            (node) =>
              node.activation ===
              0,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "confirms Phase A actually produced different legitimate experience histories",
      () => {
        expect(
          experiment.acquisition
            .branchA
            .discoveryCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES,
        );

        expect(
          experiment.acquisition
            .branchA
            .consumptionCount,
        ).toBeGreaterThanOrEqual(
          M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS,
        );

        expect(
          experiment.acquisition
            .branchB
            .discoveryCount,
        ).toBeLessThanOrEqual(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES,
        );

        expect(
          experiment.acquisition
            .branchB
            .consumptionCount,
        ).toBeLessThanOrEqual(
          M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS,
        );
      },
    );

    it(
      "preserves a relevant persistent learned-state difference into the standardized probe",
      () => {
        expect(
          experiment.branchA
            .connectionWeights,
        ).not.toEqual(
          experiment.branchB
            .connectionWeights,
        );

        expect(
          experiment.branchA
            .connectionWeights[
              "hunger-to-seek"
            ],
        ).toBeGreaterThan(
          experiment.branchB
            .connectionWeights[
              "hunger-to-seek"
            ] ??
            Number.NEGATIVE_INFINITY,
        );

        expect(
          experiment.branchA
            .connectionWeights[
              "food-to-seek"
            ],
        ).toBeGreaterThan(
          experiment.branchB
            .connectionWeights[
              "food-to-seek"
            ] ??
            Number.NEGATIVE_INFINITY,
        );
      },
    );

    it(
      "produces the prospectively required later behavioural divergence under identical current conditions",
      () => {
        expect(
          experiment.branchA
            .seekActivation,
        ).toBeGreaterThan(
          experiment.branchB
            .seekActivation,
        );

        expect(
          experiment.branchA
            .selectedActionId,
        ).toBe(
          M3_PRIMARY_PROBE_METRIC
            .expectedBranchAAction,
        );

        expect(
          experiment.branchB
            .selectedActionId,
        ).toBe(
          M3_PRIMARY_PROBE_METRIC
            .expectedBranchBAction,
        );

        expect(
          experiment.branchA
            .selectedActionId,
        ).toBe(
          "seek",
        );

        expect(
          experiment.branchB
            .selectedActionId,
        ).toBe(
          "idle",
        );
      },
    );

    it(
      "turns the learned behavioural divergence into a different physical consequence",
      () => {
        expect(
          experiment.branchA
            .movementSource,
        ).toBe(
          "seek",
        );

        expect(
          experiment.branchA
            .distanceMoved,
        ).toBeGreaterThan(
          0,
        );

        expect(
          experiment.branchA
            .positionAfter.x,
        ).toBeGreaterThan(
          experiment.branchA
            .normalizedState
            .position.x,
        );

        expect(
          experiment.branchB
            .movementSource,
        ).toBeNull();

        expect(
          experiment.branchB
            .distanceMoved,
        ).toBe(
          0,
        );

        expect(
          experiment.branchB
            .positionAfter,
        ).toEqual(
          experiment.branchB
            .normalizedState
            .position,
        );
      },
    );

    it(
      "keeps current exploration completely out of the standardized behavioural difference",
      () => {
        const probes = [
          experiment.branchA,
          experiment.branchB,
          experiment
            .learningDisabledControl,
          experiment
            .explorationDisabledControl,
          experiment
            .identityAWithBranchBWeights,
          experiment
            .identityBWithBranchAWeights,
        ];

        for (
          const probe of
          probes
        ) {
          expect(
            probe.normalizedState
              .explorationEnabled,
          ).toBe(
            false,
          );

          expect(
            probe.normalizedState
              .explorationState
              .pressure,
          ).toBe(
            0,
          );

          expect(
            probe.exploreActivation,
          ).toBe(
            0,
          );
        }
      },
    );

    it(
      "keeps current memory completely out of the standardized behavioural difference",
      () => {
        expect(
          experiment.branchA
            .normalizedState
            .foodMemory,
        ).toBeNull();

        expect(
          experiment.branchB
            .normalizedState
            .foodMemory,
        ).toBeNull();

        expect(
          experiment.branchA
            .normalizedState
            .directFoodPerception,
        ).not.toBeNull();

        expect(
          experiment.branchB
            .normalizedState
            .directFoodPerception,
        ).not.toBeNull();
      },
    );

    it(
      "keeps the learning-disabled control at the prospectively expected naive-like behaviour",
      () => {
        const control =
          experiment
            .learningDisabledControl;

        expect(
          experiment.acquisition
            .learningDisabledControl
            .discoveryCount,
        ).toBeGreaterThan(
          0,
        );

        expect(
          experiment.acquisition
            .learningDisabledControl
            .consumptionCount,
        ).toBeGreaterThan(
          0,
        );

        expect(
          experiment.acquisition
            .learningDisabledControl
            .weightChanges,
        ).toEqual(
          [],
        );

        expect(
          control.selectedActionId,
        ).toBe(
          M3_PRIMARY_PROBE_METRIC
            .expectedLearningDisabledAction,
        );

        expect(
          control.selectedActionId,
        ).toBe(
          "idle",
        );

        expect(
          control.distanceMoved,
        ).toBe(
          0,
        );
      },
    );

    it(
      "keeps the exploration-disabled control at the prospectively expected naive-like behaviour",
      () => {
        const control =
          experiment
            .explorationDisabledControl;

        expect(
          experiment.acquisition
            .explorationDisabledControl
            .discoveryCount,
        ).toBe(
          0,
        );

        expect(
          experiment.acquisition
            .explorationDisabledControl
            .consumptionCount,
        ).toBe(
          0,
        );

        expect(
          control.selectedActionId,
        ).toBe(
          M3_PRIMARY_PROBE_METRIC
            .expectedExplorationDisabledAction,
        );

        expect(
          control.selectedActionId,
        ).toBe(
          "idle",
        );

        expect(
          control.distanceMoved,
        ).toBe(
          0,
        );
      },
    );

    it(
      "makes behaviour follow swapped learned state rather than diagnostic identity",
      () => {
        const identityAWithBranchBWeights =
          experiment
            .identityAWithBranchBWeights;

        const identityBWithBranchAWeights =
          experiment
            .identityBWithBranchAWeights;

        expect(
          M3_EXPERIENCE_STATE_SWAP_EXPECTATION,
        ).toBe(
          "behaviour-follows-learned-state-not-creature-id",
        );

        /*
         * Identity A originally had the
         * experience-rich Branch A weights.
         *
         * After receiving Branch B weights it
         * must behave like Branch B.
         */
        expect(
          identityAWithBranchBWeights
            .identity,
        ).toBe(
          M3_PROBE_IDENTITY_A,
        );

        expect(
          identityAWithBranchBWeights
            .connectionWeights,
        ).toEqual(
          experiment.branchB
            .connectionWeights,
        );

        expect(
          identityAWithBranchBWeights
            .selectedActionId,
        ).toBe(
          experiment.branchB
            .selectedActionId,
        );

        expect(
          identityAWithBranchBWeights
            .selectedActionId,
        ).toBe(
          "idle",
        );

        expect(
          identityAWithBranchBWeights
            .distanceMoved,
        ).toBe(
          0,
        );

        /*
         * Identity B originally had the
         * experience-poor Branch B weights.
         *
         * After receiving Branch A weights it
         * must behave like Branch A.
         */
        expect(
          identityBWithBranchAWeights
            .identity,
        ).toBe(
          M3_PROBE_IDENTITY_B,
        );

        expect(
          identityBWithBranchAWeights
            .connectionWeights,
        ).toEqual(
          experiment.branchA
            .connectionWeights,
        );

        expect(
          identityBWithBranchAWeights
            .selectedActionId,
        ).toBe(
          experiment.branchA
            .selectedActionId,
        );

        expect(
          identityBWithBranchAWeights
            .selectedActionId,
        ).toBe(
          "seek",
        );

        expect(
          identityBWithBranchAWeights
            .distanceMoved,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "copies only connection weights during the experience-state swap",
      () => {
        const target =
          experiment.acquisition
            .branchB
            .finalBrain;

        const source =
          experiment.acquisition
            .branchA
            .finalBrain;

        const swapped =
          copyM3LearnedConnectionWeights(
            target,
            source,
          );

        for (
          const targetNode of
          target.nodes
        ) {
          const swappedNode =
            swapped.nodes.find(
              (node) =>
                node.id ===
                targetNode.id,
            );

          expect(
            swappedNode,
          ).toBeDefined();

          expect(
            swappedNode!
              .module,
          ).toBe(
            targetNode.module,
          );

          expect(
            swappedNode!
              .activation,
          ).toBe(
            0,
          );
        }

        for (
          const swappedConnection of
          swapped.connections
        ) {
          const sourceConnection =
            source.connections.find(
              (connection) =>
                connection.id ===
                swappedConnection.id,
            );

          const targetConnection =
            target.connections.find(
              (connection) =>
                connection.id ===
                swappedConnection.id,
            );

          expect(
            sourceConnection,
          ).toBeDefined();

          expect(
            targetConnection,
          ).toBeDefined();

          expect(
            swappedConnection.weight,
          ).toBe(
            sourceConnection!
              .weight,
          );

          expect(
            swappedConnection
              .sourceNodeId,
          ).toBe(
            targetConnection!
              .sourceNodeId,
          );

          expect(
            swappedConnection
              .targetNodeId,
          ).toBe(
            targetConnection!
              .targetNodeId,
          );

          expect(
            swappedConnection.enabled,
          ).toBe(
            targetConnection!
              .enabled,
          );
        }
      },
    );

    it(
      "shows that diagnostic identity alone has no behavioural effect",
      () => {
        const commonBrain =
          createM3Brain();

        const identityA =
          runM3StandardizedProbe(
            M3_PROBE_IDENTITY_A,
            commonBrain,
          );

        const identityB =
          runM3StandardizedProbe(
            M3_PROBE_IDENTITY_B,
            commonBrain,
          );

        expect(
          identityA.identity,
        ).not.toBe(
          identityB.identity,
        );

        expect(
          identityA.normalizedState,
        ).toEqual(
          identityB.normalizedState,
        );

        expect(
          identityA.connectionWeights,
        ).toEqual(
          identityB.connectionWeights,
        );

        expect(
          identityA.seekActivation,
        ).toBe(
          identityB.seekActivation,
        );

        expect(
          identityA.selectedActionId,
        ).toBe(
          identityB.selectedActionId,
        );

        expect(
          identityA.positionAfter,
        ).toEqual(
          identityB.positionAfter,
        );
      },
    );

    it(
      "does not consume RNG during the standardized probe",
      () => {
        const probes = [
          experiment.branchA,
          experiment.branchB,
          experiment
            .learningDisabledControl,
          experiment
            .explorationDisabledControl,
          experiment
            .identityAWithBranchBWeights,
          experiment
            .identityBWithBranchAWeights,
        ];

        for (
          const probe of
          probes
        ) {
          expect(
            probe.rngStateAfter,
          ).toEqual(
            probe.normalizedState
              .rngState,
          );
        }

        expect(
          experiment.branchA
            .normalizedState
            .rngState,
        ).toEqual(
          experiment.branchB
            .normalizedState
            .rngState,
        );
      },
    );

    it(
      "replays the complete acquisition plus individuality probe exactly",
      () => {
        const first =
          runM3IndividualityProbeExperiment();

        const second =
          runM3IndividualityProbeExperiment();

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);