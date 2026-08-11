export const FOOD_OBJECT_KIND = "food" as const;

export interface FoodObjectState {
  readonly id: string;
  readonly kind: typeof FOOD_OBJECT_KIND;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly energyValue: number;
  readonly consumed: boolean;
}

export function createFoodObject(
  id: string,
  x: number,
  y: number,
  energyValue = 1,
): FoodObjectState {
  if (!id.trim()) {
    throw new Error("Food object id must not be empty.");
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new RangeError("Food object position must use finite coordinates.");
  }

  if (!Number.isFinite(energyValue) || energyValue <= 0) {
    throw new RangeError("Food energy value must be a positive finite number.");
  }

  return {
    id,
    kind: FOOD_OBJECT_KIND,
    position: { x, y },
    energyValue,
    consumed: false,
  };
}