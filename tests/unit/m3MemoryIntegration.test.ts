import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  deserializeM3AcquisitionState,
  runM3AcquisitionBranch,
  serializeM3AcquisitionState,
  type M3AcquisitionState,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  deriveM3DirectFoodPerception,
} from "../../src/simulation/core/m3Discovery.js";

import {
  runM3StandardizedLearningComparison,
} from "../../src/simulation/core/m3Probe.js";

import {
  createM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
} from "../../src/simulation/memory/foodMemory.js";

import {
  M3_ACQUISITION_OCCLUDER,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

function createMemoryDisabledState():
  M3AcquisitionState {
  return createM3AcquisitionState({
    seed:
      M3_PRIMARY_BRANCH_A_SEED,

    learningEnabled:
      true,

    explorationEnabled:
      true,
  });
}

function createMemoryEnabledState():
  M3AcquisitionState {
  return createM3AcquisitionState({
    seed:
      M3_PRIMARY_BRANCH_A_SEED,

    learningEnabled:
      true,

    explorationEnabled:
      true,

    memoryEnabled:
      true,
  });
}

/*
 * Small unoccluded scenario used by several
 * tests below: food placed directly in front of
 * the Creature, no occluder in the way, so
 * direct perception is legitimately available
 * from tick 0 without depending on autonomous
 * exploration to discover it.
 */
function createDirectlyVisibleState(
  memoryEnabled:
    boolean,
): M3AcquisitionState {
  const base =
    createM3AcquisitionState({
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        false,

      memoryEnabled,
    });

  return {
    ...base,

    food: {
      ...base.food,

      position: {
        x: 3,
        y: 0,
      },
    },

    sensoryOccluder: {
      ...base.sensoryOccluder,

      active:
        false,
    },
  };
}

describe(
  "M3.11R memory integration",
  () => {
    it(
      "keeps the controlled acquisition experiment memory-disabled by default",
      () => {
        const state =
          createMemoryDisabledState();

        expect(
          state.memoryEnabled,
        ).toBe(
          false,
        );

        expect(
          state.foodMemory,
        ).toBeNull();

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
          expect(
            round.finalState
              .memoryEnabled,
          ).toBe(
            false,
          );

          expect(
            round.finalState
              .foodMemory,
          ).toBeNull();

          for (
            const tick of
            round.ticks
          ) {
            expect(
              tick.activeFoodMemoryPresent,
            ).toBe(
              false,
            );

            expect(
              tick.foodMemoryRecall,
            ).toBeNull();
          }
        }
      },
    );

    it(
      "allows the ordinary browser Creature to construct memory-enabled state",
      () => {
        const state =
          createMemoryEnabledState();

        expect(
          state.memoryEnabled,
        ).toBe(
          true,
        );

        expect(
          state.foodMemory,
        ).toBeNull();
      },
    );

    it(
      "encodes memory only from legitimate direct perception",
      () => {
        const state =
          createDirectlyVisibleState(
            true,
          );

        const result =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          result.evidence
            .directFoodPerceptionBefore,
        ).not.toBeNull();

        expect(
          result.state.foodMemory,
        ).not.toBeNull();

        expect(
          result.state.foodMemory
            ?.sourceFoodId,
        ).toBe(
          state.food.id,
        );

        expect(
          result.state.foodMemory
            ?.rememberedDirectionX,
        ).toBeCloseTo(
          result.evidence
            .directFoodPerceptionBefore
            ?.directionX ??
            Number.NaN,
        );
      },
    );

    it(
      "does not update memory when relocated food remains hidden from perception",
      () => {
        /*
         * Locked acquisition food starts behind
         * the real occluder, so it has never been
         * directly perceived. Relocating it to
         * another hidden location must not create
         * or change any memory trace.
         */
        const state =
          createMemoryEnabledState();

        expect(
          state.foodMemory,
        ).toBeNull();

        const placement =
          applyM3PlayerFoodPlacement(
            state,

            {
              x:
                M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,

              y:
                M3_HIDDEN_TARGET_ALTERNATE_FOOD.y,
            },

            0,
          );

        expect(
          placement.state.foodMemory,
        ).toBeNull();

        const result =
          advanceM3AcquisitionTick(
            placement.state,
          );

        expect(
          result.evidence
            .directFoodPerceptionBefore,
        ).toBeNull();

        expect(
          result.state.foodMemory,
        ).toBeNull();
      },
    );

    it(
      "keeps stale recall wrong after hidden food relocation within valid habitat bounds, then corrects it once legitimately re-perceived",
      () => {
        /*
         * Mirrors the accepted M2.6/M2.7
         * stale-memory and correction
         * adversarial cases at the M3
         * integration boundary.
         *
         * Both the original and relocated food
         * positions, and the Creature itself,
         * stay strictly within the locked
         * [0, 10] x [0, 10] M3 habitat bounds
         * (M3_HABITAT_BOUNDS) throughout: an
         * authoritative world state outside those
         * bounds is not valid acceptance evidence.
         *
         * Hunger is held at maximum energy (zero
         * hunger) throughout so that direct-
         * perception-driven SEEK activation
         * (strength 0.7 at distance 3, weight 0.3,
         * contributing 0.21) never beats the
         * locked 0.35 IDLE bias on its own. This
         * isolates pure memory encode/stale/
         * correction behaviour from any
         * confounding movement.
         */
        const base =
          createMemoryEnabledState();

        const zeroHunger =
          createHungerState(
            base.hunger.maxEnergy,
            base.hunger.maxEnergy,
          );

        let state: M3AcquisitionState = {
          ...base,

          position: {
            x: 5,
            y: 0,
          },

          hunger:
            zeroHunger,

          food: {
            ...base.food,

            position: {
              x: 8,
              y: 0,
            },
          },

          sensoryOccluder: {
            ...base.sensoryOccluder,

            active:
              false,
          },
        };

        const firstTick =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          firstTick.state.position,
        ).toEqual(
          state.position,
        );

        const originalDirectionX =
          firstTick.state.foodMemory
            ?.rememberedDirectionX ??
          Number.NaN;

        expect(
          originalDirectionX,
        ).toBeGreaterThan(
          0,
        );

        /*
         * Relocate the same food to the west,
         * still within bounds (x = 2), and place a
         * genuine occluder between the stationary
         * Creature (x = 5) and the new food
         * position so it is never legitimately
         * re-perceived yet.
         */
        state = {
          ...firstTick.state,

          food: {
            ...firstTick.state.food,

            position: {
              x: 2,
              y: 0,
            },
          },

          sensoryOccluder: {
            ...firstTick.state
              .sensoryOccluder,

            active:
              true,

            x: 3.5,

            minY: -1,

            maxY: 1,
          },
        };

        expect(
          deriveM3DirectFoodPerception(
            state.position,
            state.food,
            state.sensoryOccluder,
          ).occluded,
        ).toBe(
          true,
        );

        const staleTick =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          staleTick.evidence
            .directFoodPerceptionBefore,
        ).toBeNull();

        expect(
          staleTick.state.position,
        ).toEqual(
          state.position,
        );

        /*
         * The retained trace still represents the
         * original (now wrong) eastward direction.
         */
        expect(
          staleTick.state.foodMemory
            ?.rememberedDirectionX,
        ).toBeCloseTo(
          originalDirectionX,
        );

        /*
         * Legitimate re-perception (occluder
         * removed) corrects the trace to the
         * genuine westward direction.
         */
        const revealed = {
          ...staleTick.state,

          sensoryOccluder: {
            ...staleTick.state
              .sensoryOccluder,

            active:
              false,
          },
        };

        const correctedTick =
          advanceM3AcquisitionTick(
            revealed,
          );

        expect(
          correctedTick.evidence
            .directFoodPerceptionBefore,
        ).not.toBeNull();

        expect(
          correctedTick.state.foodMemory
            ?.rememberedDirectionX,
        ).toBeLessThan(
          0,
        );
      },
    );

    it(
      "lets recall enter normal M3 neural competition without directly commanding SEEK",
      () => {
        /*
         * A stored trace with moderate confidence
         * but a fully-fed Creature (hunger = 0)
         * produces too little combined SEEK
         * activation to beat the locked 0.35 IDLE
         * bias, so IDLE must still win even though
         * recall is genuinely active. Movement
         * therefore does not occur despite a valid
         * recall signal being supplied to
         * cognition.
         */
        const base =
          createMemoryEnabledState();

        /*
         * advanceFoodMemory(...) recomputes
         * confidence deterministically from
         * (simulationTimeSeconds -
         * encodedAtSimulationTimeSeconds) rather
         * than trusting a stored confidence/age
         * value, so this fixture advances the
         * state's own simulation time forward by
         * 4 seconds past encoding to genuinely
         * reach confidence 0.5 (1.0 - 0.125 * 4)
         * through the real decay computation.
         */
        const state: M3AcquisitionState = {
          ...base,

          simulationTimeSeconds:
            4,

          hunger:
            createHungerState(
              base.hunger.maxEnergy,
              base.hunger.maxEnergy,
            ),

          foodMemory: {
            schemaVersion:
              1,

            kind:
              "food-memory",

            source:
              "food-perception",

            sourceFoodId:
              base.food.id,

            encodedAtSimulationTimeSeconds:
              0,

            ageSeconds:
              4,

            confidence:
              0.5,

            rememberedDirectionX:
              1,

            rememberedDirectionY:
              0,

            rememberedPerceptualStrength:
              0.5,
          },

          sensoryOccluder: {
            ...base.sensoryOccluder,

            active:
              true,
          },
        };

        const result =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          result.evidence
            .activeFoodMemoryPresent,
        ).toBe(
          true,
        );

        expect(
          result.evidence
            .rememberedFoodInputActivation,
        ).toBeCloseTo(
          0.25,
        );

        expect(
          result.evidence
            .selectedActionId,
        ).toBe(
          "idle",
        );

        expect(
          result.evidence
            .seekDirectionSource,
        ).toBeNull();

        expect(
          result.state.position,
        ).toEqual(
          state.position,
        );
      },
    );

    it(
      "moves from recall only after SEEK genuinely wins competition",
      () => {
        /*
         * Same stored trace as above, but now the
         * Creature is maximally hungry so recall
         * alone can push SEEK above the IDLE
         * bias and legitimately win.
         */
        const base =
          createMemoryEnabledState();

        const state: M3AcquisitionState = {
          ...base,

          hunger:
            createHungerState(
              0,

              base.hunger.maxEnergy,
            ),

          foodMemory: {
            schemaVersion:
              1,

            kind:
              "food-memory",

            source:
              "food-perception",

            sourceFoodId:
              base.food.id,

            encodedAtSimulationTimeSeconds:
              0,

            ageSeconds:
              1,

            confidence:
              1,

            rememberedDirectionX:
              1,

            rememberedDirectionY:
              0,

            rememberedPerceptualStrength:
              1,
          },

          sensoryOccluder: {
            ...base.sensoryOccluder,

            active:
              true,
          },
        };

        const result =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          result.evidence
            .selectedActionId,
        ).toBe(
          "seek",
        );

        expect(
          result.evidence
            .seekDirectionSource,
        ).toBe(
          "memory-recall",
        );

        expect(
          result.evidence
            .movementSource,
        ).toBe(
          "seek",
        );

        expect(
          result.state.position.x,
        ).toBeGreaterThan(
          state.position.x,
        );
      },
    );

    it(
      "gives current direct perception priority over recall for SEEK direction",
      () => {
        /*
         * Direct perception this tick points in
         * the opposite direction from a stale
         * retained trace. Recall is never even
         * computed while direct perception exists
         * (it is only exposed when direct
         * perception is absent), so movement must
         * follow the fresh direct evidence.
         */
        const base =
          createMemoryEnabledState();

        /*
         * Positions stay within the locked
         * [0, 10] habitat bounds: the Creature
         * starts at x = 5, direct food sits at
         * x = 2 (a westward/negative direction),
         * while the stale retained trace claims
         * an eastward/positive direction.
         */
        const state: M3AcquisitionState = {
          ...base,

          position: {
            x: 5,
            y: 0,
          },

          food: {
            ...base.food,

            position: {
              x: 2,
              y: 0,
            },
          },

          hunger:
            createHungerState(
              0,

              base.hunger.maxEnergy,
            ),

          foodMemory: {
            schemaVersion:
              1,

            kind:
              "food-memory",

            source:
              "food-perception",

            sourceFoodId:
              base.food.id,

            encodedAtSimulationTimeSeconds:
              0,

            ageSeconds:
              1,

            confidence:
              1,

            rememberedDirectionX:
              1,

            rememberedDirectionY:
              0,

            rememberedPerceptualStrength:
              1,
          },

          sensoryOccluder: {
            ...base.sensoryOccluder,

            active:
              false,
          },
        };

        const result =
          advanceM3AcquisitionTick(
            state,
          );

        expect(
          result.evidence
            .directFoodPerceptionBefore,
        ).not.toBeNull();

        expect(
          result.evidence
            .foodMemoryRecall,
        ).toBeNull();

        expect(
          result.evidence
            .selectedActionId,
        ).toBe(
          "seek",
        );

        expect(
          result.evidence
            .seekDirectionSource,
        ).toBe(
          "direct-perception",
        );

        expect(
          result.evidence
            .seekMovementDirection
            ?.x,
        ).toBeLessThan(
          0,
        );

        expect(
          result.state.position.x,
        ).toBeLessThan(
          state.position.x,
        );
      },
    );

    it(
      "decays and eventually expires memory deterministically once direct perception is lost",
      () => {
        /*
         * Hunger is held at maximum energy (zero
         * hunger) so that recall alone can never
         * out-activate the locked IDLE bias
         * during this observation window. This
         * isolates pure memory decay/expiration
         * from any confounding SEEK movement.
         */
        const base =
          createDirectlyVisibleState(
            true,
          );

        const state: M3AcquisitionState = {
          ...base,

          hunger:
            createHungerState(
              base.hunger.maxEnergy,
              base.hunger.maxEnergy,
            ),
        };

        const perceived =
          advanceM3AcquisitionTick(
            state,
          ).state;

        expect(
          perceived.foodMemory,
        ).not.toBeNull();

        expect(
          perceived.position,
        ).toEqual(
          state.position,
        );

        /*
         * Re-occlude so no further direct
         * perception refreshes the trace, then
         * let it age until it expires. The locked
         * M2 decay contract expires a trace once
         * confidence falls below 0.25, which
         * occurs at exactly 7 simulated seconds of
         * age at the locked 0.125/second decay
         * rate (age 6 -> confidence 0.25, still
         * usable; age 7 -> confidence 0.125,
         * expired).
         */
        /*
         * The occluder must genuinely sit on the
         * line of sight between the (stationary)
         * Creature at x = 0 and the food at
         * x = 3, so it is placed at x = 1.5
         * rather than reusing the locked
         * acquisition occluder's x = 4 (which
         * would sit beyond the food and therefore
         * block nothing).
         */
        let current: M3AcquisitionState = {
          ...perceived,

          sensoryOccluder: {
            ...perceived.sensoryOccluder,

            active:
              true,

            x: 1.5,

            minY: -1,

            maxY: 1,
          },
        };

        expect(
          deriveM3DirectFoodPerception(
            current.position,
            current.food,
            current.sensoryOccluder,
          ).occluded,
        ).toBe(
          true,
        );

        for (
          let tickCount = 0;
          tickCount < 7;
          tickCount += 1
        ) {
          current =
            advanceM3AcquisitionTick(
              current,
            ).state;
        }

        expect(
          current.foodMemory,
        ).toBeNull();

        expect(
          current.position,
        ).toEqual(
          perceived.position,
        );
      },
    );

    it(
      "survives meaningful serialization and continues identically after reload",
      () => {
        const state =
          createDirectlyVisibleState(
            true,
          );

        const perceived =
          advanceM3AcquisitionTick(
            state,
          ).state;

        expect(
          perceived.foodMemory,
        ).not.toBeNull();

        const serialized =
          serializeM3AcquisitionState(
            perceived,
          );

        const restored =
          deserializeM3AcquisitionState(
            serialized,
          );

        expect(
          restored,
        ).toEqual(
          perceived,
        );

        const occluded: M3AcquisitionState = {
          ...perceived,

          sensoryOccluder: {
            ...perceived.sensoryOccluder,

            active:
              true,

            x: 0,

            minY: -10,

            maxY: 10,
          },
        };

        const restoredOccluded: M3AcquisitionState = {
          ...restored,

          sensoryOccluder: {
            ...restored.sensoryOccluder,

            active:
              true,

            x: 0,

            minY: -10,

            maxY: 10,
          },
        };

        const continuedFromOriginal =
          advanceM3AcquisitionTick(
            occluded,
          );

        const continuedFromRestored =
          advanceM3AcquisitionTick(
            restoredOccluded,
          );

        expect(
          continuedFromRestored.state,
        ).toEqual(
          continuedFromOriginal.state,
        );

        expect(
          continuedFromRestored.evidence,
        ).toEqual(
          continuedFromOriginal.evidence,
        );
      },
    );

    it(
      "accepts earlier schema-1 M3 checkpoints that predate the foodMemory field",
      () => {
        const state =
          createMemoryDisabledState();

        const serialized =
          serializeM3AcquisitionState(
            state,
          );

        const legacyShaped =
          JSON.parse(
            serialized,
          ) as Record<
            string,
            unknown
          >;

        /*
         * Simulate a genuinely pre-M3.11R
         * checkpoint: the foodMemory key never
         * existed in the serialized JSON at all.
         */
        delete legacyShaped.foodMemory;

        const legacySerialized =
          JSON.stringify(
            legacyShaped,
          );

        const restored =
          deserializeM3AcquisitionState(
            legacySerialized,
          );

        expect(
          restored.memoryEnabled,
        ).toBe(
          false,
        );

        expect(() =>
          advanceM3AcquisitionTick(
            restored,
          ),
        ).not.toThrow();
      },
    );

    it(
      "keeps learning identical whether memory is enabled or disabled when recall never actually activates",
      () => {
        /*
         * With food always directly visible,
         * recall is never exposed to cognition in
         * either branch (recall only participates
         * while direct perception is absent), so
         * the two configurations must produce
         * byte-identical learning outcomes.
         */
        const withMemory =
          createDirectlyVisibleState(
            true,
          );

        const withoutMemory =
          createDirectlyVisibleState(
            false,
          );

        const resultWithMemory =
          advanceM3AcquisitionTick(
            withMemory,
          );

        const resultWithoutMemory =
          advanceM3AcquisitionTick(
            withoutMemory,
          );

        expect(
          resultWithMemory.state.brain,
        ).toEqual(
          resultWithoutMemory.state
            .brain,
        );

        expect(
          resultWithMemory.state
            .weightChanges,
        ).toEqual(
          resultWithoutMemory.state
            .weightChanges,
        );

        expect(
          resultWithMemory.evidence
            .selectedActionId,
        ).toBe(
          resultWithoutMemory.evidence
            .selectedActionId,
        );
      },
    );

    it(
      "keeps exploration target-independent regardless of whether memory is enabled",
      () => {
        /*
         * Before any legitimate perception has
         * ever occurred there is nothing to
         * recall, so enabling memory must not
         * change autonomous exploratory action,
         * heading or movement at all relative to
         * the identical memory-disabled run.
         */
        let withMemory =
          createMemoryEnabledState();

        let withoutMemory =
          createMemoryDisabledState();

        for (
          let tickCount = 0;
          tickCount < 6;
          tickCount += 1
        ) {
          const resultWithMemory =
            advanceM3AcquisitionTick(
              withMemory,
            );

          const resultWithoutMemory =
            advanceM3AcquisitionTick(
              withoutMemory,
            );

          expect(
            resultWithMemory.evidence
              .selectedActionId,
          ).toBe(
            resultWithoutMemory
              .evidence
              .selectedActionId,
          );

          expect(
            resultWithMemory.state
              .position,
          ).toEqual(
            resultWithoutMemory.state
              .position,
          );

          expect(
            resultWithMemory.state
              .explorationState,
          ).toEqual(
            resultWithoutMemory.state
              .explorationState,
          );

          withMemory =
            resultWithMemory.state;

          withoutMemory =
            resultWithoutMemory.state;
        }
      },
    );

    it(
      "runs the standardized learning comparison as a read-only observer that cannot mutate the running Creature",
      () => {
        const creature =
          createDirectlyVisibleState(
            true,
          );

        const advanced =
          advanceM3AcquisitionTick(
            creature,
          ).state;

        const brainBeforeSnapshot =
          JSON.stringify(
            advanced.brain,
          );

        const rngBeforeSnapshot =
          JSON.stringify(
            advanced.rngState,
          );

        const stateBeforeSnapshot =
          JSON.stringify(
            advanced,
          );

        const comparison =
          runM3StandardizedLearningComparison(
            advanced.brain,
          );

        expect(
          JSON.stringify(
            advanced.brain,
          ),
        ).toBe(
          brainBeforeSnapshot,
        );

        expect(
          JSON.stringify(
            advanced.rngState,
          ),
        ).toBe(
          rngBeforeSnapshot,
        );

        expect(
          JSON.stringify(
            advanced,
          ),
        ).toBe(
          stateBeforeSnapshot,
        );

        expect(
          comparison.freshEquivalent
            .connectionWeights,
        ).toEqual(
          Object.fromEntries(
            createM3Brain()
              .connections.map(
                (connection) => [
                  connection.id,
                  connection.weight,
                ],
              ),
          ),
        );

        /*
         * Deterministic and reproducible: the
         * same input produces the same result,
         * confirming no hidden RNG consumption
         * or ordering dependency.
         */
        const secondComparison =
          runM3StandardizedLearningComparison(
            advanced.brain,
          );

        expect(
          secondComparison,
        ).toEqual(
          comparison,
        );
      },
    );

    it(
      "keeps the standardized probe metric response consistent with the locked M3.7 individuality contract while memory-disabled",
      () => {
        /*
         * The controlled acquisition experiment
         * and standardized probe are entirely
         * unaffected by M3.11R; every branch
         * still runs with foodMemory permanently
         * null.
         */
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
          branch.finalBrain,
        ).toBeDefined();

        for (
          const round of
          branch.rounds
        ) {
          expect(
            round.finalState
              .foodMemory,
          ).toBeNull();
        }
      },
    );
  },
);

/*
 * Sanity guard: the locked M2 minimum recall
 * confidence constant used to construct the
 * synthetic traces above must remain the value
 * these hand-built test fixtures assume.
 */
describe(
  "M3.11R memory fixture assumptions",
  () => {
    it(
      "assumes the locked minimum recall confidence used to build test fixtures",
      () => {
        expect(
          FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
        ).toBe(
          0.25,
        );
      },
    );

    it(
      "assumes the acquisition occluder starting geometry used to build occluded fixtures",
      () => {
        expect(
          M3_ACQUISITION_OCCLUDER.active,
        ).toBe(
          true,
        );
      },
    );
  },
);
