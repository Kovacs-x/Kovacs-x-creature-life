export interface DiagnosticTelemetryEntry {
  readonly type: "simulation-tick";
  readonly tickIndex: number;
  readonly simulationTime: number;
}

export class BoundedTelemetry {
  private readonly entries: DiagnosticTelemetryEntry[] = [];

  public constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError("Telemetry capacity must be a non-negative integer.");
    }
  }

  public record(entry: DiagnosticTelemetryEntry): void {
    if (this.capacity === 0) {
      return;
    }

    this.entries.push(entry);
    if (this.entries.length > this.capacity) {
      this.entries.shift();
    }
  }

  public snapshot(): readonly DiagnosticTelemetryEntry[] {
    return this.entries.map((entry) => ({ ...entry }));
  }
}