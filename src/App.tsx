import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { boardFromWords, createBoard, BoardStyled } from "./components/Board";
import { CellStyled } from "./components/Cell";

export function App(props) {
  const [board, setBoard] = useState(createBoard);

  function renderBoard() {
    const cells = board.cells.map((row, r) => (
        row.map((col, c) => {
          // Note: Each component in a list should have a key.
          // See https://reactjs.org/docs/lists-and-keys.html#keys
          return renderCell(r.toString() + c.toString());
        })
    ));
    return <BoardStyled key="board">
      {cells}
    </BoardStyled>;
  }

  function renderCell(key: string) {
    return <CellStyled key={key}></CellStyled>
  }

  return renderBoard();
}