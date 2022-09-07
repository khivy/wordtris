import * as React from "react";
import { animated, useSpring } from "react-spring";
import { BoardCell } from "../util/BoardCell";

export const FallingBlock = React.memo( ({ fallingLetters, durationRate }: {fallingLetters: BoardCell[], durationRate: number }) => {
        const fallenLetters =
            fallingLetters.
            map((fallingLetterBeforeAndAfter) => (
                <FallingLetter
                    fallingLetterBeforeAndAfter={fallingLetterBeforeAndAfter}
                    durationRate={durationRate}
                    key={`${fallingLetterBeforeAndAfter[0].r}${fallingLetterBeforeAndAfter[0].c}`}
                />)
            );
        return <>{fallenLetters}</>;
    },
);

const FallingLetter = React.memo( ({ fallingLetterBeforeAndAfter, durationRate }: {fallingLetterBeforeAndAfter: BoardCell[], durationRate: number}) => {
    console.assert(fallingLetterBeforeAndAfter.length == 2);
    const [before, after] = fallingLetterBeforeAndAfter;
    const margin = 100 * Math.abs(after.r - before.r);

    const styles = useSpring({
        from: {
            gridRow: before.r + 1,
            gridColumn: before.c + 1,
            marginTop: '0%',
            marginBottom: '0%',
        },
        to: {
            gridRow: before.r + 1,
            gridColumn: before.c + 1,
            marginTop: `${margin}%`,
            marginBottom: `-${margin}%`,
        },
        reset: true,
        config: {
            duration: durationRate * (after.r - before.r),
        }
    });

    const innerStyle = {
        zIndex: 5,
        height: "88%",
        background: "orange",
        border: 2,
        borderStyle: "solid",
        display: "flex",
        justifyContent: "center",
    } as const;

    return (
        <animated.div style={styles} >
            <div style={innerStyle} >
                {before.char}
            </div>
        </animated.div>
    );
});
