import * as React from "react";
import { BoardCell } from "./BoardCell";
import { EMPTY } from "./setup";


export const BoardComponent = React.memo(
    ({ boardCellMatrix }: { boardCellMatrix: BoardCell[][] }) => {
        const boardCells = boardCellMatrix.map((row, r) =>
            row.map((cell, c) => {
                const bg = () => {
                    if (cell.char === EMPTY) {
                        return "none";
                    } else if (cell.hasMatched) {
                        return "lightgreen";
                    } else {
                        return "red";
                    }
                };
                const divStyle = {
                    width: "auto",
                    text: cell.char === EMPTY ? "none" : "red",
                    border: "2px solid",
                    gridRow: r + 1,
                    gridColumn: c + 1,
                    textAlign: "center",
                    background: bg(),
                };

                return <div
                    key={`cell(${r.toString()},${c.toString()})`}
                    style={divStyle}
                >
                    {cell.char}
                </div>
                }
            )
        );

        return <>{boardCells}</>;
    },
);
