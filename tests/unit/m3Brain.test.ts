import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createM1Brain,
  M1_NODE_IDS,
} from "../../src/simulation/brain/m1Brain.js";

import {
  createM3Brain,
  evaluateM3Brain,
  M3_CONNECTION_IDS,
  M3_NODE_IDS,
} from "../../src/simulation/brain/m3Brain.js";

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
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_EXPLORATION_TO_EXPLORE_WEIGHT,
} from "../../src/simulation/core/m3Contract.js";

describe(
  "M3 neural exploration integration",
  () => {
    it(
      "extends the accepted M1 brain without modifying the M1 baseline",
      () => {
        const m1Brain =
          createM1Brain();

        const m1Snapshot =
          JSON.parse(
            JSON.stringify(
              m1Brain,
            ),
          );

        const m3Brain =
          createM3Brain(
            m1Brain,
          );

        expect(
          m1Brain,
        ).toEqual(
          m1Snapshot,
        );

        expect(
          m3Brain.nodes,
        ).toHaveLength(
          m1Brain.nodes.length +
            2,
        );

        expect(
          m3Brain.connections,
        ).toHaveLength(
          m1Brain.connections.length +
            1,
        );

        expect(
          m1Brain.nodes.some(
            (node) =>
              node.id ===
                M3_NODE_IDS
                  .explorationInput ||
              node.id ===
                M3_NODE_IDS
                  .exploreOutput,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "preserves every accepted M1 node and connection exactly",
      () => {
        const m1Brain =
          createM1Brain();

        const m3Brain =
          createM3Brain(
            m1Brain,
          );

        expect(
          m3Brain.nodes.slice(
            0,
            m1Brain.nodes.length,
          ),
        ).toEqual(
          m1Brain.nodes,
        );

        expect(
          m3Brain.connections.slice(
            0,
            m1Brain.connections.length,
          ),
        ).toEqual(
          m1Brain.connections,
        );
      },
    );

    it(
      "adds only the dedicated exploration input and EXPLORE output",
      () => {
        const brain =
          createM3Brain();

        const explorationInput =
          brain.nodes.find(
            (node) =>
              node.id ===
              M3_NODE_IDS
                .explorationInput,
          );

        const exploreOutput =
          brain.nodes.find(
            (node) =>
              node.id ===
              M3_NODE_IDS
                .exploreOutput,
          );

        expect(
          explorationInput,
        ).toEqual({
          id:
            "input:exploration",

          module:
            "input",

          activation:
            0,
        });

        expect(
          exploreOutput,
        ).toEqual({
          id:
            "action:explore",

          module:
            "action",

          activation:
            0,
        });
      },
    );

    it(
      "uses the prospectively locked exploration connection weight",
      () => {
        const brain =
          createM3Brain();

        const connection =
          brain.connections.find(
            (candidate) =>
              candidate.id ===
              M3_CONNECTION_IDS
                .explorationToExplore,
          );

        expect(
          connection,
        ).toEqual({
          id:
            "exploration-to-explore",

          sourceNodeId:
            M3_NODE_IDS
              .explorationInput,

          targetNodeId:
            M3_NODE_IDS
              .exploreOutput,

          weight:
            M3_EXPLORATION_TO_EXPLORE_WEIGHT,

          enabled:
            true,
        });

        expect(
          connection?.weight,
        ).toBe(
          0.5,
        );
      },
    );

    it(
      "keeps IDLE selected at the locked initial exploration pressure",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              0.5,
              1,
            ),
          );

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            M3_EXPLORATION_INITIAL_PRESSURE,
          );

        expect(
          result.exploreActivation,
        ).toBeCloseTo(
          0.1,
        );

        expect(
          result.idleActivation,
        ).toBeCloseTo(
          0.35,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "idle",
        );
      },
    );

    it(
      "allows EXPLORE to win ordinary competition when pressure becomes sufficiently high",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              0,
              1,
            ),
          );

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            0.8,
          );

        expect(
          result.idleActivation,
        ).toBeCloseTo(
          0.35,
        );

        expect(
          result.seekActivation,
        ).toBeCloseTo(
          0.3,
        );

        expect(
          result.exploreActivation,
        ).toBeCloseTo(
          0.4,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "explore",
        );
      },
    );

    it(
      "does not give EXPLORE priority over stronger legitimate food seeking",
      () => {
        const brain =
          createM3Brain();

        const creaturePosition = {
          x: 0,
          y: 0,
        };

        const hunger =
          senseHunger(
            createHungerState(
              0,
              1,
            ),
          );

        const food =
          createFoodObject(
            "m3-brain-food",
            2,
            0,
            0.5,
          );

        const foodSignal =
          perceiveFood(
            creaturePosition,
            food,
            {
              maxRange:
                10,
            },
          );

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            foodSignal,
            0.8,
          );

        expect(
          result.seekActivation,
        ).toBeGreaterThan(
          result.exploreActivation,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "seek",
        );
      },
    );

    it(
      "does not give EXPLORE priority over legitimate eating",
      () => {
        const brain =
          createM3Brain();

        const creaturePosition = {
          x: 0,
          y: 0,
        };

        const hunger =
          senseHunger(
            createHungerState(
              0,
              1,
            ),
          );

        const food =
          createFoodObject(
            "m3-contact-food",
            0,
            0,
            0.5,
          );

        const foodSignal =
          perceiveFood(
            creaturePosition,
            food,
            {
              maxRange:
                10,
            },
          );

        const contactSignal =
          senseFoodContact(
            creaturePosition,
            food,
            0.25,
          );

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            foodSignal,
            1,
            contactSignal,
          );

        expect(
          result.eatActivation,
        ).toBeGreaterThan(
          result.exploreActivation,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "eat",
        );
      },
    );

    it(
      "preserves the distinct remembered-food neural pathway",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              0.5,
              1,
            ),
          );

        const rememberedFood = {
          kind:
            "food-memory-recall" as const,

          ageSeconds:
            1,

          confidence:
            1,

          directionX:
            1,

          directionY:
            0,

          strength:
            1,
        };

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            0.2,
            {
              inRange:
                false,
            },
            rememberedFood,
          );

        expect(
          result.brain.nodes.find(
            (node) =>
              node.id ===
              M1_NODE_IDS
                .foodInput,
          )?.activation,
        ).toBe(
          0,
        );

        expect(
          result.brain.nodes.find(
            (node) =>
              node.id ===
              M1_NODE_IDS
                .rememberedFoodInput,
          )?.activation,
        ).toBe(
          1,
        );

        expect(
          result.seekActivation,
        ).toBeGreaterThan(
          result.exploreActivation,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "seek",
        );
      },
    );

    it(
      "does not let an exact EXPLORE tie displace an existing accepted action",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              1,
              1,
            ),
          );

        /*
         * explorationPressure 0.7
         * ×
         * locked weight 0.5
         * =
         * 0.35
         *
         * exactly equal to the accepted
         * bias-to-IDLE activation.
         */
        const result =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            0.7,
          );

        expect(
          result.idleActivation,
        ).toBeCloseTo(
          0.35,
        );

        expect(
          result.exploreActivation,
        ).toBeCloseTo(
          0.35,
        );

        expect(
          result.selectedActionId,
        ).toBe(
          "idle",
        );
      },
    );

    it(
      "records exploration pressure as a distinct neural input activation",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              1,
              1,
            ),
          );

        const result =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            0.6,
          );

        const explorationInput =
          result.brain.nodes.find(
            (node) =>
              node.id ===
              M3_NODE_IDS
                .explorationInput,
          );

        expect(
          explorationInput?.activation,
        ).toBeCloseTo(
          0.6,
        );

        expect(
          result.exploreActivation,
        ).toBeCloseTo(
          0.3,
        );
      },
    );

    it(
      "produces identical neural evaluation from identical state and inputs",
      () => {
        const first =
          evaluateM3Brain(
            createM3Brain(),
            senseHunger(
              createHungerState(
                0.2,
                1,
              ),
            ),
            null,
            0.8,
          );

        const second =
          evaluateM3Brain(
            createM3Brain(),
            senseHunger(
              createHungerState(
                0.2,
                1,
              ),
            ),
            null,
            0.8,
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "rejects invalid exploration pressure",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              0.5,
              1,
            ),
          );

        expect(() =>
          evaluateM3Brain(
            brain,
            hunger,
            null,
            -0.1,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          evaluateM3Brain(
            brain,
            hunger,
            null,
            1.1,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          evaluateM3Brain(
            brain,
            hunger,
            null,
            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "rejects an ordinary M1 brain when M3 evaluation is requested",
      () => {
        const hunger =
          senseHunger(
            createHungerState(
              0.5,
              1,
            ),
          );

        expect(() =>
          evaluateM3Brain(
            createM1Brain(),
            hunger,
            null,
            0.5,
          ),
        ).toThrow();
      },
    );

    it(
      "does not allow M3 exploration nodes to be added twice",
      () => {
        const m3Brain =
          createM3Brain();

        expect(() =>
          createM3Brain(
            m3Brain,
          ),
        ).toThrow();
      },
    );
  },
);