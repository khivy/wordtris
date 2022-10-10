import * as React from "react";
import { BOARD_CELL_COLOR } from "../setup";
import { getLeaders } from "../util/webUtil";
import { Leaderboard } from "./Leaderboard";

export const Header = React.memo(() => {

    const outerStyle = {
        display: "flex",
        background: "red",
        // The following options prevent the flex from filling & blocking the page from clicks.
        zIndex: 1,
        maxHeight: "0px",
    } as const;

    const leaderboardTitle = "▼ Toggle Leaderboard";
    return (
        <div style={outerStyle}>
            <div>
                <GameTitle/>
            </div>
            <LeaderboardToggle title={leaderboardTitle}/>
        </div>
    );
});

export const GameTitle = React.memo(() => {
    const containerStyle = {
        marginTop: "3vmin",
        marginLeft: "2vmin",
        zIndex: 20,
    } as const;

    const textStyle = {
        fontSize: "4vmin",
        textTransform: "uppercase",
        fontWeight: "bolder",
        color: BOARD_CELL_COLOR,
        padding: "10px",
        fontFamily: `"Press Start 2P"`,
    } as const;

    return (
        <div style={containerStyle}>
            <a
                href={"https://github.com/khivy/wordtris"}
                style={{ textDecoration: "none" } as const}
            >
                <span style={textStyle}>Wordtris</span>
            </a>
        </div>
    );
});

export const LeaderboardToggle = React.memo(
    ({ title }: {
        title: string,
    }) => {
        const [isVisible, setIsVisible] = React.useState(false);

        const toggleContainerStyle = {
            zIndex: 30,
            height: "100vh",
            marginLeft: "auto",
            background:"red",
            maxHeight: "0px",
        } as const;

        const adjustTogglePositionStyle = {
            marginTop: "3vmin",
            marginRight: "2vmin",
        } as const;

        const staticToggleStyle = {
            zIndex: 20,
            cursor: "pointer",
            color: BOARD_CELL_COLOR,
            fontSize: "3vmin",
            textAlign: "right",
        } as const;

        const toggleStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            border: "none",
        } as const;

        return (

            <div style={toggleContainerStyle}>
                <div style={adjustTogglePositionStyle}>
                    <div>
                        <div style={staticToggleStyle} onClick={() => { setIsVisible(prev => !prev) }} >
                            {title}
                        </div>
                        <div style={toggleStyle}>
                            <Leaderboard/>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);
