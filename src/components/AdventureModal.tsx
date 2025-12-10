import { AnimatePresence, motion } from "framer-motion";
import { useGameContext } from "../context/GameContext";
import React from 'react';

const dareTheme = {
  container:
    "bg-gradient-to-br from-purple-950 via-indigo-900 to-slate-900 text-indigo-100",
  border: "border-purple-500/70",
  badge: "bg-indigo-500/30 text-indigo-100",
  button:
    "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-400 hover:to-indigo-400 focus-visible:ring focus-visible:ring-purple-200/60",
};

const rewardTheme = {
  container:
    "bg-gradient-to-br from-yellow-100 via-amber-100 to-rose-100 text-amber-900",
  border: "border-yellow-500/70",
  badge: "bg-amber-300/80 text-red-700",
  button:
    "bg-gradient-to-r from-amber-400 to-rose-400 text-red-900 hover:from-amber-300 hover:to-rose-300 focus-visible:ring focus-visible:ring-amber-200/80",
};

const dareMotion = {
  initial: { scale: 0.7, rotate: -8, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    x: [0, -10, 10, -8, 8, -4, 0],
  },
  exit: { scale: 0.9, opacity: 0, rotate: -4 },
  transition: { type: "spring", stiffness: 260, damping: 18, duration: 0.6 },
};

const rewardMotion = {
  initial: { scale: 0.6, rotate: -6, opacity: 0 },
  animate: {
    scale: [0.95, 1.05, 1],
    rotate: 0,
    opacity: 1,
  },
  exit: { scale: 0.9, opacity: 0, rotate: -4 },
  transition: { type: "spring", stiffness: 200, damping: 16, duration: 0.6 },
};

export const AdventureModal = () => {
  const { state, dispatch } = useGameContext();
  const adventure = state.adventure;

  const isVisible =
    adventure.status === "open" && Boolean(adventure.content) && adventure.type;

  const adventureType = adventure.type ?? "dare";
  const theme = adventureType === "dare" ? dareTheme : rewardTheme;
  const motionConfig = adventureType === "dare" ? dareMotion : rewardMotion;

  const title =
    adventureType === "dare" ? "😈 大冒险时间!" : "🎁 恭喜获得奖励!";
  const buttonLabel = adventureType === "dare" ? "接受挑战" : "领取奖励";

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="adventure-backdrop"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key="adventure-modal"
            initial={motionConfig.initial}
            animate={motionConfig.animate}
            exit={motionConfig.exit}
            transition={motionConfig.transition}
            className={`relative w-[min(92vw,520px)] overflow-hidden rounded-3xl border-2 p-9 text-center shadow-2xl ${theme.container} ${theme.border}`}
          >
            {adventureType === "reward" ? (
              <span className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-b from-yellow-200/70 via-amber-200/30 to-transparent blur-2xl" />
            ) : (
              <span className="pointer-events-none absolute -top-28 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-purple-800/30 blur-3xl" />
            )}

            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.span
                className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.45em] ${theme.badge}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                {adventureType === "dare" ? "Punishment" : "Reward"}
              </motion.span>

              <motion.h2
                className="font-serif text-3xl font-bold tracking-wide drop-shadow-lg"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
              >
                {title}
              </motion.h2>

              <motion.p
                className="text-lg leading-relaxed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                {adventure.content}
              </motion.p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className={`rounded-full px-10 py-3 text-sm font-semibold uppercase tracking-[0.4em] shadow-xl transition ${theme.button}`}
                onClick={() => dispatch({ type: "CLOSE_ADVENTURE" })}
              >
                {buttonLabel}
              </motion.button>
            </div>

            {adventureType === "reward" && (
              <span className="pointer-events-none absolute inset-x-12 bottom-10 h-24 rounded-full bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent blur-2xl" />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
