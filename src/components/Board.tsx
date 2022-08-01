import * as React from "react";
import styled from 'styled-components';
import { Letter } from "./Letter";
import { Cell } from "./Cell";


export let BOARD_ROWS = 5
export let BOARD_COLS = 5

export function createBoard() {
    // Init cells.
    let cells = new Array();
    for (let r = 0; r < BOARD_ROWS; ++r) {
        cells.push(new Array());
        for (let c = 0; c < BOARD_ROWS; ++c) {
            cells[r].push(new Cell(r,c));
        }
    }
    let board = {
        cells: cells
    };
    return board;
}

export const BoardStyled = styled.div`
  display: grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
  grid-gap: 1px;
  border: 1px solid black;
  background: gray;
`;

function Row({ row }: { row: (string | undefined)[] }) {
    return <div>
        {row.map((letter, i) => letter && <Letter key={i} letter={letter} />)}
    </div>;
}

export function Board({ rows }: { rows: (string | undefined)[][] }) {
    return <div>
        {rows.map((row, i) => <Row key={i} row={row} />)}
    </div>;
}

export function boardFromWords(words: string[]) {
    const rows = words.map(word => [...word].map(letter => letter === " " ? undefined : letter));
    return Board({ rows });
}
