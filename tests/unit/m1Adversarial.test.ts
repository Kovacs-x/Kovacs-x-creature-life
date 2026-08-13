import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceHungerOverTime,
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  createM1Brain,
  evaluateM1Brain,
} from "../../src/simulation/brain/m1Brain.js";

import {
  perceiveFood,
} from "../../src/simulation/senses/foodPerception.js";

import {
  senseHunger,
} from "../../src/simulation/senses/hungerSense.js";

import {
  senseFoodContact,
} from "../../src/simulation/senses/foodContact.js";

import {
  moveAlongDirection,
} from "../../src/simulation/actions/movement.js";

import {
  eatFood,
} from "../../src/simulation/actions/eating.js";

import {
  createFoodObject,
} from "../../src/world/food.js";

describe(
  "M1 adversarial world changes",
  () => {
    it("stops pursuing food after it disappears before arrival", () => {
      let position = {
        x: 0,
        y: 0,
      };

      let hunger =
        createHungerState(
          0.1,
          1,
        );

      let food =
        createFoodObject(
          "food-1",
          2,
          0,
          0.5,
        );

      let brain =
        createM1Brain();

      /*
       * TICK 1
       *
       * Food is visible two units away.
       * The creature is hungry and should
       * choose SEEK through normal action
       * competition.
       */

      const tick1FoodSignal =
        perceiveFood(
          position,
          food,
          {
            maxRange: 10,
          },
        );

      expect(
        tick1FoodSignal,
      ).not.toBeNull();

      const tick1Decision =
        evaluateM1Brain(
          brain,

          senseHunger(
            hunger,
          ),

          tick1FoodSignal,

          senseFoodContact(
            position,
            food,
            0.25,
          ),
        );

      expect(
        tick1Decision
          .selectedActionId,
      ).toBe("seek");

      brain =
        tick1Decision.brain;

      if (
        tick1FoodSignal === null
      ) {
        throw new Error(
          "Expected food to be perceived on tick one.",
        );
      }

      const movement =
        moveAlongDirection(
          position,

          tick1FoodSignal
            .directionX,

          tick1FoodSignal
            .directionY,

          1,

          {
            minX: 0,
            minY: 0,
            maxX: 10,
            maxY: 10,
          },
        );

      position =
        movement.position;

      /*
       * The creature has moved only halfway
       * toward the original food location.
       */

      expect(
        position,
      ).toEqual({
        x: 1,
        y: 0,
      });

      /*
       * ADVERSARIAL WORLD CHANGE
       *
       * Another process removes the food
       * before the creature arrives.
       *
       * "consumed" represents an unavailable
       * world object: perception and contact
       * must now treat it as absent.
       */

      food = {
        ...food,
        consumed: true,
      };

      /*
       * Normal simulation time still passes.
       */

      hunger =
        advanceHungerOverTime(
          hunger,
          1,
          {
            energyLossPerSecond:
              0.02,
          },
        );

      /*
       * TICK 2
       *
       * The creature must resample the world.
       *
       * It must NOT continue behaving from a
       * hidden remembered target coordinate.
       */

      const tick2FoodSignal =
        perceiveFood(
          position,
          food,
          {
            maxRange: 10,
          },
        );

      const tick2ContactSignal =
        senseFoodContact(
          position,
          food,
          0.25,
        );

      expect(
        tick2FoodSignal,
      ).toBeNull();

      expect(
        tick2ContactSignal
          .inRange,
      ).toBe(false);

      const tick2Decision =
        evaluateM1Brain(
          brain,

          senseHunger(
            hunger,
          ),

          tick2FoodSignal,

          tick2ContactSignal,
        );

      /*
       * With no currently perceived food,
       * SEEK must lose the competition.
       */

      expect(
        tick2Decision
          .seekActivation,
      ).toBeLessThan(
        tick2Decision
          .idleActivation,
      );

      expect(
        tick2Decision
          .selectedActionId,
      ).toBe("idle");

      /*
       * The creature must also be unable to
       * eat an object that disappeared.
       */

      const eatingResult =
        eatFood(
          position,
          hunger,
          food,
          0.25,
        );

      expect(
        eatingResult.ate,
      ).toBe(false);

      expect(
        eatingResult
          .hunger.energy,
      ).toBeCloseTo(
        hunger.energy,
      );

      /*
       * There is no second movement toward
       * the stale food location.
       */

      expect(
        position,
      ).toEqual({
        x: 1,
        y: 0,
      });
    });
  },
);