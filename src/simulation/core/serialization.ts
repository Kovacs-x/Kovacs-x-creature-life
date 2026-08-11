import type { WorldState } from "./contracts.js";

export function serializeWorldState(state: WorldState): string {
  assertWorldStateShape(state);
  return JSON.stringify(state);
}

export function deserializeWorldState(serialized: string): WorldState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error("World state is not valid JSON.", { cause: error });
  }

  assertWorldStateShape(parsed);
  return parsed;
}

function assertWorldStateShape(value: unknown): asserts value is WorldState {
  if (!isRecord(value)) {
    throw new Error("World state must be an object.");
  }

  if (value.schemaVersion !== 1) {
    throw new Error("Unsupported world schema version.");
  }

  if (
    typeof value.id !== "string" ||
    typeof value.simulationTime !== "number" ||
    !Number.isFinite(value.simulationTime) ||
    !Number.isInteger(value.tickIndex) ||
    !Array.isArray(value.objects) ||
    !Array.isArray(value.creatures) ||
    !isRecord(value.rngState) ||
    value.rngState.algorithm !== "xorshift32"
  ) {
    throw new Error("World state does not satisfy the canonical state contract.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}