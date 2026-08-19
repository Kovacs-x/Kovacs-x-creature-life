import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  runM3AcquisitionRound,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3LifeHistory,
  deserializeM3LifeHistory,
  exportM3LifeHistoryJson,
  M3_LIFE_HISTORY_ENTRY_KIND,
  M3_LIFE_HISTORY_SCHEMA_VERSION,
  observeM3PlayerWorldEventForLifeHistory,
  observeM3TickForLifeHistory,
  serializeM3LifeHistory,
} from "../../src/simulation/core/m3LifeHistory.js";

import {
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_SEED,
} from "../../src/simulation/core/m3Contract.js";

describe(
  "M3 persistent life history",
  () => {
    it(
      "starts as a separate empty player-facing biography",
      () => {
        const history =
          createM3LifeHistory();

        expect(
          history,
        ).toEqual({
          schemaVersion:
            M3_LIFE_HISTORY_SCHEMA_VERSION,

          entries:
            [],

          pendingPlayerFoodEvent:
            null,
        });
      },
    );

    it(
      "derives first exploration, discovery, consumption and learning from genuine Branch A evidence",
      () => {
        const round =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        let history =
          createM3LifeHistory();

        for (
          const evidence of
          round.ticks
        ) {
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );
        }

        const eventTypes =
          history.entries.map(
            (entry) =>
              entry.eventType,
          );

        expect(
          eventTypes,
        ).toContain(
          "first-autonomous-exploration",
        );

        expect(
          eventTypes,
        ).toContain(
          "first-autonomous-food-discovery",
        );

        expect(
          eventTypes,
        ).toContain(
          "first-food-consumption-after-discovery",
        );

        expect(
          eventTypes,
        ).toContain(
          "first-learning-change",
        );

        for (
          const entry of
          history.entries
        ) {
          expect(
            entry.kind,
          ).toBe(
            M3_LIFE_HISTORY_ENTRY_KIND,
          );

          expect(
            entry.simulationTimeSeconds,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            entry.tickIndex,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            entry.description.length,
          ).toBeGreaterThan(
            0,
          );

          expect(
            entry.causalReference.length,
          ).toBeGreaterThan(
            0,
          );
        }
      },
    );

    it(
      "does not invent discovery, consumption or learning for the locked Branch B history",
      () => {
        const round =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_B_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        let history =
          createM3LifeHistory();

        for (
          const evidence of
          round.ticks
        ) {
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );
        }

        const eventTypes =
          history.entries.map(
            (entry) =>
              entry.eventType,
          );

        expect(
          eventTypes,
        ).toContain(
          "first-autonomous-exploration",
        );

        expect(
          eventTypes,
        ).not.toContain(
          "first-autonomous-food-discovery",
        );

        expect(
          eventTypes,
        ).not.toContain(
          "first-food-consumption-after-discovery",
        );

        expect(
          eventTypes,
        ).not.toContain(
          "first-learning-change",
        );
      },
    );

    it(
      "records each first-life event only once",
      () => {
        const round =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        let history =
          createM3LifeHistory();

        for (
          const evidence of
          round.ticks
        ) {
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );

          /*
           * Re-observing the same evidence must
           * not duplicate first-life entries.
           */
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );
        }

        const counts =
          new Map<
            string,
            number
          >();

        for (
          const entry of
          history.entries
        ) {
          counts.set(
            entry.eventType,

            (
              counts.get(
                entry.eventType,
              ) ??
              0
            ) +
              1,
          );
        }

        for (
          const count of
          counts.values()
        ) {
          expect(
            count,
          ).toBe(
            1,
          );
        }
      },
    );

    it(
      "does not turn a player world action itself into Creature perception",
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

        const historyAfterPlayerEvent =
          observeM3PlayerWorldEventForLifeHistory(
            createM3LifeHistory(),

            placement.event,
          );

        expect(
          historyAfterPlayerEvent
            .entries,
        ).toEqual(
          [],
        );

        expect(
          historyAfterPlayerEvent
            .pendingPlayerFoodEvent,
        ).not.toBeNull();

        const tick =
          advanceM3AcquisitionTick(
            placement.state,
          );

        expect(
          tick.evidence
            .directFoodPerceptionBefore,
        ).toBeNull();

        expect(
          tick.evidence
            .directFoodPerceptionAfterMovement,
        ).toBeNull();

        const historyAfterHiddenTick =
          observeM3TickForLifeHistory(
            historyAfterPlayerEvent,

            tick.evidence,
          );

        expect(
          historyAfterHiddenTick
            .entries.some(
              (entry) =>
                entry.eventType ===
                "first-player-positioned-food-perception",
            ),
        ).toBe(
          false,
        );

        expect(
          historyAfterHiddenTick
            .pendingPlayerFoodEvent,
        ).not.toBeNull();
      },
    );

    it(
      "records player-positioned food only after ordinary perception actually sees it",
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

        const placement =
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            4,
          );

        let history =
          observeM3PlayerWorldEventForLifeHistory(
            createM3LifeHistory(),

            placement.event,
          );

        expect(
          history.entries,
        ).toEqual(
          [],
        );

        const tick =
          advanceM3AcquisitionTick(
            placement.state,
          );

        expect(
          tick.evidence
            .directFoodPerceptionBefore,
        ).not.toBeNull();

        history =
          observeM3TickForLifeHistory(
            history,

            tick.evidence,
          );

        const entry =
          history.entries.find(
            (candidate) =>
              candidate.eventType ===
              "first-player-positioned-food-perception",
          );

        expect(
          entry,
        ).toBeDefined();

        expect(
          entry!
            .description,
        ).toBe(
          "First noticed food after it was positioned by the player.",
        );

        expect(
          entry!
            .causalReference,
        ).toBe(
          `player-event:4/tick:${tick.evidence.tickIndex}`,
        );

        expect(
          history
            .pendingPlayerFoodEvent,
        ).toBeNull();
      },
    );

    it(
      "uses conservative deterministic descriptions derived from real events",
      () => {
        const round =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        let history =
          createM3LifeHistory();

        for (
          const evidence of
          round.ticks
        ) {
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );
        }

        const discovery =
          history.entries.find(
            (entry) =>
              entry.eventType ===
              "first-autonomous-food-discovery",
          );

        expect(
          discovery
            ?.description,
        ).toBe(
          "First independently discovered food.",
        );

        const exploration =
          history.entries.find(
            (entry) =>
              entry.eventType ===
              "first-autonomous-exploration",
          );

        expect(
          exploration
            ?.description,
        ).toBe(
          "First explored autonomously.",
        );

        /*
         * Unsupported emotional interpretation
         * must not appear in biography wording.
         */
        const allDescriptions =
          history.entries
            .map(
              (entry) =>
                entry.description,
            )
            .join(
              " ",
            )
            .toLowerCase();

        expect(
          allDescriptions,
        ).not.toContain(
          "happy",
        );

        expect(
          allDescriptions,
        ).not.toContain(
          "excited",
        );

        expect(
          allDescriptions,
        ).not.toContain(
          "curious",
        );

        expect(
          allDescriptions,
        ).not.toContain(
          "proud",
        );
      },
    );

    it(
      "does not mutate authoritative tick evidence while deriving biography",
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

        const tick =
          advanceM3AcquisitionTick(
            state,
          );

        const evidenceBefore =
          JSON.stringify(
            tick.evidence,
          );

        observeM3TickForLifeHistory(
          createM3LifeHistory(),

          tick.evidence,
        );

        expect(
          JSON.stringify(
            tick.evidence,
          ),
        ).toBe(
          evidenceBefore,
        );
      },
    );

    it(
      "cannot influence Creature behaviour because biography is outside the simulation transition",
      () => {
        const createState =
          () =>
            createM3AcquisitionState({
              seed:
                M3_PRIMARY_BRANCH_A_SEED,

              learningEnabled:
                true,

              explorationEnabled:
                true,
            });

        const baseline =
          advanceM3AcquisitionTick(
            createState(),
          );

        /*
         * Construct and alter biography state.
         *
         * It is deliberately impossible to pass
         * this object into
         * advanceM3AcquisitionTick().
         */
        const history = {
          ...createM3LifeHistory(),

          entries: [
            {
              kind:
                M3_LIFE_HISTORY_ENTRY_KIND,

              simulationTimeSeconds:
                999,

              tickIndex:
                999,

              eventType:
                "first-autonomous-exploration" as const,

              description:
                "Arbitrary presentation wording.",

              causalReference:
                "presentation-only",
            },
          ],
        };

        expect(
          history.entries,
        ).toHaveLength(
          1,
        );

        const comparison =
          advanceM3AcquisitionTick(
            createState(),
          );

        expect(
          comparison,
        ).toEqual(
          baseline,
        );
      },
    );

    it(
      "round-trips deterministic life-history persistence",
      () => {
        const round =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        let history =
          createM3LifeHistory();

        for (
          const evidence of
          round.ticks
        ) {
          history =
            observeM3TickForLifeHistory(
              history,
              evidence,
            );
        }

        const serialized =
          serializeM3LifeHistory(
            history,
          );

        const restored =
          deserializeM3LifeHistory(
            serialized,
          );

        expect(
          restored,
        ).toEqual(
          history,
        );

        expect(
          serializeM3LifeHistory(
            restored,
          ),
        ).toBe(
          serialized,
        );
      },
    );

    it(
      "exports deterministic player-readable JSON without wall-clock data",
      () => {
        const history =
          createM3LifeHistory();

        const first =
          exportM3LifeHistoryJson(
            history,
          );

        const second =
          exportM3LifeHistoryJson(
            history,
          );

        expect(
          second,
        ).toBe(
          first,
        );

        expect(
          first,
        ).not.toContain(
          "Date",
        );

        expect(
          first,
        ).not.toContain(
          "timestamp",
        );
      },
    );

    it(
      "rejects malformed persisted biography state",
      () => {
        expect(() =>
          deserializeM3LifeHistory(
            "not-json",
          ),
        ).toThrow();

        expect(() =>
          deserializeM3LifeHistory(
            JSON.stringify({
              schemaVersion:
                999,

              entries:
                [],

              pendingPlayerFoodEvent:
                null,
            }),
          ),
        ).toThrow();

        expect(() =>
          deserializeM3LifeHistory(
            JSON.stringify({
              schemaVersion:
                M3_LIFE_HISTORY_SCHEMA_VERSION,

              entries: [
                {
                  kind:
                    M3_LIFE_HISTORY_ENTRY_KIND,

                  simulationTimeSeconds:
                    -1,

                  tickIndex:
                    0,

                  eventType:
                    "first-autonomous-exploration",

                  description:
                    "Invalid.",

                  causalReference:
                    "tick:0",
                },
              ],

              pendingPlayerFoodEvent:
                null,
            }),
          ),
        ).toThrow();
      },
    );
  },
);