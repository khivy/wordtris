import * as React from "react";
import { _ENABLE_UP_KEY, ENABLE_SMOOTH_FALL, interp } from "./setup";

export const PlayerComponent = React.memo(({ gameState, init }) => {
    // This function contains player information.
    const playerState = React.useState(init); // Note: cells is not adjusted to the board.
    gameState.setPlayerCells = playerState[1];
    const [playerCells, _setPlayerCells] = playerState;
    const adjustedCellsStyled = playerCells.map((cell) => {
        const margin = ENABLE_SMOOTH_FALL ? interp.val : 0;
        const divStyle = {
            background: "lightblue",
            border: 2,
            borderStyle: "solid",
            gridRow: cell.r + 1,
            gridColumn: cell.c + 1,
            display: "flex",
            marginTop: `${margin}%`,
            marginBottom: `${-margin}%`,
            justifyContent: "center",
            zIndex: 1,
        };
        return (
            <div
                key={cell.uid}
                style={divStyle}
            >
                {cell.char}
            </div>
        );
    });

    // Return an array of PlayerCells, adjusted to the 1-indexed CSS Grid.
    return <>{adjustedCellsStyled}</>;
});
