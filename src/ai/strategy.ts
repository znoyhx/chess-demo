import type { GameState } from "../context/GameContext";
import type { Position } from "../data/pieces";

export interface AIMove {
  from: Position;
  to: Position;
}

export interface AIStrategy {
  readonly name: string;
  pickMove(state: GameState): AIMove | null;
}

export interface StrategyDescriptor {
  key: "random" | "minimax";
  strategy: AIStrategy;
}
