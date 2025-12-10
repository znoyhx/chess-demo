export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export type PieceColor = "red" | "black";
export type PieceType =
  | "general"
  | "advisor"
  | "elephant"
  | "horse"
  | "chariot"
  | "cannon"
  | "soldier";

export interface Position {
  r: number;
  c: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  symbol: string;
  label: string;
}

export type BoardMatrix = (Piece | null)[][];

type PieceDefinition = {
  label: string;
  redSymbol: string;
  blackSymbol: string;
};

const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  general: { label: "General", redSymbol: "帅", blackSymbol: "将" },
  advisor: { label: "Advisor", redSymbol: "仕", blackSymbol: "士" },
  elephant: { label: "Elephant", redSymbol: "相", blackSymbol: "象" },
  horse: { label: "Horse", redSymbol: "马", blackSymbol: "马" },
  chariot: { label: "Chariot", redSymbol: "车", blackSymbol: "车" },
  cannon: { label: "Cannon", redSymbol: "炮", blackSymbol: "炮" },
  soldier: { label: "Soldier", redSymbol: "兵", blackSymbol: "卒" },
};

const createPiece = (
  type: PieceType,
  color: PieceColor,
  suffix: string
): Piece => {
  const definition = PIECE_DEFINITIONS[type];
  const symbol = color === "red" ? definition.redSymbol : definition.blackSymbol;

  return {
    id: `${color}-${type}-${suffix}`,
    type,
    color,
    symbol,
    label: definition.label,
  };
};

const createEmptyRow = (): (Piece | null)[] => new Array(BOARD_COLS).fill(null);

const buildInitialBoard = (): BoardMatrix => {
  const row0: (Piece | null)[] = [
    createPiece("chariot", "black", "a"),
    createPiece("horse", "black", "a"),
    createPiece("elephant", "black", "a"),
    createPiece("advisor", "black", "a"),
    createPiece("general", "black", "main"),
    createPiece("advisor", "black", "b"),
    createPiece("elephant", "black", "b"),
    createPiece("horse", "black", "b"),
    createPiece("chariot", "black", "b"),
  ];

  const row2: (Piece | null)[] = createEmptyRow();
  row2[1] = createPiece("cannon", "black", "a");
  row2[7] = createPiece("cannon", "black", "b");

  const row3: (Piece | null)[] = createEmptyRow();
  row3[0] = createPiece("soldier", "black", "a");
  row3[2] = createPiece("soldier", "black", "b");
  row3[4] = createPiece("soldier", "black", "c");
  row3[6] = createPiece("soldier", "black", "d");
  row3[8] = createPiece("soldier", "black", "e");

  const row6: (Piece | null)[] = createEmptyRow();
  row6[0] = createPiece("soldier", "red", "a");
  row6[2] = createPiece("soldier", "red", "b");
  row6[4] = createPiece("soldier", "red", "c");
  row6[6] = createPiece("soldier", "red", "d");
  row6[8] = createPiece("soldier", "red", "e");

  const row7: (Piece | null)[] = createEmptyRow();
  row7[1] = createPiece("cannon", "red", "a");
  row7[7] = createPiece("cannon", "red", "b");

  const row9: (Piece | null)[] = [
    createPiece("chariot", "red", "a"),
    createPiece("horse", "red", "a"),
    createPiece("elephant", "red", "a"),
    createPiece("advisor", "red", "a"),
    createPiece("general", "red", "main"),
    createPiece("advisor", "red", "b"),
    createPiece("elephant", "red", "b"),
    createPiece("horse", "red", "b"),
    createPiece("chariot", "red", "b"),
  ];

  return [
    row0,
    createEmptyRow(),
    row2,
    row3,
    createEmptyRow(),
    createEmptyRow(),
    row6,
    row7,
    createEmptyRow(),
    row9,
  ];
};

export const INITIAL_BOARD: BoardMatrix = buildInitialBoard();

export const PALACE_BOUNDS: Record<PieceColor, { rowRange: [number, number]; colRange: [number, number] }> = {
  black: { rowRange: [0, 2], colRange: [3, 5] },
  red: { rowRange: [7, 9], colRange: [3, 5] },
};

export const RIVER_BOUNDARY = 4; // Rows 0-4 belong to black side, 5-9 to red side.

export const PIECE_TYPES = Object.freeze({
  GENERAL: "general" as PieceType,
  ADVISOR: "advisor" as PieceType,
  ELEPHANT: "elephant" as PieceType,
  HORSE: "horse" as PieceType,
  CHARIOT: "chariot" as PieceType,
  CANNON: "cannon" as PieceType,
  SOLDIER: "soldier" as PieceType,
});

export const PIECE_COLORS = Object.freeze({
  RED: "red" as PieceColor,
  BLACK: "black" as PieceColor,
});

export const isWithinBoard = ({ r, c }: Position): boolean =>
  r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS;
