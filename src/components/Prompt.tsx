import * as React from "react";
import { ReactNode } from "react";
import { BOARD_CELL_COLOR, SMALL_TEXT_SIZE } from "../setup";

export const Prompt = React.memo(({ children }: { children: ReactNode }) => {

    // To align `<Prompt/>` above the game.
    const promptContainerStyle = {
        flexDirection: "column",
        display: "flex",
    } as const;

    const promptSize = SMALL_TEXT_SIZE;
    const paddingSize = SMALL_TEXT_SIZE;

    const promptStyle = {
        textAlign: "center",
        fontSize: promptSize,
        paddingBottom: paddingSize,
        color: BOARD_CELL_COLOR,
    } as const;

    // This div allows the children to stay centered in `<Prompt/>`'s parent.
    const counterBalanceStyle = {
        height: promptSize,
        paddingBottom: paddingSize,
    } as const;

    return (
        <div style={promptContainerStyle}>
            <span style={promptStyle}>Create words of 3+ letters</span>
            {children}
            <div style={counterBalanceStyle}/>
        </div>
    );
});
