import { BoardCell } from "./BoardCell";
import { EMPTY } from "../setup";

export function createBoard(rows: number, cols: number): BoardCell[][] {
    // Init cells.
    const cells = [];
    for (let r = 0; r < rows; ++r) {
        const row = [];
        for (let c = 0; c < cols; ++c) {
            row.push({ c: c, r: r, char: EMPTY, hasMatched: false });
        }
        cells.push(row);
    }
    return cells;
}

export function getGroundHeight(
    col: number,
    startRow: number,
    board: BoardCell[][],
): number {
    // Search for first non-EMPTY board cell from the top.
    for (let row = startRow; row < board.length - 1; ++row) {
        if (board[row + 1][col].char !== EMPTY) {
            return row;
        }
    }
    return board.length - 1;
}
