import * as React from "react";
import { useState } from "react";
import { _ENABLE_UP_KEY, ENABLE_SMOOTH_FALL, interp } from "./setup";

export const PlayerComponent = React.memo(({ isVisible, adjustedCells }) => {
    // This function contains player information.

    const adjustedCellsStyled = adjustedCells.map((cell) => {
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
            visibility: isVisible ? "visible" as const : "hidden" as const,
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
