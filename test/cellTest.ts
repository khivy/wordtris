import { createBoard, getGroundHeight } from "../src/BoardPhysics";

function testBaseHeight() {
    const len = 5;
    const matrix = createBoard(len, len);
    for (let i = 0; i < len; ++i) {
        console.assert(
            getGroundHeight(i, len - 1, matrix) == len - 1,
        );
    }
}

testBaseHeight();
