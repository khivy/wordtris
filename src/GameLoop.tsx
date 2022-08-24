import * as React from "react";
import { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { PlayerComponent } from "./PlayerComponent";
import { BoardComponent } from "./BoardComponent";
import {
    spawnPos,
    layout,
    rotateCells,
    convertCellsToAdjusted,
    dropFloatingCells,
    getAdjustedTopR,
    getAdjustedBottomR,
    getAdjustedLeftmostC,
    getAdjustedUserCell,
    generateUserCells,
    getAdjustedRightmostC,
    doGradualFall,
    isInRBounds,
    isInCBounds,
    isPlayerTouchingGround,
} from "./PlayerPhysics";
import { createBoard, getGroundHeight } from "./BoardPhysics";
import { BoardCell } from "./BoardCell";
import { WordList } from "./WordList";
import { useInterval } from "./useInterval";
import { GameOverOverlay, PlayAgainButton } from "./components/GameOverOverlay";
import {
    _ENABLE_UP_KEY,
    BOARD_COLS,
    BOARD_ROWS,
    EMPTY,
    ENABLE_INSTANT_DROP,
    ENABLE_SMOOTH_FALL,
    interp,
    interpKeydownMult,
    interpMax,
    interpRate,
    MIN_WORD_LENGTH,
} from "./setup";

// Unpack words that can be created.
let validWords: Set<string> | undefined;
fetch("lexicons/Google20000.txt")
    .then((response) => response.text())
    .then((data) => {
        // Do something with your data
        validWords = new Set(data.split("\n"));
    });

// Style of encompassing board.
const BoardStyled = styled.div`
  display: inline-grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
  border: solid red 4px;
  position: relative;
`;

// Terminology: https://tetris.fandom.com/wiki/Glossary
// Declaration of game states.
const stateMachine = createMachine({
    initial: "startingGame",
    states: {
        startingGame: { on: { START: "countdown" } },
        countdown: { on: { DONE: "spawningBlock" } },
        spawningBlock: { on: { SPAWN: "placingBlock" } },
        placingBlock: { on: { TOUCHINGBLOCK: "lockDelay", BLOCKED: "gameOver" } },
        lockDelay: { on: { LOCK: "fallingLetters", UNLOCK: "placingBlock" } },
        fallingLetters: { on: { GROUNDED: "checkingMatches" } },
        checkingMatches: { on: { PLAYING_ANIM: "playMatchAnimation" } },
        playMatchAnimation: {
            on: { DO_CHAIN: "checkingMatches", DONE: "spawningBlock" },
        },
        gameOver: { on: { RESTART: "startingGame" } },

    },
    predictableActionArguments: true,
});

// Handle states.
const stateHandler = interpret(stateMachine).onTransition((state) => {
    console.log("   STATE:", state.value);
});
stateHandler.start();

// Various game logic vars.

/* Note: with 60 FPS, this is a float (16.666..7). Might run into issues. */
const framesPerSecLimit = 60;

const frameStep = 1000 / framesPerSecLimit;
let accumFrameTime = 0;
let prevFrameTime = performance.now();

/* Block cell coordinates that were placed/dropped.. */
const placedCells: Set<[number, number]> = new Set();

/* matchedCells stores string coordinates, rather than [number, number],
to allow for `.has()` to find equivalent coordinates. */
const matchedCells: Set<string> = new Set();
let lockStart: number | undefined;

/* The amount of time it takes before a block locks in place. */
const lockMax = 1500;

let matchAnimStart: number | undefined;
const matchAnimLength = 750;
let isMatchChaining = false;
let isPlayerMovementEnabled = false;
let didInstantDrop = false;

let leaveGroundPenalty = 0;
const leaveGroundRate = 250;

// This has trouble being used as React state due to React's asynchronous updates.
let countdownMillisecondsElapsed = 0;
const countdownTotalSecs = 3;

export function GameLoop () {
    const [boardCellMatrix, setBoardCellMatrix] = useState(
        createBoard(BOARD_ROWS, BOARD_COLS)
    );

    const [playerPos, setPlayerPos] = useState(spawnPos.slice() as [number, number]);
    const [playerCells, setPlayerCells] = useState(generateUserCells());
    const [playerAdjustedCells, setPlayerAdjustedCells] = useState(convertCellsToAdjusted(playerCells, playerPos));
    const [playerHasMoved, setPlayerHasMoved] = useState(false);

    const [isPlayerVisible, setPlayerVisibility] = useState(false);

    const [matchedWords, setMatchedWords] = useState([] as string[]);

    const [isCountdownVisible, setCountdownVisibility] = useState(false);
    const [countdownSec, setcountdownSec] = useState(0);
    const [countdownStartTime, setCountdownStartTime] = useState(0);

    const [isGameOverVisible, setGameOverVisibility] = useState(false);

    useEffect(() => {
        globalThis.addEventListener("keydown", updatePlayerPos);
        return () => {
            globalThis.removeEventListener("keydown", updatePlayerPos)
        };
    });

    useInterval(() => {
        loop();
    }, 10);

    function rotatePlayerBlock (isClockwise: boolean, board: BoardCell[][]) {
        const rotatedCells = rotateCells(
            playerCells,
            isClockwise,
        );

        let rotatedCellsAdjusted = rotatedCells.map((cell) =>
            getAdjustedUserCell(cell, playerPos)
        );

        // Get the overlapping cell's respective index in non-adjusted array.
        const overlappingCellIndex = rotatedCellsAdjusted.findIndex((cell) => (
            !isInCBounds(cell.c) ||
            !isInRBounds(cell.r) ||
            board[cell.r][cell.c].char !== EMPTY
        ));
        // If there's no overlap, place it. Otherwise, shift it in the opposite direction of the overlapping cell.
        if (overlappingCellIndex === -1) {
            // If rotation puts a block right underneath a placed block, set interp to 0.
            const isAdjacentToGround = rotatedCellsAdjusted.some((cell) => {
                return !isInRBounds(cell.r + 1) ||
                    board[cell.r + 1][cell.c].char !== EMPTY;
            });
            if (isAdjacentToGround) {
                interp.val = 0;
            }
            setPlayerCells(rotatedCells);
            setPlayerAdjustedCells(rotatedCellsAdjusted);
            setPlayerHasMoved(true);
        } else {
            console.assert(playerAdjustedCells.length === 2);
            // Get direction of overlapping cell.
            const dr = Math.floor(layout.length / 2) -
                rotatedCells[overlappingCellIndex].r;
            const dc = Math.floor(layout[0].length / 2) -
                rotatedCells[overlappingCellIndex].c;
            // Shift it.
            for (const cell of rotatedCells) {
                cell.r += dr;
                cell.c += dc;
            }
            rotatedCellsAdjusted = rotatedCells.map((cell) =>
                getAdjustedUserCell(cell, playerPos)
            );
            // Check for overlaps with shifted cells.
            const isOverlapping = rotatedCellsAdjusted.some((cell) =>
                !isInCBounds(cell.c) ||
                !isInRBounds(cell.r) ||
                board[cell.r][cell.c].char !== EMPTY
            );
            if (!isOverlapping) {
                setPlayerCells(rotatedCells);
                setPlayerAdjustedCells(rotatedCellsAdjusted);
                setPlayerHasMoved(true);
            }
        }
    }

    function updatePlayerPos (
        { code }: { code: string },
    ): void {
        if (!isPlayerMovementEnabled) {
            return;
        }
        const board = boardCellMatrix;
        const r = playerPos[0];
        const c = playerPos[1];
        const areTargetSpacesEmpty = (
            dr: -1 | 0 | 1 | number,
            dc: -1 | 0 | 1,
        ) => playerAdjustedCells.every((cell) => {
            return board[cell.r + dr][cell.c + dc].char === EMPTY;
        });
        if ("ArrowLeft" == code) {
            // Move left.
            if (
                isInCBounds(
                    getAdjustedLeftmostC(playerAdjustedCells) - 1,
                ) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    isInRBounds(
                        getAdjustedBottomR(playerAdjustedCells) +
                        Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    -1,
                )
            ) {
                setPlayerPos([r, c - 1]);
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
                setPlayerHasMoved(true);
            }
        } else if ("ArrowRight" == code) {
            // Move right.
            if (
                isInCBounds(
                    getAdjustedRightmostC(playerAdjustedCells) + 1,
                ) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    isInRBounds(
                        getAdjustedBottomR(playerAdjustedCells) +
                        Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    1,
                )
            ) {
                setPlayerPos([r, c + 1]);
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
                setPlayerHasMoved(true);
            }
        } else if ("ArrowDown" == code) {
            // Move down faster.
            if (
                getAdjustedBottomR(playerAdjustedCells) + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                if (ENABLE_SMOOTH_FALL) {
                    interp.val += interpRate * interpKeydownMult;
                } else {
                    setPlayerPos([r + 1, c]);
                    setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
                }
            }
        } else if ("KeyZ" == code) {
            // Rotate left.
            rotatePlayerBlock(false, board);
        } else if ("ArrowUp" == code || "KeyX" == code) {
            // Rotate right.
            rotatePlayerBlock(true, board);
        } else if ("Space" == code) {
            // Instant drop.
            if (ENABLE_INSTANT_DROP) {
                let ground_row = BOARD_ROWS;
                playerAdjustedCells.forEach((cell) =>
                    ground_row = Math.min(
                        ground_row,
                        getGroundHeight(cell.c, cell.r, boardCellMatrix),
                    )
                );
                const mid = Math.floor(layout.length / 2);
                // Offset with the lowest cell, centered around layout's midpoint.
                let dy = 0;
                playerCells.forEach((cell) =>
                    dy = Math.max(dy, cell.r - mid)
                );
                setPlayerPos([ground_row - dy, playerPos[1]]); // + the lowest on that row if its >center
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
                setPlayerHasMoved(true);
                didInstantDrop = true;
            } else if (
                _ENABLE_UP_KEY && 0 <= getAdjustedTopR(playerAdjustedCells) - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                setPlayerPos([r - 1, c]);
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
                setPlayerHasMoved(true);
            }
        }
    }

    const loop = () => {
        const curTime = performance.now();
        accumFrameTime += curTime - prevFrameTime;
        prevFrameTime = curTime;

        // Update physics.
        while (accumFrameTime >= frameStep) {
            accumFrameTime -= frameStep;
            handleStates();
            if (isPlayerMovementEnabled) {
                const dr = doGradualFall(
                    boardCellMatrix,
                    playerAdjustedCells,
                    playerHasMoved,
                );
                setPlayerPos([
                    playerPos[0] + dr,
                    playerPos[1]
                ]);
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));
            }
            // Reset if spawn point is blocked.
            if ("placingBlock" === stateHandler.state.value &&
                boardCellMatrix[spawnPos[0]][
                    spawnPos[1]
                    ].char !== EMPTY
            ) {
                // Pause player movement.
                setPlayerVisibility(false);
                isPlayerMovementEnabled = false;

                setGameOverVisibility(true);
                stateHandler.send("BLOCKED");
            }
        }
    };

    function findWords (arr: BoardCell[], reversed: boolean): number[] {
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

    function handleStates () {
        if ("startingGame" === stateHandler.state.value) {
            // Takes care of multiple enqueued state changes.
            setBoardCellMatrix(createBoard(BOARD_ROWS, BOARD_COLS));

            // Reset Word List.
            setMatchedWords([]);

            setGameOverVisibility(false);

            setCountdownVisibility(true);
            setCountdownStartTime(performance.now());
            stateHandler.send("START");
        } else if ("countdown" === stateHandler.state.value) {
            countdownMillisecondsElapsed = performance.now() - countdownStartTime;
            const currCountdownSec = countdownTotalSecs - Math.floor(countdownMillisecondsElapsed / 1000);
            if (currCountdownSec !== 0) {
                setcountdownSec(currCountdownSec);
            } else {
                stateHandler.send("DONE");
            }
        } else if ("spawningBlock" === stateHandler.state.value) {
            // Hide countdown.
            setCountdownVisibility(false);

            // Reset player.
            isPlayerMovementEnabled = true;
            setPlayerVisibility(true);

            // Reset penalty.
            leaveGroundPenalty = 0;

            placedCells.clear();
            stateHandler.send("SPAWN");
        } else if ("placingBlock" === stateHandler.state.value) {
            if (isPlayerTouchingGround(playerAdjustedCells, boardCellMatrix)) {
                stateHandler.send("TOUCHINGBLOCK");
                lockStart = performance.now();
            }
        } else if ("lockDelay" === stateHandler.state.value) {
            const lockTime = performance.now() - lockStart + leaveGroundPenalty;

            if (playerHasMoved && !isPlayerTouchingGround(playerAdjustedCells, boardCellMatrix)) {
                // Player has moved off of ground.
                leaveGroundPenalty += leaveGroundRate;
                stateHandler.send("UNLOCK");
            } else if (lockMax <= lockTime || didInstantDrop) {
                const newBoard = boardCellMatrix.slice();
                playerAdjustedCells.forEach((cell) => {
                    placedCells.add([cell.r, cell.c]);
                    // Give player cells to board.
                    newBoard[cell.r][cell.c].char = cell.char;
                });
                // Allow React to see change with a new object:
                setBoardCellMatrix(newBoard);
                interp.val = 0;
                // Allow React to see change with a new object:
                setPlayerPos(spawnPos.slice());
                setPlayerCells(generateUserCells());
                setPlayerAdjustedCells(convertCellsToAdjusted(playerCells, playerPos));

                didInstantDrop = false;

                stateHandler.send("LOCK");
                // Disable player block features.
                isPlayerMovementEnabled = false;
                setPlayerVisibility(false);
            }
        } else if ("fallingLetters" === stateHandler.state.value) {
            // For each floating block, move it 1 + the ground.
            const [newBoardWithDrops, added, _removed] = dropFloatingCells(
                boardCellMatrix,
            );
            setBoardCellMatrix(newBoardWithDrops);
            added.forEach((coord) => placedCells.add(coord));
            stateHandler.send("GROUNDED");
        } else if ("checkingMatches" === stateHandler.state.value) {
            // Allocate a newBoard to avoid desync between render and board (React, pls).
            const newBoard = boardCellMatrix.slice();
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
                const [row_left, row_right] = findWords(newBoard[r], false);
                // Remove word, but ignore when a candidate isn't found.
                if (row_left !== -1) {
                    matchedWords.push(
                        newBoard[r].slice(row_left, row_right + 1).map((cell) =>
                            cell.char
                        ).join(""),
                    );
                    for (let i = row_left; i < row_right + 1; ++i) {
                        matchedCells.add([r, i].toString());
                    }
                    hasRemovedWord = true;
                }
            });
            const newMatchedWords = [] as string[];
            affectedCols.forEach((c) => {
                // Column words
                let [col_top, col_bot] = findWords(
                    boardCellMatrix.map((row) => row[c]),
                    false,
                );
                const [col_topR, col_botR] = findWords(
                    boardCellMatrix.map((row) => row[c]),
                    true,
                );
                // Use reversed word if longer.
                let isColReversed = false;
                if (col_botR - col_topR > col_bot - col_top) {
                    col_top = col_topR;
                    col_bot = col_botR;
                    isColReversed = true;
                }
                // Remove word, but ignore when a candidate isn't found.
                if (col_top !== -1) {
                    newMatchedWords.push(
                        isColReversed
                            ? boardCellMatrix.map((row) => row[c])
                                .slice(col_top, col_bot + 1).map((cell) =>
                                    cell.char
                                ).reverse().join("")
                            : boardCellMatrix.map((row) => row[c])
                                .slice(col_top, col_bot + 1).map((cell) =>
                                    cell.char
                                ).join(""),
                    );
                    for (let i = col_top; i < col_bot + 1; ++i) {
                        matchedCells.add([i, c].toString());
                    }
                    hasRemovedWord = true;
                }
            });

            setMatchedWords(matchedWords => matchedWords.concat(newMatchedWords));

            // Signal characters to remove.
            newBoard.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (matchedCells.has([r, c].toString())) {
                        cell.hasMatched = true;
                    }
                })
            });

            setBoardCellMatrix(newBoard);
            if (hasRemovedWord) {
                isMatchChaining = true;
                matchAnimStart = performance.now();
            }
            stateHandler.send("PLAYING_ANIM");
        } else if ("playMatchAnimation" === stateHandler.state.value) {
            if (isMatchChaining) {
                const animTime = performance.now() - matchAnimStart;
                if (matchAnimLength <= animTime) {
                    // Also remove characters. (hasMatched)
                    let newBoard = boardCellMatrix.slice();
                    newBoard.forEach((row, r) => {
                        row.forEach((cell, c) => {
                            if (matchedCells.has([r, c].toString())) {
                                cell.char = EMPTY;
                                cell.hasMatched = false;
                            }
                        })
                    });

                    // Drop all characters.
                    const [newBoardWithDrops, added, _removed] = dropFloatingCells(newBoard);
                    setBoardCellMatrix(newBoardWithDrops);
                    placedCells.clear();
                    added.forEach((coord) => placedCells.add(coord));

                    // Go back to checkingMatches to see if dropped letters causes more matches.
                    matchedCells.clear();
                    isMatchChaining = false;
                    stateHandler.send("DO_CHAIN");
                }
            } else {
                stateHandler.send("DONE");
            }
        } else if ("gameOver" === stateHandler.state.value) {
            // TODO Add 'play again' button
        }
        setPlayerHasMoved(false);
    }

    const appStyle = {
        display: "flex",
        border: "solid green 4px",
        flexWrap: "wrap",
        flexDirection: "row",
    } as const;

    return (
        <div style={appStyle}>
            <BoardStyled>
                <CountdownOverlay
                    isVisible={isCountdownVisible}
                    countdownSec={countdownSec}
                />
                <PlayerComponent
                    isVisible={isPlayerVisible}
                    adjustedCells={playerAdjustedCells}
                />
                <BoardComponent
                    boardCellMatrix={boardCellMatrix}
                />
                <GameOverOverlay isVisible={isGameOverVisible}>
                    Game Over
                    <PlayAgainButton stateHandler={stateHandler}/>
                </GameOverOverlay>
            </BoardStyled>
            <WordList displayedWords={matchedWords}/>
        </div>
    );
}

export const CountdownOverlay = React.memo(
    (
        { isVisible, countdownSec }: {
            isVisible: boolean;
            countdownSec: number;
        },
    ) => {
        const divStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            color: "red",
            fontSize: "200%",
        } as const;
        return (
            <div style={divStyle}>
                {countdownSec}
            </div>
        );
    },
);
