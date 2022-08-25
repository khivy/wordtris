import { BoardPhysics } from "../src/BoardPhysics";

function testBaseHeight() {
    const len = 5;
    const matrix = BoardPhysics.createBoard(len, len);
    for (let i = 0; i < len; ++i) {
        console.assert(BoardPhysics.getGroundHeight(i, len - 1, matrix) == len - 1);
    }
}

testBaseHeight();
