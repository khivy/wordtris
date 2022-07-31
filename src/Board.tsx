import * as React from "react";
import { Letter } from "./Letter";

export let ROWS = 5
export let COLS = 5

class Cell {
    x: number;
    y: number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

}

export function createBoard() {
    // Init cells.
    let cells = new Array();
    for (let r = 0; r < ROWS; ++r) {
        cells.push(new Array());
        for (let c = 0; c < ROWS; ++c) {
            cells[r].push(new Cell(r,c));
        }
    }
    let board = {
        cells: cells
    };
    return board;
}

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
