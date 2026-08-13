import type { BrainState } from "./contracts.js";

import type {
  M1TelemetryEntry,
} from "./m1Telemetry.js";

import {
  advanceHungerOverTime,
  createHungerState,
  type HungerState,
} from "../biology/hunger.js";

import {
  createM1Brain,
  evaluateM1Brain,
  M1_NODE_IDS,
} from "../brain/m1Brain.js";

import {
  deriveConnectionEligibilities,
} from "../brain/eligibility.js";

import {
  keepEligibilitiesForTarget,
} from "../brain/actionEligibility.js";

import {
  mergeEligibilityTrace,
} from "../brain/eligibilityTrace.js";

import {
  applyRewardPlasticity,
} from "../brain/plasticity.js";

import {
  deriveEnergyReward,
} from "../brain/reward.js";

import {
  moveAlongDirection,
} from "../actions/movement.js";

import {
  eatFood,
} from "../actions/eating.js";

import {
  perceiveFood,
} from "../senses/foodPerception.js";

import {
  senseHunger,
} from "../senses/hungerSense.js";

import {
  senseFoodContact,
} from "../senses/foodContact.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

export const M1_TRIAL_TICK_SECONDS = 1;

export const M1_TRIAL_ENERGY_LOSS_PER_SECOND =
  0.02;

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

  readonly energy: number;
}

export interface M1TrialResult {
  readonly ticks:
    readonly M1TrialTick[];

  readonly telemetry:
    readonly M1TelemetryEntry[];

  readonly positionBefore: {
    readonly x: number;
    readonly y: number;
  };

  readonly positionAfter: {
    readonly x: number;
    readonly y: number;
  };

  readonly hungerBefore:
    HungerState;

  readonly hungerAfter:
    HungerState;

  readonly foodBefore:
    FoodObjectState;

  readonly foodAfter:
    FoodObjectState;

  readonly ate: boolean;
  readonly reward: number;

  readonly brainBefore:
    BrainState;

  readonly brainAfter:
    BrainState;

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

  let position =
    positionBefore;

  const hungerBefore =
    createHungerState(
      0.1,
      1,
    );

  let hunger =
    hungerBefore;

  const foodBefore =
    createFoodObject(
      "food-1",
      1,
      0,
      0.5,
    );

  let food =
    foodBefore;

  const brainBefore =
    config.brain ??
    createM1Brain();

  let brain =
    brainBefore;

  const ticks:
    M1TrialTick[] = [];

  const telemetry:
    M1TelemetryEntry[] = [];

  /*
   * TICK 1
   *
   * The creature begins hungry.
   *
   * Food is visible but not yet within
   * eating range.
   */

  const tick1FoodSignal =
    perceiveFood(
      position,
      food,
      {
        maxRange: 10,
      },
    );

  const tick1HungerSignal =
    senseHunger(
      hunger,
    );

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

  brain =
    tick1Brain.brain;

  ticks.push({
    tick: 1,

    selectedActionId:
      tick1Brain
        .selectedActionId,

    position,

    energy:
      hunger.energy,
  });

  const tick1Activations:
    Record<string, number> =
      Object.fromEntries(
        tick1Brain.brain.nodes.map(
          (node) => [
            node.id,
            node.activation,
          ],
        ),
      );

  /*
   * Diagnostic snapshot of the complete
   * decision process.
   *
   * Telemetry observes the simulation.
   * It does not influence behaviour.
   */

  telemetry.push({
    type: "m1-decision",

    tick: 1,

    position: {
      ...position,
    },

    energy:
      hunger.energy,

    hungerLevel:
      tick1HungerSignal
        .hungerLevel,

    foodSignal:
      tick1FoodSignal === null
        ? null
        : {
            ...tick1FoodSignal,
          },

    contactInRange:
      tick1ContactSignal
        .inRange,

    brainActivations: {
      ...tick1Activations,
    },

    actionCandidates: [
      {
        actionId: "idle",
        activation:
          tick1Brain
            .idleActivation,
      },
      {
        actionId: "seek",
        activation:
          tick1Brain
            .seekActivation,
      },
      {
        actionId: "eat",
        activation:
          tick1Brain
            .eatActivation,
      },
    ],

    selectedActionId:
      tick1Brain
        .selectedActionId,
  });

  const tick1RawEligibilities =
    deriveConnectionEligibilities(
      tick1Brain.brain,
      tick1Activations,
    );

  let eligibilityTrace =
    keepEligibilitiesForTarget(
      tick1Brain.brain,
      tick1RawEligibilities,
      actionIdToNodeId(
        tick1Brain
          .selectedActionId,
      ),
    );

  if (
    tick1Brain
      .selectedActionId ===
      "seek" &&
    tick1FoodSignal !== null
  ) {
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
  }

  /*
   * SIMULATION TIME ADVANCES
   */

  hunger =
    advanceHungerOverTime(
      hunger,

      M1_TRIAL_TICK_SECONDS,

      {
        energyLossPerSecond:
          M1_TRIAL_ENERGY_LOSS_PER_SECOND,
      },
    );

  /*
   * TICK 2
   *
   * Perception and internal biology are
   * sampled again after movement and
   * metabolic time advancement.
   */

  const tick2FoodSignal =
    perceiveFood(
      position,
      food,
      {
        maxRange: 10,
      },
    );

  const tick2HungerSignal =
    senseHunger(
      hunger,
    );

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

  brain =
    tick2Brain.brain;

  ticks.push({
    tick: 2,

    selectedActionId:
      tick2Brain
        .selectedActionId,

    position,

    energy:
      hunger.energy,
  });

  const tick2Activations:
    Record<string, number> =
      Object.fromEntries(
        tick2Brain.brain.nodes.map(
          (node) => [
            node.id,
            node.activation,
          ],
        ),
      );

  telemetry.push({
    type: "m1-decision",

    tick: 2,

    position: {
      ...position,
    },

    energy:
      hunger.energy,

    hungerLevel:
      tick2HungerSignal
        .hungerLevel,

    foodSignal:
      tick2FoodSignal === null
        ? null
        : {
            ...tick2FoodSignal,
          },

    contactInRange:
      tick2ContactSignal
        .inRange,

    brainActivations: {
      ...tick2Activations,
    },

    actionCandidates: [
      {
        actionId: "idle",
        activation:
          tick2Brain
            .idleActivation,
      },
      {
        actionId: "seek",
        activation:
          tick2Brain
            .seekActivation,
      },
      {
        actionId: "eat",
        activation:
          tick2Brain
            .eatActivation,
      },
    ],

    selectedActionId:
      tick2Brain
        .selectedActionId,
  });

  const tick2RawEligibilities =
    deriveConnectionEligibilities(
      tick2Brain.brain,
      tick2Activations,
    );

  const tick2Eligibilities =
    keepEligibilitiesForTarget(
      tick2Brain.brain,
      tick2RawEligibilities,
      actionIdToNodeId(
        tick2Brain
          .selectedActionId,
      ),
    );

  eligibilityTrace =
    mergeEligibilityTrace(
      eligibilityTrace,
      tick2Eligibilities,
      {
        decay: 0.5,
      },
    );

  /*
   * Biological state immediately before
   * the possible eating consequence.
   */

  const hungerBeforeEating =
    hunger;

  let ate = false;

  if (
    tick2Brain
      .selectedActionId ===
    "eat"
  ) {
    const eatingResult =
      eatFood(
        position,
        hunger,
        food,
        0.25,
      );

    hunger =
      eatingResult.hunger;

    food =
      eatingResult.food;

    ate =
      eatingResult.ate;
  }

  /*
   * Reward derives from actual biological
   * change caused by the consequence.
   */

  const rewardSignal =
    deriveEnergyReward(
      hungerBeforeEating,
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

  /*
   * Final learning/consequence telemetry.
   *
   * This exposes exactly what happened
   * after the selected behaviour without
   * allowing telemetry to alter it.
   */

  telemetry.push({
    type: "m1-learning",

    tick: 2,

    learningEnabled:
      config.learningEnabled,

    ate,

    foodConsumed:
      food.consumed,

    energyBeforeConsequence:
      hungerBeforeEating.energy,

    energyAfterConsequence:
      hunger.energy,

    reward:
      rewardSignal.value,

    weightChanges:
      plasticity.changes.map(
        (change) => ({
          ...change,
        }),
      ),
  });

  return {
    ticks,

    telemetry,

    positionBefore,

    positionAfter:
      position,

    hungerBefore,

    hungerAfter:
      hunger,

    foodBefore,

    foodAfter:
      food,

    ate,

    reward:
      rewardSignal.value,

    brainBefore,

    brainAfter:
      plasticity.brain,

    weightChanges:
      plasticity.changes,
  };
}

function actionIdToNodeId(
  actionId: string,
): string {
  switch (actionId) {
    case "idle":
      return M1_NODE_IDS
        .idleOutput;

    case "seek":
      return M1_NODE_IDS
        .seekOutput;

    case "eat":
      return M1_NODE_IDS
        .eatOutput;

    default:
      throw new Error(
        `Unknown M1 action: ${actionId}`,
      );
  }
}