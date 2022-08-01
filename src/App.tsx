import * as React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Board, boardFromWords, createBoard, ROWS, COLS} from "./components/Board";

export class App extends React.Component {
  board;

  init() {
    this.board = createBoard();
  }

  printBoard() {
    console.log("Board:", this.board);
  }

  renderCells() {
    // this.board.forEach(cell => (
    //
    // ));
    console.log("hi");
    return <div className="App-cell">Hi</div>
  }

  render() {
    return <div className="App">
      <header className="App-header">
        {this.renderCells()}
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

