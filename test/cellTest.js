import { BoardPhysics } from '../src/App';

function testBaseHeight() {
    let len;
    const b = new BoardPhysics(len, len);
    for (let i = 0; i < len; ++i) {
        console.assert(b.getGroundHeight(i, len-1) == len);
    }
}

testBaseHeight()