import type {
  FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import type {
  WeightChange,
} from "../brain/plasticity.js";

export interface M1ActionCandidateTelemetry {
  readonly actionId:
    | "idle"
    | "seek"
    | "eat";

  readonly activation: number;
}

export interface M1DecisionTelemetryEntry {
  readonly type: "m1-decision";

  readonly tick: number;

  readonly position: {
    readonly x: number;
    readonly y: number;
  };

  readonly energy: number;
  readonly hungerLevel: number;

  readonly foodSignal:
    | FoodPerceptionSignal
    | null;

  readonly contactInRange: boolean;

  readonly brainActivations:
    Readonly<
      Record<string, number>
    >;

  readonly actionCandidates:
    readonly M1ActionCandidateTelemetry[];

  readonly selectedActionId: string;
}

export interface M1LearningTelemetryEntry {
  readonly type: "m1-learning";

  readonly tick: number;

  readonly learningEnabled: boolean;

  readonly ate: boolean;
  readonly foodConsumed: boolean;

  readonly energyBeforeConsequence:
    number;

  readonly energyAfterConsequence:
    number;

  readonly reward: number;

  readonly weightChanges:
    readonly WeightChange[];
}

export type M1TelemetryEntry =
  | M1DecisionTelemetryEntry
  | M1LearningTelemetryEntry;