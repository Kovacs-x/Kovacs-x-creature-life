import { SimulationClock } from "./clock.js";
import type { WorldState } from "./contracts.js";
import { SeededRng } from "./rng.js";
import { BoundedTelemetry, type DiagnosticTelemetryEntry } from "./telemetry.js";

export interface SimulationStepResult {
  readonly state: WorldState;
  readonly telemetry: readonly DiagnosticTelemetryEntry[];
}

export class HeadlessSimulation {
  private state: WorldState;
  private readonly clock: SimulationClock;
  private readonly rng: SeededRng;
  private readonly telemetry: BoundedTelemetry;

  public constructor(world: WorldState, telemetryCapacity = 32) {
    this.state = world;
    this.clock = new SimulationClock({
      tickIndex: world.tickIndex,
      timeSeconds: world.simulationTime,
    });
    this.rng = new SeededRng(world.rngState);
    this.telemetry = new BoundedTelemetry(telemetryCapacity);
  }

  public getState(): WorldState {
    return this.state;
  }

  public getTelemetry(): readonly DiagnosticTelemetryEntry[] {
    return this.telemetry.snapshot();
  }

  public advance(deltaSeconds: number): SimulationStepResult {
    const clockState = this.clock.advance(deltaSeconds);
    this.state = {
      ...this.state,
      simulationTime: clockState.timeSeconds,
      tickIndex: clockState.tickIndex,
      rngState: this.rng.state,
    };

    this.telemetry.record({
      type: "simulation-tick",
      tickIndex: clockState.tickIndex,
      simulationTime: clockState.timeSeconds,
    });

    return {
      state: this.state,
      telemetry: this.getTelemetry(),
    };
  }
}