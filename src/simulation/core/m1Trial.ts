import type { BrainState } from "./contracts.js";

import {
  createHungerState,
  type HungerState,
} from "../biology/hunger.js";

import {
  createM1Brain,
  evaluateM1Brain,
} from "../brain/m1Brain.js";

import { deriveConnectionEligibilities } from "../brain/eligibility.js";
import { mergeEligibilityTrace } from "../brain/eligibilityTrace.js";
import { applyRewardPlasticity } from "../brain/plasticity.js";
import { deriveEnergyReward } from "../brain/reward.js";

import { moveAlongDirection } from "../actions/movement.js";
import { eatFood } from "../actions/eating.js";

import { perceiveFood } from "../senses/foodPerception.js";
import { senseHunger } from "../senses/hungerSense.js";
import { senseFoodContact } from "../senses/foodContact.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

export interface M1TrialConfig {
  readonly learningEnabled: boolean;
  readonly brain?: BrainState;
}

export interface M1TrialTick {
  readonly tick: number;
  readonly selectedActionId: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
}

export interface M1TrialResult {
  readonly ticks: readonly M1TrialTick[];

  readonly positionBefore: {
    readonly x: number;
    readonly y: number;
  };

  readonly positionAfter: {
    readonly x: number;
    readonly y: number;
  };

  readonly hungerBefore: HungerState;
  readonly hungerAfter: HungerState;

  readonly foodBefore: FoodObjectState;
  readonly foodAfter: FoodObjectState;

  readonly ate: boolean;
  readonly reward: number;

  readonly brainBefore: BrainState;
  readonly brainAfter: BrainState;

  readonly weightChanges: readonly {
    readonly connectionId: string;
    readonly before: number;
    readonly after: number;
    readonly delta: number;
  }[];
}

export function runM1Trial(
  config: M1TrialConfig,
): M1TrialResult {
  const positionBefore = {
    x: 0,
    y: 0,
  };

  let position = positionBefore;

  const hungerBefore = createHungerState(
    0.1,
    1,
  );

  let hunger = hungerBefore;

  const foodBefore = createFoodObject(
    "food-1",
    1,
    0,
    0.5,
  );

  let food = foodBefore;

  const brainBefore =
    config.brain ?? createM1Brain();

  let brain = brainBefore;

  const ticks: M1TrialTick[] = [];

  /*
   * TICK 1
   */

  const tick1FoodSignal = perceiveFood(
    position,
    food,
    {
      maxRange: 10,
    },
  );

  const tick1HungerSignal =
    senseHunger(hunger);

  const tick1ContactSignal =
    senseFoodContact(
      position,
      food,
      0.25,
    );

  const tick1Brain =
    evaluateM1Brain(
      brain,
      tick1HungerSignal,
      tick1FoodSignal,
      tick1ContactSignal,
    );

  brain = tick1Brain.brain;

  ticks.push({
    tick: 1,
    selectedActionId:
      tick1Brain.selectedActionId,
    position,
  });

  const tick1Activations =
    Object.fromEntries(
      tick1Brain.brain.nodes.map(
        (node) => [
          node.id,
          node.activation,
        ],
      ),
    );

  let eligibilityTrace =
    deriveConnectionEligibilities(
      tick1Brain.brain,
      tick1Activations,
    );

  if (
    tick1Brain.selectedActionId ===
      "seek" &&
    tick1FoodSignal !== null
  ) {
    const movement =
      moveAlongDirection(
        position,
        tick1FoodSignal.directionX,
        tick1FoodSignal.directionY,
        1,
        {
          minX: 0,
          minY: 0,
          maxX: 10,
          maxY: 10,
        },
      );

    position = movement.position;
  }

  /*
   * TICK 2
   */

  const tick2FoodSignal = perceiveFood(
    position,
    food,
    {
      maxRange: 10,
    },
  );

  const tick2HungerSignal =
    senseHunger(hunger);

  const tick2ContactSignal =
    senseFoodContact(
      position,
      food,
      0.25,
    );

  const tick2Brain =
    evaluateM1Brain(
      brain,
      tick2HungerSignal,
      tick2FoodSignal,
      tick2ContactSignal,
    );

  brain = tick2Brain.brain;

  ticks.push({
    tick: 2,
    selectedActionId:
      tick2Brain.selectedActionId,
    position,
  });

  const tick2Activations =
    Object.fromEntries(
      tick2Brain.brain.nodes.map(
        (node) => [
          node.id,
          node.activation,
        ],
      ),
    );

  const tick2Eligibilities =
    deriveConnectionEligibilities(
      tick2Brain.brain,
      tick2Activations,
    );

  eligibilityTrace =
    mergeEligibilityTrace(
      eligibilityTrace,
      tick2Eligibilities,
      {
        decay: 0.5,
      },
    );

  let ate = false;

  if (
    tick2Brain.selectedActionId ===
    "eat"
  ) {
    const eatingResult = eatFood(
      position,
      hunger,
      food,
      0.25,
    );

    hunger = eatingResult.hunger;
    food = eatingResult.food;
    ate = eatingResult.ate;
  }

  const rewardSignal =
    deriveEnergyReward(
      hungerBefore,
      hunger,
    );

  const plasticity =
    applyRewardPlasticity(
      brain,
      eligibilityTrace,
      rewardSignal.value,
      {
        learningRate: 0.25,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled:
          config.learningEnabled,
      },
    );

  return {
    ticks,

    positionBefore,
    positionAfter: position,

    hungerBefore,
    hungerAfter: hunger,

    foodBefore,
    foodAfter: food,

    ate,
    reward: rewardSignal.value,

    brainBefore,
    brainAfter:
      plasticity.brain,

    weightChanges:
      plasticity.changes,
  };
}