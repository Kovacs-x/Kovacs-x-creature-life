import type { HungerState } from "../biology/hunger.js";
import { getHungerLevel } from "../biology/hunger.js";

export interface HungerSenseSignal {
  readonly hungerLevel: number;
}

export function senseHunger(
  hungerState: HungerState,
): HungerSenseSignal {
  const hungerLevel = getHungerLevel(hungerState);

  if (
    !Number.isFinite(hungerLevel) ||
    hungerLevel < 0 ||
    hungerLevel > 1
  ) {
    throw new RangeError(
      "Derived hunger level must remain between 0 and 1.",
    );
  }

  return {
    hungerLevel,
  };
}