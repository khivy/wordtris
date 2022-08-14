import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { generateRandomChar } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";
import { PlayerPhysics } from './PlayerPhysics'
import { BoardCell } from './BoardCell'
import { UserCell } from './UserCell'
import { ENABLE_SMOOTH_FALL, MIN_WORD_LENGTH, _ENABLE_UP_KEY, validWords, BOARD_COLS, BOARD_ROWS, EMPTY, TBD, interp, interpMax, interpRate, interpKeydownMult } from './setup'

export const UserCellStyled = styled.div`
  background: blue;
  border: 2px solid;
  grid-row: ${(props) => props.r};
  grid-column: ${(props) => props.c};
  display: flex;
  margin-top: ${(props) => props.interp}%;
  margin-bottom: -${(props) => props.interp}%;
  justify-content: center;
  z-index: 1;
`;

export const BoardStyled = styled.div`
  display: grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
`;

// Terminology: https://tetris.fandom.com/wiki/Glossary
const stateMachine = createMachine({
    initial: "spawningBlock",
    states: {
        spawningBlock: { on: { SPAWN: "placingBlock" } },
        placingBlock: { on: { TOUCHINGBLOCK: "lockDelay" } },
        lockDelay: { on: { LOCK: "fallingLetters", UNLOCK: "placingBlock" } },
        fallingLetters: { on: { GROUNDED: "checkingMatches" } },
        checkingMatches: { on: { DONE: "spawningBlock" } },
    },
});

// Handle states.
const service = interpret(stateMachine).onTransition((state) => {
    // TODO
});
service.start();

const PlayerComponent = React.memo(
    function PlayerComponent({ gameState, init }) {
        // This function contains player information.
        const playerState = useState(init); // Note: cells is not adjusted to the board.
        gameState.setPlayerCells = playerState[1];
        const [playerCells, _setPlayerCells] = playerState;
        let adjustedCellsStyled = playerCells.map((cell) => {
            const divStyle = {
                background: "blue",
                border: 2,
                borderStyle: "solid",
                gridRow: cell.r + 1,
                gridColumn: cell.c + 1,
                display: "flex",
                marginTop: ENABLE_SMOOTH_FALL ? interp.val.toString() + "%" : "0%",
                marginBottom: ENABLE_SMOOTH_FALL
                    ? -interp.val.toString() + "%"
                    : "0%",
                justifyContent: "center",
                zIndex: 1,
            };
            return (
                <div
                    key={cell.uid}
                    style={divStyle}
                >
                    {cell.char}
                </div>
            );
        });

        // Return an array of PlayerCells, adjusted to the 1-indexed CSS Grid.
        return <React.Fragment>{adjustedCellsStyled}</React.Fragment>;
    },
);

export class BoardPhysics {
    boardCellMatrix: BoardCell[][];

    constructor(rows: number, cols: number) {
        this.boardCellMatrix = this.createBoard(rows, cols);
    }

    resetBoard(rows, cols) {
        this.boardCellMatrix.forEach((row) =>
            row.forEach((col) => {
                col.char = EMPTY;
            })
        );
    }

    createBoard(rows: number, cols: number): BoardCell[][] {
        // Init cells.
        const cells = [];
        for (let r = 0; r < rows; ++r) {
            let row = [];
            for (let c = 0; c < cols; ++c) {
                row.push({ c: c, r: r, char: EMPTY });
            }
            cells.push(row);
        }
        return cells;
    }

    getGroundHeight(col: number, startRow: number): number {
        // Search for first non-EMPTY board cell from the top.
        for (let row = startRow; row < BOARD_ROWS - 1; ++row) {
            if (this.boardCellMatrix[row + 1][col].char !== EMPTY) {
                return row;
            }
        }
        return BOARD_ROWS - 1;
    }
}

const BoardComponent = React.memo(function BoardComponent({ gameState, init }) {
    const boardState = useState(init);
    gameState.setBoardCells = boardState[1];
    const [board, _setBoard] = boardState;

    const boardCells = board.map((row, r) =>
        row.map((cell, c) => (
            <BoardCellStyled
                key={`cell(${r.toString()},${c.toString()})`}
                r={cell.r + 1}
                c={cell.c + 1}
                char={cell.char}
            >
                {cell.char}
            </BoardCellStyled>
        ))
    );

    return <React.Fragment>{boardCells}</React.Fragment>;
});

let placedCells = new Set();
let boardPhysics = new BoardPhysics(BOARD_ROWS, BOARD_COLS);
let playerPhysics = new PlayerPhysics(boardPhysics.boardCellMatrix);
let lockStart = null;
// The amount of time it takes before a block locks in place.
let lockMax = 1500;

export function GameLoop() {
    const gameState = {
        setPlayerCells: null,
        setBoardCells: null,
    };

    let res = (
        <BoardStyled>
            <PlayerComponent
                key={"Player"}
                gameState={gameState}
                init={playerPhysics.adjustedCells.slice()}
            />
            <BoardComponent
                gameState={gameState}
                key={"Board"}
                init={boardPhysics.boardCellMatrix.slice()}
            />
        </BoardStyled>
    );

    let FPS = 60;
    // Note: with 60 FPS, this is a float (16.666..7). Might run into issues.
    let frameStep = 1000 / FPS;
    let accum = 0;
    let prevTime = performance.now();

    function loop(timestamp) {
        let curTime = performance.now();
        accum += curTime - prevTime;
        prevTime = curTime;

        // Update physics.
        while (accum >= frameStep) {
            accum -= frameStep;
            handleStates();
            const dr = playerPhysics.doGradualFall(
                boardPhysics.boardCellMatrix,
            );
            playerPhysics.setPos(
                playerPhysics.pos[0] + dr,
                playerPhysics.pos[1],
            );

            // Reset if spawn point is blocked.
            if (
                boardPhysics
                    .boardCellMatrix[playerPhysics.spawnPos[0]][
                        playerPhysics.spawnPos[1]
                    ].char !== EMPTY
            ) {
                boardPhysics.resetBoard(BOARD_ROWS, BOARD_COLS);
            }
        }

        // Update rendering.
        if (gameState.setPlayerCells != null) {
            gameState.setPlayerCells(playerPhysics.adjustedCells);
        }
        if (gameState.setBoardCells != null) {
            gameState.setBoardCells(boardPhysics.boardCellMatrix);
        }
        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);

    function isPlayerTouchingGround() {
        return playerPhysics.adjustedCells.some((cell) => {
            return cell.r >= boardPhysics.getGroundHeight(cell.c, cell.r);
        });
    }

    function dropFloatingCells(): number[][] {
        // Returns 2 arrays: 1 array for the coords of the floating cells, 1 array for the new coords of the floating cells.
        let added = [];
        let removed = [];
        for (let r = BOARD_ROWS - 2; r >= 0; --r) {
            for (let c = BOARD_COLS - 1; c > 0; --c) {
                if (
                    boardPhysics.boardCellMatrix[r][c].char !== EMPTY &&
                    boardPhysics.boardCellMatrix[r + 1][c].char === EMPTY
                ) {
                    let g = boardPhysics.getGroundHeight(c, r);
                    boardPhysics.boardCellMatrix[g][c].char =
                        boardPhysics.boardCellMatrix[r][c].char;
                    boardPhysics.boardCellMatrix[r][c].char = EMPTY;
                    // Update cell in placedCells.
                    added.push([g, c]);
                    removed.push([r, c]);
                }
            }
        }
        return [added, removed];
    }

    function findWords(arr: UserCell[], reversed: boolean): number[] {
        // Given the array of a row or column, returns the left and right indices (inclusive) of the longest word.
        let contents = reversed
            ? arr.map((cell) => cell.char === EMPTY ? "-" : cell.char).reverse()
                .join("")
            : arr.map((cell) => cell.char === EMPTY ? "-" : cell.char).join("");
        // Look for words in row
        let resLeft = -1;
        let resRight = -1;
        for (let left = 0; left < contents.length; ++left) {
            for (
                let right = left + MIN_WORD_LENGTH - 1;
                right < contents.length;
                ++right
            ) {
                let cand = contents.slice(left, right + 1);
                if (validWords.has(cand)) {
                    if (right - left > resRight - resLeft) {
                        resRight = right;
                        resLeft = left;
                    }
                }
            }
        }
        return reversed
            ? [
                contents.length - resRight - 1,
                resRight - (resLeft) + (contents.length - resRight - 1),
            ]
            : [resLeft, resRight];
    }

    function handleStates() {
        // console.log(service.state.value)
        if ("spawningBlock" == service.state.value) {
            placedCells.clear();
            service.send("SPAWN");
            console.log("event: spawningBlock ~ SPAWN");
        } else if ("placingBlock" == service.state.value) {
            if (isPlayerTouchingGround()) {
                service.send("TOUCHINGBLOCK");
                lockStart = performance.now();
                console.log("event: placingBlock ~ TOUCHINGBLOCK");
            }
        } else if ("lockDelay" == service.state.value) {
            let lockTime = performance.now() - lockStart;

            // TODO: Instead of running isPlayerTouchingGround(), make it more robust by checking
            // if the previous touched ground height is the same as the current one.
            if (playerPhysics.hasMoved && !isPlayerTouchingGround()) {
                service.send("UNLOCK");
            } else if (lockMax <= lockTime) {
                let newBoard = boardPhysics.boardCellMatrix.slice();
                playerPhysics.adjustedCells.forEach((cell) => {
                    placedCells.add([cell.r, cell.c]);
                    // Give player cells to board.
                    newBoard[cell.r][cell.c].char = cell.char;
                });
                // Allow React to see change with a new object:
                boardPhysics.boardCellMatrix = newBoard;
                interp.val = 0;
                // Allow React to see change with a new object:
                playerPhysics.resetBlock();

                service.send("LOCK");
                console.log("event: lockDelay ~ SEND");
            }
        } else if ("fallingLetters" == service.state.value) {
            // For each floating block, move it 1 + the ground.
            const [added, _removed] = dropFloatingCells();
            added.forEach((coord) => placedCells.add(coord));
            service.send("GROUNDED");
            console.log("event: fallingLetters ~ GROUNDED");
        } else if ("checkingMatches" == service.state.value) {
            // Allocate a newBoard to avoid desync between render and board (React, pls).
            let newBoard = boardPhysics.boardCellMatrix.slice();
            // TODO: Remove repeated checks when placedCells occupy same row or col.
            let hasRemovedWord = false;
            let affectedRows = new Set([...placedCells].map((cell) => cell[0]));
            let affectedCols = new Set([...placedCells].map((cell) => cell[1]));
            affectedRows.forEach((r) => {
                // Row words
                let [row_left, row_right] = findWords(newBoard[r], false);
                const [row_leftR, row_rightR] = findWords(
                    boardPhysics.boardCellMatrix[r],
                    true,
                );
                // Use reversed word if longer.
                if (row_rightR - row_leftR > row_right - row_left) {
                    row_left = row_leftR;
                    row_right = row_rightR;
                }
                // Remove word, but ignore when a candidate isn't found.
                if (row_left !== -1) {
                    console.log(
                        "removing word: ",
                        row_rightR - row_leftR > row_right - row_left
                            ? newBoard[r].slice(row_left, row_right + 1).map((
                                cell,
                            ) => cell.char).reverse().join("")
                            : newBoard[r].slice(row_left, row_right + 1).map((
                                cell,
                            ) => cell.char).reverse().join(""),
                    );
                    for (let i = row_left; i < row_right + 1; ++i) {
                        newBoard[r][i].char = EMPTY;
                    }
                    hasRemovedWord = true;
                }
            });
            affectedCols.forEach((c) => {
                // Column words
                let [col_top, col_bot] = findWords(
                    boardPhysics.boardCellMatrix.map((row) => row[c]),
                    false,
                );
                let [col_topR, col_botR] = findWords(
                    boardPhysics.boardCellMatrix.map((row) => row[c]),
                    true,
                );
                // Use reversed word if longer.
                if (col_botR - col_topR > col_bot - col_top) {
                    col_top = col_topR;
                    col_bot = col_botR;
                }
                // Remove word, but ignore when a candidate isn't found.
                if (col_top !== -1) {
                    console.log(
                        "removing word: ",
                        col_botR - col_topR > col_bot - col_top
                            ? boardPhysics.boardCellMatrix.map((row) => row[c])
                                .slice(col_top, col_bot + 1).map((cell) =>
                                    cell.char
                                ).reverse().join("")
                            : boardPhysics.boardCellMatrix.map((row) => row[c])
                                .slice(col_top, col_bot + 1).map((cell) =>
                                    cell.char
                                ).reverse().join(""),
                    );
                    for (let i = col_top; i < col_bot + 1; ++i) {
                        console.log("rem char", newBoard[i][c].char);
                        newBoard[i][c].char = EMPTY;
                    }
                    hasRemovedWord = true;
                }
            });

            // Allow React to see changes.
            boardPhysics.boardCellMatrix = newBoard;

            // Drop all characters.
            if (hasRemovedWord) {
                const [added, _removed] = dropFloatingCells();
                // Dropped letters can chain into more words, so stay in this state.
                placedCells = new Set(added);
                console.log("event: checkingMatches ~ n/a");
            } else {
                service.send("DONE");
                console.log("event: checkingMatches ~ DONE");
            }
        }
        // TODO: Move this to a playerUpdate function.
        playerPhysics.hasMoved = false;
    }

    return res;
}
