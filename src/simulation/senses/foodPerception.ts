import type { FoodObjectState } from "../../world/food.js";

export interface FoodPerceptionSignal {
  readonly foodId: string;
  readonly distance: number;
  readonly directionX: number;
  readonly directionY: number;
  readonly strength: number;
}

export interface FoodPerceptionConfig {
  readonly maxRange: number;
}

export function perceiveFood(
  creaturePosition: { readonly x: number; readonly y: number },
  food: FoodObjectState,
  config: FoodPerceptionConfig,
): FoodPerceptionSignal | null {
  if (!Number.isFinite(config.maxRange) || config.maxRange <= 0) {
    throw new RangeError("Food perception maxRange must be positive and finite.");
  }

  if (food.consumed) {
    return null;
  }

  const dx = food.position.x - creaturePosition.x;
  const dy = food.position.y - creaturePosition.y;

  const distance = Math.hypot(dx, dy);

  if (distance > config.maxRange) {
    return null;
  }

  if (distance === 0) {
    return {
      foodId: food.id,
      distance: 0,
      directionX: 0,
      directionY: 0,
      strength: 1,
    };
  }

  return {
    foodId: food.id,
    distance,
    directionX: dx / distance,
    directionY: dy / distance,
    strength: 1 - distance / config.maxRange,
  };
}