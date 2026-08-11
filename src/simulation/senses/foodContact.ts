import type { FoodObjectState } from "../../world/food.js";

export interface FoodContactSignal {
  readonly inRange: boolean;
}

export function senseFoodContact(
  creaturePosition: {
    readonly x: number;
    readonly y: number;
  },
  food: FoodObjectState,
  interactionRange: number,
): FoodContactSignal {
  if (
    !Number.isFinite(interactionRange) ||
    interactionRange < 0
  ) {
    throw new RangeError(
      "Food contact range must be finite and non-negative.",
    );
  }

  if (food.consumed) {
    return {
      inRange: false,
    };
  }

  const distance = Math.hypot(
    food.position.x - creaturePosition.x,
    food.position.y - creaturePosition.y,
  );

  return {
    inRange: distance <= interactionRange,
  };
}