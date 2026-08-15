import type {
  BrainState,
} from "../core/contracts.js";

import type {
  FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import type {
  HungerSenseSignal,
} from "../senses/hungerSense.js";

import type {
  FoodContactSignal,
} from "../senses/foodContact.js";

import type {
  FoodMemoryRecallSignal,
} from "../memory/foodMemory.js";

import {
  selectHighestActivation,
} from "../actions/competition.js";

import {
  createBrainState,
  evaluateBrain,
} from "./network.js";

export const M1_NODE_IDS = {
  biasInput:
    "input:bias",

  hungerInput:
    "input:hunger",

  foodInput:
    "input:food",

  rememberedFoodInput:
    "input:remembered-food",

  contactInput:
    "input:food-contact",

  idleOutput:
    "action:idle",

  seekOutput:
    "action:seek",

  eatOutput:
    "action:eat",
} as const;

export interface M1BrainEvaluation {
  readonly brain:
    BrainState;

  readonly idleActivation:
    number;

  readonly seekActivation:
    number;

  readonly eatActivation:
    number;

  readonly selectedActionId:
    string;
}

export function createM1Brain():
  BrainState {
  return createBrainState(
    [
      {
        id:
          M1_NODE_IDS.biasInput,

        module:
          "input",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.hungerInput,

        module:
          "input",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.foodInput,

        module:
          "input",

        activation: 0,
      },

      /*
       * M2 remembered-food evidence is a
       * distinct neural input.
       *
       * It must never masquerade as current
       * direct food perception.
       */
      {
        id:
          M1_NODE_IDS
            .rememberedFoodInput,

        module:
          "input",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.contactInput,

        module:
          "input",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.idleOutput,

        module:
          "action",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.seekOutput,

        module:
          "action",

        activation: 0,
      },

      {
        id:
          M1_NODE_IDS.eatOutput,

        module:
          "action",

        activation: 0,
      },
    ],

    [
      {
        id:
          "bias-to-idle",

        sourceNodeId:
          M1_NODE_IDS.biasInput,

        targetNodeId:
          M1_NODE_IDS.idleOutput,

        weight: 0.35,

        enabled: true,
      },

      {
        id:
          "hunger-to-seek",

        sourceNodeId:
          M1_NODE_IDS.hungerInput,

        targetNodeId:
          M1_NODE_IDS.seekOutput,

        weight: 0.3,

        enabled: true,
      },

      {
        id:
          "food-to-seek",

        sourceNodeId:
          M1_NODE_IDS.foodInput,

        targetNodeId:
          M1_NODE_IDS.seekOutput,

        weight: 0.3,

        enabled: true,
      },

      /*
       * Initial remembered-food evidence has
       * the same synaptic weight as current
       * direct-food evidence.
       *
       * This avoids introducing a specially
       * tuned M2 weight merely to force the
       * behavioural probe.
       *
       * Memory is already imperfect because
       * its input activation is reduced by
       * stored perceptual strength and
       * deterministic confidence decay.
       */
      {
        id:
          "remembered-food-to-seek",

        sourceNodeId:
          M1_NODE_IDS
            .rememberedFoodInput,

        targetNodeId:
          M1_NODE_IDS.seekOutput,

        weight: 0.3,

        enabled: true,
      },

      {
        id:
          "contact-to-eat",

        sourceNodeId:
          M1_NODE_IDS.contactInput,

        targetNodeId:
          M1_NODE_IDS.eatOutput,

        weight: 0.7,

        enabled: true,
      },

      {
        id:
          "hunger-to-eat",

        sourceNodeId:
          M1_NODE_IDS.hungerInput,

        targetNodeId:
          M1_NODE_IDS.eatOutput,

        weight: 0.2,

        enabled: true,
      },
    ],
  );
}

export function evaluateM1Brain(
  brain: BrainState,

  hunger:
    HungerSenseSignal,

  food:
    FoodPerceptionSignal | null,

  contact:
    FoodContactSignal = {
      inRange: false,
    },

  rememberedFood:
    FoodMemoryRecallSignal | null =
      null,
): M1BrainEvaluation {
  /*
   * Memory confidence does not command an
   * action directly.
   *
   * Instead, remembered sensory evidence is
   * converted into an ordinary bounded neural
   * input:
   *
   * remembered perceptual evidence
   * ×
   * current memory confidence
   *
   * Both terms originated from the memory
   * mechanism rather than current world truth.
   */
  const rememberedFoodActivation =
    rememberedFood === null
      ? 0
      : rememberedFood.strength *
        rememberedFood.confidence;

  const evaluation =
    evaluateBrain(
      brain,
      {
        [M1_NODE_IDS.biasInput]:
          1,

        [M1_NODE_IDS.hungerInput]:
          hunger.hungerLevel,

        /*
         * Current direct perception remains
         * its own independent neural channel.
         */
        [M1_NODE_IDS.foodInput]:
          food?.strength ?? 0,

        /*
         * Recalled evidence remains a
         * separate channel.
         */
        [M1_NODE_IDS.rememberedFoodInput]:
          rememberedFoodActivation,

        [M1_NODE_IDS.contactInput]:
          contact.inRange
            ? 1
            : 0,
      },
    );

  const idleActivation =
    evaluation.activations[
      M1_NODE_IDS.idleOutput
    ] ?? 0;

  const seekActivation =
    evaluation.activations[
      M1_NODE_IDS.seekOutput
    ] ?? 0;

  const eatActivation =
    evaluation.activations[
      M1_NODE_IDS.eatOutput
    ] ?? 0;

  /*
   * Memory receives no special selection
   * privilege.
   *
   * IDLE, SEEK and EAT continue through the
   * same generic action competition.
   */
  const selection =
    selectHighestActivation(
      [
        {
          actionId:
            "idle",

          activation:
            idleActivation,
        },

        {
          actionId:
            "seek",

          activation:
            seekActivation,
        },

        {
          actionId:
            "eat",

          activation:
            eatActivation,
        },
      ],
    );

  return {
    brain:
      evaluation.brain,

    idleActivation,

    seekActivation,

    eatActivation,

    selectedActionId:
      selection.selectedActionId,
  };
}