export interface SeededRngState {
  readonly algorithm: "xorshift32";
  readonly state: number;
}

export interface RandomSource {
  nextFloat(): number;
  nextInt(maxExclusive: number): number;
  nextUint32(): number;
  readonly state: SeededRngState;
}

const ALGORITHM = "xorshift32" as const;
const NON_ZERO_FALLBACK = 0x6d2b79f5;

export class SeededRng implements RandomSource {
  private currentState: number;

  public constructor(seedOrState: number | SeededRngState) {
    this.currentState =
      typeof seedOrState === "number"
        ? normaliseSeed(seedOrState)
        : validateAndReadState(seedOrState);
  }

  public get state(): SeededRngState {
    return {
      algorithm: ALGORITHM,
      state: this.currentState,
    };
  }

  public nextUint32(): number {
    let value = this.currentState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.currentState = value >>> 0;
    return this.currentState;
  }

  public nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }

  public nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("The exclusive upper bound must be a positive integer.");
    }

    return Math.floor(this.nextFloat() * maxExclusive);
  }
}

function normaliseSeed(seed: number): number {
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) {
    throw new RangeError("The RNG seed must be a finite integer.");
  }

  const normalised = seed >>> 0;
  return normalised === 0 ? NON_ZERO_FALLBACK : normalised;
}

function validateAndReadState(state: SeededRngState): number {
  if (state.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported RNG algorithm: ${state.algorithm}`);
  }

  if (!Number.isInteger(state.state) || state.state <= 0 || state.state > 0xffff_ffff) {
    throw new RangeError("The RNG state must be a non-zero uint32.");
  }

  return state.state >>> 0;
}