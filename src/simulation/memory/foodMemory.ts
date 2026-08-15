import type {
  FoodPerceptionSignal,
} from "../senses/foodPerception.js";

export const FOOD_MEMORY_TRACE_SCHEMA_VERSION =
  1 as const;

export const FOOD_MEMORY_INITIAL_CONFIDENCE =
  1.0;

export const FOOD_MEMORY_DECAY_PER_SECOND =
  0.125;

export const FOOD_MEMORY_MIN_RECALL_CONFIDENCE =
  0.25;

export const FOOD_MEMORY_KIND =
  "food-memory" as const;

export const FOOD_MEMORY_SOURCE =
  "food-perception" as const;

export const FOOD_MEMORY_RECALL_KIND =
  "food-memory-recall" as const;

export interface FoodMemoryTrace {
  readonly schemaVersion:
    typeof FOOD_MEMORY_TRACE_SCHEMA_VERSION;

  readonly kind:
    typeof FOOD_MEMORY_KIND;

  readonly source:
    typeof FOOD_MEMORY_SOURCE;

  /*
   * Diagnostic provenance only.
   *
   * This identifier must never be used
   * during recall to query the current
   * world position or state of the food.
   */
  readonly sourceFoodId: string;

  /*
   * Simulation time at which the direct
   * perception was encoded.
   *
   * Memory ageing is derived exclusively
   * from explicit simulation time.
   */
  readonly encodedAtSimulationTimeSeconds:
    number;

  readonly ageSeconds:
    number;

  readonly confidence:
    number;

  /*
   * These values come directly from the
   * sensory representation.
   *
   * The memory deliberately does not store
   * an exact world-space food position.
   */
  readonly rememberedDirectionX:
    number;

  readonly rememberedDirectionY:
    number;

  readonly rememberedPerceptualStrength:
    number;
}

export interface FoodMemoryRecallSignal {
  readonly kind:
    typeof FOOD_MEMORY_RECALL_KIND;

  readonly ageSeconds:
    number;

  readonly confidence:
    number;

  readonly directionX:
    number;

  readonly directionY:
    number;

  readonly strength:
    number;
}

/*
 * Encode a new food memory exclusively from
 * a legitimate FoodPerceptionSignal.
 *
 * This function has no access to:
 *
 * - FoodObjectState
 * - world coordinates
 * - the world object collection
 * - the current hidden position of food
 *
 * The caller may replace an older food
 * memory with the newly encoded trace when
 * fresh legitimate perception occurs.
 */
export function encodeFoodMemory(
  signal: FoodPerceptionSignal,
  simulationTimeSeconds: number,
): FoodMemoryTrace {
  validateFoodPerceptionSignal(
    signal,
  );

  validateSimulationTime(
    simulationTimeSeconds,
  );

  return {
    schemaVersion:
      FOOD_MEMORY_TRACE_SCHEMA_VERSION,

    kind:
      FOOD_MEMORY_KIND,

    source:
      FOOD_MEMORY_SOURCE,

    sourceFoodId:
      signal.foodId,

    encodedAtSimulationTimeSeconds:
      simulationTimeSeconds,

    ageSeconds: 0,

    confidence:
      FOOD_MEMORY_INITIAL_CONFIDENCE,

    rememberedDirectionX:
      signal.directionX,

    rememberedDirectionY:
      signal.directionY,

    rememberedPerceptualStrength:
      signal.strength,
  };
}

/*
 * Advance a memory to an explicit current
 * simulation time.
 *
 * Confidence is recomputed from the
 * original encoding time rather than
 * repeatedly subtracting from the previous
 * confidence. This keeps decay deterministic
 * and avoids accumulation of step-dependent
 * rounding behaviour.
 *
 * A return value of null means the memory
 * has deterministically been forgotten.
 */
export function advanceFoodMemory(
  trace: FoodMemoryTrace,
  simulationTimeSeconds: number,
): FoodMemoryTrace | null {
  validateFoodMemoryTrace(
    trace,
  );

  validateSimulationTime(
    simulationTimeSeconds,
  );

  if (
    simulationTimeSeconds <
    trace.encodedAtSimulationTimeSeconds
  ) {
    throw new RangeError(
      "Food memory cannot be advanced to a simulation time before it was encoded.",
    );
  }

  const ageSeconds =
    simulationTimeSeconds -
    trace.encodedAtSimulationTimeSeconds;

  const confidence =
    Math.max(
      0,
      FOOD_MEMORY_INITIAL_CONFIDENCE -
        FOOD_MEMORY_DECAY_PER_SECOND *
          ageSeconds,
    );

  /*
   * The locked value is the minimum usable
   * confidence.
   *
   * Therefore exactly 0.25 is still
   * recallable. Values below 0.25 are
   * forgotten.
   */
  if (
    confidence <
    FOOD_MEMORY_MIN_RECALL_CONFIDENCE
  ) {
    return null;
  }

  return {
    ...trace,

    ageSeconds,

    confidence,
  };
}

/*
 * Convert a currently usable memory trace
 * into a distinct recall signal.
 *
 * Object identity is intentionally omitted
 * from the cognitive recall representation.
 *
 * Later brain integration therefore has no
 * need to receive sourceFoodId.
 */
export function recallFoodMemory(
  trace: FoodMemoryTrace | null,
): FoodMemoryRecallSignal | null {
  if (trace === null) {
    return null;
  }

  validateFoodMemoryTrace(
    trace,
  );

  if (
    trace.confidence <
    FOOD_MEMORY_MIN_RECALL_CONFIDENCE
  ) {
    return null;
  }

  return {
    kind:
      FOOD_MEMORY_RECALL_KIND,

    ageSeconds:
      trace.ageSeconds,

    confidence:
      trace.confidence,

    directionX:
      trace.rememberedDirectionX,

    directionY:
      trace.rememberedDirectionY,

    strength:
      trace.rememberedPerceptualStrength,
  };
}

function validateFoodPerceptionSignal(
  signal: FoodPerceptionSignal,
): void {
  if (!signal.foodId.trim()) {
    throw new Error(
      "Food perception signal foodId must not be empty.",
    );
  }

  if (
    !Number.isFinite(
      signal.distance,
    ) ||
    signal.distance < 0
  ) {
    throw new RangeError(
      "Food perception signal distance must be finite and non-negative.",
    );
  }

  validateDirectionComponent(
    signal.directionX,
    "directionX",
  );

  validateDirectionComponent(
    signal.directionY,
    "directionY",
  );

  if (
    !Number.isFinite(
      signal.strength,
    ) ||
    signal.strength < 0 ||
    signal.strength > 1
  ) {
    throw new RangeError(
      "Food perception signal strength must be finite and between 0 and 1.",
    );
  }
}

function validateFoodMemoryTrace(
  trace: FoodMemoryTrace,
): void {
  if (
    trace.schemaVersion !==
    FOOD_MEMORY_TRACE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported food memory trace schema version.",
    );
  }

  if (
    trace.kind !==
    FOOD_MEMORY_KIND
  ) {
    throw new Error(
      "Food memory trace kind is invalid.",
    );
  }

  if (
    trace.source !==
    FOOD_MEMORY_SOURCE
  ) {
    throw new Error(
      "Food memory trace source is invalid.",
    );
  }

  if (
    !trace.sourceFoodId.trim()
  ) {
    throw new Error(
      "Food memory trace sourceFoodId must not be empty.",
    );
  }

  validateSimulationTime(
    trace.encodedAtSimulationTimeSeconds,
  );

  if (
    !Number.isFinite(
      trace.ageSeconds,
    ) ||
    trace.ageSeconds < 0
  ) {
    throw new RangeError(
      "Food memory age must be finite and non-negative.",
    );
  }

  if (
    !Number.isFinite(
      trace.confidence,
    ) ||
    trace.confidence < 0 ||
    trace.confidence >
      FOOD_MEMORY_INITIAL_CONFIDENCE
  ) {
    throw new RangeError(
      "Food memory confidence is invalid.",
    );
  }

  validateDirectionComponent(
    trace.rememberedDirectionX,
    "rememberedDirectionX",
  );

  validateDirectionComponent(
    trace.rememberedDirectionY,
    "rememberedDirectionY",
  );

  if (
    !Number.isFinite(
      trace.rememberedPerceptualStrength,
    ) ||
    trace.rememberedPerceptualStrength <
      0 ||
    trace.rememberedPerceptualStrength >
      1
  ) {
    throw new RangeError(
      "Remembered perceptual strength must be finite and between 0 and 1.",
    );
  }
}

function validateSimulationTime(
  simulationTimeSeconds: number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new RangeError(
      "Simulation time must be finite and non-negative.",
    );
  }
}

function validateDirectionComponent(
  value: number,
  name: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < -1 ||
    value > 1
  ) {
    throw new RangeError(
      `${name} must be finite and between -1 and 1.`,
    );
  }
}