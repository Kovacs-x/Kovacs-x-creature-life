import { SeededRng } from "./rng.js";
import {
  WORLD_SCHEMA_VERSION,
  type SimulationConfig,
  type WorldState,
} from "./contracts.js";

export function createEmptyWorld(config: SimulationConfig): WorldState {
  const rng = new SeededRng(config.seed);

  return {
    id: config.worldId,
    schemaVersion: WORLD_SCHEMA_VERSION,
    simulationTime: 0,
    tickIndex: 0,
    rngState: rng.state,
    environment: {
      bounds: config.bounds,
    },
    objects: [],
    creatures: [],
  };
}