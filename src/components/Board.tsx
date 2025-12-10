import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Position } from "../data/pieces";
import { PIECE_COLORS, PIECE_TYPES } from "../data/pieces";
import { canMove } from "../logic/movement";
import { useGameContext } from "../context/GameContext";
import { Piece } from "./Piece";
import { ADVENTURE_CATALOG } from "../data/adventure";
import type { AdventureType } from "../data/adventure";

const isSamePosition = (a: Position | null, b: Position): boolean =>
  !!a && a.r === b.r && a.c === b.c;

const palaceLines = [
  { x1: 3, y1: 0, x2: 6, y2: 3 },
  { x1: 6, y1: 0, x2: 3, y2: 3 },
  { x1: 3, y1: 7, x2: 6, y2: 10 },
  { x1: 6, y1: 7, x2: 3, y2: 10 },
];

const toPercent = (value: number, max: number) => (value / max) * 100;

const showToast = (message: string) => {
  window.alert(message);
};

export const Board = () => {
  const { state, dispatch } = useGameContext();
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);

  const pieceHasEffect = (pieceId: string, effectType: "IMMUNITY" | "SEAL") =>
    state.activeEffects.some(
      (effect) => effect.type === effectType && effect.targetId === pieceId
    );

  const randomAdventure = (): { type: AdventureType; index: number } => {
    const type: AdventureType = Math.random() > 0.5 ? "dare" : "reward";
    const pool = ADVENTURE_CATALOG[type];
    const index = Math.floor(Math.random() * pool.length);
    return { type, index };
  };

  const handleMoveAttempt = (source: Position | null, target: Position) => {
    if (state.isFrozen) {
      setSelectedPos(null);
      return;
    }

    const targetPiece = state.board[target.r]?.[target.c] ?? null;

    if (!source) {
      if (
        targetPiece &&
        targetPiece.color === state.currentTurn &&
        !state.isFrozen
      ) {
        setSelectedPos(target);
      }
      return;
    }

    const selectedPiece = state.board[source.r]?.[source.c] ?? null;
    if (!selectedPiece || selectedPiece.color !== state.currentTurn) {
      setSelectedPos(null);
      return;
    }

    if (pieceHasEffect(selectedPiece.id, "SEAL")) {
      window.alert("Chariot is Sealed!");
      setSelectedPos(null);
      return;
    }

    if (isSamePosition(source, target)) {
      setSelectedPos(null);
      return;
    }

    if (targetPiece && targetPiece.color === state.currentTurn) {
      setSelectedPos(target);
      return;
    }

    if (targetPiece && targetPiece.color !== state.currentTurn) {
      if (state.isBonusMovePhase) {
        showToast("Bonus move cannot capture!");
        setSelectedPos(null);
        return;
      }

      if (state.opponentCannotCapture) {
        showToast("Pacifism Active: Cannot capture this turn!");
        setSelectedPos(null);
        return;
      }
    }

    const canExecute = canMove(state.board, source, target, selectedPiece);
    if (canExecute) {
      if (targetPiece) {
        if (pieceHasEffect(targetPiece.id, "IMMUNITY")) {
          window.alert("Immunity Blocked!");
          dispatch({
            type: "CONSUME_IMMUNITY",
            payload: {
              targetId: targetPiece.id,
            },
          });
          setSelectedPos(null);
          return;
        }

        const adventure = randomAdventure();
        dispatch({
          type: "CAPTURE_PIECE",
          payload: {
            from: source,
            to: target,
          },
        });

        if (targetPiece.type !== PIECE_TYPES.GENERAL) {
          dispatch({
            type: "OPEN_ADVENTURE",
            payload: {
              adventureType: adventure.type,
              adventureIndex: adventure.index,
            },
          });
        }
      } else {
        const skipTurnEnd =
          state.pendingDoubleMove === state.currentTurn && !state.isBonusMovePhase;
        dispatch({
          type: "MOVE_PIECE",
          payload: {
            from: source,
            to: target,
          },
        });
        if (!skipTurnEnd) {
          dispatch({ type: "TURN_END" });
        }
      }
    }

    setSelectedPos(null);
  };

  const handleCellClick = (position: Position) => {
    handleMoveAttempt(selectedPos, position);
  };

  const isPlayersTurn = state.currentTurn === PIECE_COLORS.RED ? "red" : "black";

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4">
      <div className="relative aspect-[9/10] w-full overflow-hidden rounded-2xl border-8 border-[#8b5a2b] bg-[#d4a473] shadow-[0px_25px_45px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent)] opacity-80" />
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-10">
          {state.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const position: Position = { r: rowIndex, c: colIndex };
              const isSelected = isSamePosition(selectedPos, position);
              const isEnemy = cell && cell.color !== state.currentTurn;
              const cursorClass = state.isFrozen
                ? "cursor-not-allowed"
                : "cursor-pointer";

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(position)}
                  className={`relative flex items-center justify-center border border-amber-900/60 bg-gradient-to-br from-[#f9e4c6]/80 to-[#d9b98e]/60 transition-colors ${
                    isSelected
                      ? "bg-amber-200/70 backdrop-blur ring-2 ring-amber-500/70"
                      : ""
                  } ${cursorClass}`}
                >
                  {cell ? (
                    <Piece
                      piece={cell}
                      isSelected={isSelected}
                      onClick={() => handleMoveAttempt(selectedPos, position)}
                    />
                  ) : null}
                  {isEnemy && selectedPos && (
                    <span className="pointer-events-none absolute inset-0 rounded-lg border-2 border-red-500/40" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <motion.div
          className="pointer-events-none absolute left-1/2 w-[70%] -translate-x-1/2 text-center font-serif text-2xl text-slate-700/70"
          style={{
            top: `${(4.5 / 10) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <div className="flex items-center justify-between uppercase tracking-[0.6em]">
            <span>楚河</span>
            <span>汉界</span>
          </div>
        </motion.div>

        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {palaceLines.map((line, index) => (
            <line
              key={index}
              x1={`${toPercent(line.x1, 9)}%`}
              y1={`${toPercent(line.y1, 10)}%`}
              x2={`${toPercent(line.x2, 9)}%`}
              y2={`${toPercent(line.y2, 10)}%`}
              stroke="#5b3311"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity={0.6}
            />
          ))}
        </svg>
      </div>

      <div className="mt-4 text-center text-sm font-medium uppercase tracking-widest text-stone-600">
        {isPlayersTurn === "red" ? "Red side to move" : "Black side to move"}
      </div>
    </div>
  );
};
