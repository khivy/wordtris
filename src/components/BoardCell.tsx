import styled from "styled-components";

export interface BoardCell {
    x: number;
    y: number;
}

export const BoardCellStyled = styled.div`
  width: auto;
  background: rgba(${(props) => props.color}, 0.8);
  border: 2px solid;
  grid-row: ${(props) => props.x};
  grid-column: ${(props) => props.y};
  text-align: center;
`;
