import * as React from "react";
import { LARGE_TEXT_SIZE, BOARD_CELL_COLOR, MENU_TEXT_COLOR } from "../setup";

export const CountdownOverlay = React.memo(
    (
        { isVisible, countdownSec }: {
            isVisible: boolean;
            countdownSec: number;
        },
    ) => {
        const divStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            color: MENU_TEXT_COLOR,
            fontSize: LARGE_TEXT_SIZE,
            WebkitTextStroke: "0.2vmin",
            WebkitTextStrokeColor: BOARD_CELL_COLOR,
        } as const;
        return (
            <div style={divStyle}>
                {countdownSec}
            </div>
        );
    },
);
