const weightedChars = {
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
};

function buildWeightedCharacters(
    dict: Record<string, number>,
): [[string, number][], number] {
    const res = [];
    let prefixSum = 0;
    for (const [ch, weight] of Object.entries(dict)) {
        prefixSum += weight;
        res.push([ch, prefixSum] as [string, number]);
    }
    return [res, prefixSum];
}

function pickWeightedRandom(
    weightedChars: [string, number][],
    totalSum: number,
) {
    let l = 0;
    let r = weightedChars.length - 1;
    const target = Math.random() * totalSum;
    while (l < r) {
        const m = Math.floor((r + l) / 2);
        if (weightedChars[m][1] < target) {
            l = m + 1;
        } else {
            r = m;
        }
    }
    return weightedChars[Math.floor((r + l) / 2)][0];
}

export function generateRandomChar(): string {
    return pickWeightedRandom(...buildWeightedCharacters(weightedChars));
    // return String.fromCharCode(
    //     Math.floor(Math.random() * 26) + 97,
    // );
}
