import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import type {
  BoardMatrix,
  Piece,
  PieceColor,
  Position,
} from "../data/pieces";
import {
  INITIAL_BOARD,
  PIECE_COLORS,
  PIECE_TYPES,
} from "../data/pieces";
import type { AdventureType } from "../data/adventure";
import { ADVENTURE_CATALOG, getAdventureByIndex } from "../data/adventure";
import { canMove } from "../logic/movement";
import { selectAIMove } from "../ai/ai";
import type { AIOptions } from "../ai/ai";

// --- Types ---

export type AdventureStatus = "idle" | "pending" | "open";

export type GameMode = "PVE" | "LOCAL" | "ONLINE_RESERVED";

export interface AdventureState {
  status: AdventureStatus;
  type: AdventureType | null;
  index: number | null;
  content: string | null;
}

export type GameEffectType = "IMMUNITY" | "SEAL";

export interface GameEffect {
  type: GameEffectType;
  targetId: string;
  duration: number;
  owner?: PieceColor;
}

export interface MoveDescriptor {
  from: Position;
  to: Position;
  pieceId: string;
  pieceType: Piece["type"];
  pieceColor: PieceColor;
  capture: boolean;
  capturedPieceId: string | null;
  adventureType: AdventureType | null;
  adventureIndex: number | null;
  origin: "local" | "synced";
}

export interface RoomState {
  roomId: string | null;
  playerColor: PieceColor | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
}

interface GameSnapshot {
  board: BoardMatrix;
  currentTurn: PieceColor;
  capturedPieces: Record<PieceColor, Piece[]>;
  activeEffects: GameEffect[];
  inventory: {
    canUndo: number;
  };
  winner: PieceColor | null;
  isGameOver: boolean;
  pendingDoubleMove: PieceColor | null;
  isBonusMovePhase: boolean;
  opponentCannotCapture: boolean;
  nextCaptureGrantsExtraMove: PieceColor | null;
}

export interface GameState {
  board: BoardMatrix;
  currentTurn: PieceColor;
  isFrozen: boolean;
  adventure: AdventureState;
  lastMove: MoveDescriptor | null;
  moveHistory: MoveDescriptor[];
  capturedPieces: Record<PieceColor, Piece[]>;
  room: RoomState;
  mode: GameMode;
  winner: PieceColor | null;
  activeEffects: GameEffect[];
  inventory: {
    canUndo: number;
  };
  showTaunt: boolean;
  isGameOver: boolean;
  shieldPulsePieceId: string | null;
  historyStack: GameSnapshot[];
  pendingDoubleMove: PieceColor | null;
  isBonusMovePhase: boolean;
  opponentCannotCapture: boolean;
  nextCaptureGrantsExtraMove: PieceColor | null;
}

// --- Actions ---

export type GameAction =
  | {
      type: "MOVE_PIECE";
      payload: {
        from: Position;
        to: Position;
      };
    }
  | {
      type: "CAPTURE_PIECE";
      payload: {
        from: Position;
        to: Position;
      };
    }
  | {
      type: "SYNC_MOVE";
      payload: {
        from: Position;
        to: Position;
        capture: boolean;
        adventureType?: AdventureType | null;
        adventureIndex?: number | null;
      };
    }
  | {
      type: "OPEN_ADVENTURE";
      payload: {
        adventureType: AdventureType;
        adventureIndex: number;
      };
    }
  | {
      type: "SYNC_ADVENTURE";
      payload: {
        adventureType: AdventureType;
        adventureIndex: number;
      };
    }
  | {
      type: "CLOSE_ADVENTURE";
    }
  | {
      type: "SET_MODE";
      payload: {
        mode: GameMode;
      };
    }
  | {
      type: "TURN_END";
    }
  | {
      type: "APPLY_REWARD";
      payload: {
        reward: "IMMUNITY" | "UNDO" | "TAUNT" | "SEAL_CHARIOT";
      };
    }
  | {
      type: "UNDO_MOVE";
    }
  | {
      type: "CONSUME_IMMUNITY";
      payload: {
        targetId: string;
      };
    }
  | {
      type: "HIDE_TAUNT";
    }
  | {
      type: "CLEAR_SHIELD_PULSE";
    }
  | {
      type: "FORCE_TURN";
    }
  | {
      type: "RESET_GAME";
    };

export type GameDispatch = (action: GameAction) => void;

export interface GameContextValue {
  state: GameState;
  dispatch: GameDispatch;
}

// --- Helpers ---

const hydrateInitialBoard = (): BoardMatrix =>
  structuredClone(INITIAL_BOARD) as BoardMatrix;

const clonePiece = (piece: Piece): Piece => ({ ...piece });

const cloneBoard = (board: BoardMatrix): BoardMatrix =>
  board.map((row) => row.map((cell) => (cell ? clonePiece(cell) : null)));

const opponentOf = (color: PieceColor): PieceColor =>
  color === PIECE_COLORS.RED ? PIECE_COLORS.BLACK : PIECE_COLORS.RED;

const createSnapshot = (state: GameState): GameSnapshot => ({
  board: cloneBoard(state.board),
  currentTurn: state.currentTurn,
  capturedPieces: structuredClone(state.capturedPieces) as Record<PieceColor, Piece[]>,
  activeEffects: structuredClone(state.activeEffects) as GameEffect[],
  inventory: structuredClone(state.inventory) as { canUndo: number },
  winner: state.winner,
  isGameOver: state.isGameOver,
  pendingDoubleMove: state.pendingDoubleMove,
  isBonusMovePhase: state.isBonusMovePhase,
  opponentCannotCapture: state.opponentCannotCapture,
  nextCaptureGrantsExtraMove: state.nextCaptureGrantsExtraMove,
});

const getEffect = (
  effects: GameEffect[],
  type: GameEffectType,
  targetId: string
): GameEffect | undefined =>
  effects.find((effect) => effect.type === type && effect.targetId === targetId);

const pushCapturedPiece = (
  capturedPieces: Record<PieceColor, Piece[]>,
  captorColor: PieceColor,
  captured: Piece
): Record<PieceColor, Piece[]> => {
  const next = structuredClone(capturedPieces) as Record<PieceColor, Piece[]>;
  next[captorColor].push(structuredClone(captured) as Piece);
  return next;
};

const removeEffectsForPiece = (
  effects: GameEffect[],
  pieceId: string
): GameEffect[] => effects.filter((effect) => effect.targetId !== pieceId);

const removeSpecificEffect = (
  effects: GameEffect[],
  type: GameEffectType,
  targetId: string
): GameEffect[] =>
  effects.filter(
    (effect) => !(effect.type === type && effect.targetId === targetId)
  );

const advanceEffects = (effects: GameEffect[]): GameEffect[] =>
  effects
    .map((effect) => {
      if (effect.type !== "SEAL") {
        return effect;
      }
      return {
        ...effect,
        duration: effect.duration - 1,
      };
    })
    .filter((effect) => (effect.type === "SEAL" ? effect.duration > 0 : true));

const createAdventureState = (
  status: AdventureStatus = "idle"
): AdventureState => ({
  status,
  type: null,
  index: null,
  content: null,
});

export const initialGameState: GameState = {
  board: hydrateInitialBoard(),
  currentTurn: PIECE_COLORS.RED,
  isFrozen: false,
  adventure: createAdventureState("idle"),
  lastMove: null,
  moveHistory: [],
  capturedPieces: {
    red: [],
    black: [],
  },
  room: {
    roomId: null,
    playerColor: null,
    connectionStatus: "disconnected",
  },
  mode: "LOCAL",
  winner: null,
  activeEffects: [],
  inventory: {
    canUndo: 0,
  },
  showTaunt: false,
  isGameOver: false,
  shieldPulsePieceId: null,
  historyStack: [],
  pendingDoubleMove: null,
  isBonusMovePhase: false,
  opponentCannotCapture: false,
  nextCaptureGrantsExtraMove: null,
};

const toggleTurn = (color: PieceColor): PieceColor =>
  color === PIECE_COLORS.RED ? PIECE_COLORS.BLACK : PIECE_COLORS.RED;

const updateMoveHistoryWithAdventure = (
  history: MoveDescriptor[],
  adventureType: AdventureType,
  adventureIndex: number
): MoveDescriptor[] => {
  if (!history.length) {
    return history;
  }
  const last = history[history.length - 1];
  const updated = {
    ...last,
    adventureType,
    adventureIndex,
  };
  return [...history.slice(0, history.length - 1), updated];
};

const updateLastMoveWithAdventure = (
  move: MoveDescriptor | null,
  adventureType: AdventureType,
  adventureIndex: number
): MoveDescriptor | null => {
  if (!move) {
    return move;
  }
  return {
    ...move,
    adventureType,
    adventureIndex,
  };
};

const resetForMode = (state: GameState, mode: GameMode): GameState => ({
  ...state,
  board: hydrateInitialBoard(),
  currentTurn: PIECE_COLORS.RED,
  isFrozen: false,
  adventure: createAdventureState("idle"),
  lastMove: null,
  moveHistory: [],
  capturedPieces: {
    red: [],
    black: [],
  },
  mode,
  winner: null,
  activeEffects: [],
  inventory: { canUndo: 0 },
  showTaunt: false,
  isGameOver: false,
  shieldPulsePieceId: null,
  historyStack: [],
  pendingDoubleMove: null,
  isBonusMovePhase: false,
  opponentCannotCapture: false,
  nextCaptureGrantsExtraMove: null,
});

// --- Reducer ---

export const gameReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  switch (action.type) {
    case "MOVE_PIECE": {
      const { from, to } = action.payload;
      const piece = state.board[from.r]?.[from.c];
      if (!piece) {
        return state;
      }
      if (state.isGameOver) {
        return state;
      }
      if (piece.color !== state.currentTurn) {
        return state;
      }
      if (getEffect(state.activeEffects, "SEAL", piece.id)) {
        return state;
      }
      if (state.board[to.r]?.[to.c]) {
        return state;
      }
      if (!canMove(state.board, from, to, piece)) {
        return state;
      }

      const snapshot = createSnapshot(state);
      const board = structuredClone(state.board) as BoardMatrix;
      const movingPiece = board[from.r]?.[from.c];
      if (!movingPiece) {
        return state;
      }

      board[from.r][from.c] = null;
      board[to.r][to.c] = movingPiece;

      const descriptor: MoveDescriptor = {
        from,
        to,
        pieceId: movingPiece.id,
        pieceType: movingPiece.type,
        pieceColor: movingPiece.color,
        capture: false,
        capturedPieceId: null,
        adventureType: null,
        adventureIndex: null,
        origin: "local",
      };

      const isBonusPhase = state.isBonusMovePhase;
      const ownsPendingDouble = state.pendingDoubleMove === state.currentTurn;

      let nextCurrentTurn = state.currentTurn;
      let nextPendingDoubleMove = state.pendingDoubleMove;
      let nextBonusMovePhase: boolean = state.isBonusMovePhase;

      if (isBonusPhase) {
        nextBonusMovePhase = false;
        nextCurrentTurn = toggleTurn(state.currentTurn);
      } else if (ownsPendingDouble) {
        nextPendingDoubleMove = null;
        nextBonusMovePhase = true;
      } else {
        nextCurrentTurn = toggleTurn(state.currentTurn);
      }

      return {
        ...state,
        board,
        currentTurn: nextCurrentTurn,
        isFrozen: false,
        adventure: createAdventureState("idle"),
        lastMove: descriptor,
        moveHistory: [...state.moveHistory, descriptor],
        historyStack: [...state.historyStack, snapshot],
        pendingDoubleMove: nextPendingDoubleMove,
        isBonusMovePhase: nextBonusMovePhase,
      };
    }

    case "CAPTURE_PIECE": {
      const { from, to } = action.payload;
      const piece = state.board[from.r]?.[from.c];
      const target = state.board[to.r]?.[to.c];
      if (!piece || !target) {
        return state;
      }
      if (state.isGameOver) {
        return state;
      }
      if (piece.color !== state.currentTurn || target.color === piece.color) {
        return state;
      }
      if (state.isBonusMovePhase) {
        return state;
      }
      if (state.opponentCannotCapture) {
        return state;
      }
      if (getEffect(state.activeEffects, "SEAL", piece.id)) {
        return state;
      }
      if (!canMove(state.board, from, to, piece)) {
        return state;
      }

      const snapshot = createSnapshot(state);
      const board = structuredClone(state.board) as BoardMatrix;
      const movingPiece = board[from.r]?.[from.c];
      const capturedPiece = board[to.r]?.[to.c];
      if (!movingPiece || !capturedPiece) {
        return state;
      }

      board[from.r][from.c] = null;
      board[to.r][to.c] = movingPiece;

      const capturedPieces = pushCapturedPiece(
        state.capturedPieces,
        piece.color,
        capturedPiece
      );

      const filteredEffects = removeEffectsForPiece(
        state.activeEffects,
        capturedPiece.id
      );

      const descriptor: MoveDescriptor = {
        from,
        to,
        pieceId: movingPiece.id,
        pieceType: movingPiece.type,
        pieceColor: movingPiece.color,
        capture: true,
        capturedPieceId: capturedPiece.id,
        adventureType: null,
        adventureIndex: null,
        origin: "local",
      };

      const capturedIsGeneral = capturedPiece.type === PIECE_TYPES.GENERAL;

      const ownsPendingDouble = state.pendingDoubleMove === state.currentTurn;
      const ownsCritBonus = state.nextCaptureGrantsExtraMove === state.currentTurn;

      let nextPendingDoubleMove = state.pendingDoubleMove;
      let nextBonusMovePhase: boolean = state.isBonusMovePhase;
      let nextCaptureBonus = state.nextCaptureGrantsExtraMove;

      if (ownsPendingDouble) {
        nextPendingDoubleMove = null;
        nextBonusMovePhase = true;
      }

      if (ownsCritBonus) {
        nextCaptureBonus = null;
        nextBonusMovePhase = true;
      }

      if (capturedIsGeneral) {
        nextPendingDoubleMove = null;
        nextBonusMovePhase = false;
        nextCaptureBonus = null;
      }

      return {
        ...state,
        board,
        capturedPieces,
        isFrozen: true,
        adventure: capturedIsGeneral
          ? createAdventureState("idle")
          : createAdventureState("pending"),
        lastMove: descriptor,
        moveHistory: [...state.moveHistory, descriptor],
        activeEffects: filteredEffects,
        historyStack: [...state.historyStack, snapshot],
        winner: capturedIsGeneral ? piece.color : state.winner,
        isGameOver: capturedIsGeneral ? true : state.isGameOver,
        pendingDoubleMove: nextPendingDoubleMove,
        isBonusMovePhase: nextBonusMovePhase,
        nextCaptureGrantsExtraMove: nextCaptureBonus,
      };
    }

    case "SYNC_MOVE": {
      const { from, to, capture, adventureType = null, adventureIndex = null } =
        action.payload;
      const board = structuredClone(state.board) as BoardMatrix;
      const movingPiece = board[from.r]?.[from.c];
      if (!movingPiece) {
        return state;
      }

      if (getEffect(state.activeEffects, "SEAL", movingPiece.id)) {
        return state;
      }

      const targetBefore = state.board[to.r]?.[to.c] ?? null;

      if (!canMove(state.board, from, to, movingPiece)) {
        return state;
      }

      if (capture) {
        if (!targetBefore || targetBefore.color === movingPiece.color) {
          return state;
        }
        if (state.isBonusMovePhase || state.opponentCannotCapture) {
          return state;
        }
      } else if (targetBefore) {
        return state;
      }

      const capturedPiece = board[to.r]?.[to.c] ?? null;
      board[from.r][from.c] = null;
      board[to.r][to.c] = movingPiece;

      const descriptor: MoveDescriptor = {
        from,
        to,
        pieceId: movingPiece.id,
        pieceType: movingPiece.type,
        pieceColor: movingPiece.color,
        capture,
        capturedPieceId: capturedPiece ? capturedPiece.id : null,
        adventureType: capture ? adventureType ?? null : null,
        adventureIndex: capture ? adventureIndex ?? null : null,
        origin: "synced",
      };

      const nextCapturedPieces =
        capture && capturedPiece
          ? pushCapturedPiece(state.capturedPieces, movingPiece.color, capturedPiece)
          : state.capturedPieces;

      const nextEffects = capturedPiece
        ? removeEffectsForPiece(state.activeEffects, capturedPiece.id)
        : state.activeEffects;

      const capturedIsGeneral = capturedPiece?.type === PIECE_TYPES.GENERAL;

      let nextCurrentTurn = state.currentTurn;
      let nextPendingDoubleMove = state.pendingDoubleMove;
      let nextBonusMovePhase: boolean = state.isBonusMovePhase;
      let nextCaptureBonus = state.nextCaptureGrantsExtraMove;
      let nextIsFrozen = state.isFrozen;
      let nextAdventureState = state.adventure;

      if (capture) {
        nextIsFrozen = true;
        nextAdventureState = capturedIsGeneral
          ? createAdventureState("idle")
          : createAdventureState("pending");

        if (state.pendingDoubleMove === state.currentTurn) {
          nextPendingDoubleMove = null;
          nextBonusMovePhase = true;
        }

        if (state.nextCaptureGrantsExtraMove === state.currentTurn) {
          nextCaptureBonus = null;
          nextBonusMovePhase = true;
        }

        if (capturedIsGeneral) {
          nextPendingDoubleMove = null;
          nextBonusMovePhase = false;
          nextCaptureBonus = null;
        }
      } else {
        nextIsFrozen = false;
        nextAdventureState = createAdventureState("idle");

        if (state.isBonusMovePhase) {
          nextBonusMovePhase = false;
          nextCurrentTurn = toggleTurn(state.currentTurn);
        } else if (state.pendingDoubleMove === state.currentTurn) {
          nextPendingDoubleMove = null;
          nextBonusMovePhase = true;
        } else {
          nextCurrentTurn = toggleTurn(state.currentTurn);
        }
      }

      return {
        ...state,
        board,
        capturedPieces: nextCapturedPieces,
        currentTurn: nextCurrentTurn,
        isFrozen: nextIsFrozen,
        adventure: nextAdventureState,
        lastMove: descriptor,
        moveHistory: [...state.moveHistory, descriptor],
        activeEffects: nextEffects,
        winner: capturedIsGeneral ? movingPiece.color : state.winner,
        isGameOver: capturedIsGeneral ? true : state.isGameOver,
        pendingDoubleMove: nextPendingDoubleMove,
        isBonusMovePhase: nextBonusMovePhase,
        nextCaptureGrantsExtraMove: nextCaptureBonus,
      };
    }

    case "OPEN_ADVENTURE": {
      const { adventureType, adventureIndex } = action.payload;
      const content = getAdventureByIndex(adventureType, adventureIndex);
      if (!content || state.isGameOver) {
        return state;
      }

      const adventureState: AdventureState = {
        status: "open",
        type: adventureType,
        index: adventureIndex,
        content,
      };

      return {
        ...state,
        adventure: adventureState,
        isFrozen: true,
        lastMove: updateLastMoveWithAdventure(
          state.lastMove,
          adventureType,
          adventureIndex
        ),
        moveHistory: updateMoveHistoryWithAdventure(
          state.moveHistory,
          adventureType,
          adventureIndex
        ),
      };
    }

    case "SYNC_ADVENTURE": {
      const { adventureType, adventureIndex } = action.payload;
      const content = getAdventureByIndex(adventureType, adventureIndex);
      if (!content || state.isGameOver) {
        return state;
      }

      const adventureState: AdventureState = {
        status: "open",
        type: adventureType,
        index: adventureIndex,
        content,
      };

      return {
        ...state,
        adventure: adventureState,
        isFrozen: true,
        lastMove: updateLastMoveWithAdventure(
          state.lastMove,
          adventureType,
          adventureIndex
        ),
        moveHistory: updateMoveHistoryWithAdventure(
          state.moveHistory,
          adventureType,
          adventureIndex
        ),
      };
    }

    case "CLOSE_ADVENTURE": {
      if (state.adventure.status === "idle") {
        return state;
      }

      const upcomingTurn = toggleTurn(state.currentTurn);
      const advancedEffects = advanceEffects(state.activeEffects);

      let interimState: GameState = {
        ...state,
        activeEffects: advancedEffects,
      };

      const shouldKeepTurn = state.isBonusMovePhase;

      if (state.adventure.type === "reward" && state.adventure.content) {
        const content = state.adventure.content;
        const currentPlayer = state.currentTurn;
        const opponentColor = opponentOf(currentPlayer);

        if (
          content.includes("连击时刻") ||
          content.includes("神速战车")
        ) {
          interimState = {
            ...interimState,
            pendingDoubleMove: currentPlayer,
          };
        }

        if (content.includes("和平主义")) {
          interimState = {
            ...interimState,
            opponentCannotCapture: true,
          };
        }

        if (content.includes("暴击准备")) {
          interimState = {
            ...interimState,
            nextCaptureGrantsExtraMove: currentPlayer,
          };
        }

        if (content.includes("绝对零度")) {
          const enemyPieces: Piece[] = [];
          interimState.board.forEach((row) => {
            row.forEach((cell) => {
              if (cell && cell.color === opponentColor) {
                enemyPieces.push(cell);
              }
            });
          });

          if (enemyPieces.length > 0) {
            const randomIndex = Math.floor(Math.random() * enemyPieces.length);
            const frozen = enemyPieces[randomIndex] ?? null;
            if (frozen) {
              const filtered = interimState.activeEffects.filter(
                (effect) =>
                  !(effect.type === "SEAL" && effect.targetId === frozen.id)
              );
              interimState = {
                ...interimState,
                activeEffects: [
                  ...filtered,
                  {
                    type: "SEAL",
                    targetId: frozen.id,
                    duration: 1,
                    owner: currentPlayer,
                  },
                ],
              };
            }
          }
        }
      }

      return {
        ...interimState,
        adventure: createAdventureState("idle"),
        isFrozen: false,
        currentTurn: shouldKeepTurn ? state.currentTurn : upcomingTurn,
      };
    }

    case "TURN_END": {
      return {
        ...state,
        activeEffects: advanceEffects(state.activeEffects),
        shieldPulsePieceId: null,
        opponentCannotCapture: false,
      };
    }

    case "APPLY_REWARD": {
      if (!state.lastMove || state.isGameOver) {
        return state;
      }
      const { reward } = action.payload;
      const lastMove = state.lastMove;
      const moverColor = lastMove.pieceColor;
      const opponentColor = opponentOf(moverColor);

      switch (reward) {
        case "IMMUNITY": {
          const withoutExisting = removeSpecificEffect(
            state.activeEffects,
            "IMMUNITY",
            lastMove.pieceId
          );
          return {
            ...state,
            activeEffects: [
              ...withoutExisting,
              {
                type: "IMMUNITY",
                targetId: lastMove.pieceId,
                duration: 1,
                owner: moverColor,
              },
            ],
            shieldPulsePieceId: lastMove.pieceId,
          };
        }
        case "UNDO": {
          return {
            ...state,
            inventory: {
              ...state.inventory,
              canUndo: state.inventory.canUndo + 1,
            },
          };
        }
        case "TAUNT": {
          return {
            ...state,
            showTaunt: true,
          };
        }
        case "SEAL_CHARIOT": {
          const sealedOpponents = state.board.reduce<GameEffect[]>((acc, row) => {
            row.forEach((cell) => {
              if (
                cell &&
                cell.type === PIECE_TYPES.CHARIOT &&
                cell.color === opponentColor
              ) {
                acc.push({
                  type: "SEAL",
                  targetId: cell.id,
                  duration: 1,
                  owner: moverColor,
                });
              }
            });
            return acc;
          }, []);

          const filtered = state.activeEffects.filter(
            (effect) => effect.type !== "SEAL"
          );

          return {
            ...state,
            activeEffects: [...filtered, ...sealedOpponents],
          };
        }
        default:
          return state;
      }
    }

    case "UNDO_MOVE": {
      if (state.moveHistory.length === 0) {
        return state;
      }
      if (state.inventory.canUndo <= 0) {
        return state;
      }

      const lastMove = state.moveHistory[state.moveHistory.length - 1];
      const previousSnapshot = state.historyStack[state.historyStack.length - 1] ?? null;

      let board: BoardMatrix;
      let capturedPieces: Record<PieceColor, Piece[]>;
      let activeEffects: GameEffect[];
      let winner: PieceColor | null;
      let isGameOver: boolean;
      let pendingDoubleMove: PieceColor | null;
      let isBonusMovePhase: boolean;
      let opponentCannotCapture: boolean;
      let nextCaptureGrantsExtraMove: PieceColor | null;

      if (previousSnapshot) {
        board = cloneBoard(previousSnapshot.board);
        capturedPieces = structuredClone(previousSnapshot.capturedPieces) as Record<PieceColor, Piece[]>;
        activeEffects = structuredClone(previousSnapshot.activeEffects) as GameEffect[];
        winner = previousSnapshot.winner;
        isGameOver = previousSnapshot.isGameOver;
        pendingDoubleMove = previousSnapshot.pendingDoubleMove;
        isBonusMovePhase = previousSnapshot.isBonusMovePhase;
        opponentCannotCapture = previousSnapshot.opponentCannotCapture;
        nextCaptureGrantsExtraMove = previousSnapshot.nextCaptureGrantsExtraMove;
      } else {
        board = cloneBoard(state.board);
        capturedPieces = structuredClone(state.capturedPieces) as Record<PieceColor, Piece[]>;
        activeEffects = structuredClone(state.activeEffects) as GameEffect[];
        winner = null;
        isGameOver = false;
        pendingDoubleMove = null;
        isBonusMovePhase = false;
        opponentCannotCapture = false;
        nextCaptureGrantsExtraMove = null;

        const pieceAtDestination = board[lastMove.to.r]?.[lastMove.to.c] ?? null;
        if (pieceAtDestination) {
          board[lastMove.from.r][lastMove.from.c] = structuredClone(pieceAtDestination) as Piece;
        } else {
          board[lastMove.from.r][lastMove.from.c] = null;
        }
        board[lastMove.to.r][lastMove.to.c] = null;

        if (lastMove.capture) {
          const captorColor = lastMove.pieceColor;
          const stash = [...capturedPieces[captorColor]];
          let revivedIndex = stash.findIndex((piece) => piece.id === lastMove.capturedPieceId);
          if (revivedIndex < 0) {
            revivedIndex = stash.length - 1;
          }
          const [revivedPiece] = revivedIndex >= 0 ? stash.splice(revivedIndex, 1) : [null];
          capturedPieces[captorColor] = stash;
          if (revivedPiece) {
            board[lastMove.to.r][lastMove.to.c] = structuredClone(revivedPiece) as Piece;
          }
        }
      }

      const trimmedHistory = state.moveHistory.slice(0, -1);
      const trimmedSnapshots = state.historyStack.slice(0, Math.max(0, state.historyStack.length - 1));

      return {
        ...state,
        board,
        moveHistory: trimmedHistory,
        lastMove: trimmedHistory.length ? trimmedHistory[trimmedHistory.length - 1] : null,
        currentTurn: lastMove.pieceColor,
        capturedPieces,
        inventory: {
          ...state.inventory,
          canUndo: Math.max(0, state.inventory.canUndo - 1),
        },
        activeEffects,
        adventure: createAdventureState("idle"),
        isFrozen: false,
        showTaunt: false,
        shieldPulsePieceId: null,
        isGameOver,
        winner,
        historyStack: trimmedSnapshots,
        pendingDoubleMove,
        isBonusMovePhase,
        opponentCannotCapture,
        nextCaptureGrantsExtraMove,
      };
    }

    case "CONSUME_IMMUNITY": {
      const { targetId } = action.payload;
      if (!getEffect(state.activeEffects, "IMMUNITY", targetId)) {
        return state;
      }

      const withoutImmunity = removeSpecificEffect(
        state.activeEffects,
        "IMMUNITY",
        targetId
      );

      return {
        ...state,
        activeEffects: advanceEffects(withoutImmunity),
        currentTurn: toggleTurn(state.currentTurn),
        shieldPulsePieceId: targetId,
        isFrozen: false,
        adventure:
          state.adventure.status === "idle"
            ? state.adventure
            : createAdventureState("idle"),
      };
    }

    case "HIDE_TAUNT": {
      if (!state.showTaunt) {
        return state;
      }
      return {
        ...state,
        showTaunt: false,
      };
    }

    case "CLEAR_SHIELD_PULSE": {
      if (!state.shieldPulsePieceId) {
        return state;
      }
      return {
        ...state,
        shieldPulsePieceId: null,
      };
    }

    case "FORCE_TURN": {
      return {
        ...state,
        currentTurn: toggleTurn(state.currentTurn),
        isFrozen: false,
        pendingDoubleMove: null,
        isBonusMovePhase: false,
        opponentCannotCapture: false,
        nextCaptureGrantsExtraMove: null,
      };
    }

    case "RESET_GAME": {
      return resetForMode(state, state.mode);
    }

    case "SET_MODE": {
      const {
        payload: { mode },
      } = action;
      if (state.mode === mode) {
        return resetForMode(state, mode);
      }
      return resetForMode(state, mode);
    }

    default:
      return state;
  }
};

// --- Context Provider ---

export const GameContext = createContext<GameContextValue | undefined>(undefined);

export interface GameProviderProps {
  reducer?: React.Reducer<GameState, GameAction>;
  children: ReactNode;
  aiOptions?: AIOptions;
}

export const GameProvider = ({
  reducer = gameReducer,
  children,
  aiOptions,
}: GameProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialGameState);
  const aiPendingRef = useRef(false);
  const strategyKey = aiOptions?.strategyKey;

  useEffect(() => {
    if (state.mode !== "PVE") {
      return;
    }
    if (state.isGameOver) {
      return;
    }
    if (state.currentTurn !== PIECE_COLORS.BLACK) {
      return;
    }
    if (state.isFrozen) {
      return;
    }
    if (state.adventure.status !== "idle") {
      return;
    }
    if (aiPendingRef.current) {
      return;
    }

    let cancelled = false;

    const randomAdventure = (): { type: AdventureType; index: number } => {
      const adventureType: AdventureType = Math.random() > 0.5 ? "dare" : "reward";
      const options = ADVENTURE_CATALOG[adventureType];
      const index = options.length > 0
        ? Math.floor(Math.random() * options.length)
        : 0;
      return { type: adventureType, index };
    };

    const releaseAI = () => {
      aiPendingRef.current = false;
    };

    aiPendingRef.current = true;

    const runAI = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (cancelled) {
          releaseAI();
          return;
        }

        const move = await selectAIMove(state, { strategyKey });

        if (cancelled || !move) {
          releaseAI();
          return;
        }

        const movingPiece = state.board[move.from.r]?.[move.from.c];
        if (!movingPiece) {
          releaseAI();
          return;
        }

        if (getEffect(state.activeEffects, "SEAL", movingPiece.id)) {
          releaseAI();
          return;
        }

        const destination = state.board[move.to.r]?.[move.to.c] ?? null;

        if (destination) {
          if (getEffect(state.activeEffects, "IMMUNITY", destination.id)) {
            releaseAI();
            dispatch({
              type: "CONSUME_IMMUNITY",
              payload: { targetId: destination.id },
            });
            return;
          }

          dispatch({
            type: "CAPTURE_PIECE",
            payload: {
              from: move.from,
              to: move.to,
            },
          });

          if (destination.type !== PIECE_TYPES.GENERAL) {
            const { type, index } = randomAdventure();
            dispatch({
              type: "OPEN_ADVENTURE",
              payload: {
                adventureType: type,
                adventureIndex: index,
              },
            });
          }

          releaseAI();
          return;
        }

        dispatch({
          type: "MOVE_PIECE",
          payload: {
            from: move.from,
            to: move.to,
          },
        });

        const skipTurnEnd =
          state.pendingDoubleMove === state.currentTurn && !state.isBonusMovePhase;
        if (!skipTurnEnd) {
          dispatch({ type: "TURN_END" });
        }

        releaseAI();
      } catch (error) {
        console.error("AI Error:", error);
        releaseAI();
      }
    };

    runAI();

    return () => {
      cancelled = true;
      aiPendingRef.current = false;
    };
  }, [state, strategyKey]);

  useEffect(() => {
    if (!state.shieldPulsePieceId) {
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "CLEAR_SHIELD_PULSE" });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [state.shieldPulsePieceId, dispatch]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
