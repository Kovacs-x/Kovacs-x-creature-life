import type { BrainState } from "../core/contracts.js";
import type { ConnectionEligibility } from "./plasticity.js";

export function deriveConnectionEligibilities(
  brain: BrainState,
  activations: Readonly<Record<string, number>>,
): readonly ConnectionEligibility[] {
  return brain.connections.map((connection) => {
    const sourceActivation =
      activations[connection.sourceNodeId] ?? 0;

    const targetActivation =
      activations[connection.targetNodeId] ?? 0;

    if (
      !Number.isFinite(sourceActivation) ||
      !Number.isFinite(targetActivation)
    ) {
      throw new RangeError(
        `Activation for connection ${connection.id} must be finite.`,
      );
    }

    if (!connection.enabled) {
      return {
        connectionId: connection.id,
        eligibility: 0,
      };
    }

    return {
      connectionId: connection.id,
      eligibility:
        clampActivation(sourceActivation) *
        clampActivation(targetActivation),
    };
  });
}

function clampActivation(value: number): number {
  return Math.min(1, Math.max(0, value));
}