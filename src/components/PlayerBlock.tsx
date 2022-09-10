import * as React from "react";
import {
    _ENABLE_UP_KEY,
    BOARD_CELL_TEXT_COLOR,
    ENABLE_SMOOTH_FALL,
    interp,
    NORMAL_TEXT_SIZE,
    PLAYER_COLOR,
    UNIVERSAL_BORDER_RADIUS,
} from "../setup";
import { UserCell } from "../util/UserCell";

export const PlayerBlock = React.memo(
    (
        { isVisible, adjustedCells }: {
            isVisible: boolean;
            adjustedCells: UserCell[];
        },
    ) => {
        const adjustedCellsStyled = adjustedCells.map((cell) => {
            const divStyle = {
                background: PLAYER_COLOR,
                color: BOARD_CELL_TEXT_COLOR,
                fontSize: NORMAL_TEXT_SIZE,
                gridRow: cell.r + 1,
                gridColumn: cell.c + 1,
                marginTop: ENABLE_SMOOTH_FALL
                    ? `${interp.val}%`
                    : "0.4vmin",
                marginBottom: ENABLE_SMOOTH_FALL
                    ? `${-interp.val}%`
                    : "0.4vmin",
                marginLeft: "0.4vmin",
                marginRight: "0.4vmin",
                visibility: isVisible ? "visible" as const : "hidden" as const,
                zIndex: 1,
            };
            return (
                <div
                    key={cell.uid}
                    className={"cell with-text-style"}
                    style={divStyle}
                >
                    {cell.char}
                </div>
            );
        });

        // Return an array of PlayerCells, adjusted to the 1-indexed CSS Grid.
        return <>{adjustedCellsStyled}</>;
    },
);
