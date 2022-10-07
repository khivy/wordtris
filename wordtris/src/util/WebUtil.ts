import { PlayerSubmissionData } from "../protobuf_gen/PlayerSubmissionData";
import { hash } from "fast-sha256";

const axios = require('axios').default;


async function submitScore (
    score: number,
    name: string,
    ip: string,
    words: Uint8Array,
    checksum: Uint8Array
) {
    let data = PlayerSubmissionData.encode({
        score,
        name,
        ip,
        words,
        checksum
    });

    console.log("ok")
    // axios({
    //     method: "put",
    //     url: "http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/submitscore",
    //     data
    // })
    //     .then(function (response) {
    //         console.log("response")
    //     });
    return axios({
        method: "get",
        url: "http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/getleaders",
        data
    })
        .then(response => {
            console.log(`response ${response}`)
        });
}

function isAsciiOnly(str: string) {
    for (var i = 0; i < str.length; i++)
        if (str.charCodeAt(i) > 255)
            return false;
    return true;
}

function serializeWordsArray(words: Array<String>) {
    const joined = words.join(" ")
    console.assert(isAsciiOnly(joined), "Error: Given list of words isn't ASCII-only!")
    const serialized = Uint8Array.from(joined.split('').map(letter => letter.charCodeAt(0)));
    return serialized
}

export function test() {
    let words = ["hag", "fish"];
    let serialized = serializeWordsArray(words)
    submitScore(50, "SampleName", "127.0.0.1/32", serialized, hash(serialized));
    console.log("hi")
}

test()