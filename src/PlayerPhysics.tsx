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

export class PlayerPhysics {
    static spawnPos = [1, 3] as const;
    static layout = [
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
        [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ] as const;

    static rotateCells(cells: UserCell[], isClockwise: boolean): UserCell[] {
        console.assert(PlayerPhysics.layout.length == PlayerPhysics.layout[0].length);
        console.assert(PlayerPhysics.layout.length % 2 == 1);
        const mid = Math.floor(PlayerPhysics.layout.length / 2);
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

    static getAdjustedLeftmostC(adjustedCells: UserCell[]): number {
        return adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? prev : cur
        ).c;
    }

    static getAdjustedRightmostC(adjustedCells: UserCell[]): number {
        return adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? cur : prev
        ).c;
    }

    static getAdjustedTopR(adjustedCells: UserCell[]): number {
        return adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? prev : cur
        ).r;
    }

    static getAdjustedBottomR(adjustedCells: UserCell[]): number {
        return adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? cur : prev
        ).r;
    }

    static isInRBounds(r: number): boolean {
        return 0 <= r && r < BOARD_ROWS;
    }

    static isInCBounds(c: number): boolean {
        return 0 <= c && c < BOARD_COLS;
    }

    // Returns the number of times crossed onto a new row.
    static doGradualFall(board: BoardCell[][], adjustedCells: UserCell[], hasMoved: boolean): number {
        interp.val += interpRate;
        if (
            adjustedCells.some((cell) =>
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
            hasMoved = true;
        }
        return dr;
    }

    static generateUserCells(): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        return PlayerPhysics.layout.flatMap((row, r) =>
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

    static convertCellsToAdjusted(cells: UserCell[], pos: [number, number]) {
        return cells.map((cell) =>
            PlayerPhysics.getAdjustedUserCell(cell, pos)
        );
    }

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    static getAdjustedUserCell({ r, c, char, uid }: UserCell, pos: [number, number]): UserCell {
        return {
            r: r + pos[0] - Math.floor(PlayerPhysics.layout.length / 2),
            c: c + pos[1] - Math.floor(PlayerPhysics.layout[0].length / 2),
            char,
            uid,
        };
    }
}
