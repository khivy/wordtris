import * as React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import { BoardStyled, createBoard } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

export const UserCellStyled = styled.div`
  background: blue;
  border: 2px solid;
  grid-row: ${(props) => props.y};
  grid-column: ${(props) => props.x};
  display: flex;
  // margin-top: -50%;
  // margin-bottom: 50%;
  justify-content: center;
  z-index: 1;
`;

interface UserCell {
    char: string;
    uid: string;
}

function Player() {
    // This function contains player information.
    const TBD = "@";
    const EMPTY = "!";
    const [pos, setPos] = useState([2, 2] as [number, number]);
    const [matrix, setMatrix] = useState(generateCharMatrix());

    useEffect(() => {
        window.addEventListener("keydown", updatePlayerPos);
        // Cleanup to prevent flooding.
        return () => {
            window.removeEventListener("keydown", updatePlayerPos);
        };
    });

    function updatePlayerPos(
        { keyCode, repeat }: { keyCode: number; repeat: boolean },
    ): void {
        if (keyCode === 37) {
            setPos([pos[0] - 1, pos[1]]);
        } else if (keyCode === 39) {
            setPos([pos[0] + 1, pos[1]]);
        } else if (keyCode === 40) {
            if (repeat) {
                // TODO: Handle repeated downkey.
            }
            setPos([pos[0], pos[1] + 1]);
        } else if (keyCode === 38) {
            setPos([pos[0], pos[1] - 1]);
        } else if (keyCode == 32) {
            // Space bar.
            setMatrix(rotateMatrix(matrix));
            // TODO: Remove this hack to have the block re-render.
            setPos([pos[0], pos[1]]);
        }
    }

    function generateCharMatrix(): UserCell[][] {
        // Return random starting block matrix with seed.
        // TODO: Make it pseudo-random.
        return [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ].map((row, r) =>
            row.map((ch, c) => {
                const uid = `user(${r},${c})`;
                return ch === TBD
                    ? {
                        char: String.fromCharCode(
                            Math.floor(Math.random() * 26) + 97,
                        ),
                        uid,
                    }
                    : { char: EMPTY, uid };
            })
        );
    }

    function rotateMatrix(matrix: UserCell[][]): UserCell[][] {
        // Inplace but returns itself.
        console.assert(matrix.length === matrix[0].length);
        let l = 0;
        let r = matrix.length - 1;

        while (l < r) {
            for (let i = 0; i < r - l; ++i) {
                let bottom = r;
                let top = l;
                let topLeft = matrix[top][l + i];

                matrix[top][l + i] = matrix[bottom - i][l];
                matrix[bottom - i][l] = matrix[bottom][r - i];
                matrix[bottom][r - i] = matrix[top + i][r];
                matrix[top + i][r] = topLeft;
            }
            ++l;
            --r;
        }
        return matrix;
    }

    function PlayerCell(
        { x, y, text }: { x: number; y: number; text: string },
    ) {
        x += pos[0];
        y += pos[1];
        // Center on the pivot.
        x -= Math.floor(matrix[0].length / 2);
        y -= Math.floor(matrix.length / 2);
        // Note: the `{x,y}+1` is b.c. CSS grids' rows & cols are 1-indexed.
        return (
            <UserCellStyled x={x + 1} y={y + 1}>
                {text}
            </UserCellStyled>
        );
    }

    // Return only an array player cells & nulls.
    return matrix.map((row, r) =>
        row.map((cell, c) => {
            return cell.char != EMPTY
                ? (
                    <PlayerCell
                        key={cell.uid}
                        x={c}
                        y={r}
                        text={cell.char}
                    />
                )
                : null;
        })
    );
}

export function App() {
    const [board, _setBoard] = useState(createBoard);

    const cells = board.cells.map((row, r) =>
        row.map((_col, c) => (
            <BoardCellStyled
                key={`cell(${r.toString()},${c.toString()})`}
                x={r + 1}
                y={c + 1}
            />
        ))
    );
    return (
        <BoardStyled key="board">
            {cells}
            <Player />
        </BoardStyled>
    );
}
