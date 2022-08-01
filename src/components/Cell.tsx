import styled from 'styled-components';

export class Cell {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export const CellStyled = styled.div`
  width: auto;
  background: rgba(${props => props.color}, 0.8);
  border: 4px solid;
`;
