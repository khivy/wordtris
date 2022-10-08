import { hash } from "fast-sha256";
import {
    getLeaders,
    serializeWordsArray,
    submitScore,
} from "../src/util/webUtil";

async function testSuccess() {
    let words = ["hag", "fish"];
    return await submitScore(2, "SampleName", "127.0.0.1/32", words);
}

async function testFailureInvalidChecksum() {
    let words = ["hag", "fish"];
    let falseWordsAsUInt8Array = serializeWordsArray(["hag", "fish", "fish"]);
    return await submitScore(
        2,
        "SampleName",
        "127.0.0.1/32",
        words,
        hash(falseWordsAsUInt8Array),
    );
}

async function testFailureInvalidScore() {
    let words = ["hag", "fish"];
    return await submitScore(
        words.length + 1,
        "SampleName",
        "127.0.0.1/32",
        words,
    );
}

async function testGetLeaders() {
    return await getLeaders();
}

function runTests(): boolean {
    testFailureInvalidScore().then((res) =>
        console.assert(res.status === 406, "Test failure: invalid score")
    );
    testFailureInvalidChecksum().then((res) =>
        console.assert(res.status === 406, "Test failure: invalid checksum")
    );
    testSuccess().then((res) =>
        console.assert(res.status === 202, "Test failure: valid submission")
    );
    testGetLeaders().then((res) =>
        console.assert(
            res.status === 202,
            "Test failure: failed to get leaderboard",
        )
    );
    return true;
}

runTests();
