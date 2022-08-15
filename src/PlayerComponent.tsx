import * as React from "react";
import { _ENABLE_UP_KEY, ENABLE_SMOOTH_FALL, interp } from "./setup";

export const PlayerComponent = React.memo(
    function PlayerComponent({ gameState, init }) {
        // This function contains player information.
        const playerState = React.useState(init); // Note: cells is not adjusted to the board.
        gameState.setPlayerCells = playerState[1];
        const playerCells = playerState[0];

        const playerVisibility = React.useState(true); // Note: cells is not adjusted to the board.
        gameState.setPlayerVisible = playerVisibility[1];
        const isPlayerVisible = playerVisibility[0];

        const adjustedCellsStyled = playerCells.map((cell) => {
            const divStyle = {
                background: "lightblue",
                border: 2,
                borderStyle: "solid",
                gridRow: cell.r + 1,
                gridColumn: cell.c + 1,
                display: "flex",
                marginTop: ENABLE_SMOOTH_FALL
                    ? interp.val.toString() + "%"
                    : "0%",
                marginBottom: ENABLE_SMOOTH_FALL
                    ? -interp.val.toString() + "%"
                    : "0%",
                justifyContent: "center",
                visibility: isPlayerVisible ? 'visible' : 'hidden',
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
        return <React.Fragment>{adjustedCellsStyled}</React.Fragment>;
    },
);
