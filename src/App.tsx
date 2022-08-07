import * as React from "react";
import { useEffect, useState, useCallback } from "react";
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
import { BoardStyled } from "./components/Board";

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

const TBD = "@";

class PlayerPhysics {
    cells: UserCell[];
    adjustedCells: UserCell[];
    pos: number[];
    layout: string[][];

    constructor () {
        this.layout = [
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, TBD, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
        ];
        this.pos = [2, 2];
        this.cells = this.generateUserCells();
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );

        window.addEventListener(
            "keydown",
            this.updatePlayerPos.bind(this),
            false,
        ); // Without bind it loses context.
    }

    setPos (x: number, y: number) {
        this.pos[0] = x;
        this.pos[1] = y;
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    setCells (cells: UserCell[]) {
        this.cells = cells;
        this.adjustedCells = this.cells.map((cell) =>
            this.getAdjustedUserCell(cell)
        );
    }

    rotateCells (cells: UserCell[]): UserCell[] {
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
        return cells;
    }


    updatePlayerPos (
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
            this.setCells(this.rotateCells(this.cells));
            // This is to prompt React to re-render component b.c. only sees changes in pointers.
            // this.setPos(this.pos[0], this.pos[1]);
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

    // Take a UserCell with coordinates based on the matrix, and adjust its height by `pos` and matrix center.
    getAdjustedUserCell (cell: UserCell): UserCell {
        return {
            x: cell.x + this.pos[0] - Math.floor(this.layout[0].length / 2),
            y: cell.y + this.pos[1] - Math.floor(this.layout.length / 2),
            uid: cell.uid,
            char: cell.char,
        };
    }
}

function PlayerComponent ({ gameState }) {
    // This function contains player information.
    const playerState = useState(gameState.playerCells); // Note: cells is not adjusted to the board.
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

function BoardComponent ({ gameState }) {
    const boardState = useState(createBoard());
    gameState.boardCells = boardState;
    const [board, setBoard] = boardState;

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

    function getGroundHeight (col: number) {
        // Search for first non-EMPTY board cell from the top.
        for (let row = 0; row < BOARD_ROWS; ++row) {
            if (board[row][col].char !== EMPTY) {
                return row;
            }
        }
        return 0;
    }

    function handleStates () {
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

    return <BoardStyled key="board">
        {boardCells}
    </BoardStyled>;
}

export function GameLoop () {

    let playerPhysics = new PlayerPhysics();

    // Idea: We init function component state objects using physics state and
    // memoize the physics objects and their respective setter functions (from Components) here.
    const gameState = {
        playerCells: playerPhysics.adjustedCells,
        setPlayerCells: null,
        boardCells: null,
    };

    let res = <BoardStyled>
        <BoardComponent gameState={gameState}/>
        <PlayerComponent gameState={gameState}/>
    </BoardStyled>;

    function loop (timestamp) {
        // Physics

        // Render
        if (gameState.setPlayerCells != null) {
            gameState.setPlayerCells(playerPhysics.adjustedCells); // expensive, run only if change in level or rotation. the continuous dropping is anim only because
        }
        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);

    return res;
}
