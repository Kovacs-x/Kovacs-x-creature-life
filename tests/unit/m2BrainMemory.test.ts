import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  createM1Brain,
  evaluateM1Brain,
  M1_NODE_IDS,
} from "../../src/simulation/brain/m1Brain.js";

import {
  advanceFoodMemory,
  encodeFoodMemory,
  recallFoodMemory,
  type FoodMemoryRecallSignal,
} from "../../src/simulation/memory/foodMemory.js";

import {
  perceiveFood,
  type FoodPerceptionSignal,
} from "../../src/simulation/senses/foodPerception.js";

import {
  senseHunger,
} from "../../src/simulation/senses/hungerSense.js";

import {
  createFoodObject,
} from "../../src/world/food.js";

function createLegitimatePerception():
  FoodPerceptionSignal {
  const food =
    createFoodObject(
      "food-1",
      3,
      0,
      1,
    );

  const perception =
    perceiveFood(
      {
        x: 0,
        y: 0,
      },

      food,

      {
        maxRange: 10,
      },
    );

  if (perception === null) {
    throw new Error(
      "Expected legitimate food perception.",
    );
  }

  return perception;
}

function createLegitimateRecall(
  ageSeconds:
    number,
): FoodMemoryRecallSignal {
  const memory =
    encodeFoodMemory(
      createLegitimatePerception(),
      0,
    );

  const agedMemory =
    advanceFoodMemory(
      memory,
      ageSeconds,
    );

  if (agedMemory === null) {
    throw new Error(
      "Expected food memory to remain recallable for this test.",
    );
  }

  const recall =
    recallFoodMemory(
      agedMemory,
    );

  if (recall === null) {
    throw new Error(
      "Expected legitimate food-memory recall.",
    );
  }

  return recall;
}

function getNodeActivation(
  brain:
    ReturnType<
      typeof createM1Brain
    >,

  nodeId:
    string,
): number {
  const node =
    brain.nodes.find(
      (candidate) =>
        candidate.id ===
        nodeId,
    );

  if (node === undefined) {
    throw new Error(
      `Missing brain node: ${nodeId}`,
    );
  }

  return node.activation;
}

describe(
  "M2.3 neural food-memory integration",
  () => {
    it("provides a distinct remembered-food neural input with the same initial weight as direct food evidence", () => {
      const brain =
        createM1Brain();

      const directFoodConnection =
        brain.connections.find(
          (connection) =>
            connection.sourceNodeId ===
              M1_NODE_IDS.foodInput &&
            connection.targetNodeId ===
              M1_NODE_IDS.seekOutput,
        );

      const rememberedFoodConnection =
        brain.connections.find(
          (connection) =>
            connection.sourceNodeId ===
              M1_NODE_IDS
                .rememberedFoodInput &&
            connection.targetNodeId ===
              M1_NODE_IDS.seekOutput,
        );

      expect(
        directFoodConnection,
      ).toBeDefined();

      expect(
        rememberedFoodConnection,
      ).toBeDefined();

      expect(
        rememberedFoodConnection
          ?.sourceNodeId,
      ).not.toBe(
        directFoodConnection
          ?.sourceNodeId,
      );

      expect(
        rememberedFoodConnection
          ?.weight,
      ).toBe(
        directFoodConnection
          ?.weight,
      );

      expect(
        rememberedFoodConnection
          ?.enabled,
      ).toBe(true);
    });

    it("keeps direct perception and recalled food on separate neural inputs", () => {
      const brain =
        createM1Brain();

      const hunger =
        senseHunger(
          createHungerState(
            0.08,
            1,
          ),
        );

      const directPerception =
        createLegitimatePerception();

      const recall =
        createLegitimateRecall(
          1,
        );

      const directEvaluation =
        evaluateM1Brain(
          brain,

          hunger,

          directPerception,

          {
            inRange: false,
          },

          null,
        );

      const recalledEvaluation =
        evaluateM1Brain(
          brain,

          hunger,

          null,

          {
            inRange: false,
          },

          recall,
        );

      expect(
        getNodeActivation(
          directEvaluation.brain,
          M1_NODE_IDS.foodInput,
        ),
      ).toBeGreaterThan(0);

      expect(
        getNodeActivation(
          directEvaluation.brain,
          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);

      expect(
        getNodeActivation(
          recalledEvaluation.brain,
          M1_NODE_IDS.foodInput,
        ),
      ).toBe(0);

      expect(
        getNodeActivation(
          recalledEvaluation.brain,
          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);
    });

    it("increases SEEK activation through recalled food evidence when direct perception is absent", () => {
      const brain =
        createM1Brain();

      const hunger =
        senseHunger(
          createHungerState(
            0.08,
            1,
          ),
        );

      const recall =
        createLegitimateRecall(
          1,
        );

      const control =
        evaluateM1Brain(
          brain,

          hunger,

          null,

          {
            inRange: false,
          },

          null,
        );

      const remembered =
        evaluateM1Brain(
          brain,

          hunger,

          null,

          {
            inRange: false,
          },

          recall,
        );

      expect(
        remembered
          .seekActivation,
      ).toBeGreaterThan(
        control
          .seekActivation,
      );
    });

    it("allows memory confidence decay to reduce neural influence", () => {
      const brain =
        createM1Brain();

      const hunger =
        senseHunger(
          createHungerState(
            0.08,
            1,
          ),
        );

      const recentRecall =
        createLegitimateRecall(
          0,
        );

      const olderRecall =
        createLegitimateRecall(
          4,
        );

      const recent =
        evaluateM1Brain(
          brain,

          hunger,

          null,

          {
            inRange: false,
          },

          recentRecall,
        );

      const older =
        evaluateM1Brain(
          brain,

          hunger,

          null,

          {
            inRange: false,
          },

          olderRecall,
        );

      expect(
        recentRecall.confidence,
      ).toBeGreaterThan(
        olderRecall.confidence,
      );

      expect(
        getNodeActivation(
          recent.brain,
          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(
        getNodeActivation(
          older.brain,
          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      );

      expect(
        recent.seekActivation,
      ).toBeGreaterThan(
        older.seekActivation,
      );
    });

    it("does not let remembered food directly command SEEK when normal competition favours IDLE", () => {
      const brain =
        createM1Brain();

      /*
       * A fully satiated Creature receives no
       * hunger support for SEEK.
       */
      const full =
        senseHunger(
          createHungerState(
            1,
            1,
          ),
        );

      const recall =
        createLegitimateRecall(
          0,
        );

      const result =
        evaluateM1Brain(
          brain,

          full,

          null,

          {
            inRange: false,
          },

          recall,
        );

      /*
       * Memory contributes neural evidence,
       * but it cannot bypass competition and
       * issue SEEK as a command.
       */
      expect(
        getNodeActivation(
          result.brain,
          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      expect(
        result.seekActivation,
      ).toBeLessThan(
        result.idleActivation,
      );

      expect(
        result.selectedActionId,
      ).toBe("idle");
    });
  },
);