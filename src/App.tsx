import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { generateRandomChar } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

const IS_DEBUG = true;

const TBD = "@";
export const EMPTY = "";
const BOARD_ROWS = 7;
const BOARD_COLS = 7;

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

export const BoardStyled = styled.div`
  display: grid;
  grid-template-rows: repeat(${BOARD_ROWS}, 30px);
  grid-template-columns: repeat(${BOARD_COLS}, 30px);
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

class PlayerPhysics {
    cells: UserCell[];
    adjustedCells: UserCell[];
    pos: number[]; // x, y
    spawnPos: number[]; // x, y
    layout: string[][];
    hasMoved: boolean;

    constructor(board: BoardCell[][]) {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.spawnPos = [2, 1];
        this.resetBlock();
        window.addEventListener(
            "keydown",
            this.updatePlayerPos.bind(this, board),
            false,
        ); // Without bind it loses context.
        this.hasMoved = false;
    }

    setPos(x: number, y: number) {
        this.pos[0] = x;
        this.pos[1] = y;
        // Update adjusted cells, which also allows React to see new updates.
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    setCells(cells: UserCell[]) {
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    rotateCells(cells: UserCell[]) {
        // Inplace but returns itself.
        console.assert(this.layout.length == this.layout[0].length);
        console.assert(this.layout.length % 2 == 1);
        let mid = Math.floor(this.layout.length / 2);
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
    }

    getAdjustedLeftmostX() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.x < cur.x ? prev.x : cur.x
        );
    }

    getAdjustedRightmostX() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.x < cur.x ? cur.x : prev.x
        );
    }

    getAdjustedTopY() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.y < cur.y ? prev.y : cur.y
        );
    }

    getAdjustedBottomY() {
        return this.adjustedCells.reduce((prev, cur) =>
            prev.y < cur.y ? cur.y : prev.y
        );
    }

    // Might be worth it to move this to GameLoop.
    updatePlayerPos(
        board: BoardCell[][],
        { keyCode, repeat }: { keyCode: number; repeat: boolean },
    ): void {
        const x = this.pos[0];
        const y = this.pos[1];
        const areTargetSpacesEmpty = (dx, dy) =>
            this.adjustedCells.every((cell) =>
                board[cell.y + dy][cell.x + dx].char == EMPTY
            );
        if (keyCode === 37) {
            if (
                0 <= this.getAdjustedLeftmostX() - 1 &&
                areTargetSpacesEmpty(-1, 0)
            ) {
                this.setPos(x - 1, y);
                this.hasMoved = true;
            }
        } else if (keyCode === 39) {
            if (
                this.getAdjustedRightmostX() + 1 < BOARD_COLS &&
                areTargetSpacesEmpty(1, 0)
            ) {
                this.setPos(x + 1, y);
                this.hasMoved = true;
            }
        } else if (keyCode === 40) {
            // Down
            if (repeat) {
                // TODO: Handle repeated downkey.
            }
            if (
                this.getAdjustedBottomY() + 1 < BOARD_ROWS &&
                areTargetSpacesEmpty(0, 1)
            ) {
                this.setPos(x, y + 1);
                this.hasMoved = true;
            }
        } else if (keyCode === 38) {
            if (
                IS_DEBUG && 0 <= this.getAdjustedTopY() - 1 &&
                areTargetSpacesEmpty(0, -1)
            ) {
                this.setPos(x, y - 1);
                this.hasMoved = true;
            }
        } else if (keyCode == 32) {
            // Space bar.
            this.rotateCells(this.cells);
            this.setPos(x, y);
        }
    }

    generateUserCells(): UserCell[] {
        // Return starting block matrix of UserCells with randomly-assigned characters.
        // TODO: Make it pseudo-random.
        let res = [];
        this.layout.forEach((row, r) =>
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

    resetBlock() {
        this.pos = this.spawnPos.slice();
        this.cells = this.generateUserCells();
        this.setPos(this.pos[0], this.pos[1]);
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    getAdjustedUserCell(cell: UserCell): UserCell {
        return {
            x: cell.x + this.pos[0] - Math.floor(this.layout[0].length / 2),
            y: cell.y + this.pos[1] - Math.floor(this.layout.length / 2),
            uid: cell.uid,
            char: cell.char,
        };
    }
}

const PlayerComponent = React.memo(
    function PlayerComponent({ gameState, init }) {
        // This function contains player information.
        const playerState = useState(init); // Note: cells is not adjusted to the board.
        gameState.setPlayerCells = playerState[1];
        const [playerCells, _setPlayerCells] = playerState;

        let adjustedCellsStyled = playerCells.map((cell) => {
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
        return <React.Fragment>{adjustedCellsStyled}</React.Fragment>;
    },
);

interface BoardCell {
    x: number;
    y: number;
    char: string;
}

class BoardPhysics {
    boardCellMatrix;

    constructor(rows: number, cols: number) {
        this.boardCellMatrix = this.createBoard(rows, cols);
    }

    createBoard(rows: number, cols: number): BoardCell[][] {
        // Init cells.
        const cells = [];
        for (let r = 0; r < rows; ++r) {
            let row = [];
            for (let c = 0; c < cols; ++c) {
                row.push({ x: c, y: r, char: EMPTY });
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
                x={cell.x + 1}
                y={cell.y + 1}
                char={cell.char}
            >
                {cell.char}
            </BoardCellStyled>
        ))
    );

    return <React.Fragment>{boardCells}</React.Fragment>;
});

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
            <BoardComponent
                gameState={gameState}
                key={"Board"}
                init={boardPhysics.boardCellMatrix.slice()}
            />
            <PlayerComponent
                key={"Player"}
                gameState={gameState}
                init={playerPhysics.adjustedCells.slice()}
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
        if (accum >= frameStep) {
            accum -= frameStep;
            handleStates();

            // Reset if spawn point is blocked.
            if (
                boardPhysics
                    .boardCellMatrix[playerPhysics.spawnPos[1]][
                        playerPhysics.spawnPos[0]
                    ].char !== EMPTY
            ) {
                playerPhysics = new PlayerPhysics();
                boardPhysics = new BoardPhysics(BOARD_ROWS, BOARD_COLS);
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
            return cell.y >= boardPhysics.getGroundHeight(cell.x, cell.y);
        });
    }

    function handleStates() {
        // console.log(service.state.value)
        if ("placingBlock" == service.state.value) {
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
                let cells = boardPhysics.boardCellMatrix.slice();
                playerPhysics.adjustedCells.forEach((userCell) => {
                    cells[userCell.y][userCell.x].char = userCell.char;
                });
                // Allow React to see change with a new object:
                boardPhysics.boardCellMatrix = cells;
                // Allow React to see change with a new object:
                playerPhysics.resetBlock();

                service.send("LOCK");
                console.log("event: lockDelay ~ SEND");
            }
        } else if ("fallingLetters" == service.state.value) {
            service.send("GROUNDED");
            console.log("event: fallingLetters ~ GROUNDED");
        }
        // TODO: Move this to a playerUpdate function.
        playerPhysics.hasMoved = false;
    }

    return res;
}
