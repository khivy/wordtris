import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./index.css";
import { GameLoop } from "./GameLoop";
import { reportWebVitals } from "./reportWebVitals";
import { StrictMode } from "react";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <StrictMode>
        <GameLoop/>,
    </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
