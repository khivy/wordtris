import { BoardCell } from "./BoardCell";
import { _ENABLE_UP_KEY, EMPTY } from "./setup";

export class BoardPhysics {
    boardCellMatrix: BoardCell[][];
    rows: number;
    cols: number;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.boardCellMatrix = this.createBoard(rows, cols);
        // this.boardCellMatrix[8][2].char = 'o'
        // this.boardCellMatrix[9][2].char = 't'
        // this.boardCellMatrix[9][3].char = 'z'
        // this.boardCellMatrix[9][4].char = 'z'
        // this.boardCellMatrix[9][5].char = 'z'
        // this.boardCellMatrix[8][3].char = 'z'
        // this.boardCellMatrix[8][4].char = 'z'
        // this.boardCellMatrix[8][5].char = 'z'
        // this.boardCellMatrix[7][3].char = 'e'
        // this.boardCellMatrix[7][4].char = 'a'
        // this.boardCellMatrix[7][5].char = 'r'
    }

    createBoard(rows: number, cols: number): BoardCell[][] {
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

    getGroundHeight(col: number, startRow: number): number {
        // Search for first non-EMPTY board cell from the top.
        for (let row = startRow; row < this.rows - 1; ++row) {
            if (this.boardCellMatrix[row + 1][col].char !== EMPTY) {
                return row;
            }
        }
        return this.rows - 1;
    }
}
