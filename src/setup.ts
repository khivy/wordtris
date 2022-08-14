import * as Words from "a-set-of-english-words";

// Main features:
export const ENABLE_SMOOTH_FALL = false;
export const MIN_WORD_LENGTH = 3;
// Debug features:
export const _ENABLE_UP_KEY = true;

export const TBD = "@";
export const EMPTY = "";
export const BOARD_ROWS = 7;
export const BOARD_COLS = 7;

// Interp determines the distance between the player block's current row and the next row.
export let interp = { val: 0 };
export const interpRate = .4;
export const interpKeydownMult = 30;
export const interpMax = 100;

export const validWords = Words;
