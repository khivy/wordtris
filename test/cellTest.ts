import { BoardPhysics } from "../src/GameLoop";

function testBaseHeight() {
    const len = 5;
    const b = new BoardPhysics(len, len);
    for (let i = 0; i < len; ++i) {
        console.assert(b.getGroundHeight(i, len - 1) == len - 1);
    }
}

testBaseHeight();
