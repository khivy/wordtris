import * as React from "react";

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
            color: "red",
            fontSize: "200%",
        };
        return (
            <div style={divStyle}>
                {countdownSec}
            </div>
        );
    },
);
