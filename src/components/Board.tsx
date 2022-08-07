import styled from "styled-components";

// TODO: move this out.
export function generateRandomChar(): string {
    return String.fromCharCode(
        Math.floor(Math.random() * 26) + 97,
    );
}
