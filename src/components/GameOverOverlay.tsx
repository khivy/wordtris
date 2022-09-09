import * as React from "react";
import { ReactNode } from "react";
import { PLAYER_COLOR, MENU_TEXT_COLOR, NORMAL_TEXT_SIZE, UNIVERSAL_BORDER_RADIUS } from "../setup";

export const GameOverOverlay = React.memo(
    (
        { children, isVisible }: {
            children: ReactNode[];
            isVisible: boolean;
        },
    ) => {

        const divStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            position: "absolute",
            top: "50%",
            left: "50%",
            whiteSpace: "nowrap",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            color: MENU_TEXT_COLOR,
            fontSize: "200%",
        } as const;
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
    ({ stateHandler }: { stateHandler: { send: (arg0: string) => void } }) => {
        const buttonStyle = {
            cursor: "pointer",
            border: "none",
            background: PLAYER_COLOR,
            color: MENU_TEXT_COLOR,
            borderRadius: UNIVERSAL_BORDER_RADIUS,
            padding: "0.4vmin",
            textAlign: "center",
            marginTop: "0.4vmin",
            fontSize: NORMAL_TEXT_SIZE,
        };
        return (
            <div
                className={"with-text-style"}
                style={buttonStyle}
                onClick={() => {
                    stateHandler.send("RESTART");
                }}
            >
                Play Again
            </div>
        );
    },
);
