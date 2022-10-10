import * as React from "react";
import { BOARD_CELL_COLOR, NORMAL_TEXT_SIZE, PLAYER_COLOR, SMALL_TEXT_SIZE, UNIVERSAL_BORDER_RADIUS, } from "../setup";

export const WordList = React.memo(
    ({ displayedWords }: { displayedWords: string[] }) => {

        const wordStyle = {
            background: BOARD_CELL_COLOR,
            padding: UNIVERSAL_BORDER_RADIUS,
            margin: UNIVERSAL_BORDER_RADIUS,
            borderRadius: UNIVERSAL_BORDER_RADIUS,
            fontSize: SMALL_TEXT_SIZE,
            fontStyle: "italic",
        } as const;

        const scrollBoxStyle = {
            flex: "auto",
            overflowY: "auto",
            justifyContent: "flex-end",
            height: 0,
        } as const;

        const titleStyle = {
            color: BOARD_CELL_COLOR,
            fontSize: NORMAL_TEXT_SIZE,
        } as const;

        const pointsStyle = {
            color: PLAYER_COLOR,
            fontSize: NORMAL_TEXT_SIZE,
        } as const;

        return <>
            <div className={"with-text-style"} style={titleStyle}>
                MATCHES [
                <span className={"with-text-style"} style={pointsStyle}>
                        {displayedWords.length}
                    </span>
                ]
            </div>
            <div style={scrollBoxStyle}>
                <>
                    {displayedWords.map((word, i) => (
                        // Invert the key to keep scroll bar at bottom if set to bottom.
                        <div
                            key={displayedWords.length - i}
                            className={"with-text-style"}
                            style={wordStyle}
                        >
                            {word}
                        </div>
                    ))}
                </>
            </div>
        </>
    }
);
