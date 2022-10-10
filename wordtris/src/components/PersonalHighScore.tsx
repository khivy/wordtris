import * as React from "react";
import { useEffect } from "react";
import { NORMAL_TEXT_SIZE } from "../setup";

export const PersonalHighScore = React.memo(
    () => {

        const [highScore, setHighScore] = React.useState(0 as const);

        useEffect(() => {
            fetch(
                "http://wordtris-lb-932541632.us-west-1.elb.amazonaws.com/score",
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                },
            )
                .then((response) => response.json())
                .then((data) => {
                    // console.log(data)
                    if (data.length <= 0) {
                        return;
                    }
                    setHighScore(data.score)
                });
        }, []);

        const textStyle = {
            fontSize: NORMAL_TEXT_SIZE,
            textAlign: "center",
        } as const;

        return (
        <div style={textStyle}>
            High score: {highScore}
        </div>
        );
    });
