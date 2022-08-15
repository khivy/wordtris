import "./App.css";
import { generateRandomChar } from "./components/Board";
import {
    _ENABLE_UP_KEY,
    BOARD_COLS,
    BOARD_ROWS,
    EMPTY,
    ENABLE_INSTANT_DROP,
    ENABLE_SMOOTH_FALL,
    interp,
    interpKeydownMult,
    interpMax,
    interpRate,
    TBD,
} from "./setup";
import { UserCell } from "./UserCell";
import { BoardCell } from "./BoardCell";
import { BoardPhysics } from "./BoardPhysics";

export class PlayerPhysics {
    cells: UserCell[];
    adjustedCells: UserCell[];
    pos: [number, number]; // r, c
    spawnPos: [number, number];
    layout: string[][];
    hasMoved: boolean;

    constructor(boardPhysics: BoardPhysics) {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.spawnPos = [1, 3];
        this.resetBlock();
        this.hasMoved = false;
    }

    setPos(r: number, c: number) {
        this.pos[0] = r;
        this.pos[1] = c;
        // Update adjusted cells, which also allows React to see new updates.
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    rotateCells(cells: UserCell[]): UserCell[] {
        console.assert(this.layout.length == this.layout[0].length);
        console.assert(this.layout.length % 2 == 1);
        const mid = Math.floor(this.layout.length / 2);
        const res = structuredClone(cells);
        res.forEach((cell) => {
            // Center around mid.
            // Remember, top-left is (0,0) and bot-right is (last,last).
            const r = cell.r - mid;
            const c = cell.c - mid;
            if (r !== 0 || c !== 0) {
                cell.r = c + mid;
                cell.c = -r + mid;
            }
        });
        return res;
    }

    getAdjustedLeftmostC() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? prev.c : cur.c
        );
    }

    getAdjustedRightmostC() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? cur.c : prev.c
        );
    }

    getAdjustedTopR() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? prev.r : cur.r
        );
    }

    getAdjustedBottomR() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? cur.r : prev.r
        );
    }

    isInRBounds(r: number) {
        return 0 <= r && r < BOARD_ROWS;
    }

    isInCBounds(c: number) {
        return 0 <= c && c < BOARD_COLS;
    }

    // Returns the number of times crossed onto a new row.
    doGradualFall(board: BoardCell[][]): number {
        interp.val += interpRate;
        if (
            this.adjustedCells.some((cell) =>
                !this.isInRBounds(cell.r + 1) ||
                board[cell.r + 1][cell.c].char !== EMPTY
            )
        ) {
            interp.val = 0;
        }
        let dr = 0;
        while (interpMax <= interp.val) {
            dr += 1;
            interp.val -= interpMax;
            this.hasMoved = true;
        }
        return dr;
    }

    generateUserCells(): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        const res = [];
        this.layout.forEach((row, r) =>
            row.forEach((ch, c) => {
                if (ch === TBD) {
                    res.push({
                        r: r,
                        c: c,
                        char: generateRandomChar(),
                        uid: `user(${r},${c})`,
                    });
                }
            })
        );
        return res;
    }

    resetBlock() {
        this.pos = [...this.spawnPos];
        this.cells = this.generateUserCells();
        this.setPos(this.pos[0], this.pos[1]);
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    getAdjustedUserCell(cell: UserCell): UserCell {
        return {
            r: cell.r + this.pos[0] - Math.floor(this.layout.length / 2),
            c: cell.c + this.pos[1] - Math.floor(this.layout[0].length / 2),
            uid: cell.uid,
            char: cell.char,
        };
    }
}
