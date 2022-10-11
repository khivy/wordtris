import * as React from "react";
import { useEffect } from "react";
import {
    BOARD_CELL_COLOR, LEADERBOARD_ROW_COLOR_1, LEADERBOARD_ROW_COLOR_2, SMALL_TEXT_SIZE,
    UNIVERSAL_BORDER_RADIUS
} from "../setup";

export const Leaderboard = React.memo(
    ({leaders}: {leaders: Array<{name: string, score: number}>}) => {

        const leaderboardRowStyle = {
            borderRadius: UNIVERSAL_BORDER_RADIUS,
            color: BOARD_CELL_COLOR,
            fontSize: SMALL_TEXT_SIZE,
        } as const;

        const leaderboardRows = leaders.map((leader: {name: string, score: number}, index: number) => {
            return (
                <div key={index} style={{...leaderboardRowStyle, background: index % 2 == 0 ? LEADERBOARD_ROW_COLOR_1 : LEADERBOARD_ROW_COLOR_2}}>
                    <span style={{float: "left"}}>
                        &nbsp;{index}. {leader.name}
                    </span> <span style={{float: "right"}}>
                        {leader.score}&nbsp;
                    </span>
                    <div style={{ clear: "both" }}/>
                </div>
            );
        });

        const containerStyle = {
            flex: "auto",
            overflowY: "auto",
            height: "90vh",
        } as const;

        return (
            <div style={containerStyle}>
                <>{leaderboardRows}</>
            </div>
    );
    },
);
