import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  type M3AcquisitionState,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

/*
 * M3.11R ACTION-FEASIBILITY LIVENESS EVIDENCE
 *
 * Architecture review found that the original
 * M3.11R patch documented, but wrongly accepted,
 * a genuine persistent-play liveness defect: under
 * continuous repeated legitimate feeding, ordinary
 * reward-modulated plasticity (unchanged from M1)
 * can strengthen a contact-independent connection
 * (hunger-to-eat) until EAT's activation exceeds
 * every other candidate even with no food in reach.
 * An unsuccessful EAT produces no reward, so the
 * weight freezes; hunger and exploration pressure
 * stay saturated; the same physically unsupported
 * action wins every tick forever.
 *
 * The correction adds an explicit action-feasibility
 * gate to the generic M3 action competition
 * (selectHighestActivation's optional `available`
 * field, applied in evaluateM3Brain): SEEK is only
 * feasible with a legitimate direction source
 * (direct perception or usable M2 recall); EAT is
 * only feasible with genuine food contact. Neither
 * gate inspects hidden coordinates, IDs or renderer
 * state, forces a fallback action, or hides the raw
 * learned activation from telemetry.
 *
 * The tests below prove, using only the locked
 * Branch A seed and existing accepted mechanics,
 * that:
 *
 * 1. repeated legitimate feeding can still raise raw
 *    EAT activation above every competing candidate;
 * 2. without contact, eatActionFeasible is false and
 *    EAT cannot win selection despite that raw
 *    dominance;
 * 3. with contact, eatActionFeasible is true and EAT
 *    can still win and genuinely consume food;
 * 4. after the exact historical repeated-feeding
 *    sequence that previously produced a permanent
 *    lock, the Creature continues to have legitimate
 *    future action/movement opportunities rather than
 *    remaining stationary forever;
 * 5. SEEK cannot similarly monopolize the Creature
 *    merely because a learned hunger-to-seek weight
 *    becomes large, absent any legitimate direction
 *    source;
 * 6. SEEK remains normally competitive when a
 *    legitimate direct-perception direction is
 *    available.
 *
 * No locked seed, weight, learning rate or other M3
 * constant is altered anywhere in this file. The
 * boosted-weight fixtures in the SEEK section
 * construct a standalone test brain object rather
 * than tuning any locked production constant.
 */

/*
 * Drives the exact historical sequence that
 * previously produced a permanent EAT lock before
 * this correction: three genuine player-relocated
 * feeding cycles under the locked Branch A seed,
 * driven exclusively through the existing
 * authoritative tick transition and the existing
 * accepted M3.8 player food-placement boundary.
 */
function driveHistoricalRepeatedFeedingSequence():
  M3AcquisitionState {
  let state: M3AcquisitionState =
    createM3AcquisitionState({
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        true,
    });

  const destinations = [
    { x: 9.5, y: 9.5 },
    { x: 0.5, y: 9.5 },
    { x: 9.5, y: 0.5 },
  ];

  let eventSequence =
    0;

  let relocateIndex =
    0;

  for (
    let safety = 0;
    safety < 500 &&
    relocateIndex <
      destinations.length;
    safety += 1
  ) {
    if (state.complete) {
      const destination =
        destinations[
          relocateIndex
        ];

      if (
        destination ===
        undefined
      ) {
        throw new Error(
          "Test fixture destination index out of range.",
        );
      }

      const placement =
        applyM3PlayerFoodPlacement(
          state,

          destination,

          eventSequence,
        );

      eventSequence +=
        1;

      relocateIndex +=
        1;

      state =
        placement.state;

      continue;
    }

    state =
      advanceM3AcquisitionTick(
        state,
      ).state;
  }

  if (
    relocateIndex !==
    destinations.length
  ) {
    throw new Error(
      "Test fixture failed to drive the full historical feeding sequence.",
    );
  }

  return state;
}

describe(
  "M3.11R action-feasibility liveness correction",
  () => {
    describe(
      "EAT feasibility",
      () => {
        it(
          "lets repeated legitimate feeding raise raw EAT activation above every competing candidate, observably, even while infeasible",
          () => {
            let state =
              driveHistoricalRepeatedFeedingSequence();

            let sawInfeasibleEatDominant =
              false;

            for (
              let tickCount = 0;
              tickCount < 100 &&
              !state.complete;
              tickCount += 1
            ) {
              const result =
                advanceM3AcquisitionTick(
                  state,
                );

              state =
                result.state;

              const evidence =
                result.evidence;

              if (
                evidence.eatActivation >
                  evidence.idleActivation &&
                evidence.eatActivation >
                  evidence.seekActivation &&
                evidence.eatActivation >
                  evidence.exploreActivation &&
                evidence.eatActionFeasible ===
                  false
              ) {
                sawInfeasibleEatDominant =
                  true;

                break;
              }
            }

            /*
             * The learned raw EAT activation
             * genuinely dominates every other
             * candidate at least once. Feasibility
             * does not hide or zero this value; it
             * only withholds selection.
             */
            expect(
              sawInfeasibleEatDominant,
            ).toBe(
              true,
            );
          },
        );

        it(
          "never lets EAT win without contact, and the Creature keeps legitimate future action and movement opportunities after the historical repeated-feeding sequence",
          () => {
            let state =
              driveHistoricalRepeatedFeedingSequence();

            let sawGenuineDisplacement =
              false;

            let eatSelectedWithoutFeasibility =
              0;

            for (
              let tickCount = 0;
              tickCount < 300 &&
              !state.complete;
              tickCount += 1
            ) {
              const result =
                advanceM3AcquisitionTick(
                  state,
                );

              state =
                result.state;

              const evidence =
                result.evidence;

              if (
                evidence.selectedActionId ===
                  "eat" &&
                !evidence.eatActionFeasible
              ) {
                eatSelectedWithoutFeasibility +=
                  1;
              }

              if (
                evidence.distanceMoved >
                1e-9
              ) {
                sawGenuineDisplacement =
                  true;
              }
            }

            /*
             * Structural guarantee: the generic
             * competition never selects an
             * unavailable candidate.
             */
            expect(
              eatSelectedWithoutFeasibility,
            ).toBe(
              0,
            );

            /*
             * This is the corrected outcome,
             * directly reversing the previous
             * "permanent lock is acceptable"
             * finding: physical displacement
             * resumes once EAT can no longer
             * monopolize the ordinarily
             * infeasible tick.
             */
            expect(
              sawGenuineDisplacement,
            ).toBe(
              true,
            );
          },
        );

        it(
          "confirms EAT becomes feasible and can still win and genuinely consume food once genuine contact exists",
          () => {
            /*
             * A standalone test brain with an
             * artificially boosted hunger-to-eat
             * weight, mirroring the same real
             * mechanism repeated legitimate feeding
             * produces, but constructed directly so
             * this proof does not depend on exactly
             * how many ticks an emergent multi-tick
             * sequence takes to reach the same
             * point. This does not tune any locked
             * production constant.
             */
            const baseBrain =
              createM3Brain();

            const boostedBrain = {
              ...baseBrain,

              connections:
                baseBrain.connections.map(
                  (connection) =>
                    connection.id ===
                    "hunger-to-eat"
                      ? {
                          ...connection,

                          weight:
                            0.95,
                        }
                      : connection,
                ),
            };

            const base =
              createM3AcquisitionState({
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  false,

                explorationEnabled:
                  false,

                brain:
                  boostedBrain,
              });

            const zeroHunger =
              createHungerState(
                0,

                base.hunger.maxEnergy,
              );

            /*
             * Food far outside interaction range:
             * raw EAT activation still dominates
             * IDLE, but contact is absent.
             */
            const outOfRange: M3AcquisitionState = {
              ...base,

              hunger:
                zeroHunger,

              position: {
                x: 0,
                y: 0,
              },

              food: {
                ...base.food,

                position: {
                  x: 9,
                  y: 9,
                },
              },

              sensoryOccluder: {
                ...base.sensoryOccluder,

                active:
                  false,
              },
            };

            const infeasibleResult =
              advanceM3AcquisitionTick(
                outOfRange,
              );

            expect(
              infeasibleResult.evidence
                .eatActivation,
            ).toBeGreaterThan(
              infeasibleResult.evidence
                .idleActivation,
            );

            expect(
              infeasibleResult.evidence
                .contactInRange,
            ).toBe(
              false,
            );

            expect(
              infeasibleResult.evidence
                .eatActionFeasible,
            ).toBe(
              false,
            );

            expect(
              infeasibleResult.evidence
                .selectedActionId,
            ).not.toBe(
              "eat",
            );

            /*
             * Identical brain and hunger, but the
             * Creature now genuinely stands on the
             * food: the same learned dominance is
             * now feasible and must be allowed to
             * win and actually consume food.
             */
            const inRange: M3AcquisitionState = {
              ...base,

              hunger:
                zeroHunger,

              position: {
                x: 0,
                y: 0,
              },

              food: {
                ...base.food,

                position: {
                  x: 0,
                  y: 0,
                },
              },

              sensoryOccluder: {
                ...base.sensoryOccluder,

                active:
                  false,
              },
            };

            const feasibleResult =
              advanceM3AcquisitionTick(
                inRange,
              );

            expect(
              feasibleResult.evidence
                .contactInRange,
            ).toBe(
              true,
            );

            expect(
              feasibleResult.evidence
                .eatActionFeasible,
            ).toBe(
              true,
            );

            expect(
              feasibleResult.evidence
                .selectedActionId,
            ).toBe(
              "eat",
            );

            expect(
              feasibleResult.evidence.ate,
            ).toBe(
              true,
            );

            expect(
              feasibleResult.state.food
                .consumed,
            ).toBe(
              true,
            );

            expect(
              feasibleResult.state.hunger
                .energy,
            ).toBeGreaterThan(
              0,
            );
          },
        );
      },
    );

    describe(
      "SEEK feasibility",
      () => {
        it(
          "prevents SEEK from winning merely because a learned hunger-to-seek weight is large, absent any legitimate direction source",
          () => {
            /*
             * A standalone test brain with an
             * artificially boosted hunger-to-seek
             * weight, constructed only for this
             * fixture. This does not tune any
             * locked production constant; it
             * demonstrates that raw activation
             * dominance alone, without a legitimate
             * direction source, still cannot win
             * SEEK the competition.
             */
            const baseBrain =
              createM3Brain();

            const boostedBrain = {
              ...baseBrain,

              connections:
                baseBrain.connections.map(
                  (connection) =>
                    connection.id ===
                    "hunger-to-seek"
                      ? {
                          ...connection,

                          weight:
                            0.95,
                        }
                      : connection,
                ),
            };

            const base =
              createM3AcquisitionState({
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  false,

                explorationEnabled:
                  true,

                brain:
                  boostedBrain,
              });

            /*
             * Maximum hunger, and the locked
             * acquisition occluder remains active
             * by default, so no direct perception
             * and (memoryEnabled defaults to false)
             * no recall are available this tick.
             */
            const state: M3AcquisitionState = {
              ...base,

              hunger:
                createHungerState(
                  0,

                  base.hunger.maxEnergy,
                ),
            };

            expect(
              state.sensoryOccluder.active,
            ).toBe(
              true,
            );

            const result =
              advanceM3AcquisitionTick(
                state,
              );

            expect(
              result.evidence
                .directFoodPerceptionBefore,
            ).toBeNull();

            expect(
              result.evidence
                .seekActivation,
            ).toBeGreaterThan(
              result.evidence
                .idleActivation,
            );

            expect(
              result.evidence
                .seekActionFeasible,
            ).toBe(
              false,
            );

            expect(
              result.evidence
                .selectedActionId,
            ).not.toBe(
              "seek",
            );

            expect(
              result.evidence
                .distanceMoved,
            ).toBe(
              0,
            );

            expect(
              result.state.position,
            ).toEqual(
              state.position,
            );
          },
        );

        it(
          "keeps SEEK normally competitive when a legitimate direct-perception direction is available",
          () => {
            const base =
              createM3AcquisitionState({
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  true,

                explorationEnabled:
                  false,
              });

            const state: M3AcquisitionState = {
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
                .seekActionFeasible,
            ).toBe(
              true,
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
              "direct-perception",
            );

            expect(
              result.evidence
                .distanceMoved,
            ).toBeGreaterThan(
              0,
            );
          },
        );
      },
    );
  },
);
