import * as React from "react";
import { ReactNode } from "react";
import { BOARD_CELL_COLOR, SMALL_TEXT_SIZE } from "../setup";

export const Prompt = React.memo(({ children }: { children: ReactNode }) => {
    // To align `<Prompt/>` above the game.
    const promptContainerStyle = {
        flexDirection: "column",
        display: "flex",
    } as const;

    const promptSize = 3;
    const paddingSize = 3;

    const promptStyle = {
        textAlign: "center",
        fontSize: `${promptSize}vmin`,
        paddingBottom: `${paddingSize}vmin`,
        color: BOARD_CELL_COLOR,
    } as const;

    return (
        <div style={promptContainerStyle}>
            <span style={promptStyle}>Create words of 3+ letters</span>
            {children}
            <Keys totalSize={promptSize + paddingSize} />
        </div>
    );
});

export const Keys = React.memo(({ totalSize }: { totalSize: number }) => {
    const keyHeight = 4;

    const containerStyle = {
        marginTop: `${totalSize - keyHeight}vmin`,
        display: "flex",
        justifyContent: "center",
        gap: "6vmin",
        fontSize: "2.5vmin",
        whiteSpace: "break-spaces",
        color: BOARD_CELL_COLOR,
    } as const;

    const guideTextStyle = {
        display: "flex",
        alignItems: "center",
    } as const;

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex" }}>
                <Key char={"←"} keyHeight={keyHeight} />
                <Key char={"↓"} keyHeight={keyHeight} />
                <Key char={"→"} keyHeight={keyHeight} />{" "}
                <br/>
                <div style={guideTextStyle}>Move</div>
            </div>
            <div style={{ display: "flex" }}>
                <Key char={"z"} keyHeight={keyHeight} />{" "}
                <br/>
                <div style={guideTextStyle}>Rotate ↺</div>
            </div>
            <div style={{ display: "flex" }}>
                <Key char={"x"} keyHeight={keyHeight} />
                <Key char={"↑"} keyHeight={keyHeight} />{" "}
                <br/>
                <div style={guideTextStyle}>Rotate ↻</div>
            </div>
            <div style={{ display: "flex" }}>
                <Key char={"space"} keyHeight={keyHeight} />{" "}
                <br/>
                <div style={guideTextStyle}>Drop</div>
            </div>
        </div>
    );
});

export const Key = React.memo(
    ({ char, keyHeight }: { char: string; keyHeight: number }) => {
        const keyStyle = {
            display: "block",
            height: `${keyHeight}vmin`,
            width: char === "space" ? "10vmin" : "4vmin",
            background: "white",
            border: `0.4vmin solid ${"grey"}`,
            borderRadius: "0.5vmin",
            fontSize: SMALL_TEXT_SIZE,
        } as const;

        const keyTextStyle = {
            textAlign: "center",
            alignItems: "center",
            alignContent: "center",
            justifyItems: "center",
            justifyContent: "center",
        } as const;

        return (
            <div style={keyStyle}>
                <div style={keyTextStyle}>{char}</div>
            </div>
        );
    },
);
