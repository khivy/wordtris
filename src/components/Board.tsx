import * as React from "react";
import styled from "styled-components";
import { BoardCell } from "./BoardCell";

export let BOARD_ROWS = 5;
export let BOARD_COLS = 5;

export function createBoard() {
    // Init cells.
    const cells = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
        cells.push([]);
        for (let c = 0; c < BOARD_ROWS; ++c) {
            cells[r].push(new BoardCell(r, c));
        }
    }
    const board = {
        cells,
    };
    return board;
}

export const BoardStyled = styled.div`
  display: grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
  border: 1px solid black;
  background: gray;
`;
