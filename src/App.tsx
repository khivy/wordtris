import * as React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import {
    BOARD_ROWS,
    BoardStyled,
    createBoard,
    EMPTY,
    generateRandomChar,
} from "./components/Board";
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

// Terminology: https://tetris.fandom.com/wiki/Glossary
const stateMachine = createMachine({
    initial: "placingBlock",
    states: {
        placingBlock: { on: { TOUCHINGBLOCK: "lockDelay" } },
        fallingLetters: { on: { GROUNDED: "placingBlock" } },
        lockDelay: { on: { LOCK: "fallingLetters", UNLOCK: "placingBlock" } },
    },
});

// Handle states.
const service = interpret(stateMachine).onTransition((state) => {
    // TODO
});
service.start();

interface UserCell {
    x: number;
    y: number;
    char: string;
    uid: string;
}

function Player() {
    // This function contains player information.
    const TBD = "@";
    const layout = [
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
        [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ];
    const [pos, setPos] = useState([2, 2] as [number, number]);
    const [cells, setCells] = useState(generateUserCells()); // Note: cells is not adjusted to the board.

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
            setCells(rotateCells(cells));
            // This is to prompt React to re-render component b.c. only sees changes in pointers.
            setPos([pos[0], pos[1]]);
        }
    }

    function generateUserCells(): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        let res = [];
        layout.forEach((row, r) =>
            row.forEach((ch, c) => {
                if (ch === TBD) {
                    res.push({
                        x: c,
                        y: r,
                        char: generateRandomChar(),
                        uid: `user(${r},${c})`,
                    });
                }
            })
        );
        return res;
    }

    function rotateCells(cells: UserCell[]): UserCell[] {
        // Inplace but returns itself.
        console.assert(layout.length == layout[0].length);
        console.assert(layout.length % 2 == 1);
        let mid = Math.floor(layout.length / 2);
        cells.forEach((cell) => {
            // Center around mid.
            // Remember, top-left is (0,0) and bot-right is (last,last).
            const x = cell.x - mid; // 2,1 - 2,2, it's 0,-1, hoping to see 1,0
            const y = cell.y - mid; //
            if (x !== 0 || y !== 0) {
                cell.x = -y + mid;
                cell.y = x + mid;
            }
        });
        return cells;
    }

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    function getAdjustedUserCell(cell: UserCell): UserCell {
        return {
            x: cell.x + pos[0] - Math.floor(layout[0].length / 2),
            y: cell.y + pos[1] - Math.floor(layout.length / 2),
            uid: cell.uid,
            char: cell.char,
        };
    }

    const adjustedCells = cells.map((cell) => getAdjustedUserCell(cell));

    const adjustedCellsStyled = adjustedCells.map((cell) => {
        return (
            <UserCellStyled
                key={cell.uid}
                x={cell.x + 1}
                y={cell.y + 1}
            >
                {cell.char}
            </UserCellStyled>
        );
    });

    // Return an array of PlayerCells, adjusted to the 1-indexed CSS Grid.
    return {
        playerCellsStyled: adjustedCellsStyled,
        playerCells: adjustedCells,
    };
}

export function App() {
    const [board, _setBoard] = useState(createBoard);
    const { playerCellsStyled, playerCells } = Player();

    // Create Board of locked or empty cells.
    const boardCells = board.map((row, r) =>
        row.map((cell, c) => (
            <BoardCellStyled
                key={`cell(${r.toString()},${c.toString()})`}
                x={cell.x + 1}
                y={cell.y + 1}
            >
                {cell.char}
            </BoardCellStyled>
        ))
    );

    function getGroundHeight(col: number) {
        // Search for first non-EMPTY board cell from the top.
        for (let row = 0; row < BOARD_ROWS; ++row) {
            if (board[row][col].char !== EMPTY) {
                return row;
            }
        }
        return 0;
    }

    function handleStates() {
        service.send({ type: "TOUCHINGBLOCK" }); // Do placed when cond heldGround
        if (service.state.value == "placingBlock") {
            // TODO: This needs testing.
            const is_touching = playerCells.some((cell) => {
                return cell.y - 1 >= getGroundHeight(cell.x);
            });
            if (is_touching) {
                service.send("TOUCHINGBLOCK");
            }
        }
    }

    return (
        <BoardStyled key="board">
            {boardCells}
            {playerCellsStyled}
        </BoardStyled>
    );
}
