import * as React from "react";

export const GameOverOverlay = React.memo(
    (
        { children, isVisible }: {
            children: React.Component;
            isVisible: boolean;
        },
    ) => {
        const divStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-25%, -25%)",
            zIndex: 2,
            color: "red",
            fontSize: "200%",
        };
        return (
            <div style={divStyle}>
                <>
                    {children}
                </>
            </div>
        );
    },
);

export const PlayAgainButton = React.memo(
    ({ stateHandler }: { stateHandler: { send: (arg0: string) => any } }) => {
        const buttonStyle = {
            cursor: "pointer",
            border: "none",
            display: "inline-block",
        };
        return (
            <button
                style={buttonStyle}
                onClick={() => {
                    stateHandler.send("RESTART");
                }}
            >
                Play Again
            </button>
        );
    },
);
