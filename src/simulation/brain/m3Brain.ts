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

import {
  createM1Brain,
  M1_NODE_IDS,
} from "./m1Brain.js";

import {
  M3_EXPLORATION_TO_EXPLORE_WEIGHT,
} from "../core/m3Contract.js";

export const M3_NODE_IDS = {
  explorationInput:
    "input:exploration",

  exploreOutput:
    "action:explore",
} as const;

export const M3_CONNECTION_IDS = {
  explorationToExplore:
    "exploration-to-explore",
} as const;

export interface M3BrainEvaluation {
  readonly brain:
    BrainState;

  readonly idleActivation:
    number;

  readonly seekActivation:
    number;

  readonly eatActivation:
    number;

  readonly exploreActivation:
    number;

  /*
   * M3.11R explicit action-feasibility evidence.
   *
   * Derived only from legitimate current sensor
   * evidence already supplied to this function
   * (direct perception, M2 recall, food contact),
   * never from hidden food coordinates, object
   * IDs or renderer state.
   *
   * IDLE and EXPLORE are always feasible and are
   * not represented here: IDLE requires no
   * evidence, and EXPLORE retains its existing
   * normal M3 competition semantics unforced.
   */
  readonly seekActionFeasible:
    boolean;

  readonly eatActionFeasible:
    boolean;

  readonly selectedActionId:
    string;
}

/*
 * Create the M3 brain as a narrow extension
 * of the accepted M1/M2 brain.
 *
 * The supplied base brain may contain learned
 * M1/M2 connection weights.
 *
 * Those nodes and connections are preserved
 * exactly.
 *
 * M3 adds only:
 *
 * - one exploration-pressure input node;
 * - one EXPLORE action-output node;
 * - one prospectively locked weighted
 *   connection between them.
 *
 * The accepted createM1Brain() function and
 * its returned state remain unchanged.
 */
export function createM3Brain(
  baseBrain:
    BrainState =
      createM1Brain(),
): BrainState {
  assertM1CompatibleBrain(
    baseBrain,
  );

  assertM3NodesAbsent(
    baseBrain,
  );

  return createBrainState(
    [
      ...baseBrain.nodes,

      {
        id:
          M3_NODE_IDS
            .explorationInput,

        module:
          "input",

        activation:
          0,
      },

      {
        id:
          M3_NODE_IDS
            .exploreOutput,

        module:
          "action",

        activation:
          0,
      },
    ],

    [
      ...baseBrain.connections,

      {
        id:
          M3_CONNECTION_IDS
            .explorationToExplore,

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
      },
    ],
  );
}

/*
 * M3 neural evaluation.
 *
 * Exploration pressure enters cognition as an
 * ordinary bounded neural input.
 *
 * It does not:
 *
 * - force EXPLORE;
 * - select a heading;
 * - consume RNG;
 * - inspect food/world coordinates;
 * - command movement.
 *
 * IDLE, SEEK, EAT and EXPLORE all enter the
 * existing generic deterministic action
 * competition.
 */
export function evaluateM3Brain(
  brain:
    BrainState,

  hunger:
    HungerSenseSignal,

  food:
    FoodPerceptionSignal | null,

  explorationPressure:
    number,

  contact:
    FoodContactSignal = {
      inRange: false,
    },

  rememberedFood:
    FoodMemoryRecallSignal | null =
      null,
): M3BrainEvaluation {
  assertM3Brain(
    brain,
  );

  validateExplorationPressure(
    explorationPressure,
  );

  /*
   * Preserve the accepted M2 distinction:
   *
   * remembered perceptual strength
   * ×
   * memory confidence
   *
   * remains separate from current direct
   * perception.
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

        [M1_NODE_IDS.foodInput]:
          food?.strength ??
          0,

        [M1_NODE_IDS.rememberedFoodInput]:
          rememberedFoodActivation,

        [M1_NODE_IDS.contactInput]:
          contact.inRange
            ? 1
            : 0,

        /*
         * Primitive M3 exploration pressure
         * enters only through its dedicated
         * neural channel.
         */
        [M3_NODE_IDS.explorationInput]:
          explorationPressure,
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

  const exploreActivation =
    evaluation.activations[
      M3_NODE_IDS.exploreOutput
    ] ?? 0;

  /*
   * M3.11R EXPLICIT ACTION FEASIBILITY
   *
   * A genuine persistent-play liveness defect was
   * found in continuous repeated-feeding play:
   * reward-modulated plasticity can legitimately
   * strengthen a contact-independent connection
   * (e.g. hunger-to-eat) until an action wins
   * competition even though no physically
   * supported opportunity exists for it. Because
   * an unsuccessful action produces no reward and
   * no biological change, the state becomes a
   * permanent fixed point: the same physically
   * unsupported action wins forever.
   *
   * Feasibility does not choose a fallback action
   * and does not zero or hide the raw learned
   * activation. It only restricts which candidates
   * may *win* the same generic deterministic
   * competition, using exclusively evidence already
   * legitimately available to cognition this tick:
   *
   * - SEEK is feasible only when a legitimate
   *   movement-direction source exists: current
   *   direct perception, or a currently usable M2
   *   recall signal.
   * - EAT is feasible only when the legitimate
   *   food-contact sense reports inRange.
   *
   * IDLE is always feasible. EXPLORE keeps its
   * existing normal M3 competition semantics
   * unforced (always feasible; still must win on
   * activation like any other candidate).
   */
  const seekActionFeasible =
    food !==
      null ||
    rememberedFood !==
      null;

  const eatActionFeasible =
    contact.inRange;

  /*
   * EXPLORE receives no selection privilege.
   *
   * It is deliberately placed after the
   * accepted actions.
   *
   * Because selectHighestActivation() replaces
   * the winner only on strictly greater
   * activation, an exact tie cannot make the
   * newly introduced EXPLORE action displace
   * an accepted existing action.
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

          available:
            seekActionFeasible,
        },

        {
          actionId:
            "eat",

          activation:
            eatActivation,

          available:
            eatActionFeasible,
        },

        {
          actionId:
            "explore",

          activation:
            exploreActivation,
        },
      ],
    );

  return {
    brain:
      evaluation.brain,

    idleActivation,

    seekActivation,

    eatActivation,

    exploreActivation,

    seekActionFeasible,

    eatActionFeasible,

    selectedActionId:
      selection.selectedActionId,
  };
}

function assertM1CompatibleBrain(
  brain:
    BrainState,
): void {
  const requiredNodeIds = [
    M1_NODE_IDS.biasInput,
    M1_NODE_IDS.hungerInput,
    M1_NODE_IDS.foodInput,
    M1_NODE_IDS.rememberedFoodInput,
    M1_NODE_IDS.contactInput,
    M1_NODE_IDS.idleOutput,
    M1_NODE_IDS.seekOutput,
    M1_NODE_IDS.eatOutput,
  ];

  const nodeIds =
    new Set(
      brain.nodes.map(
        (node) =>
          node.id,
      ),
    );

  for (
    const nodeId of
    requiredNodeIds
  ) {
    if (
      !nodeIds.has(
        nodeId,
      )
    ) {
      throw new Error(
        `M3 brain requires M1-compatible node: ${nodeId}`,
      );
    }
  }
}

function assertM3NodesAbsent(
  brain:
    BrainState,
): void {
  const nodeIds =
    new Set(
      brain.nodes.map(
        (node) =>
          node.id,
      ),
    );

  if (
    nodeIds.has(
      M3_NODE_IDS
        .explorationInput,
    ) ||
    nodeIds.has(
      M3_NODE_IDS
        .exploreOutput,
    )
  ) {
    throw new Error(
      "Cannot add M3 exploration nodes to a brain that already contains them.",
    );
  }

  if (
    brain.connections.some(
      (connection) =>
        connection.id ===
        M3_CONNECTION_IDS
          .explorationToExplore,
    )
  ) {
    throw new Error(
      "Cannot add the M3 exploration connection twice.",
    );
  }
}

function assertM3Brain(
  brain:
    BrainState,
): void {
  assertM1CompatibleBrain(
    brain,
  );

  const explorationInput =
    brain.nodes.find(
      (node) =>
        node.id ===
        M3_NODE_IDS
          .explorationInput,
    );

  if (
    explorationInput ===
    undefined
  ) {
    throw new Error(
      "M3 brain is missing the exploration input node.",
    );
  }

  const exploreOutput =
    brain.nodes.find(
      (node) =>
        node.id ===
        M3_NODE_IDS
          .exploreOutput,
    );

  if (
    exploreOutput ===
    undefined
  ) {
    throw new Error(
      "M3 brain is missing the EXPLORE output node.",
    );
  }

  const connection =
    brain.connections.find(
      (candidate) =>
        candidate.id ===
        M3_CONNECTION_IDS
          .explorationToExplore,
    );

  if (
    connection ===
    undefined
  ) {
    throw new Error(
      "M3 brain is missing the exploration-to-EXPLORE connection.",
    );
  }

  if (
    connection.sourceNodeId !==
      M3_NODE_IDS
        .explorationInput ||
    connection.targetNodeId !==
      M3_NODE_IDS
        .exploreOutput
  ) {
    throw new Error(
      "M3 exploration connection has invalid endpoints.",
    );
  }
}

function validateExplorationPressure(
  explorationPressure:
    number,
): void {
  if (
    !Number.isFinite(
      explorationPressure,
    ) ||
    explorationPressure < 0 ||
    explorationPressure > 1
  ) {
    throw new RangeError(
      "Exploration pressure must be finite and between 0 and 1.",
    );
  }
}