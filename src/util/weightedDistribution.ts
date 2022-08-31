export class WeightedDistribution<K> {
    keys: K[];
    prefixWeights: number[];
    totalWeight: number;

    constructor(weightedDistribution: Iterable<[K, number]>) {
        const keys = [];
        const prefixWeights = [];
        let prefixWeight = 0;
        for (const [key, weight] of weightedDistribution) {
            prefixWeight += weight;
            keys.push(key);
            prefixWeights.push(prefixWeight);
        }
        this.keys = keys;
        this.prefixWeights = prefixWeights;
        this.totalWeight = prefixWeight;
    }

    static ofMap<K>(
        weightedDistribution: Map<K, number>,
    ): WeightedDistribution<K> {
        return new WeightedDistribution(weightedDistribution.entries());
    }

    static ofRecord(
        weightedDistribution: Record<string, number>,
    ): WeightedDistribution<string> {
        return new WeightedDistribution(Object.entries(weightedDistribution));
    }

    get(weight: number): K | undefined {
        // Binary Search
        let left = 0;
        let right = this.prefixWeights.length - 1;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.prefixWeights[mid]! < weight) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        return this.keys[Math.floor((left + right) / 2)];
    }

    getRandom(): K | undefined {
        const weight = Math.random() * this.totalWeight;
        return this.get(weight);
    }

    [Symbol.iterator](): Iterator<Weight<K>> {
        return new WeightIterator(this);
    }

    static englishLetters(): WeightedDistribution<string> {
        return WeightedDistribution.ofRecord({
            a: 8.2,
            b: 1.5,
            c: 2.8,
            d: 4.3,
            e: 13,
            f: 2.2,
            g: 2,
            h: 6.1,
            i: 7,
            j: 0.15,
            k: 0.77,
            l: 4,
            m: 2.4,
            n: 6.7,
            o: 7.5,
            p: 1.9,
            q: 0.1,
            r: 6,
            s: 6.3,
            t: 9.1,
            u: 2.8,
            v: 1,
            w: 2.4,
            x: 0.15,
            y: 2,
            z: 0.074,
        });
    }
}

export interface Weight<K> {
    index: number;
    key: K;
    weight: number;
    prefixWeight: number;
}

class WeightIterator<K> {
    weightedDistribution: WeightedDistribution<K>;
    i: number;
    prevPrefixWeight: number;

    constructor(weightedDistribution: WeightedDistribution<K>) {
        this.weightedDistribution = weightedDistribution;
        this.i = 0;
        this.prevPrefixWeight = 0;
    }

    next(): IteratorResult<Weight<K>> {
        const index = this.i;
        if (index >= this.weightedDistribution.keys.length) {
            return { done: true, value: undefined };
        }
        const key = this.weightedDistribution.keys[index]!;
        const prefixWeight = this.weightedDistribution.prefixWeights[index]!;
        const weight = prefixWeight - this.prevPrefixWeight;
        return {
            done: false,
            value: {
                index,
                key,
                weight,
                prefixWeight,
            },
        };
    }
}

const englishLetters = WeightedDistribution.englishLetters();

export function generateRandomChar(): string {
    return englishLetters.getRandom()!;
}
