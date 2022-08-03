import React, { useState, useEffect } from "react";
import styled from 'styled-components';
import "./App.css";
import { createBoard, BoardStyled, BOARD_ROWS } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

export const UserCellStyled = styled.div`
  background: blue;
  border: 2px solid;
  grid-row: ${props => props.y};
  grid-column: ${props => props.x};
  display: flex;
  // margin-top: -50%;
  // margin-bottom: 50%;
  justify-content: center;
  z-index: 1;
`;

class UserCell {
    char: string;
    uid: string;

    constructor (char: string, uid: string) {
        this.char = char;
        this.uid = uid;
    }
}

function usePlayer () {
    // This function contains player information.
    const TBD = '@';
    const EMPTY = '!';
    const [pos, setPos] = useState([2, 2] as [number, number]);
    const [matrix, setMatrix] = useState(generateCharMatrix() as const);

    function updatePlayerPos ({ keyCode, repeat }: { keyCode: number; repeat: boolean }): void {
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
        }
    }

    function generateCharMatrix (): UserCell[][] {
        // Return random starting block matrix with seed.
        // TODO: Make it pseudo-random.
        const res = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        res.forEach((_, r) => res[r] = res[r].map((ch, c) => {
            const uid = 'user(' + r + ',' + c + ')';
            return ch === TBD ?
                new UserCell(String.fromCharCode(Math.random(26) * 10 + 97), uid) : new UserCell(EMPTY, uid);
        }));
        return res;
    }

    function rotateMatrix (matrix: UserCell[][]): UserCell[][] {
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

    function renderPlayerCell (key: string, x: number, y: number, text: string) {
        x += pos[0];
        y += pos[1];
        // Center on the pivot.
        x -= Math.floor(matrix[0].length / 2);
        y -= Math.floor(matrix.length / 2);
        // Note: the `{x,y}+1` is b.c. CSS grids' rows & cols are 1-indexed.
        return <UserCellStyled key={key} x={x + 1} y={y + 1}>{text}</UserCellStyled>
    }

    function renderPlayerBlock () {
        const cellsRendered = [];
        for (let r = 0; r < BOARD_ROWS; ++r) {
            cellsRendered.push([]);
            for (let c = 0; c < BOARD_ROWS; ++c) {
                if (matrix[r][c].char != EMPTY) {
                    cellsRendered[r].push(renderPlayerCell(matrix[r][c].uid, c, r, matrix[r][c].char));
                }
            }
        }
        return cellsRendered;
    }
    return { updatePlayerPos, renderPlayerBlock }
}

export function App (props) {
    const [board, setBoard] = useState(createBoard);

    const { updatePlayerPos, renderPlayerBlock } = usePlayer();

    useEffect(() => {
        window.addEventListener("keydown", updatePlayerPos);
        // Cleanup to prevent flooding.
        return () => {
            window.removeEventListener("keydown", updatePlayerPos);
        };
    });

    function renderBoard () {
        const cells = board.cells.map((row, r) => (
            row.map((col, c) => {
                // Note: Each component in a list should have a key.
                // See https://reactjs.org/docs/lists-and-keys.html#keys
                return renderCell("cell(" + r.toString() + ',' + c.toString() + ')', r + 1, c + 1);
            })
        ));
        return <BoardStyled key="board">
            {cells}
            {renderPlayerBlock()}
        </BoardStyled>
            ;
    }

    function renderCell (key: string, x: number, y: number) {
        return <BoardCellStyled key={key} x={x} y={y}/>
    }

    return renderBoard();
}
