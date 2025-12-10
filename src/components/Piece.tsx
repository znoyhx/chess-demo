import React from "react";
import { motion } from "framer-motion";
import type { Piece as PieceEntity } from "../data/pieces";
import { useGameContext } from "../context/GameContext";

export interface PieceProps {
  piece: PieceEntity;
  isSelected: boolean;
  onClick: () => void;
}

const baseShadow = "0px 6px 12px rgba(0, 0, 0, 0.3)";
const selectedShadow = "0px 0px 18px rgba(234, 179, 8, 0.6)";
const immunityShadow = "0 0 15px 5px rgba(255, 215, 0, 0.8)";

export const Piece = ({ piece, isSelected, onClick }: PieceProps) => {
  const { state } = useGameContext();

  const immunityEffect = state.activeEffects.find(
    (effect) => effect.type === "IMMUNITY" && effect.targetId === piece.id
  );
  const sealedEffect = state.activeEffects.find(
    (effect) => effect.type === "SEAL" && effect.targetId === piece.id
  );
  const isShieldPulse = state.shieldPulsePieceId === piece.id;

  const isRed = piece.color === "red";
  const textColor = isRed ? "text-red-700" : "text-gray-900";
  const glowClass = isSelected
    ? "ring-4 ring-amber-300 ring-offset-2 ring-offset-[#f0d5b6]"
    : "ring-0";

  const resolvedShadow = isSelected
    ? selectedShadow
    : immunityEffect
    ? immunityShadow
    : baseShadow;

  return (
    <motion.button
      type="button"
      aria-pressed={isSelected}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      animate={{
        scale: isSelected ? 1.12 : isShieldPulse ? [1, 1.1, 0.92, 1] : 1,
        boxShadow: resolvedShadow,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-amber-700/70 bg-[#f0d5b6] font-semibold text-2xl tracking-widest shadow-lg transition ${textColor} ${glowClass} ${
        sealedEffect ? "opacity-80" : ""
      }`}
    >
      <span className="font-serif select-none">
        {piece.symbol ?? piece.label ?? piece.type}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-75" />
      {sealedEffect ? (
        <motion.span
          className="pointer-events-none absolute -top-1 right-0 text-xl drop-shadow-sm"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🔒
        </motion.span>
      ) : null}
    </motion.button>
  );
};
