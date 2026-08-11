export interface SimulationClockState {
  readonly tickIndex: number;
  readonly timeSeconds: number;
}

export class SimulationClock {
  private currentState: SimulationClockState;

  public constructor(initialState: SimulationClockState = { tickIndex: 0, timeSeconds: 0 }) {
    validateClockState(initialState);
    this.currentState = { ...initialState };
  }

  public get state(): SimulationClockState {
    return { ...this.currentState };
  }

  public advance(deltaSeconds: number): SimulationClockState {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError("Simulation delta must be a finite, non-negative number.");
    }

    this.currentState = {
      tickIndex: this.currentState.tickIndex + 1,
      timeSeconds: this.currentState.timeSeconds + deltaSeconds,
    };

    return this.state;
  }
}

function validateClockState(state: SimulationClockState): void {
  if (!Number.isInteger(state.tickIndex) || state.tickIndex < 0) {
    throw new RangeError("Simulation tick index must be a non-negative integer.");
  }

  if (!Number.isFinite(state.timeSeconds) || state.timeSeconds < 0) {
    throw new RangeError("Simulation time must be a finite, non-negative number.");
  }
}