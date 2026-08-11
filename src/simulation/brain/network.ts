import type {
  BrainConnectionState,
  BrainNodeState,
  BrainState,
} from "../core/contracts.js";

export type ExternalActivations = Readonly<Record<string, number>>;

export interface BrainEvaluationResult {
  readonly brain: BrainState;
  readonly activations: Readonly<Record<string, number>>;
}

export function evaluateBrain(
  brain: BrainState,
  externalActivations: ExternalActivations,
): BrainEvaluationResult {
  const sourceActivations: Record<string, number> = {};
  const weightedSums: Record<string, number> = {};

  for (const node of brain.nodes) {
    const externalValue =
      externalActivations[node.id] ?? 0;

    sourceActivations[node.id] =
      clampActivation(externalValue);

    weightedSums[node.id] = 0;
  }

  for (const connection of brain.connections) {
    if (!connection.enabled) {
      continue;
    }

    const sourceActivation =
      sourceActivations[
        connection.sourceNodeId
      ];

    if (sourceActivation === undefined) {
      throw new Error(
        `Brain connection references missing source node: ${connection.sourceNodeId}`,
      );
    }

    const currentTargetSum =
      weightedSums[
        connection.targetNodeId
      ];

    if (currentTargetSum === undefined) {
      throw new Error(
        `Brain connection references missing target node: ${connection.targetNodeId}`,
      );
    }

    weightedSums[
      connection.targetNodeId
    ] =
      currentTargetSum +
      sourceActivation *
        connection.weight;
  }

  const activations: Record<string, number> = {};

  for (const node of brain.nodes) {
    const externalActivation =
      sourceActivations[node.id] ?? 0;

    const incomingActivation =
      weightedSums[node.id] ?? 0;

    activations[node.id] =
      clampActivation(
        externalActivation +
          incomingActivation,
      );
  }

  const nodes: BrainNodeState[] =
    brain.nodes.map((node) => ({
      ...node,
      activation:
        activations[node.id] ?? 0,
    }));

  return {
    brain: {
      ...brain,
      nodes,
    },
    activations,
  };
}

export function createBrainState(
  nodes: readonly BrainNodeState[],
  connections: readonly BrainConnectionState[],
): BrainState {
  assertUniqueNodeIds(nodes);
  assertUniqueConnectionIds(connections);

  const nodeIds = new Set(
    nodes.map((node) => node.id),
  );

  for (const connection of connections) {
    if (
      !nodeIds.has(
        connection.sourceNodeId,
      )
    ) {
      throw new Error(
        `Connection ${connection.id} references missing source node ${connection.sourceNodeId}.`,
      );
    }

    if (
      !nodeIds.has(
        connection.targetNodeId,
      )
    ) {
      throw new Error(
        `Connection ${connection.id} references missing target node ${connection.targetNodeId}.`,
      );
    }

    if (
      !Number.isFinite(
        connection.weight,
      )
    ) {
      throw new RangeError(
        `Connection ${connection.id} must have a finite weight.`,
      );
    }
  }

  return {
    schemaVersion: 1,
    nodes: nodes.map((node) => ({
      ...node,
    })),
    connections: connections.map(
      (connection) => ({
        ...connection,
      }),
    ),
  };
}

function clampActivation(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      "Brain activation must be finite.",
    );
  }

  return Math.min(
    1,
    Math.max(0, value),
  );
}

function assertUniqueNodeIds(
  nodes: readonly BrainNodeState[],
): void {
  const ids = new Set<string>();

  for (const node of nodes) {
    if (ids.has(node.id)) {
      throw new Error(
        `Duplicate brain node id: ${node.id}`,
      );
    }

    ids.add(node.id);
  }
}

function assertUniqueConnectionIds(
  connections: readonly BrainConnectionState[],
): void {
  const ids = new Set<string>();

  for (const connection of connections) {
    if (ids.has(connection.id)) {
      throw new Error(
        `Duplicate brain connection id: ${connection.id}`,
      );
    }

    ids.add(connection.id);
  }
}