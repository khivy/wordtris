import * as React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { PlayerBlock } from "./components/PlayerBlock";
import { BoardCells } from "./components/BoardCells";
import {
    convertCellsToAdjusted,
    doGradualFall,
    dropFloatingCells,
    generateUserCells,
    getAdjustedBottomR,
    getAdjustedLeftmostC,
    getAdjustedRightmostC,
    getAdjustedTopR,
    getAdjustedUserCell,
    isInCBounds,
    isInRBounds,
    isPlayerTouchingGround,
    layout,
    rotateCells,
    spawnPos,
} from "./util/playerUtil";
import { createBoard, getGroundHeight } from "./util/boardUtil";
import { BoardCell } from "./util/BoardCell";
import { WordList } from "./components/WordList";
import { useInterval } from "./util/useInterval";
import { GameOverOverlay, PlayAgainButton } from "./components/GameOverOverlay";
import { CountdownOverlay } from "./components/CountdownOverlay";
import {
    _ENABLE_UP_KEY,
    _IS_PRINTING_STATE,
    BOARD_COLS,
    BOARD_ROWS,
    countdownTotalSecs,
    EMPTY,
    ENABLE_INSTANT_DROP,
    ENABLE_SMOOTH_FALL,
    frameStep,
    groundExitPenaltyRate,
    interp,
    interpKeydownMult,
    interpMax,
    interpRate,
    lockMax,
    matchAnimLength,
    MIN_WORD_LENGTH,
} from "./setup";

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
        placingBlock: {
            on: { TOUCHINGBLOCK: "lockDelay", BLOCKED: "gameOver" },
        },
        lockDelay: { on: { LOCK: "fallingLetters", UNLOCK: "placingBlock" } },
        fallingLetters: { on: { GROUNDED: "checkingMatches" } },
        checkingMatches: {
            on: {
                PLAYING_ANIM: "playMatchAnimation",
                SKIP_ANIM: "postMatchAnimation",
            },
        },
        playMatchAnimation: {
            on: { CHECK_FOR_CHAIN: "checkingMatches" },
        },
        postMatchAnimation: {
            on: { DONE: "spawningBlock" },
        },
        gameOver: { on: { RESTART: "startingGame" } },
    },
    predictableActionArguments: true,
});

// Handle states.
const stateHandler = interpret(stateMachine).onTransition((state) => {
    if (_IS_PRINTING_STATE) console.log("   STATE:", state.value);
});
stateHandler.start();

const timestamps = {
    matchAnimStart: 0,
    lockStart: 0,
    countdownStartTime: 0,
    accumFrameTime: 0,
    prevFrameTime: performance.now(),
    countdownMillisecondsElapsed: 0,
};

export function GameLoop() {
    const [validWords, setValidWords] = useState(new Set());

    useEffect(() => {
        // Fetch validWords during countdown.
        fetch(
            "https://raw.githubusercontent.com/khivy/wordtris/main/lexicons/Scrabble80K.txt",
        )
            .then((res) => res.text())
            .then((res) => res.split("\n"))
            .then((data) => setValidWords(new Set(data)));
    }, []);

    const [boardCellMatrix, setBoardCellMatrix] = useState(
        createBoard(BOARD_ROWS, BOARD_COLS),
    );

    // Player state.
    const [playerPos, setPlayerPos] = useState(
        spawnPos.slice() as [number, number],
    );
    const [playerCells, setPlayerCells] = useState(generateUserCells());
    const [playerAdjustedCells, setPlayerAdjustedCells] = useState(
        convertCellsToAdjusted(playerCells, playerPos),
    );
    const [isPlayerVisible, setPlayerVisibility] = useState(false);
    const [isPlayerMovementEnabled, setIsPlayerMovementEnabled] = useState(
        false,
    );

    /* Block cell coordinates that were placed/dropped.. */
    const [placedCells, setPlacedCells] = useState(
        new Set() as Set<[number, number]>,
    );

    // Variables for valid word matches.
    const [matchedWords, setMatchedWords] = useState([] as string[]);
    /* matchedCells stores string coordinates, rather than [number, number],
    to allow for `.has()` to find equivalent coordinates. */
    const [matchedCells, setMatchedCells] = useState(new Set() as Set<string>);

    // Variables for `<CountdownOverlay/>`
    const [isCountdownVisible, setCountdownVisibility] = useState(false);
    const [countdownSec, setcountdownSec] = useState(0);

    // Variable(s) to prevent infinite stalling.
    const [isGameOverVisible, setGameOverVisibility] = useState(false);
    const [groundExitPenalty, setGroundExitPenalty] = useState(0);

    const [didInstantDrop, setDidInstantDrop] = useState(false);

    useEffect(() => {
        globalThis.addEventListener("keydown", updatePlayerPos);
        return () => {
            globalThis.removeEventListener("keydown", updatePlayerPos);
        };
    });

    useInterval(() => {
        loop();
    }, 10);

    function rotatePlayerBlock(isClockwise: boolean, board: BoardCell[][]) {
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
            }
        }
    }

    function updatePlayerPos(
        { code }: { code: string },
    ): void {
        if (!isPlayerMovementEnabled) {
            return;
        }
        const board = boardCellMatrix;
        const areTargetSpacesEmpty = (
            dr: -1 | 0 | 1 | number,
            dc: -1 | 0 | 1,
        ) => playerAdjustedCells.every((cell) => {
            return board[cell.r + dr][cell.c + dc].char === EMPTY;
        });
        if ("ArrowLeft" === code) {
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
                setPlayerPos((prev) => {
                    const pos = [prev[0], prev[1] - 1] as [number, number];
                    setPlayerAdjustedCells(
                        convertCellsToAdjusted(playerCells, pos),
                    );
                    return pos;
                });
            }
        } else if ("ArrowRight" === code) {
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
                setPlayerPos((prev) => {
                    const pos = [prev[0], prev[1] + 1] as [number, number];
                    setPlayerAdjustedCells(
                        convertCellsToAdjusted(playerCells, pos),
                    );
                    return pos;
                });
            }
        } else if ("ArrowDown" === code) {
            // Move down faster.
            if (
                getAdjustedBottomR(playerAdjustedCells) + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                if (ENABLE_SMOOTH_FALL) {
                    interp.val += interpRate * interpKeydownMult;
                } else {
                    setPlayerPos((prev) => {
                        const pos = [prev[0] + 1, prev[1]] as [number, number];
                        setPlayerAdjustedCells(
                            convertCellsToAdjusted(playerCells, pos),
                        );
                        return pos;
                    });
                    // Reset interp.
                    interp.val = 0;
                }
            }
        } else if ("KeyZ" === code) {
            // Rotate left.
            rotatePlayerBlock(false, board);
        } else if ("ArrowUp" === code || "KeyX" === code) {
            // Rotate right.
            rotatePlayerBlock(true, board);
        } else if ("Space" === code) {
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
                playerCells.forEach((cell) => dy = Math.max(dy, cell.r - mid));
                setPlayerPos((prev) => {
                    const pos = [ground_row - dy, prev[1]] as [number, number];
                    setPlayerAdjustedCells(
                        convertCellsToAdjusted(playerCells, pos),
                    );
                    return pos;
                });
                setDidInstantDrop(true);
            } else if (
                _ENABLE_UP_KEY &&
                0 <= getAdjustedTopR(playerAdjustedCells) - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                setPlayerPos((prev) => {
                    const pos = [prev[0] - 1, prev[1]] as [number, number];
                    setPlayerAdjustedCells(
                        convertCellsToAdjusted(playerCells, pos),
                    );
                    return pos;
                });
            }
        }
    }

    const loop = () => {
        const curTime = performance.now();
        timestamps.accumFrameTime += curTime - timestamps.prevFrameTime;
        timestamps.prevFrameTime = curTime;

        // Update physics.
        while (timestamps.accumFrameTime >= frameStep) {
            timestamps.accumFrameTime -= frameStep;
            handleStates();
        }
    };

    function findWords(arr: BoardCell[], reversed: boolean): number[] {
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
        if ("startingGame" === stateHandler.state.value) {
            // Takes care of multiple enqueued state changes.
            setBoardCellMatrix(createBoard(BOARD_ROWS, BOARD_COLS));

            // Reset Word List.
            setMatchedWords([]);

            setGameOverVisibility(false);

            setCountdownVisibility(true);
            timestamps.countdownStartTime = performance.now();
            stateHandler.send("START");
        } else if ("countdown" === stateHandler.state.value) {
            timestamps.countdownMillisecondsElapsed = performance.now() -
                timestamps.countdownStartTime;
            const currCountdownSec = countdownTotalSecs -
                Math.floor(timestamps.countdownMillisecondsElapsed / 1000);
            if (currCountdownSec !== 0) {
                setcountdownSec(currCountdownSec);
            } else {
                stateHandler.send("DONE");
            }
        } else if ("spawningBlock" === stateHandler.state.value) {
            if (validWords.size === 0) {
                return;
            }
            // Hide countdown.
            setCountdownVisibility(false);

            // Reset player.
            // This nested structure prevents desync between the given state variables.
            setPlayerPos(() => {
                const pos = spawnPos.slice() as [number, number];
                setPlayerCells(() => {
                    const cells = generateUserCells();
                    setPlayerAdjustedCells(convertCellsToAdjusted(cells, pos));
                    return cells;
                });
                return pos;
            });
            setIsPlayerMovementEnabled(true);
            setPlayerVisibility(true);

            // Reset penalty.
            setGroundExitPenalty(0);

            // Empty placedCells.
            setPlacedCells((prev) => {
                prev.clear();
                return prev;
            });
            stateHandler.send("SPAWN");
        } else if ("placingBlock" === stateHandler.state.value) {
            // Reset if spawn point is blocked.
            if (boardCellMatrix[spawnPos[0]][spawnPos[1]].char !== EMPTY) {
                // Pause player movement.
                setPlayerVisibility(false);
                setIsPlayerMovementEnabled(false);
                // Signal Game Over.
                setGameOverVisibility(true);
                stateHandler.send("BLOCKED");
            }

            // Handle gradual fall.
            if (isPlayerMovementEnabled) {
                const dr = doGradualFall(
                    boardCellMatrix,
                    playerAdjustedCells,
                );
                setPlayerPos([
                    playerPos[0] + dr,
                    playerPos[1],
                ]);
                setPlayerAdjustedCells(
                    convertCellsToAdjusted(playerCells, playerPos),
                );
            }

            // Check if player is touching ground.
            if (isPlayerTouchingGround(playerAdjustedCells, boardCellMatrix)) {
                timestamps.lockStart = performance.now();
                stateHandler.send("TOUCHINGBLOCK");
            }
        } else if ("lockDelay" === stateHandler.state.value) {
            const lockTime = performance.now() - timestamps.lockStart +
                groundExitPenalty;
            if (!isPlayerTouchingGround(playerAdjustedCells, boardCellMatrix)) {
                // Player has moved off of ground.
                setGroundExitPenalty((prev) => prev + groundExitPenaltyRate);
                stateHandler.send("UNLOCK");
            } else if (lockMax <= lockTime || didInstantDrop) {
                // Lock in block.
                const newBoard = boardCellMatrix.slice();
                setPlacedCells((prev) => {
                    playerAdjustedCells.forEach((cell) => {
                        prev.add([cell.r, cell.c]);
                        // Give player cells to board.
                        newBoard[cell.r][cell.c].char = cell.char;
                    });
                    return prev;
                });
                setBoardCellMatrix(newBoard);
                interp.val = 0;
                setDidInstantDrop(false);

                // Disable player block features.
                setIsPlayerMovementEnabled(false);
                setPlayerVisibility(false);
                stateHandler.send("LOCK");
            }
        } else if ("fallingLetters" === stateHandler.state.value) {
            // For each floating block, move it 1 + the ground.
            const [newBoardWithDrops, added, _removed] = dropFloatingCells(
                boardCellMatrix,
            );
            setBoardCellMatrix(newBoardWithDrops);
            setPlacedCells((prev) => {
                added.forEach((coord) => prev.add(coord));
                return prev;
            });
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
            const newMatchedCells = [] as string[];
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
                        newMatchedCells.push([r, i].toString());
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
                        newMatchedCells.push([i, c].toString());
                    }
                    hasRemovedWord = true;
                }
            });

            setMatchedWords((matchedWords) =>
                matchedWords.concat(newMatchedWords)
            );
            setMatchedCells((prev) => {
                newMatchedCells.forEach((word) => prev.add(word));
                // Signal characters to remove.
                newBoard.forEach((row, r) => {
                    row.forEach((cell, c) => {
                        if (matchedCells.has([r, c].toString())) {
                            cell.hasMatched = true;
                        }
                    });
                });
                return prev;
            });

            timestamps.matchAnimStart = performance.now();
            setBoardCellMatrix(newBoard);

            if (hasRemovedWord) {
                stateHandler.send("PLAYING_ANIM");
            } else {
                stateHandler.send("SKIP_ANIM");
            }
        } else if ("playMatchAnimation" === stateHandler.state.value) {
            const animTime = performance.now() - timestamps.matchAnimStart;
            if (matchAnimLength <= animTime) {
                // Also remove characters. (hasMatched)
                const newBoard = boardCellMatrix.slice();
                newBoard.forEach((row, r) => {
                    row.forEach((cell, c) => {
                        if (matchedCells.has([r, c].toString())) {
                            cell.char = EMPTY;
                            cell.hasMatched = false;
                        }
                    });
                });

                // Drop all characters.
                const [newBoardWithDrops, added, _removed] = dropFloatingCells(
                    newBoard,
                );
                setBoardCellMatrix(newBoardWithDrops);
                setPlacedCells((prev) => {
                    prev.clear();
                    added.forEach((coord) => prev.add(coord));
                    return prev;
                });

                // Go back to checkingMatches to see if dropped letters causes more matches.
                setMatchedCells((prev) => {
                    prev.clear();
                    return prev;
                });
                stateHandler.send("CHECK_FOR_CHAIN");
            }
        } else if ("postMatchAnimation" === stateHandler.state.value) {
            setPlacedCells((prev) => {
                prev.clear();
                return prev;
            });
            stateHandler.send("DONE");
        }
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

                <PlayerBlock
                    isVisible={isPlayerVisible}
                    adjustedCells={playerAdjustedCells}
                />
                <BoardCells
                    boardCellMatrix={boardCellMatrix}
                />
                <GameOverOverlay isVisible={isGameOverVisible}>
                    Game Over
                    <PlayAgainButton stateHandler={stateHandler} />
                </GameOverOverlay>
            </BoardStyled>
            <WordList displayedWords={matchedWords} />
        </div>
    );
}
