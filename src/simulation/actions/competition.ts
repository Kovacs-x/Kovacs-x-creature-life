export interface ActionCandidate {
  readonly actionId: string;
  readonly activation: number;
}

export interface ActionSelection {
  readonly selectedActionId: string;
  readonly activation: number;
}

export function selectHighestActivation(
  candidates: readonly ActionCandidate[],
): ActionSelection {
  if (candidates.length === 0) {
    throw new Error("At least one action candidate is required.");
  }

  let selected = candidates[0];

  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.activation)) {
      throw new RangeError(
        `Action activation must be finite: ${candidate.actionId}`,
      );
    }

    if (
      selected === undefined ||
      candidate.activation > selected.activation
    ) {
      selected = candidate;
    }
  }

  if (selected === undefined) {
    throw new Error("Unable to select an action candidate.");
  }

  return {
    selectedActionId: selected.actionId,
    activation: selected.activation,
  };
}