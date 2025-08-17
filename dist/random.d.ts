export declare class SeededRandom {
    private seed;
    constructor(seed?: number);
    setSeed(seed: number): void;
    getSeed(): number;
    next(): number;
    shuffle<T>(array: T[]): T[];
    shouldBeNull(percentage: number): boolean;
}
