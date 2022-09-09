import * as React from "react";
import { animated, useSpring } from "react-spring";
import { BoardCell } from "../util/BoardCell";
import { BOARD_CELL_TEXT_COLOR, NORMAL_TEXT_SIZE } from "../setup";

export const FallingBlock = React.memo(
    (
        { fallingLetters, durationRate, color }: {
            fallingLetters: BoardCell[];
            durationRate: number;
            color: string;
        },
    ) => {
        const fallenLetters = fallingLetters
            .map((fallingLetterBeforeAndAfter) => (
                <FallingLetter
                    fallingLetterBeforeAndAfter={fallingLetterBeforeAndAfter}
                    durationRate={durationRate}
                    color={color}
                    key={`${fallingLetterBeforeAndAfter[0].r}${
                        fallingLetterBeforeAndAfter[0].c
                    }`}
                />
            ));
        return <>{fallenLetters}</>;
    },
);

const FallingLetter = React.memo(
    (
        { fallingLetterBeforeAndAfter, durationRate, color }: {
            fallingLetterBeforeAndAfter: BoardCell[];
            durationRate: number;
            color: string;
        },
    ) => {
        console.assert(fallingLetterBeforeAndAfter.length == 2);
        const [before, after] = fallingLetterBeforeAndAfter;
        const margin = 100 * Math.abs(after.r - before.r);

        const styles = useSpring({
            from: {
                gridRow: before.r + 1,
                gridColumn: before.c + 1,
                zIndex: 5,
                marginTop: "0%",
                marginBottom: "0%",
            },
            to: {
                marginTop: `${margin}%`,
                marginBottom: `-${margin}%`,
            },
            reset: true,
            config: {
                duration: durationRate * (after.r - before.r),
            },
        });

        const innerStyle = {
            height: "88%",
            background: color,
            color: BOARD_CELL_TEXT_COLOR,
            fontSize: NORMAL_TEXT_SIZE,
        } as const;

        return (
            <animated.div style={styles}>
                <div
                    style={innerStyle}
                    className={"cell with-margin with-text-style"}
                >
                    {before.char}
                </div>
            </animated.div>
        );
    },
);
