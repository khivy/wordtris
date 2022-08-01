import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import styled from 'styled-components';
import "./App.css";
import { boardFromWords, createBoard, BoardStyled, BOARD_ROWS, BOARD_COLS } from "./components/Board";
import { BoardCellStyled } from "./components/BoardCell";

export const UserCellStyled = styled.div`
  background: blue;
  border: 2px solid;
  grid-row: ${props => props.x};
  grid-column: ${props => props.y};
  display: flex;
  margin-top: -50%;
  margin-bottom: 50%;
  z-index: 1;
`;

function UserBlock(props) {
  // Implementation note: UserBlock overlaps with BoardCell.
  const [pos, setPos] = useState([2,2]);
  const layout = [
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]
  function render(key: string, x, y) {
    return <UserCellStyled key={key} x={x} y={y}></UserCellStyled>
  }

  const cellsRendered = [];
  for (let r = 0; r < BOARD_ROWS; ++r) {
    cellsRendered.push([]);
    for (let c = 0; c < BOARD_ROWS; ++c) {
      if (layout[r][c] === 1) {
        cellsRendered[r].push(render("test", r+1,c+1));
      }
    }
  }
  return cellsRendered;
}

export function App(props) {
  const [board, setBoard] = useState(createBoard);
  const [userBlock, setUserBlock] = useState(null);

  function renderBoard() {
    const cells = board.cells.map((row, r) => (
        row.map((col, c) => {
          // Note: Each component in a list should have a key.
          // See https://reactjs.org/docs/lists-and-keys.html#keys
          return renderCell("cell(" + r.toString() + ',' + c.toString() + ')', r+1, c+1);
        })
    ));
    return <div>
      <BoardStyled key="board">
        {cells}
        <UserBlock />
      </BoardStyled>
    </div>;
  }

  function renderCell(key: string, x: number, y: number) {
    return <BoardCellStyled key={key} x={x} y={y} />
  }

  return renderBoard();
}