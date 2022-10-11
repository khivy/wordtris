import * as React from "react";
import { useEffect, useReducer, useState } from "react";
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
import { useInterval } from "./util/useInterval";
import { GameOverOverlay, PlayAgainButton } from "./components/GameOverOverlay";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { FallingBlock } from "./components/FallingBlock";
import {
    _ENABLE_UP_KEY,
    _IS_PRINTING_STATE,
    BOARD_CELL_COLOR,
    BOARD_COLOR,
    BOARD_COLS,
    BOARD_ROWS,
    boardCellFallDurationMillisecondsRate,
    CELL_SIZE,
    countdownTotalSecs,
    EMPTY,
    EMPTY_CELL_COLOR,
    ENABLE_INSTANT_DROP,
    ENABLE_SMOOTH_FALL,
    frameStep,
    groundExitPenaltyRate,
    interp,
    interpKeydownMult,
    interpMax,
    interpRate,
    LARGE_TEXT_SIZE,
    lockMax,
    matchAnimLength,
    MIN_WORD_LENGTH,
    PLAYER_COLOR,
    playerCellFallDurationMillisecondsRate,
    UNIVERSAL_BORDER_RADIUS,
} from "./setup";
import { UserCell } from "./UserCell";
import { Header } from "./components/Header";
import { Prompt } from "./components/Prompt";
import { getLeaders } from "./util/webUtil";
import { GameSidePanel } from "./components/GameSidePanel";
import { PersonalHighScore } from "./components/PersonalHighScore";

// Terminology: https://tetris.fandom.com/wiki/Glossary
// Declaration of game states.
const stateMachine = createMachine({
    initial: "startingGame",
    states: {
        startingGame: { on: { START: "countdown" } },
        countdown: { on: { DONE: "spawningBlock" } },
        spawningBlock: { on: { SPAWN: "placingBlock" } },
        placingBlock: {
            on: {
                TOUCHING_BLOCK: "lockDelay",
                BLOCKED: "gameOver",
                DO_INSTANT_DROP_ANIM: "playerInstantDropAnim",
            },
        },
        playerInstantDropAnim: {
            on: { TOUCHING_BLOCK: "lockDelay" },
        },
        lockDelay: { on: { LOCK: "fallingLetters", UNLOCK: "placingBlock" } },
        fallingLetters: { on: { DO_ANIM: "fallingLettersAnim" } },
        fallingLettersAnim: { on: { GROUNDED: "checkingMatches" } },
        checkingMatches: {
            on: {
                PLAYING_ANIM: "playMatchAnimation",
                SKIP_ANIM: "postMatchAnimation",
            },
        },
        playMatchAnimation: {
            on: {
                CHECK_FOR_CHAIN: "fallingLetters",
                SKIP_ANIM: "postMatchAnimation",
            },
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
    fallingLettersAnimStartMilliseconds: 0,
    fallingLettersAnimDurationMilliseconds: 0,
    playerInstantDropAnimStart: 0,
    playerInstantDropAnimDurationMilliseconds: 0,
};

type PlayerState = {
    pos: [number, number];
    cells: UserCell[];
    adjustedCells: UserCell[];
};

type PlayerAction =
    | { type: "resetPlayer" }
    | { type: "setCells"; newCells: UserCell[]; newAdjustedCells: UserCell[] }
    | { type: "movePlayer"; posUpdate: [number, number] }
    | { type: "groundPlayer"; playerRowPos: number };

export function GameLoop() {
    const [player, dispatchPlayer] = useReducer(
        (state: PlayerState, action: PlayerAction): PlayerState => {
            let newPos;
            switch (action.type) {
                case "resetPlayer": {
                    newPos = [...spawnPos] as const;
                    const initCells = generateUserCells();
                    return {
                        ...state,
                        pos: newPos.slice() as [number, number],
                        cells: initCells,
                        adjustedCells: convertCellsToAdjusted(
                            initCells,
                            newPos,
                        ),
                    };
                }
                case "setCells": {
                    return {
                        ...state,
                        cells: action.newCells,
                        adjustedCells: action.newAdjustedCells,
                    };
                }
                case "movePlayer": {
                    newPos = [
                        state.pos[0] + action.posUpdate[0],
                        state.pos[1] + action.posUpdate[1],
                    ] as [number, number];
                    return {
                        ...state,
                        pos: newPos,
                        adjustedCells: convertCellsToAdjusted(
                            state.cells,
                            newPos,
                        ),
                    };
                }
                case "groundPlayer": {
                    newPos = [action.playerRowPos, state.pos[1]] as [
                        number,
                        number,
                    ];
                    return {
                        ...state,
                        pos: newPos,
                        adjustedCells: convertCellsToAdjusted(
                            state.cells,
                            newPos,
                        ),
                    };
                }
            }
        },
        {
            pos: [...spawnPos],
            cells: [],
            adjustedCells: [],
        },
    );

    const [validWords, setValidWords] = useState(new Set());

    const [leaders, setLeaders] = React.useState([] as Array<{name: string, score: number}>);

    useEffect(() => {
        dispatchPlayer({ type: "resetPlayer" });
        // Fetch validWords during countdown.
        fetch(
            "https://raw.githubusercontent.com/khivy/wordtris/main/wordtris/lexicons/Scrabble80K.txt",
        )
            .then((res) => res.text())
            .then((res) => res.split("\n"))
            .then((data) => setValidWords(new Set(data)));

        fetchLeaders();
        }, []);

    function fetchLeaders() {
        fetch(
            "http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/leaderboard",
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            },
        )
            .then((response) => response.json())
            .then((data) => {
                setLeaders(data)
            });
    }

    const [boardCellMatrix, setBoardCellMatrix] = useState(
        createBoard(BOARD_ROWS, BOARD_COLS),
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
    const [localHighScore, setLocalHighScore] = useState(0);

    const [
        fallingBoardLettersBeforeAndAfter,
        setFallingBoardLettersBeforeAndAfter,
    ] = useState([]);
    const [
        fallingPlayerLettersBeforeAndAfter,
        setFallingPlayerLettersBeforeAndAfter,
    ] = useState([]);

    useEffect(() => {
        globalThis.addEventListener("keydown", handleKeydown);
        return () => {
            globalThis.removeEventListener("keydown", handleKeydown);
        };
    });

    useInterval(() => {
        loop();
    }, 10);

    function rotatePlayerBlock(isClockwise: boolean, board: BoardCell[][]) {
        const rotatedCells = rotateCells(
            player.cells,
            isClockwise,
        );

        let rotatedCellsAdjusted = rotatedCells.map((cell) =>
            getAdjustedUserCell(cell, player.pos)
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
            dispatchPlayer({
                type: "setCells",
                newCells: rotatedCells,
                newAdjustedCells: rotatedCellsAdjusted,
            });
        } else {
            console.assert(player.adjustedCells.length === 2);
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
                getAdjustedUserCell(cell, player.pos)
            );
            // Check for overlaps with shifted cells.
            const isOverlapping = rotatedCellsAdjusted.some((cell) =>
                !isInCBounds(cell.c) ||
                !isInRBounds(cell.r) ||
                board[cell.r][cell.c].char !== EMPTY
            );
            if (!isOverlapping) {
                dispatchPlayer({
                    type: "setCells",
                    newCells: rotatedCells,
                    newAdjustedCells: rotatedCellsAdjusted,
                });
            }
        }
    }

    function handleKeydown(
        { code }: { code: string },
    ): void {
        if (!isPlayerMovementEnabled) {
            return;
        }
        const board = boardCellMatrix;
        const areTargetSpacesEmpty = (
            dr: -1 | 0 | 1 | number,
            dc: -1 | 0 | 1,
        ) => player.adjustedCells.every((cell) => {
            return board[cell.r + dr][cell.c + dc].char === EMPTY;
        });
        if ("ArrowLeft" === code) {
            // Move left.
            if (
                isInCBounds(
                    getAdjustedLeftmostC(player.adjustedCells) - 1,
                ) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    isInRBounds(
                        getAdjustedBottomR(player.adjustedCells) +
                            Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    -1,
                )
            ) {
                dispatchPlayer({ type: "movePlayer", posUpdate: [0, -1] });
            }
        } else if ("ArrowRight" === code) {
            // Move right.
            if (
                isInCBounds(
                    getAdjustedRightmostC(player.adjustedCells) + 1,
                ) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    isInRBounds(
                        getAdjustedBottomR(player.adjustedCells) +
                            Math.ceil(interp.val / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp.val / interpMax : 0),
                    1,
                )
            ) {
                dispatchPlayer({ type: "movePlayer", posUpdate: [0, 1] });
            }
        } else if ("ArrowDown" === code) {
            // Move down faster.
            if (
                getAdjustedBottomR(player.adjustedCells) + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                if (ENABLE_SMOOTH_FALL) {
                    interp.val += interpRate * interpKeydownMult;
                } else {
                    dispatchPlayer({ type: "movePlayer", posUpdate: [1, 0] });
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
                setDidInstantDrop(true);
            } else if (
                _ENABLE_UP_KEY &&
                0 <= getAdjustedTopR(player.adjustedCells) - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                dispatchPlayer({ type: "movePlayer", posUpdate: [-1, 0] });
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
            setMatchedCells(new Set());

            setFallingBoardLettersBeforeAndAfter([]);
            setFallingPlayerLettersBeforeAndAfter([]);

            setGameOverVisibility(false);

            // Temporary fix for lingering hasMatched cells. See Github issue #55.
            setBoardCellMatrix((matrix) =>
                matrix.map((row) => {
                    return row.map((cell) => {
                        cell.hasMatched = false;
                        return cell;
                    });
                })
            );

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
            // Wait while validWords fetches data.
            if (validWords.size === 0) {
                return;
            }
            // Hide countdown.
            setCountdownVisibility(false);

            // Reset player.
            dispatchPlayer({ type: "resetPlayer" });
            setIsPlayerMovementEnabled(true);
            setPlayerVisibility(true);
            setMatchedCells(new Set());

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
                setLocalHighScore(prev => prev < matchedWords.length ? matchedWords.length : prev);
                stateHandler.send("BLOCKED");
            }

            // Handle gradual fall.
            if (isPlayerMovementEnabled) {
                const dr = doGradualFall(
                    boardCellMatrix,
                    player.adjustedCells,
                );
                dispatchPlayer({ type: "movePlayer", posUpdate: [dr, 0] });
            }

            // Check if player is touching ground.
            if (isPlayerTouchingGround(player.adjustedCells, boardCellMatrix)) {
                timestamps.lockStart = performance.now();
                stateHandler.send("TOUCHING_BLOCK");
            }

            if (didInstantDrop) {
                setPlayerVisibility(false);
                const closestPlayerCellToGround = player.adjustedCells.reduce((
                    prev,
                    cur,
                ) => getGroundHeight(prev.c, prev.r, boardCellMatrix) - prev.r <
                        getGroundHeight(cur.c, cur.r, boardCellMatrix) - cur.r
                    ? prev
                    : cur
                );
                const closestGround = getGroundHeight(
                    closestPlayerCellToGround.c,
                    closestPlayerCellToGround.r,
                    boardCellMatrix,
                );
                const minDist = closestGround - closestPlayerCellToGround.r;
                timestamps.playerInstantDropAnimStart = performance.now();
                timestamps.playerInstantDropAnimDurationMilliseconds =
                    playerCellFallDurationMillisecondsRate * minDist;
                setFallingPlayerLettersBeforeAndAfter(
                    player.adjustedCells.map((cell) => [
                        { ...cell },
                        { ...cell, r: closestGround },
                    ]),
                );
                setIsPlayerMovementEnabled(false);
                stateHandler.send("DO_INSTANT_DROP_ANIM");
            }
        } else if ("playerInstantDropAnim" === stateHandler.state.value) {
            if (
                timestamps.playerInstantDropAnimDurationMilliseconds <
                    performance.now() - timestamps.playerInstantDropAnimStart
            ) {
                setPlayerVisibility(true);
                let ground_row = BOARD_ROWS;
                player.adjustedCells.forEach((cell) =>
                    ground_row = Math.min(
                        ground_row,
                        getGroundHeight(cell.c, cell.r, boardCellMatrix),
                    )
                );
                const mid = Math.floor(layout.length / 2);
                // Offset with the lowest cell, centered around layout's midpoint.
                let dy = 0;
                player.cells.forEach((cell) => dy = Math.max(dy, cell.r - mid));
                dispatchPlayer({
                    type: "groundPlayer",
                    playerRowPos: ground_row - dy,
                });
                stateHandler.send("TOUCHING_BLOCK");
            }
        } else if ("lockDelay" === stateHandler.state.value) {
            const lockTime = performance.now() - timestamps.lockStart +
                groundExitPenalty;
            if (
                !isPlayerTouchingGround(player.adjustedCells, boardCellMatrix)
            ) {
                // Player has moved off of ground.
                setGroundExitPenalty((prev) => prev + groundExitPenaltyRate);
                stateHandler.send("UNLOCK");
            } else if (lockMax <= lockTime || didInstantDrop) {
                // Lock in block.
                setFallingPlayerLettersBeforeAndAfter([]);
                const newBoard = boardCellMatrix.slice();
                setPlacedCells((prev) => {
                    player.adjustedCells.forEach((cell) => {
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
            const { boardWithoutFallCells, postFallCells, preFallCells } =
                dropFloatingCells(
                    boardCellMatrix,
                );

            // Update falling letters & animation information.
            const newFallingBoardLettersBeforeAndAfter = preFallCells.map((
                k,
                i,
            ) => [k, postFallCells[i]]);
            // Handle animation duration.
            let animDuration = 0;
            if (postFallCells.length !== 0) {
                const [maxFallBeforeCell, maxFallAfterCell] =
                    newFallingBoardLettersBeforeAndAfter.reduce((prev, cur) =>
                        prev[1].r - prev[0].r > cur[1].r - cur[0].r ? prev : cur
                    );
                animDuration = boardCellFallDurationMillisecondsRate *
                    (maxFallAfterCell.r - maxFallBeforeCell.r);
            }
            setFallingBoardLettersBeforeAndAfter(
                newFallingBoardLettersBeforeAndAfter,
            );
            timestamps.fallingLettersAnimDurationMilliseconds = animDuration;
            timestamps.fallingLettersAnimStartMilliseconds = performance.now();

            setBoardCellMatrix(boardWithoutFallCells);

            setPlacedCells((prev) => {
                postFallCells.forEach((boardCell) =>
                    prev.add([boardCell.r, boardCell.c])
                );
                return prev;
            });

            stateHandler.send("DO_ANIM");
        } else if ("fallingLettersAnim" === stateHandler.state.value) {
            if (
                timestamps.fallingLettersAnimDurationMilliseconds <
                    performance.now() -
                        timestamps.fallingLettersAnimStartMilliseconds
            ) {
                // Drops floating cells again in-case
                const { boardWithoutFallCells, _postFallCells, _preFallCells } =
                    dropFloatingCells(
                        boardCellMatrix,
                    );
                setBoardCellMatrix(boardWithoutFallCells);

                const newBoard = boardCellMatrix.slice();
                fallingBoardLettersBeforeAndAfter.forEach((beforeAndAfter) => {
                    const [before, after] = beforeAndAfter;
                    newBoard[before.r][before.c].char = EMPTY;
                    newBoard[after.r][after.c].char = after.char;
                });
                setFallingBoardLettersBeforeAndAfter([]);
                setBoardCellMatrix(newBoard);
                stateHandler.send("GROUNDED");
            }
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

            setBoardCellMatrix(newBoard);

            if (hasRemovedWord) {
                timestamps.matchAnimStart = performance.now();
            }
            stateHandler.send("PLAYING_ANIM");
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
                setBoardCellMatrix(newBoard);

                setPlacedCells((prev) => {
                    return new Set(prev);
                });

                if (matchedCells.size !== 0) {
                    setMatchedCells(new Set());
                    stateHandler.send("CHECK_FOR_CHAIN");
                }
                stateHandler.send("SKIP_ANIM");
            }
        } else if ("postMatchAnimation" === stateHandler.state.value) {
            // Remove matched characters again.
            const newBoard = boardCellMatrix.slice();
            newBoard.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (matchedCells.has([r, c].toString())) {
                        cell.char = EMPTY;
                        cell.hasMatched = false;
                    }
                });
            });
            setBoardCellMatrix(newBoard);

            setPlacedCells((prev) => {
                prev.clear();
                return prev;
            });
            stateHandler.send("DONE");
        }
    }
    const pageStyle = {
        background: BOARD_COLOR,
        height: "100%",
        width: "100%",
        position: "absolute",
        // Allow `containerStyle` div to grow downwards, filling the page.
        display: "flex",
        flexDirection: "column",
    } as const;

    const containerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        // Prevents `<Header/>` from pushing game downwards.
        position: "absolute",
    } as const;

    const appStyle = {
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        border: `1vmin solid ${EMPTY_CELL_COLOR}`,
        padding: "0.4vmin",
        top: 0,
        borderRadius: UNIVERSAL_BORDER_RADIUS,
    } as const;

    // Style of encompassing board.
    const boardStyle = {
        display: "inline-grid",
        gridTemplateColumns: `repeat(${BOARD_COLS}, ${CELL_SIZE})`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, ${CELL_SIZE})`,
        position: "relative",
        background: BOARD_COLOR,
    } as const;

    const gameOverTextStyle = {
        color: "white",
        fontSize: LARGE_TEXT_SIZE,
        textAlign: "center",
        // WebkitTextStroke: "0.2vmin",
        // WebkitTextStrokeColor: BOARD_CELL_COLOR,
    } as const;

    return (
        <div style={pageStyle}>
            <Header refreshCallback={fetchLeaders} leaders={leaders}/>
            <div style={containerStyle}>
                <Prompt keydownCallback={handleKeydown}>
                    <div style={appStyle}>
                        <div style={boardStyle}>
                            <CountdownOverlay
                                isVisible={isCountdownVisible}
                                countdownSec={countdownSec}
                            />
                            <PlayerBlock
                                isVisible={isPlayerVisible}
                                adjustedCells={player.adjustedCells}
                            />

                            <FallingBlock
                                fallingLetters={fallingPlayerLettersBeforeAndAfter}
                                durationRate={playerCellFallDurationMillisecondsRate}
                                color={PLAYER_COLOR}
                            />

                            <FallingBlock
                                fallingLetters={fallingBoardLettersBeforeAndAfter}
                                durationRate={boardCellFallDurationMillisecondsRate}
                                color={BOARD_CELL_COLOR}
                            />

                            <BoardCells
                                boardCellMatrix={boardCellMatrix}
                            />
                            <GameOverOverlay isVisible={isGameOverVisible}>
                                <div style={gameOverTextStyle}>Game Over</div>
                                <PersonalHighScore localHighScore={localHighScore}/>
                                <PlayAgainButton stateHandler={stateHandler} words={matchedWords}/>
                            </GameOverOverlay>
                        </div>
                        <GameSidePanel displayedWords={matchedWords} />
                    </div>
                </Prompt>
            </div>
        </div>
    );
}
