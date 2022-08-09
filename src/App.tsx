import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import "./App.css";
import { createMachine, interpret } from "xstate";
import { generateRandomChar } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

const TBD = "@";
export const EMPTY = "";
const BOARD_ROWS = 5;
const BOARD_COLS = 5;

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

    constructor() {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.spawnPos = [2,1];
        this.resetBlock();
        window.addEventListener(
            "keydown",
            this.updatePlayerPos.bind(this),
            false,
        ); // Without bind it loses context.
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

    updatePlayerPos(
        { keyCode, repeat }: { keyCode: number; repeat: boolean },
    ): void {
        if (keyCode === 37) {
            this.setPos(this.pos[0] - 1, this.pos[1]);
        } else if (keyCode === 39) {
            // this.setPos(this.pos[0] + 1, this.pos[1]);
            this.setPos(this.pos[0] + 1, this.pos[1]);
        } else if (keyCode === 40) {
            if (repeat) {
                // TODO: Handle repeated downkey.
            }
            this.setPos(this.pos[0], this.pos[1] + 1);
        } else if (keyCode === 38) {
            this.setPos(this.pos[0], this.pos[1] - 1);
        } else if (keyCode == 32) {
            // Space bar.
            this.rotateCells(this.cells);
            this.setPos(this.pos[0], this.pos[1]);
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
}

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

    getGroundHeight(col: number): number {
        // Search for first non-EMPTY board cell from the top.
        for (let row = 0; row < BOARD_ROWS; ++row) {
            if (this.boardCellMatrix[row][col].char !== EMPTY) {
                return row;
            }
        }
        return BOARD_ROWS - 1;
    }
}

function BoardComponent({ gameState, init }) {
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
}

export function GameLoop() {
    let playerPhysics = new PlayerPhysics();
    let boardPhysics = new BoardPhysics(BOARD_ROWS, BOARD_COLS);

    // Idea: We init function component state objects using physics state and
    // memoize the physics objects and their respective setter functions (from Components) here.
    const gameState = {
        setPlayerCells: null,
        setBoardCells: null,
    };

    let res = (
        <BoardStyled>
            <BoardComponent
                gameState={gameState}
                init={boardPhysics.boardCellMatrix}
            />
            <PlayerComponent
                gameState={gameState}
                init={playerPhysics.adjustedCells}
            />
        </BoardStyled>
    );

    function loop(timestamp) {
        // Update physics.
        handleStates();
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

    function handleStates() {
        // console.log(service.state.value)
        if ("placingBlock" == service.state.value) {
            const is_touching = playerPhysics.adjustedCells.some((cell) => {
                return cell.y >= boardPhysics.getGroundHeight(cell.x);

            });
            if (is_touching) {
                service.send("TOUCHINGBLOCK");
                console.log("event: placingBlock ~ TOUCHINGBLOCK")
            }
        }
        else if ("lockDelay" == service.state.value) {
            let cells = playerPhysics.adjustedCells.forEach((userCell) => {
                boardPhysics.boardCellMatrix[userCell.x][userCell.y].char = userCell.char;
            });
            // Allow React to see change with a new object:
            boardPhysics.boardCellMatrix = boardPhysics.boardCellMatrix.slice();
            // Allow React to see change with a new object:
            console.log(playerPhysics.adjustedCells)
            playerPhysics.resetBlock();
            console.log(playerPhysics.adjustedCells)

            service.send("LOCK");
            console.log("event: lockDelay ~ SEND")
        }
    }
    return res;
}
