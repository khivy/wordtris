import * as React from "react";
import { MENU_TEXT_COLOR, UNIVERSAL_BORDER_RADIUS } from "../setup";
import { WordList } from "./WordList";

export const GameSidePanel = React.memo(
    ({ displayedWords }: { displayedWords: string[] }) => {

        const outerStyle = {
            display: "flex",
            flexDirection: "column",
            color: MENU_TEXT_COLOR,
            paddingLeft: UNIVERSAL_BORDER_RADIUS,
            paddingRight: UNIVERSAL_BORDER_RADIUS,
            marginBottom: UNIVERSAL_BORDER_RADIUS,
        } as const;

        return (
            <div style={outerStyle}>
                <WordList displayedWords={displayedWords}/>
            </div>
        );
    },
);