import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useGameContext } from "../context/GameContext";
import { PIECE_COLORS } from "../data/pieces";
import { Board } from "../components/Board";
import { AdventureModal } from "../components/AdventureModal";
import { DanmakuOverlay } from "../components/DanmakuOverlay";
const modeLabels: Record<"LOCAL" | "PVE" | "ONLINE_RESERVED", string> = {
  LOCAL: "Local 1v1",
  PVE: "Vs AI",
  ONLINE_RESERVED: "Online (Coming Soon)",
};

export const GamePage = () => {
  const { state, dispatch } = useGameContext();
  const isRedTurn = state.currentTurn === PIECE_COLORS.RED;
  const winnerLabel = useMemo(() => {
    if (!state.winner) {
      return "";
    }
    return state.winner === PIECE_COLORS.RED ? "Red" : "Black";
  }, [state.winner]);

  useEffect(() => {
    if (!state.showTaunt) {
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "HIDE_TAUNT" });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [state.showTaunt, dispatch]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-stone-200 via-amber-100 to-stone-300">
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light" />
      <DanmakuOverlay active={state.showTaunt} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center gap-10 px-6 py-10">
        <header className="flex w-full flex-col items-center justify-between gap-4 rounded-2xl bg-white/60 p-6 shadow-lg backdrop-blur">
          <motion.span
            className="text-xs uppercase tracking-[0.6em] text-stone-500"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Adventure Chinese Chess
          </motion.span>
          <motion.h1
            className={`font-serif text-3xl font-semibold tracking-wide ${
              isRedTurn ? "text-red-700" : "text-gray-800"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isRedTurn ? "Red" : "Black"}'s Turn
          </motion.h1>
          <span className="text-sm uppercase tracking-[0.35em] text-stone-500">
            Mode · {modeLabels[state.mode]}
          </span>
        </header>

        <main className="flex w-full flex-1 flex-col items-center justify-center gap-6">
          <Board />
        </main>

        <footer className="flex w-full flex-wrap items-center justify-center gap-4 rounded-2xl bg-white/70 p-6 shadow-lg backdrop-blur">
          <button
            type="button"
            className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest transition shadow-md ${
              state.inventory.canUndo > 0
                ? "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
                : "bg-stone-200 text-stone-500 cursor-not-allowed"
            }`}
            disabled={state.inventory.canUndo <= 0}
            onClick={() => dispatch({ type: "UNDO_MOVE" })}
          >
            Undo Move
          </button>
          <button
            type="button"
            className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest transition shadow-md ${
              state.mode === "LOCAL"
                ? "bg-amber-500 text-white shadow-lg"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
            onClick={() => dispatch({ type: "SET_MODE", payload: { mode: "LOCAL" } })}
          >
            Local 1v1
          </button>
          <button
            type="button"
            className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest transition shadow-md ${
              state.mode === "PVE"
                ? "bg-red-500 text-white shadow-lg"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
            onClick={() => dispatch({ type: "SET_MODE", payload: { mode: "PVE" } })}
          >
            Vs AI
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest bg-stone-300 text-stone-500 opacity-70"
          >
            Online (Soon)
          </button>
        </footer>
      </div>

      <AdventureModal />

      {state.isGameOver && state.winner ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <h2 className="font-serif text-3xl font-semibold text-stone-900">Game Over</h2>
            <p className="mt-3 text-lg text-stone-600">{winnerLabel} wins the match!</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600"
                onClick={() => dispatch({ type: "RESET_GAME" })}
              >
                Play Again
              </button>
              <button
                type="button"
                className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest text-stone-500"
                onClick={() => dispatch({ type: "SET_MODE", payload: { mode: state.mode } })}
              >
                Reset + Keep Mode
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
};
