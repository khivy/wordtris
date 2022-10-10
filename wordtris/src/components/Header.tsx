import * as React from "react";
import { BOARD_CELL_COLOR } from "../setup";
import { ReactNode } from "react";

export const Header = React.memo(() => {
    const outerStyle = {
        zIndex: 20,
        display: "flex",
    } as const;

    const toggleContainerStyle = {
        height: "100vh",
        marginLeft: "auto",
    } as const;

    const adjustTogglePositionStyle = {
        marginTop: "3vmin",
        marginRight: "2vmin",
    } as const;

    return (
        <span style={outerStyle}>
            <div>
                <Title/>
            </div>
            <div style={toggleContainerStyle}>
                <div style={adjustTogglePositionStyle}>
                    <Toggle title={"Leaders"}>HI</Toggle>
                </div>
            </div>
        </span>
    );
});

export const Title = React.memo(() => {
    const containerStyle = {
        background: "red",
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

export const Toggle = React.memo(
    ({ children, title }: {
        children: ReactNode[],
        title: string,
    }) => {
        const [isVisible, setIsVisible] = React.useState(false);

        const staticToggleStyle = {
            cursor: "pointer",
        } as const;

        const toggleStyle = {
            visibility: isVisible ? "visible" as const : "hidden" as const,
            border: "none",
            background: "blue",
        } as const;

        return (
            <div style={staticToggleStyle} onClick={() => {
                setIsVisible(prev => !prev)
            }}>
                {title}
                <div style={toggleStyle}>
                    {children}
                </div>
            </div>
        );
    },
);
