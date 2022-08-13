import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { generateRandomChar } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";
import * as Words from "a-set-of-english-words";

// Main features:
const ENABLE_SMOOTH_FALL = true;
// Debug features:
const _ENABLE_UP_KEY = true;

const TBD = "@";
export const EMPTY = "";
const BOARD_ROWS = 7;
const BOARD_COLS = 7;

// Interp determines the distance between the player block's current row and the next row.
let interp = 0;
const interpRate = .4;
const interpKeydownMult = 30;
const interpMax = 100;

const validWords = Words;

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

interface UserCell {
    r: number;
    c: number;
    char: string;
    uid: string;
}

class PlayerPhysics {
    cells: UserCell[];
    adjustedCells: UserCell[];
    pos: number[]; // r, c
    spawnPos: number[];
    layout: string[][];
    hasMoved: boolean;

    constructor (board: BoardCell[][]) {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.spawnPos = [1, 3];
        this.resetBlock();
        window.addEventListener(
            "keydown",
            this.updatePlayerPos.bind(this, board),
            false,
        ); // Without bind it loses context.
        this.hasMoved = false;
    }

    setPos (r: number, c: number) {
        this.pos[0] = r;
        this.pos[1] = c;
        // Update adjusted cells, which also allows React to see new updates.
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    rotateCells (cells: UserCell[]): UserCell[] {
        console.assert(this.layout.length == this.layout[0].length);
        console.assert(this.layout.length % 2 == 1);
        let mid = Math.floor(this.layout.length / 2);
        let res = structuredClone(cells);
        res.forEach((cell) => {
            // Center around mid.
            // Remember, top-left is (0,0) and bot-right is (last,last).
            const r = cell.r - mid;
            const c = cell.c - mid;
            if (r !== 0 || c !== 0) {
                cell.r = c + mid;
                cell.c = -r + mid;
            }
        });
        return res;
    }

    getAdjustedLeftmostC () {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? prev.c : cur.c
        );
    }

    getAdjustedRightmostC () {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.c < cur.c ? cur.c : prev.c
        );
    }

    getAdjustedTopR () {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? prev.r : cur.r
        );
    }

    getAdjustedBottomR () {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.r < cur.r ? cur.r : prev.r
        );
    }

    isInRBounds (r: number) {
        return 0 <= r && r < BOARD_ROWS;
    }

    isInCBounds (c: number) {
        return 0 <= c && c < BOARD_COLS;
    }

    // Returns the number of times crossed onto a new row.
    doGradualFall (board: BoardCell[][]): number {
        interp += interpRate;
        if (
            this.adjustedCells.some((cell) =>
                !this.isInRBounds(cell.r + 1) ||
                board[cell.r + 1][cell.c].char !== EMPTY
            )
        ) {
            interp = 0;
        }
        let dr = 0;
        while (interpMax <= interp) {
            dr += 1;
            interp -= interpMax;
            playerPhysics.hasMoved = true;
        }
        return dr;
    }

    // Might be worth it to move this to GameLoop.
    updatePlayerPos (
        board: BoardCell[][],
        { keyCode, repeat }: { keyCode: number; repeat: boolean },
    ): void {
        const r = this.pos[0];
        const c = this.pos[1];
        const areTargetSpacesEmpty = (dr, dc) =>
            this.adjustedCells.every((cell) => {
                return board[cell.r + dr][cell.c + dc].char === EMPTY;
            });
        if (keyCode === 37) {
            // Left
            if (
                this.isInCBounds(this.getAdjustedLeftmostC() - 1) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    this.isInRBounds(
                        this.getAdjustedBottomR() +
                        Math.ceil(interp / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp / interpMax : 0),
                    -1,
                )
            ) {
                this.setPos(r, c - 1);
                this.hasMoved = true;
            }
        } else if (keyCode === 39) {
            // Right
            if (
                this.isInCBounds(this.getAdjustedRightmostC() + 1) &&
                // Ensure blocks don't cross over to ground higher than it, regarding interpolation.
                (!ENABLE_SMOOTH_FALL ||
                    this.isInRBounds(
                        this.getAdjustedBottomR() +
                        Math.ceil(interp / interpMax),
                    )) &&
                areTargetSpacesEmpty(
                    Math.ceil(ENABLE_SMOOTH_FALL ? interp / interpMax : 0),
                    1,
                )
            ) {
                this.setPos(r, c + 1);
                this.hasMoved = true;
            }
        } else if (keyCode === 40) {
            // Down
            if (repeat) {
                // TODO: Handle repeated downkey.
            }
            if (
                this.getAdjustedBottomR() + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                if (ENABLE_SMOOTH_FALL) {
                    interp += interpRate * interpKeydownMult;
                } else {
                    this.setPos(r + 1, c);
                }
            }
        } else if (keyCode === 38) {
            // Up key
            if (
                _ENABLE_UP_KEY && 0 <= this.getAdjustedTopR() - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                this.setPos(r - 1, c);
                this.hasMoved = true;
            }
        } else if (keyCode == 32) {
            // Space bar.
            let rotatedCells = this.rotateCells(this.cells);
            let rotatedCellsAdjusted = rotatedCells.map((cell) =>
                this.getAdjustedUserCell(cell)
            );

            // Get the overlapping cell's respective index in non-adjusted array.
            let overlappingI = 0;
            const overlappingCells = rotatedCellsAdjusted.filter((cell, i) => {
                if (
                    !this.isInCBounds(cell.c) || !this.isInRBounds(cell.r) ||
                    board[cell.r][cell.c].char !== EMPTY
                ) {
                    overlappingI = i;
                    return true;
                }
                return false;
            });
            // If there's no overlap, place it. Otherwise, shift it in the opposite direction of the overlapping cell.
            if (overlappingCells.length <= 0) {
                // If rotation puts a block right underneath a placed block, set interp to 0.
                const isAdjacentToGround = rotatedCellsAdjusted.some((cell) => {
                    return !this.isInRBounds(cell.r + 1) ||
                        board[cell.r + 1][cell.c].char !== EMPTY;
                });
                if (isAdjacentToGround) {
                    interp = 0;
                }
                this.cells = rotatedCells;
                this.adjustedCells = rotatedCellsAdjusted;
                this.hasMoved = true;
            } else {
                // Get direction of overlapping cell.
                let dr = Math.floor(this.layout.length / 2) -
                    rotatedCells[overlappingI].r;
                let dc = Math.floor(this.layout[0].length / 2) -
                    rotatedCells[overlappingI].c;
                // Shift it.
                for (let cell of rotatedCells) {
                    cell.r += dr;
                    cell.c += dc;
                }
                rotatedCellsAdjusted = rotatedCells.map((cell) =>
                    this.getAdjustedUserCell(cell)
                );
                // Check for overlaps with shifted cells.
                const isOverlapping = rotatedCellsAdjusted.some((cell, i) =>
                    !this.isInCBounds(cell.c) || !this.isInRBounds(cell.r) ||
                    board[cell.r][cell.c].char !== EMPTY
                );
                if (!isOverlapping) {
                    this.cells = rotatedCells;
                    this.adjustedCells = rotatedCellsAdjusted;
                    this.hasMoved = true;
                }
            }
        }
    }

    generateUserCells (): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        let res = [];
        this.layout.forEach((row, r) =>
            row.forEach((ch, c) => {
                if (ch === TBD) {
                    res.push({
                        r: r,
                        c: c,
                        char: generateRandomChar(),
                        uid: `user(${r},${c})`,
                    });
                }
            })
        );
        return res;
    }

    resetBlock () {
        this.pos = this.spawnPos.slice();
        this.cells = this.generateUserCells();
        this.setPos(this.pos[0], this.pos[1]);
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    getAdjustedUserCell (cell: UserCell): UserCell {
        return {
            r: cell.r + this.pos[0] - Math.floor(this.layout.length / 2),
            c: cell.c + this.pos[1] - Math.floor(this.layout[0].length / 2),
            uid: cell.uid,
            char: cell.char,
        };
    }
}

const PlayerComponent = React.memo(
    function PlayerComponent ({ gameState, init }) {
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
                marginTop: ENABLE_SMOOTH_FALL ? interp.toString() + "%" : "0%",
                marginBottom: ENABLE_SMOOTH_FALL
                    ? -interp.toString() + "%"
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

interface BoardCell {
    r: number;
    c: number;
    char: string;
}

class BoardPhysics {
    boardCellMatrix: BoardCell[][];

    constructor (rows: number, cols: number) {
        this.boardCellMatrix = this.createBoard(rows, cols);
    }

    resetBoard (rows, cols) {
        this.boardCellMatrix.forEach((row) =>
            row.forEach((col) => {
                col.char = EMPTY;
            })
        );
    }

    createBoard (rows: number, cols: number): BoardCell[][] {
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

    getGroundHeight (col: number, startRow: number): number {
        // Search for first non-EMPTY board cell from the top.
        for (let row = startRow; row < BOARD_ROWS - 1; ++row) {
            if (this.boardCellMatrix[row + 1][col].char !== EMPTY) {
                return row;
            }
        }
        return BOARD_ROWS - 1;
    }
}

const BoardComponent = React.memo(function BoardComponent ({ gameState, init }) {
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

export function GameLoop () {
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

    function loop (timestamp) {
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

    function isPlayerTouchingGround () {
        return playerPhysics.adjustedCells.some((cell) => {
            return cell.r >= boardPhysics.getGroundHeight(cell.c, cell.r);
        });
    }

    function dropFloatingCells (): number[][] {
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
                    boardPhysics.boardCellMatrix[g][c].char = boardPhysics.boardCellMatrix[r][c].char;
                    boardPhysics.boardCellMatrix[r][c].char = EMPTY;
                    // Update cell in placedCells.
                    added.push([g, c])
                    removed.push([r, c])
                }
            }
        }
        return [added, removed]
    }

    function findWords (arr: UserCell[], reversed: boolean): number[] {
        // Given the array of a row or column, returns the left and right indices (inclusive) of the longest word.
        let contents = reversed ? arr.map((cell) => cell.char === EMPTY ? '-' : cell.char).reverse().join('') : arr.map((cell) => cell.char === EMPTY ? '-' : cell.char).join('')
        // Look for words in row
        let minWordLen = 2;
        let resLeft = -1;
        let resRight = -1;
        for (let left = 0; left < contents.length; ++left) {
            for (let right = left + minWordLen - 1; right < contents.length; ++right) {
                let cand = contents.slice(left, right + 1);
                if (validWords.has(cand)) {
                    if (right - left > resRight - resLeft) {
                        resRight = right;
                        resLeft = left;
                    }
                }
            }
        }
        return reversed ? [contents.length - resRight - 1, resRight - (resLeft) + (contents.length - resRight - 1)] : [resLeft, resRight];
    }

    function handleStates () {
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
                    placedCells.add([cell.r, cell.c])
                    // Give player cells to board.
                    newBoard[cell.r][cell.c].char = cell.char;
                });
                // Allow React to see change with a new object:
                boardPhysics.boardCellMatrix = newBoard;
                interp = 0;
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
                const [row_leftR, row_rightR] = findWords(boardPhysics.boardCellMatrix[r], true);
                if (row_rightR - row_leftR > row_right - row_left) {
                    row_left = row_leftR;
                    row_right = row_rightR;
                }
                // Remove word, but ignore when a candidate isn't found.
                if (row_left !== -1) {
                    console.log('removing word: ', row_rightR - row_leftR > row_right - row_left ? newBoard[r].slice(row_left, row_right + 1).map((cell) => cell.char).reverse().join('') : newBoard[r].slice(row_left, row_right + 1).map((cell) => cell.char).reverse().join(''));
                    for (let i = row_left; i < row_right + 1; ++i) {
                        newBoard[r][i].char = EMPTY;
                    }
                    hasRemovedWord = true;
                }
            });
            affectedCols.forEach((c) => {
                // Column words
                let [col_top, col_bot] = findWords(boardPhysics.boardCellMatrix.map((row) => row[c]), false);
                let [col_topR, col_botR] = findWords(boardPhysics.boardCellMatrix.map((row) => row[c]), true);
                if (col_botR - col_topR > col_bot - col_top) {
                    col_top = col_topR;
                    col_bot = col_botR;
                }
                // Remove word, but ignore when a candidate isn't found.
                if (col_top !== -1) {
                    console.log('removing word: ', col_botR - col_topR > col_bot - col_top ? boardPhysics.boardCellMatrix.map((row) => row[c]).slice(col_top, col_bot + 1).map((cell) => cell.char).reverse().join('') : boardPhysics.boardCellMatrix.map((row) => row[c]).slice(col_top, col_bot + 1).map((cell) => cell.char).reverse().join(''));
                    for (let i = col_top; i < col_bot + 1; ++i) {
                        console.log('rem char', newBoard[i][c].char)
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
