import * as React from "react";
import { ReactNode } from "react";
import { BOARD_CELL_COLOR } from "../setup";
import { useEffect, useState } from "react";

const SMALL_WINDOW_WIDTH_THRESHOLD = 1000;

export const Prompt = React.memo(({ children, keydownCallback }: { children: ReactNode, keydownCallback: ({code}: {code: string}) => void}) => {
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
            <Keys totalSize={promptSize + paddingSize} keydownCallback={keydownCallback} />
        </div>
    );
});

export const Keys = React.memo(({ totalSize, keydownCallback }: { totalSize: number, keydownCallback: ({code}: {code: string}) => void }) => {
    const [isSmallScreen, setIsSmallScreen] = useState(globalThis.innerWidth < SMALL_WINDOW_WIDTH_THRESHOLD);

    function handleResize() {
        setIsSmallScreen(globalThis.innerWidth < SMALL_WINDOW_WIDTH_THRESHOLD);
    }
    useEffect(() => {
        globalThis.addEventListener("resize", handleResize);
        return () => globalThis.removeEventListener("resize", handleResize);
    });

    const keyHeight = 4;

    const containerStyle = {
        marginTop: `${totalSize - keyHeight}vmin`,
        display: "flex",
        justifyContent: "center",
        gap: "3.5vmin",
        fontSize: "2.5vmin",
        whiteSpace: "break-spaces",
        color: BOARD_CELL_COLOR,
    } as const;

    const guideCombinedBlockStyle = {
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        gap: "0.5vmin",
        alignItems: "center",
    } as const;

    const guideKeyBlockStyle = {
        display: "flex",
        gap: "0.2vmin",
    } as const;

    const guideTextStyle = {
        display: "flex",
        alignItems: "center",
    } as const;

    const keyDivWrapper = {
        display: "flex",
    } as const;

    return (
        <div style={containerStyle}>
            <div style={guideCombinedBlockStyle}>
                <div style={guideKeyBlockStyle} >
                    <div style={keyDivWrapper} onClick={() => keydownCallback({code: "ArrowLeft"})}><Key char={"←"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/> </div>
                    <div style={keyDivWrapper} onClick={() => keydownCallback({code: "ArrowDown"})}><Key char={"↓"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/> </div>
                    <div style={keyDivWrapper} onClick={() => keydownCallback({code: "ArrowRight"})}><Key char={"→"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/> </div>
                </div>
                <div style={guideTextStyle}>Move</div>
            </div>
            <div style={guideCombinedBlockStyle}>
                <div style={guideKeyBlockStyle} onClick={() => keydownCallback({code: "KeyZ"})}>
                    <Key char={"z"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/>
                </div>
                <div style={guideTextStyle}>Rotate ↺</div>
            </div>
            <div style={guideCombinedBlockStyle}>
                <div style={guideKeyBlockStyle} onClick={() => keydownCallback({code: "KeyX"})}>
                    <Key char={"x"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/>
                    <Key char={"↑"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/>
                </div>
                <div style={guideTextStyle}>Rotate ↻</div>
            </div>
            <div style={guideCombinedBlockStyle}>
                <div style={guideKeyBlockStyle} onClick={() => keydownCallback({code: "Space"})}>
                    <Key char={"space"} keyHeight={keyHeight} isSmallScreen={isSmallScreen}/>
                </div>
                <div style={guideTextStyle}>Drop</div>
            </div>
        </div>
    );
});

export const Key = React.memo(
    ({ char, keyHeight, isSmallScreen }: { char: string; keyHeight: number, isSmallScreen: boolean }) => {
        const adjustedKeyHeight = isSmallScreen ? keyHeight*2 : keyHeight;
        const adjustedKeyTextHeight = isSmallScreen ? 6 : 3;

        const keyStyle = {
            display: "block",
            height: `${adjustedKeyHeight}vmin`,
            width: char === "space" ? `${adjustedKeyHeight*2.5}vmin` : `${adjustedKeyHeight}vmin`,
            background: "white",
            border: `0.4vmin solid ${"grey"}`,
            borderRadius: "0.5vmin",
            fontSize: `${adjustedKeyTextHeight}vmin`,
            userSelect: "none",
            cursor: "pointer",
        } as const;

        const keyTextStyle = {
            textAlign: "center",
        } as const;

        return (
            <div style={keyStyle} >
                <div style={keyTextStyle}>{char}</div>
            </div>
        );
    },
);
