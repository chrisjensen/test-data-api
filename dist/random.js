export class SeededRandom {
    constructor(seed = 0) {
        this.seed = seed;
    }
    setSeed(seed) {
        this.seed = seed;
    }
    getSeed() {
        return this.seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    shouldBeNull(percentage) {
        return this.next() < percentage / 100;
    }
}
