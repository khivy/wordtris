import "./App.css";
import { generateRandomChar } from "./components/Board";
import { EMPTY, TBD, BOARD_ROWS, BOARD_COLS, ENABLE_SMOOTH_FALL, _ENABLE_UP_KEY, interp, interpMax, interpRate, interpKeydownMult } from './setup'
import { UserCell } from './UserCell'
import { BoardCell } from './BoardCell'

export class PlayerPhysics {
    cells: UserCell[];
    adjustedCells: UserCell[];
    pos: number[]; // r, c
    spawnPos: number[];
    layout: string[][];
    hasMoved: boolean;

    constructor(board: BoardCell[][]) {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.spawnPos = [1, 3];
        this.resetBlock();
        window.addEventListener(
            "keydown",
            this.updatePlayerPos.bind(this, board),
            false,
        ); // Without bind it loses context.
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
        let mid = Math.floor(this.layout.length / 2);
        let res = structuredClone(cells);
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
            console.log(interp.val)
            dr += 1;
            interp.val -= interpMax;
            this.hasMoved = true;
        }
        return dr;
    }

    // Might be worth it to move this to GameLoop.
    updatePlayerPos(
        board: BoardCell[][],
        { keyCode, repeat }: { keyCode: number; repeat: boolean },
    ): void {
        const r = this.pos[0];
        const c = this.pos[1];
        const areTargetSpacesEmpty = (dr, dc) =>
            this.adjustedCells.every((cell) => {
                return board[cell.r + dr][cell.c + dc].char === EMPTY;
            });
        if (keyCode === 37) {
            // Left
            if (
                this.isInCBounds(this.getAdjustedLeftmostC() - 1) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    this.isInRBounds(
                        this.getAdjustedBottomR() +
                        Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    -1,
                )
            ) {
                this.setPos(r, c - 1);
                this.hasMoved = true;
            }
        } else if (keyCode === 39) {
            // Right
            if (
                this.isInCBounds(this.getAdjustedRightmostC() + 1) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    this.isInRBounds(
                        this.getAdjustedBottomR() +
                        Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    1,
                )
            ) {
                this.setPos(r, c + 1);
                this.hasMoved = true;
            }
        } else if (keyCode === 40) {
            // Down
            if (repeat) {
                // TODO: Handle repeated downkey.
            }
            if (
                this.getAdjustedBottomR() + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                if (ENABLE_SMOOTH_FALL) {
                    interp.val += interpRate * interpKeydownMult;
                } else {
                    this.setPos(r + 1, c);
                }
            }
        } else if (keyCode === 38) {
            // Up key
            if (
                _ENABLE_UP_KEY && 0 <= this.getAdjustedTopR() - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                this.setPos(r - 1, c);
                this.hasMoved = true;
            }
        } else if (keyCode == 32) {
            // Space bar.
            let rotatedCells = this.rotateCells(this.cells);
            let rotatedCellsAdjusted = rotatedCells.map((cell) =>
                this.getAdjustedUserCell(cell)
            );

            // Get the overlapping cell's respective index in non-adjusted array.
            let overlappingI = 0;
            const overlappingCells = rotatedCellsAdjusted.filter((cell, i) => {
                if (
                    !this.isInCBounds(cell.c) || !this.isInRBounds(cell.r) ||
                    board[cell.r][cell.c].char !== EMPTY
                ) {
                    overlappingI = i;
                    return true;
                }
                return false;
            });
            // If there's no overlap, place it. Otherwise, shift it in the opposite direction of the overlapping cell.
            if (overlappingCells.length <= 0) {
                // If rotation puts a block right underneath a placed block, set interp to 0.
                const isAdjacentToGround = rotatedCellsAdjusted.some((cell) => {
                    return !this.isInRBounds(cell.r + 1) ||
                        board[cell.r + 1][cell.c].char !== EMPTY;
                });
                if (isAdjacentToGround) {
                    interp.val = 0;
                }
                this.cells = rotatedCells;
                this.adjustedCells = rotatedCellsAdjusted;
                this.hasMoved = true;
            } else {
                // Get direction of overlapping cell.
                let dr = Math.floor(this.layout.length / 2) -
                    rotatedCells[overlappingI].r;
                let dc = Math.floor(this.layout[0].length / 2) -
                    rotatedCells[overlappingI].c;
                // Shift it.
                for (let cell of rotatedCells) {
                    cell.r += dr;
                    cell.c += dc;
                }
                rotatedCellsAdjusted = rotatedCells.map((cell) =>
                    this.getAdjustedUserCell(cell)
                );
                // Check for overlaps with shifted cells.
                const isOverlapping = rotatedCellsAdjusted.some((cell, i) =>
                    !this.isInCBounds(cell.c) || !this.isInRBounds(cell.r) ||
                    board[cell.r][cell.c].char !== EMPTY
                );
                if (!isOverlapping) {
                    this.cells = rotatedCells;
                    this.adjustedCells = rotatedCellsAdjusted;
                    this.hasMoved = true;
                }
            }
        }
    }

    generateUserCells(): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        let res = [];
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
        this.pos = this.spawnPos.slice();
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

