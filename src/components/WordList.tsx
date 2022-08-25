import * as React from "react";

export const WordList = React.memo(
    ({ displayedWords }: { displayedWords: string[] }) => {
        const wordStyle = {
            background: "yellow",
        } as const;

        const outerStyle = {
            display: "flex",
            flexDirection: "column",
        } as const;

        const scrollBoxStyle = {
            flex: "auto",
            overflowY: "auto",
            height: "0px",
        } as const;

        return (
            <div style={outerStyle}>
                Matched Words ({displayedWords.length})
                <article style={scrollBoxStyle}>
                    <>
                        {displayedWords.map((word, i) => (
                            // Invert the key to keep scroll bar at bottom if set to bottom.
                            <div
                                key={displayedWords.length - i}
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
