import * as React from "react";
import logo from "./logo.svg";
import "./App.css";
import { boardFromWords, createBoard, BoardStyled } from "./components/Board";
import { CellStyled } from "./components/Cell";

export class App extends React.Component {
  board;

  init() {
    this.board = createBoard();
  }

  printBoard() {
    console.log("Board:", this.board);
  }

  renderBoard() {
    let cells = this.board.cells.map((row, r) => (
      row.map((col, c) => {
          // Note: Each component in a list should have a key.
          // See https://reactjs.org/docs/lists-and-keys.html#keys
          let key = r.toString() + c.toString();
          return this.renderCell(key);
        })
    ));

    return <BoardStyled key="board">
      {cells}
    </BoardStyled>;
  }

  renderCell(key) {
    return <CellStyled key={key}></CellStyled>
  }

  render() {
    return <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <h3>Welcome to React!</h3>
        <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
        >
          Learn React
        </a>
        {boardFromWords(["hello", "world"])}
      </header>
    </div>;
  }
}

