import type { GameState } from "../context/GameContext";
import type { AIMove, AIStrategy } from "./strategy";

export const minimaxStrategy: AIStrategy = {
  name: "minimax",
  pickMove(_state: GameState): AIMove | null {
    return null;
  },
};
