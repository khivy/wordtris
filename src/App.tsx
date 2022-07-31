import * as React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Board, boardFromWords } from "./Board";

export function App() {
  return <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
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
