import * as React from "react";
import { BoardCellStyled } from "./components/BoardCell";

export const BoardComponent = React.memo(
    function BoardComponent({ gameState, init }) {
        const boardState = React.useState(init);
        gameState.setBoardCells = boardState[1];
        const [board, _setBoard] = boardState;

        const boardCells = board.map((row, r) =>
            row.map((cell, c) => (
                <BoardCellStyled
                    key={`cell(${r.toString()},${c.toString()})`}
                    r={cell.r + 1}
                    c={cell.c + 1}
                    char={cell.char}
                    hasMatched={cell.hasMatched}
                >
                    {cell.char}
                </BoardCellStyled>
            ))
        );

        return <React.Fragment>{boardCells}</React.Fragment>;
    },
);
