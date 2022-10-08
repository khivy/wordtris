import { PlayerSubmissionData } from "../protobuf_gen/PlayerSubmissionData";
import { hash } from "fast-sha256";

export function submitScore (
    score: number,
    name: string,
    ip: string,
    words: string[],
    checksum?: Uint8Array
): Promise<Response> {
    const data = PlayerSubmissionData.encode({
        score,
        name,
        ip,
        words,
        checksum: checksum ? checksum! : hash(serializeWordsArray(words))
    }).finish();

    return fetch("http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/submitscore",
        {
            method: "PUT",
            headers: {
                'Content-Type': 'application/x-protobuf'},
            body: data,
        });
}

export function getLeaders(): Promise<Response> {
    return fetch("http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/leaderboard",
        {
            method: "GET",
            headers: {
                Accept: 'application/json',
            },
        });
}

function isAsciiOnly (str: string) {
    for (var i = 0; i < str.length; i++)
        if (str.charCodeAt(i) > 255)
            return false;
    return true;
}

function serializeWordsArray (words: Array<String>) {
    const joined = words.join(' ')
    console.assert(isAsciiOnly(joined), "Error: Given list of words isn't ASCII-only!")
    const serialized = Uint8Array.from(joined.split('').map(letter => letter.charCodeAt(0)));
    return serialized
}

async function testSuccess () {
    let words = ["hag", "fish"];
    return await submitScore(2, "SampleName", "127.0.0.1/32", words);
}

async function testFailureInvalidChecksum () {
    let words = ["hag", "fish"];
    let falseWordsAsUInt8Array = serializeWordsArray(["hag", "fish", "fish"]);
    return await submitScore(2, "SampleName", "127.0.0.1/32", words, hash(falseWordsAsUInt8Array));
}

async function testFailureInvalidScore () {
    let words = ["hag", "fish"];
    return await submitScore(words.length+1, "SampleName", "127.0.0.1/32", words);
}

async function testGetLeaders () {
    return await getLeaders();
}

function runTests() {
    testFailureInvalidScore().then(res => console.log(res.status === 406));
    testFailureInvalidChecksum().then(res => console.log(res.status === 406));
    testSuccess().then(res => console.log(res.status === 202));
    testGetLeaders().then(res => console.log(res.status === 202));
}

runTests();
