export interface ActionCandidate {
  readonly actionId: string;
  readonly activation: number;

  /*
   * Optional legitimate-evidence feasibility gate.
   *
   * Defaults to true, so every existing caller that
   * omits this field (M1's evaluateM1Brain and any
   * other pre-M3.11R candidate list) retains exactly
   * its current selection behaviour.
   *
   * An unavailable candidate's activation is still
   * validated and remains observable to callers; it
   * is only excluded from winning the competition.
   * This is not a hidden fallback FSM: the candidate
   * set and their raw activations are unchanged, only
   * eligibility to win is restricted.
   */
  readonly available?: boolean;
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

  let selected: ActionCandidate | undefined;

  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.activation)) {
      throw new RangeError(
        `Action activation must be finite: ${candidate.actionId}`,
      );
    }

    const isAvailable = candidate.available ?? true;

    if (!isAvailable) {
      continue;
    }

    if (
      selected === undefined ||
      candidate.activation > selected.activation
    ) {
      selected = candidate;
    }
  }

  if (selected === undefined) {
    throw new Error(
      "At least one action candidate must be available to win the competition.",
    );
  }

  return {
    selectedActionId: selected.actionId,
    activation: selected.activation,
  };
}