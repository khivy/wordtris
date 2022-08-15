import styled from "styled-components";
import { BoardCell } from "../BoardCell";
import { EMPTY } from "../setup";

export const BoardCellStyled = styled.div`
  width: auto;
  background: ${(props: BoardCell) => {
    if (props.char === EMPTY) {
        return "none";
    } else if (props.hasMatched) {
        return "lightgreen;";
    } else {
        return "red";
    }
}};
  text: ${(props) => props.char === EMPTY ? "none" : "red"};
  border: 2px solid;
  grid-row: ${(props) => props.r};
  grid-column: ${(props) => props.c};
  text-align: center;
`;
