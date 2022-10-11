import * as React from "react";
import { useEffect } from "react";
import { NORMAL_TEXT_SIZE } from "../setup";
import { getPlayerScores } from "../util/webUtil";

export const PersonalHighScore = React.memo(
    ({localHighScore}: {localHighScore: number}) => {

        const [remoteHighScore, setRemoteHighScore] = React.useState(0);

        useEffect(() => {
            getPlayerScores()
                .then((response) => response.json())
                .then((data: Array<{score: number}>) => {
                    if (data.length <= 0) {
                        return;
                    }
                    setRemoteHighScore(data.sort().at(-1)!.score);
                });
        }, []);

        const textStyle = {
            fontSize: NORMAL_TEXT_SIZE,
            textAlign: "center",
        } as const;

        return (
        <div style={textStyle}>
            High score: {localHighScore < remoteHighScore ? remoteHighScore : localHighScore}
        </div>
        );
    });
