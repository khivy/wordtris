import styled from 'styled-components';

export class BoardCell {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export const BoardCellStyled = styled.div`
  width: auto;
  background: rgba(${props => props.color}, 0.8);
  border: 2px solid;
  grid-row: ${props => props.x};
  grid-column: ${props => props.y};
`;
