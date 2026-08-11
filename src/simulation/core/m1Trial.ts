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
import { applyRewardPlasticity } from "../brain/plasticity.js";
import { deriveEnergyReward } from "../brain/reward.js";

import { moveAlongDirection } from "../actions/movement.js";
import { eatFood } from "../actions/eating.js";

import { perceiveFood } from "../senses/foodPerception.js";
import { senseHunger } from "../senses/hungerSense.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

export interface M1TrialConfig {
  readonly learningEnabled: boolean;
}

export interface M1TrialResult {
  readonly selectedActionId: string;
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

  const hungerBefore = createHungerState(0.1, 1);

  const foodBefore = createFoodObject(
    "food-1",
    1,
    0,
    0.5,
  );

  const brainBefore = createM1Brain();

  const foodSignal = perceiveFood(
    positionBefore,
    foodBefore,
    {
      maxRange: 10,
    },
  );

  const hungerSignal = senseHunger(hungerBefore);

  const brainEvaluation = evaluateM1Brain(
    brainBefore,
    hungerSignal,
    foodSignal,
  );

  const activations = Object.fromEntries(
    brainEvaluation.brain.nodes.map((node) => [
      node.id,
      node.activation,
    ]),
  );

  const eligibilities =
    deriveConnectionEligibilities(
      brainEvaluation.brain,
      activations,
    );

  let positionAfter = positionBefore;

  if (
    brainEvaluation.selectedActionId === "seek" &&
    foodSignal !== null
  ) {
    const movement = moveAlongDirection(
      positionBefore,
      foodSignal.directionX,
      foodSignal.directionY,
      1,
      {
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 10,
      },
    );

    positionAfter = movement.position;
  }

  const eatingResult = eatFood(
    positionAfter,
    hungerBefore,
    foodBefore,
    0.25,
  );

  const rewardSignal = deriveEnergyReward(
    hungerBefore,
    eatingResult.hunger,
  );

  const plasticity = applyRewardPlasticity(
    brainEvaluation.brain,
    eligibilities,
    rewardSignal.value,
    {
      learningRate: 0.25,
      minWeight: -1,
      maxWeight: 1,
      learningEnabled: config.learningEnabled,
    },
  );

  return {
    selectedActionId:
      brainEvaluation.selectedActionId,
    positionBefore,
    positionAfter,
    hungerBefore,
    hungerAfter: eatingResult.hunger,
    foodBefore,
    foodAfter: eatingResult.food,
    ate: eatingResult.ate,
    reward: rewardSignal.value,
    brainBefore,
    brainAfter: plasticity.brain,
    weightChanges: plasticity.changes,
  };
}