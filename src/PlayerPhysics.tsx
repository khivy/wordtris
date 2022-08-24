import "./App.css";
import { generateRandomChar } from "./components/Board";
import {
    BOARD_COLS,
    BOARD_ROWS,
    EMPTY,
    interp,
    interpMax,
    interpRate,
    TBD,
} from "./setup";
import { UserCell } from "./UserCell";
import { BoardCell } from "./BoardCell";
import { getGroundHeight } from "./BoardPhysics";

export const spawnPos = [1, 3];
export const layout = [
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
    [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
] as const;

export function rotateCells(cells: UserCell[], isClockwise: boolean): UserCell[] {
        console.assert(layout.length === layout[0].length);
        console.assert(layout.length % 2 === 1);
        const mid = Math.floor(layout.length / 2);
        return cells.map(({ r, c, char, uid }) => {
            // Center around mid.
            // Remember, top-left is `(0, 0)` and bot-right is `(last, last)`.
            const r2 = r - mid;
            const c2 = c - mid;
            if (r2 !== 0 || c2 !== 0) {
                r = (isClockwise ? c2 : -c2) + mid;
                c = (isClockwise ? -r2 : r2) + mid;
            }
            return {
                r,
                c,
                char,
                uid,
            };
        });
    }

export function getAdjustedLeftmostC(adjustedCells: UserCell[]): number {
        return adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? prev : cur
        ).c;
    }

export function getAdjustedRightmostC(adjustedCells: UserCell[]): number {
    return adjustedCells.reduce((prev, cur) =>
        prev.c < cur.c ? cur : prev
    ).c;
}

export function getAdjustedTopR(adjustedCells: UserCell[]): number {
    return adjustedCells.reduce((prev, cur) =>
        prev.r < cur.r ? prev : cur
    ).r;
}

export function getAdjustedBottomR(adjustedCells: UserCell[]): number {
    return adjustedCells.reduce((prev, cur) =>
        prev.r < cur.r ? cur : prev
    ).r;
}

export function isInRBounds(r: number): boolean {
    return 0 <= r && r < BOARD_ROWS;
}

export function isInCBounds(c: number): boolean {
    return 0 <= c && c < BOARD_COLS;
}

// Returns the number of times crossed onto a new row.
export function doGradualFall(board: BoardCell[][], adjustedCells: UserCell[], hasMoved: boolean): number {
    interp.val += interpRate;
    if (
        adjustedCells.some((cell) =>
            !isInRBounds(cell.r + 1) ||
            board[cell.r + 1][cell.c].char !== EMPTY
        )
    ) {
        interp.val = 0;
    }
    let dr = 0;
    while (interpMax <= interp.val) {
        dr += 1;
        interp.val -= interpMax;
        hasMoved = true;
    }
    return dr;
}

export function generateUserCells(): UserCell[] {
    // Return starting block matrix of UserCells with randomly-assigned characters.
    // TODO: Make it pseudo-random.
    return layout.flatMap((row, r) =>
        row.map((ch, c) =>
            ch === TBD && ({
                r,
                c,
                char: generateRandomChar(),
                uid: `user(${r},${c})`,
            })
        ).filter((e): e is UserCell => !!e)
    );
}

export function convertCellsToAdjusted(cells: UserCell[], pos: [number, number]) {
    return cells.map((cell) =>
        getAdjustedUserCell(cell, pos)
    );
}

// Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
export function getAdjustedUserCell({ r, c, char, uid }: UserCell, pos: [number, number]): UserCell {
    return {
        r: r + pos[0] - Math.floor(layout.length / 2),
        c: c + pos[1] - Math.floor(layout[0].length / 2),
        char,
        uid,
    };
}

export function isPlayerTouchingGround (cells: UserCell[], board: BoardCell[][]) {
    return cells.some((cell) => {
        return cell.r >= getGroundHeight(cell.c, cell.r, board);
    });
}

export function dropFloatingCells (
    board: BoardCell[][],
): [BoardCell[][], [number, number][], [number, number][]] {
    // Returns an array of 3 arrays:
    // Array 1: The resulting board with drops.
    // Array 2: The array for the coords of the floating cells, post-drop.
    // Array 3: Array for the old coords of the floating cells.
    const newBoard = board.slice();
    const added: [number, number][] = [];
    const removed: [number, number][] = [];
    for (let r = BOARD_ROWS - 2; r >= 0; --r) {
        for (let c = BOARD_COLS - 1; c >= 0; --c) {
            if (
                newBoard[r][c].char !== EMPTY &&
                newBoard[r + 1][c].char === EMPTY
            ) {
                const g = getGroundHeight(c, r, newBoard);
                newBoard[g][c].char = newBoard[r][c].char;
                newBoard[r][c].char = EMPTY;
                // Update cell in placedCells.
                added.push([g, c]);
                removed.push([r, c]);
            }
        }
    }
    return [newBoard, added, removed];
}
