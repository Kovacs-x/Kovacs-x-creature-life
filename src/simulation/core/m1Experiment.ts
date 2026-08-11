import type { BrainState } from "./contracts.js";

import {
  createM1Brain,
  evaluateM1Brain,
} from "../brain/m1Brain.js";

import { createHungerState } from "../biology/hunger.js";
import { senseHunger } from "../senses/hungerSense.js";
import { perceiveFood } from "../senses/foodPerception.js";
import { senseFoodContact } from "../senses/foodContact.js";
import { createFoodObject } from "../../world/food.js";

import { runM1Trial } from "./m1Trial.js";

export const M1_EXPERIMENT_TRAINING_TRIALS = 3;

export interface M1ProbeResult {
  readonly seekActivation: number;
  readonly idleActivation: number;
  readonly eatActivation: number;
  readonly selectedActionId: string;
}

export interface M1ExperimentResult {
  readonly naiveProbe: M1ProbeResult;
  readonly trainedProbe: M1ProbeResult;
  readonly controlProbe: M1ProbeResult;

  readonly trainedBrain: BrainState;
  readonly controlBrain: BrainState;
}

export function runM1Experiment(): M1ExperimentResult {
  const initialBrain = createM1Brain();

  const naiveProbe =
    runHarderFoodSeekingProbe(
      initialBrain,
    );

  let trainedBrain = initialBrain;

  for (
    let trial = 0;
    trial < M1_EXPERIMENT_TRAINING_TRIALS;
    trial += 1
  ) {
    const result = runM1Trial({
      learningEnabled: true,
      brain: trainedBrain,
    });

    trainedBrain =
      result.brainAfter;
  }

  let controlBrain =
    createM1Brain();

  for (
    let trial = 0;
    trial < M1_EXPERIMENT_TRAINING_TRIALS;
    trial += 1
  ) {
    const result = runM1Trial({
      learningEnabled: false,
      brain: controlBrain,
    });

    controlBrain =
      result.brainAfter;
  }

  const trainedProbe =
    runHarderFoodSeekingProbe(
      trainedBrain,
    );

  const controlProbe =
    runHarderFoodSeekingProbe(
      controlBrain,
    );

  return {
    naiveProbe,
    trainedProbe,
    controlProbe,
    trainedBrain,
    controlBrain,
  };
}

export function runHarderFoodSeekingProbe(
  brain: BrainState,
): M1ProbeResult {
  const creaturePosition = {
    x: 0,
    y: 0,
  };

  /*
   * This probe is intentionally harder
   * than the training condition.
   *
   * The creature is only moderately hungry
   * and the food is farther away.
   */

  const hunger =
    createHungerState(
      0.5,
      1,
    );

  const food =
    createFoodObject(
      "probe-food",
      6,
      0,
      0.5,
    );

  const foodSignal =
    perceiveFood(
      creaturePosition,
      food,
      {
        maxRange: 10,
      },
    );

  const hungerSignal =
    senseHunger(
      hunger,
    );

  const contactSignal =
    senseFoodContact(
      creaturePosition,
      food,
      0.25,
    );

  const result =
    evaluateM1Brain(
      brain,
      hungerSignal,
      foodSignal,
      contactSignal,
    );

  return {
    seekActivation:
      result.seekActivation,

    idleActivation:
      result.idleActivation,

    eatActivation:
      result.eatActivation,

    selectedActionId:
      result.selectedActionId,
  };
}