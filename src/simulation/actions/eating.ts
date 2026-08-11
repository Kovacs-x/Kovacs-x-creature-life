import type { HungerState } from "../biology/hunger.js";
import { restoreEnergy } from "../biology/hunger.js";
import type { FoodObjectState } from "../../world/food.js";

export interface EatingResult {
  readonly food: FoodObjectState;
  readonly hunger: HungerState;
  readonly ate: boolean;
}

export function canEatFood(
  creaturePosition: { readonly x: number; readonly y: number },
  food: FoodObjectState,
  interactionRange: number,
): boolean {
  if (!Number.isFinite(interactionRange) || interactionRange < 0) {
    throw new RangeError(
      "Interaction range must be finite and non-negative.",
    );
  }

  if (food.consumed) {
    return false;
  }

  const distance = Math.hypot(
    food.position.x - creaturePosition.x,
    food.position.y - creaturePosition.y,
  );

  return distance <= interactionRange;
}

export function eatFood(
  creaturePosition: { readonly x: number; readonly y: number },
  hunger: HungerState,
  food: FoodObjectState,
  interactionRange: number,
): EatingResult {
  if (!canEatFood(creaturePosition, food, interactionRange)) {
    return {
      food,
      hunger,
      ate: false,
    };
  }

  return {
    food: {
      ...food,
      consumed: true,
    },
    hunger: restoreEnergy(hunger, food.energyValue),
    ate: true,
  };
}