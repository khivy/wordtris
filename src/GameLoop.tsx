import * as React from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { PlayerComponent } from "./PlayerComponent";
import { BoardComponent } from "./BoardComponent";
import { PlayerPhysics } from "./PlayerPhysics";
import { BoardPhysics } from "./BoardPhysics";
import { UserCell } from "./UserCell";
import {
    _ENABLE_UP_KEY,
    BOARD_COLS,
    BOARD_ROWS,
    EMPTY,
    ENABLE_SMOOTH_FALL,
    interp,
    interpKeydownMult,
    interpMax,
    interpRate,
    MIN_WORD_LENGTH,
    TBD,
} from "./setup";

let validWords = null;
fetch('lexicons/Oxford5000.txt')
    .then(response => response.text())
    .then(data => {
        // Do something with your data
        validWords = new Set(data.split('\n'));
    });

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
    predictableActionArguments: true,
});

// Handle states.
const stateHandler = interpret(stateMachine).onTransition((state) => {
    // TODO
});
stateHandler.start();

let placedCells = new Set();
const boardPhysics = new BoardPhysics(BOARD_ROWS, BOARD_COLS);
const playerPhysics = new PlayerPhysics(boardPhysics.boardCellMatrix);
let lockStart = null;
// The amount of time it takes before a block locks in place.
const lockMax = 1500;

export function GameLoop() {
    const gameState = {
        setPlayerCells: null,
        setBoardCells: null,
    };

    const res = (
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

    const FPS = 60;
    // Note: with 60 FPS, this is a float (16.666..7). Might run into issues.
    const frameStep = 1000 / FPS;
    let accum = 0;
    let prevTime = performance.now();

    function loop(timestamp) {
        const curTime = performance.now();
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
        globalThis.requestAnimationFrame(loop);
    }

    globalThis.requestAnimationFrame(loop);

    function isPlayerTouchingGround() {
        return playerPhysics.adjustedCells.some((cell) => {
            return cell.r >= boardPhysics.getGroundHeight(cell.c, cell.r);
        });
    }

    function dropFloatingCells(): number[][] {
        // Returns 2 arrays: 1 array for the coords of the floating cells, 1 array for the new coords of the floating cells.
        const added = [];
        const removed = [];
        for (let r = BOARD_ROWS - 2; r >= 0; --r) {
            for (let c = BOARD_COLS - 1; c >= 0; --c) {
                if (
                    boardPhysics.boardCellMatrix[r][c].char !== EMPTY &&
                    boardPhysics.boardCellMatrix[r + 1][c].char === EMPTY
                ) {
                    const g = boardPhysics.getGroundHeight(c, r);
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
        const contents = reversed
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
                const cand = contents.slice(left, right + 1);
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
        // console.log(stateHandler.state.value)
        if ("spawningBlock" == stateHandler.state.value) {
            placedCells.clear();
            stateHandler.send("SPAWN");
            console.log("event: spawningBlock ~ SPAWN");
        } else if ("placingBlock" == stateHandler.state.value) {
            if (isPlayerTouchingGround()) {
                stateHandler.send("TOUCHINGBLOCK");
                lockStart = performance.now();
                console.log("event: placingBlock ~ TOUCHINGBLOCK");
            }
        } else if ("lockDelay" == stateHandler.state.value) {
            const lockTime = performance.now() - lockStart;

            // TODO: Instead of running isPlayerTouchingGround(), make it more robust by checking
            // if the previous touched ground height is the same as the current one.
            if (playerPhysics.hasMoved && !isPlayerTouchingGround()) {
                stateHandler.send("UNLOCK");
            } else if (lockMax <= lockTime) {
                const newBoard = boardPhysics.boardCellMatrix.slice();
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

                stateHandler.send("LOCK");
                console.log("event: lockDelay ~ SEND");
            }
        } else if ("fallingLetters" == stateHandler.state.value) {
            // For each floating block, move it 1 + the ground.
            const [added, _removed] = dropFloatingCells();
            added.forEach((coord) => placedCells.add(coord));
            stateHandler.send("GROUNDED");
            console.log("event: fallingLetters ~ GROUNDED");
        } else if ("checkingMatches" == stateHandler.state.value) {
            // Allocate a newBoard to avoid desync between render and board (React, pls).
            const newBoard = boardPhysics.boardCellMatrix.slice();
            // TODO: Remove repeated checks when placedCells occupy same row or col.
            let hasRemovedWord = false;
            const affectedRows = new Set(
                [...placedCells].map((cell) => cell[0]),
            );
            const affectedCols = new Set(
                [...placedCells].map((cell) => cell[1]),
            );
            affectedRows.forEach((r) => {
                // Row words
                let [row_left, row_right] = findWords(newBoard[r], false);
                // const [row_leftR, row_rightR] = findWords(
                //     boardPhysics.boardCellMatrix[r],
                //     true,
                // );
                // // Use reversed word if longer.
                // if (row_rightR - row_leftR > row_right - row_left) {
                //     row_left = row_leftR;
                //     row_right = row_rightR;
                // }
                // Remove word, but ignore when a candidate isn't found.
                if (row_left !== -1) {
                    // console.log(
                    //     "removing word: ",
                    //     row_rightR - row_leftR > row_right - row_left
                    //         ? newBoard[r].slice(row_left, row_right + 1).map((
                    //             cell,
                    //         ) => cell.char).reverse().join("")
                    //         : newBoard[r].slice(row_left, row_right + 1).map((
                    //             cell,
                    //         ) => cell.char).reverse().join(""),
                    // );
                    console.log(newBoard[r].slice(row_left, row_right + 1).map(( cell) => cell.char).join(""));
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
                const [col_topR, col_botR] = findWords(
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
                stateHandler.send("DONE");
                console.log("event: checkingMatches ~ DONE");
            }
        }
        // TODO: Move this to a playerUpdate function.
        playerPhysics.hasMoved = false;
    }

    return res;
}
