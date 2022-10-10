import * as React from "react";
import { useEffect } from "react";

export const Leaderboard = React.memo(
    () => {
        const [leaders, setLeaders] = React.useState([] as const);

        useEffect(() => {
            fetch(
                "http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/leaderboard",
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                },
            )
                .then((response) => response.json())
                .then((data) => setLeaders(data));
        }, []);

        const leaderboardRowStyle = {
            background: "brown"
        } as const;

        const leaderboardRows = leaders.map((leader: {name: string, score: number}, index: number) => {
            return <div key={index} style={leaderboardRowStyle}>
                <span style={{float: "left"}}>
                    {leader.name}
                </span> <span style={{float: "right"}}>
                    {leader.score}
                </span>
                <div style={{ clear: "both" }}/>
            </div>
        });

        return <>{leaderboardRows}</>
    },
);
