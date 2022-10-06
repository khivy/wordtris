import * as React from "react";
import { BoardCell } from "../util/BoardCell";
import {
    BOARD_CELL_COLOR,
    BOARD_CELL_TEXT_COLOR,
    EMPTY,
    EMPTY_CELL_COLOR,
    MATCH_COLOR,
    MATCH_TEXT_COLOR,
    NORMAL_TEXT_SIZE,
} from "../setup";

export const BoardCells = React.memo(
    ({ boardCellMatrix }: { boardCellMatrix: BoardCell[][] }) => {
        const boardCells = boardCellMatrix.map((row, r) =>
            row.map((cell, c) => {
                const bg = () => {
                    if (cell.char === EMPTY) {
                        return EMPTY_CELL_COLOR;
                    } else if (cell.hasMatched) {
                        return MATCH_COLOR;
                    } else {
                        return BOARD_CELL_COLOR;
                    }
                };
                const textColor = () => {
                    if (cell.hasMatched) {
                        return MATCH_TEXT_COLOR;
                    } else {
                        return BOARD_CELL_TEXT_COLOR;
                    }
                };
                const divStyle = {
                    gridRow: r + 1,
                    gridColumn: c + 1,
                    background: bg(),
                    color: textColor(),
                    fontSize: NORMAL_TEXT_SIZE,
                } as const;

                return (
                    <div
                        key={`cell(${r.toString()},${c.toString()})`}
                        className={"cell with-margin with-text-style"}
                        style={divStyle}
                    >
                        {cell.char}
                    </div>
                );
            })
        );

        return <>{boardCells}</>;
    },
);
