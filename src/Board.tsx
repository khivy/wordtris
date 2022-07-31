import * as React from "react";
import { Letter } from "./Letter";

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
