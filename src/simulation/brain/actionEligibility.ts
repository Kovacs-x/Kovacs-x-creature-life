import type { BrainState } from "../core/contracts.js";
import type { ConnectionEligibility } from "./plasticity.js";

export function keepEligibilitiesForTarget(
  brain: BrainState,
  eligibilities: readonly ConnectionEligibility[],
  targetNodeId: string,
): readonly ConnectionEligibility[] {
  const connectionTargets = new Map(
    brain.connections.map((connection) => [
      connection.id,
      connection.targetNodeId,
    ]),
  );

  return eligibilities.map((entry) => {
    const target =
      connectionTargets.get(entry.connectionId);

    if (target === undefined) {
      throw new Error(
        `Eligibility references unknown connection: ${entry.connectionId}`,
      );
    }

    return {
      connectionId: entry.connectionId,
      eligibility:
        target === targetNodeId
          ? entry.eligibility
          : 0,
    };
  });
}