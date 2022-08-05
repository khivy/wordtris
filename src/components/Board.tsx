import styled from "styled-components";

export const BOARD_ROWS = 5;
export const BOARD_COLS = 5;
export const EMPTY = "";

interface BoardCell {
    x: number;
    y: number;
    char: string;
}

// TODO: move this out.
export function generateRandomChar(): string {
    return String.fromCharCode(
        Math.floor(Math.random() * 26) + 97,
    );
}

export function createBoard(): BoardCell[][] {
    // Init cells.
    const cells = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
        let row = [];
        for (let c = 0; c < BOARD_ROWS; ++c) {
            row.push({ x: c, y: r, char: EMPTY });
        }
        cells.push(row);
    }
    return cells;
}

export const BoardStyled = styled.div`
  display: grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
  border: 1px solid black;
  background: gray;
`;
