import React, { useState, useEffect } from "react";
import styled from 'styled-components';
import "./App.css";
import { boardFromWords, createBoard, BoardStyled, BOARD_ROWS, BOARD_COLS } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

export const UserCellStyled = styled.div`
  background: blue;
  border: 2px solid;
  grid-row: ${props => props.y};
  grid-column: ${props => props.x};
  display: flex;
  margin-top: -50%;
  margin-bottom: 50%;
  z-index: 1;
`;

function usePlayer() {
  // This function contains player information.
  const [pos, setPos] = useState([2,2]);
  const layout = [
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]

  function updatePlayerPos(dx: number, dy: number) {
    setPos([pos[0]+dx, pos[1]+dy]);
  }

  function renderPlayerCell(key: string, x, y) {
    x += pos[0];
    y += pos[1];
    // Center on the pivot.
    x -= Math.floor(layout[0].length / 2);
    y -= Math.floor(layout.length / 2);
    // Note: the `{x,y}+1` is b.c. CSS grids' rows & cols are 1-indexed.
    return <UserCellStyled key={key} x={x+1} y={y+1}></UserCellStyled>
  }

  function renderPlayerBlock() {
    const cellsRendered = [];
    for (let r = 0; r < BOARD_ROWS; ++r) {
      cellsRendered.push([]);
      for (let c = 0; c < BOARD_ROWS; ++c) {
        if (layout[r][c] === 1) {
          cellsRendered[r].push(renderPlayerCell("test", c, r));
        }
      }
    }
    return cellsRendered;
  }

  return {updatePlayerPos, renderPlayerBlock}
}

export function App(props) {
  const [board, setBoard] = useState(createBoard);
  const [userBlock, setUserBlock] = useState(null);

  const {updatePlayerPos, renderPlayerBlock} = usePlayer();

  function renderBoard() {
    const cells = board.cells.map((row, r) => (
        row.map((col, c) => {
          // Note: Each component in a list should have a key.
          // See https://reactjs.org/docs/lists-and-keys.html#keys
          return renderCell("cell(" + r.toString() + ',' + c.toString() + ')', r+1, c+1);
        })
    ));
    return <div tabIndex="0" onKeyDown={() => updatePlayerPos(1,0)}>
      <BoardStyled key="board">
        {cells}
        {renderPlayerBlock()}
      </BoardStyled>
    </div>;
  }

  function renderCell(key: string, x: number, y: number) {
    return <BoardCellStyled key={key} x={x} y={y} />
  }

  return renderBoard();
}