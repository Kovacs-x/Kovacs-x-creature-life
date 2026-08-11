import type { SeededRngState } from "./rng.js";

export const WORLD_SCHEMA_VERSION = 1 as const;
export const CREATURE_SCHEMA_VERSION = 1 as const;
export const BRAIN_SCHEMA_VERSION = 1 as const;
export const GENOME_SCHEMA_VERSION = 1 as const;

export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export interface WorldBounds {
  readonly min: Vector2;
  readonly max: Vector2;
}

export interface EnvironmentState {
  readonly bounds: WorldBounds;
}

export interface WorldObjectState {
  readonly id: string;
  readonly kind: string;
  readonly position: Vector2;
}

export interface GenomeState {
  readonly schemaVersion: typeof GENOME_SCHEMA_VERSION;
  readonly parameters: Readonly<Record<string, number>>;
}

export interface BiologyState {
  readonly schemaVersion: 1;
  readonly values: Readonly<Record<string, number>>;
}

export interface PerceptionState {
  readonly schemaVersion: 1;
  readonly signals: readonly unknown[];
}

export interface BrainNodeState {
  readonly id: string;
  readonly module: string;
  readonly activation: number;
}

export interface BrainConnectionState {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly weight: number;
  readonly enabled: boolean;
}

export interface BrainState {
  readonly schemaVersion: typeof BRAIN_SCHEMA_VERSION;
  readonly nodes: readonly BrainNodeState[];
  readonly connections: readonly BrainConnectionState[];
}

export interface DriveState {
  readonly schemaVersion: 1;
  readonly values: Readonly<Record<string, number>>;
}

export interface MemoryState {
  readonly schemaVersion: 1;
  readonly entries: readonly unknown[];
}

export interface ActionState {
  readonly kind: "none";
}

export interface TelemetrySettingsState {
  readonly enabled: boolean;
  readonly maxEntries: number;
}

export interface CreatureState {
  readonly id: string;
  readonly schemaVersion: typeof CREATURE_SCHEMA_VERSION;
  readonly displayName: string;
  readonly birthTime: number;
  readonly developmentalState: "uninitialized";
  readonly genome: GenomeState;
  readonly biology: BiologyState;
  readonly perception: PerceptionState;
  readonly brain: BrainState;
  readonly drives: DriveState;
  readonly memory: MemoryState;
  readonly position: Vector2;
  readonly currentAction: ActionState;
  readonly telemetry: TelemetrySettingsState;
}

export interface WorldState {
  readonly id: string;
  readonly schemaVersion: typeof WORLD_SCHEMA_VERSION;
  readonly simulationTime: number;
  readonly tickIndex: number;
  readonly rngState: SeededRngState;
  readonly environment: EnvironmentState;
  readonly objects: readonly WorldObjectState[];
  readonly creatures: readonly CreatureState[];
}

export interface SimulationConfig {
  readonly worldId: string;
  readonly seed: number;
  readonly bounds: WorldBounds;
}

export function createEmptyCreature(
  id: string,
  displayName = "Creature",
): CreatureState {
  return {
    id,
    schemaVersion: CREATURE_SCHEMA_VERSION,
    displayName,
    birthTime: 0,
    developmentalState: "uninitialized",
    genome: {
      schemaVersion: GENOME_SCHEMA_VERSION,
      parameters: {},
    },
    biology: {
      schemaVersion: 1,
      values: {},
    },
    perception: {
      schemaVersion: 1,
      signals: [],
    },
    brain: {
      schemaVersion: BRAIN_SCHEMA_VERSION,
      nodes: [],
      connections: [],
    },
    drives: {
      schemaVersion: 1,
      values: {},
    },
    memory: {
      schemaVersion: 1,
      entries: [],
    },
    position: { x: 0, y: 0 },
    currentAction: { kind: "none" },
    telemetry: {
      enabled: false,
      maxEntries: 0,
    },
  };
}