// Main features:
export const ENABLE_SMOOTH_FALL = false;
export const MIN_WORD_LENGTH = 3;
export const ENABLE_INSTANT_DROP = true;
// Debug features:
export const _ENABLE_UP_KEY = true;
export const _IS_PRINTING_STATE = true;

export const TBD = "@";
export const EMPTY = "";
export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

// Interp determines the distance between the player block's current row and the next row.
export const interp = { val: 0 };
export const interpRate = 1;
export const interpKeydownMult = 30;
export const interpMax = 100;

/* Note: with 60 FPS, this is a float (16.666..7). Might run into issues. */
export const framesPerSecLimit = 60;
export const frameStep = 1000 / framesPerSecLimit;

/* The amount of time it takes before a block locks in place. */
export const lockMax = 1500;
export const matchAnimLength = 750;
export const groundExitPenaltyRate = 250;
export const countdownTotalSecs = 3;

export const boardCellFallDurationMillisecondsRate = 75;
export const playerCellFallDurationMillisecondsRate = 10;

export const FONT_COLOR = "#FFFFFF";
export const BOARD_COLOR = "#FDEDD8";
export const EMPTY_CELL_COLOR = "#F4A261";
export const BOARD_CELL_COLOR = "#2B5F8C";
export const PLAYER_COLOR = "#499F68";
export const MATCH_COLOR = "#FFEA00";
export const MATCH_TEXT_COLOR = BOARD_CELL_COLOR;
export const MENU_TEXT_COLOR = "#FFFFFF";
export const BOARD_CELL_TEXT_COLOR = "#EBF5EE";

export const UNIVERSAL_BORDER_RADIUS = "1vmin";
export const CELL_SIZE = "7vmin";
export const LARGE_TEXT_SIZE = "7vmin";
export const NORMAL_TEXT_SIZE = "3.5vmin";
export const SMALL_TEXT_SIZE = "3.0vmin";
