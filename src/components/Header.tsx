import * as React from "react";
import { BOARD_CELL_COLOR } from "../setup"

export const Header = React.memo(() => {
    const style = {
        zIndex: 20,
    } as const;

    return <div style={style}>
        <Title>Wordtris</Title>
    </div>
});

export const Title = React.memo(({}) => {
    const containerStyle = {
        marginTop: "3vmin",
        marginLeft: "2vmin",
        zIndex: 20,
    } as const;

    const textStyle = {
        fontSize: "30px",
        textTransform: "uppercase",
        fontWeight: "bolder",
        color: BOARD_CELL_COLOR,
        padding: "10px",
        fontFamily: `"Press Start 2P"`,
    } as const;

    return <div style={containerStyle}>
        <span style={textStyle}>Wordtris</span>
    </div>
});
