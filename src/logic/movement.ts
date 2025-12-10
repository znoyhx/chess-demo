import type { BoardMatrix, Piece, PieceColor, Position } from "../data/pieces";
import {
  PALACE_BOUNDS,
  PIECE_TYPES,
  PIECE_COLORS,
  RIVER_BOUNDARY,
  isWithinBoard,
} from "../data/pieces";

const isSamePosition = (a: Position, b: Position): boolean =>
  a.r === b.r && a.c === b.c;

const isWithinPalace = (position: Position, color: PieceColor): boolean => {
  const bounds = PALACE_BOUNDS[color];
  return (
    position.r >= bounds.rowRange[0] &&
    position.r <= bounds.rowRange[1] &&
    position.c >= bounds.colRange[0] &&
    position.c <= bounds.colRange[1]
  );
};

const hasCrossedRiver = (position: Position, color: PieceColor): boolean =>
  color === PIECE_COLORS.RED
    ? position.r <= RIVER_BOUNDARY
    : position.r >= RIVER_BOUNDARY + 1;

export const countObstacles = (
  board: BoardMatrix,
  from: Position,
  to: Position
): number => {
  if (from.r !== to.r && from.c !== to.c) {
    return -1;
  }

  let count = 0;

  if (from.r === to.r) {
    const row = from.r;
    const start = Math.min(from.c, to.c) + 1;
    const end = Math.max(from.c, to.c);
    for (let c = start; c < end; c += 1) {
      if (board[row][c]) {
        count += 1;
      }
    }
    return count;
  }

  const column = from.c;
  const start = Math.min(from.r, to.r) + 1;
  const end = Math.max(from.r, to.r);
  for (let r = start; r < end; r += 1) {
    if (board[r][column]) {
      count += 1;
    }
  }
  return count;
};

const locateGeneralsAfterMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  movingPiece: Piece
): { red: Position | null; black: Position | null } => {
  let red: Position | null = null;
  let black: Position | null = null;

  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      if (r === from.r && c === from.c) {
        continue;
      }
      if (r === to.r && c === to.c) {
        const target = board[r][c];
        if (target && target.type === PIECE_TYPES.GENERAL) {
          continue; // captured general
        }
      }
      const occupant = board[r][c];
      if (!occupant || occupant.type !== PIECE_TYPES.GENERAL) {
        continue;
      }
      if (occupant.color === PIECE_COLORS.RED) {
        red = { r, c };
      } else {
        black = { r, c };
      }
    }
  }

  if (movingPiece.type === PIECE_TYPES.GENERAL) {
    if (movingPiece.color === PIECE_COLORS.RED) {
      red = { ...to };
    } else {
      black = { ...to };
    }
  }

  return { red, black };
};

const isOccupiedAfterMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  _movingPiece: Piece,
  candidate: Position
): boolean => {
  if (candidate.r === from.r && candidate.c === from.c) {
    return false;
  }
  if (candidate.r === to.r && candidate.c === to.c) {
    return true;
  }
  const occupant = board[candidate.r][candidate.c];
  if (!occupant) {
    return false;
  }
  if (candidate.r === to.r && candidate.c === to.c) {
    return false;
  }
  return true;
};

const violatesFacingRule = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  movingPiece: Piece
): boolean => {
  const { red, black } = locateGeneralsAfterMove(board, from, to, movingPiece);
  if (!red || !black || red.c !== black.c) {
    return false;
  }

  const column = red.c;
  const start = Math.min(red.r, black.r) + 1;
  const end = Math.max(red.r, black.r);
  let blockers = 0;

  for (let r = start; r < end; r += 1) {
    if (isOccupiedAfterMove(board, from, to, movingPiece, { r, c: column })) {
      blockers += 1;
      if (blockers > 0) {
        break;
      }
    }
  }

  return blockers === 0;
};

const validateGeneralMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const dr = Math.abs(to.r - from.r);
  const dc = Math.abs(to.c - from.c);
  if (dr + dc !== 1) {
    return false;
  }
  return isWithinPalace(to, piece.color) && !violatesFacingRule(board, from, to, piece);
};

const validateAdvisorMove = (
  _board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const dr = Math.abs(to.r - from.r);
  const dc = Math.abs(to.c - from.c);
  return dr === 1 && dc === 1 && isWithinPalace(to, piece.color);
};

const validateElephantMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const dr = Math.abs(to.r - from.r);
  const dc = Math.abs(to.c - from.c);
  if (dr !== 2 || dc !== 2) {
    return false;
  }
  if (piece.color === PIECE_COLORS.RED && to.r <= RIVER_BOUNDARY) {
    return false;
  }
  if (piece.color === PIECE_COLORS.BLACK && to.r >= RIVER_BOUNDARY + 1) {
    return false;
  }
  const eye = {
    r: from.r + (to.r - from.r) / 2,
    c: from.c + (to.c - from.c) / 2,
  };
  return !board[eye.r][eye.c];
};

const validateHorseMove = (
  board: BoardMatrix,
  from: Position,
  to: Position
): boolean => {
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2))) {
    return false;
  }

  if (absDr === 2) {
    const leg = {
      r: from.r + dr / 2,
      c: from.c,
    };
    return !board[leg.r][leg.c];
  }

  const leg = {
    r: from.r,
    c: from.c + dc / 2,
  };
  return !board[leg.r][leg.c];
};

const validateChariotMove = (
  board: BoardMatrix,
  from: Position,
  to: Position
): boolean => {
  if (from.r !== to.r && from.c !== to.c) {
    return false;
  }
  return countObstacles(board, from, to) === 0;
};

const validateCannonMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  destination: Piece | null
): boolean => {
  if (from.r !== to.r && from.c !== to.c) {
    return false;
  }
  const obstacles = countObstacles(board, from, to);
  if (!destination) {
    return obstacles === 0;
  }
  return obstacles === 1;
};

const validateSoldierMove = (
  _board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const dr = to.r - from.r;
  const dc = to.c - from.c;

  if (piece.color === PIECE_COLORS.RED) {
    if (dr === -1 && dc === 0) {
      return true;
    }
    if (hasCrossedRiver(from, piece.color) && dr === 0 && Math.abs(dc) === 1) {
      return true;
    }
    return false;
  }

  if (dr === 1 && dc === 0) {
    return true;
  }
  if (hasCrossedRiver(from, piece.color) && dr === 0 && Math.abs(dc) === 1) {
    return true;
  }
  return false;
};

const validatePieceMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece,
  destination: Piece | null
): boolean => {
  switch (piece.type) {
    case PIECE_TYPES.GENERAL:
      return validateGeneralMove(board, from, to, piece);
    case PIECE_TYPES.ADVISOR:
      return validateAdvisorMove(board, from, to, piece);
    case PIECE_TYPES.ELEPHANT:
      return validateElephantMove(board, from, to, piece);
    case PIECE_TYPES.HORSE:
      return validateHorseMove(board, from, to);
    case PIECE_TYPES.CHARIOT:
      return validateChariotMove(board, from, to);
    case PIECE_TYPES.CANNON:
      return validateCannonMove(board, from, to, destination);
    case PIECE_TYPES.SOLDIER:
      return validateSoldierMove(board, from, to, piece);
    default:
      return false;
  }
};

const createsFacingViolation = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => violatesFacingRule(board, from, to, piece);

export const canMove = (
  board: BoardMatrix,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  if (!isWithinBoard(from) || !isWithinBoard(to)) {
    return false;
  }
  if (isSamePosition(from, to)) {
    return false;
  }
  if (board[from.r]?.[from.c] !== piece) {
    return false;
  }
  const destination = board[to.r][to.c];
  if (destination && destination.color === piece.color) {
    return false;
  }

  if (!validatePieceMove(board, from, to, piece, destination)) {
    return false;
  }

  if (createsFacingViolation(board, from, to, piece)) {
    return false;
  }

  return true;
};
