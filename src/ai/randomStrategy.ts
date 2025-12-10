import type { GameState } from "../context/GameContext";
import { BOARD_COLS, BOARD_ROWS } from "../data/pieces";
import type { BoardMatrix, Piece, Position } from "../data/pieces";
import { canMove } from "../logic/movement";
import type { AIMove, AIStrategy } from "./strategy";

const enumerateBoardPositions = (): Position[] => {
  const positions: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r += 1) {
    for (let c = 0; c < BOARD_COLS; c += 1) {
      positions.push({ r, c });
    }
  }
  return positions;
};

const allPositions = enumerateBoardPositions();

const collectLegalMoves = (board: BoardMatrix, piece: Piece, from: Position): AIMove[] => {
  const moves: AIMove[] = [];
  for (const to of allPositions) {
    if (canMove(board, from, to, piece)) {
      moves.push({ from, to });
    }
  }
  return moves;
};

const gatherMovesForColor = (state: GameState, color: Piece["color"]): AIMove[] => {
  const candidates: AIMove[] = [];
  for (let r = 0; r < state.board.length; r += 1) {
    const row = state.board[r];
    for (let c = 0; c < row.length; c += 1) {
      const piece = row[c];
      if (!piece || piece.color !== color) {
        continue;
      }
      const legalMoves = collectLegalMoves(state.board, piece, { r, c }).filter(
        (move) => {
          const target = state.board[move.to.r]?.[move.to.c] ?? null;
          const isCapture = !!target && target.color !== piece.color;

          if (state.isBonusMovePhase && isCapture) {
            return false;
          }

          if (state.opponentCannotCapture && isCapture) {
            return false;
          }

          const ownsPendingDouble = state.pendingDoubleMove === state.currentTurn;
          if (ownsPendingDouble && state.isBonusMovePhase) {
            return false;
          }

          return true;
        }
      );

      candidates.push(...legalMoves);
    }
  }
  return candidates;
};

const pickRandom = <T>(items: T[]): T | null => {
  if (!items.length) {
    return null;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
};

export const randomStrategy: AIStrategy = {
  name: "random",
  pickMove(state) {
    const moves = gatherMovesForColor(state, state.currentTurn);
    return pickRandom(moves);
  },
};
