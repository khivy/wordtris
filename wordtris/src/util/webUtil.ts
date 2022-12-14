import { PlayerSubmissionData } from "../protobuf_gen/PlayerSubmissionData";
import { hash } from "fast-sha256";

export function submitScore(
    score: number,
    name: string,
    words: string[],
    checksum?: Uint8Array,
): Promise<Response> {
    const data = PlayerSubmissionData.encode({
        score,
        name,
        words,
        checksum: checksum ? checksum! : hash(serializeWordsArray(words)),
    }).finish();

    return fetch(
        "https://wordtris-server.com/submitscore",
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-protobuf",
            },
            body: data,
        },
    );
}

export function getLeaders(): Promise<Response> {
    return fetch(
        "https://wordtris-server.com/leaderboard",
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        },
    );
}

function isAsciiOnly(str: string) {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) {
            return false;
        }
    }
    return true;
}

export function serializeWordsArray(words: Array<String>) {
    const joined = words.join(" ");
    console.assert(
        isAsciiOnly(joined),
        "Error: Given list of words isn't ASCII-only!",
    );
    const serialized = Uint8Array.from(
        joined.split("").map((letter) => letter.charCodeAt(0)),
    );
    return serialized;
}

export function getPlayerScores() {
    return fetch(
        "https://wordtris-server.com/leaderboard",
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        },
    );
}
