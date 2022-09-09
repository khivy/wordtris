import * as React from "react";
import { PLAYER_COLOR, MENU_TEXT_COLOR, BOARD_CELL_COLOR, UNIVERSAL_BORDER_RADIUS, NORMAL_TEXT_SIZE, SMALL_TEXT_SIZE } from "../setup";

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

        const outerStyle = {
            display: "flex",
            flexDirection: "column",
            color: MENU_TEXT_COLOR,
            paddingLeft: UNIVERSAL_BORDER_RADIUS,
            paddingRight: UNIVERSAL_BORDER_RADIUS,
            marginBottom: UNIVERSAL_BORDER_RADIUS,
        } as const;

        const scrollBoxStyle = {
            flex: "auto",
            overflowY: "auto",
            height: "0px",
        } as const;

        const titleStyle = {
            color: BOARD_CELL_COLOR,
            fontSize: NORMAL_TEXT_SIZE,
        } as const;

        const pointsStyle = {
            color: PLAYER_COLOR,
            fontSize: NORMAL_TEXT_SIZE,
        } as const;

        return (
            <div style={outerStyle}>
                <div className={"with-text-style"} style={titleStyle}>MATCHES [
                    <span className={"with-text-style"} style={pointsStyle}>{displayedWords.length}</span>
                ]</div>
                <article style={scrollBoxStyle}>
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
                </article>
            </div>
        );
    },
);
