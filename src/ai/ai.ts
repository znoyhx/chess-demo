import type { GameState } from "../context/GameContext";
import type { AIMove, AIStrategy, StrategyDescriptor } from "./strategy";
import { randomStrategy } from "./randomStrategy";
import { minimaxStrategy } from "./minimaxStrategy";

const STRATEGIES: StrategyDescriptor[] = [
  { key: "random", strategy: randomStrategy },
  { key: "minimax", strategy: minimaxStrategy },
];

export interface AIOptions {
  strategyKey?: StrategyDescriptor["key"];
}

const getStrategy = (options?: AIOptions): AIStrategy => {
  const key = options?.strategyKey ?? "random";
  const descriptor = STRATEGIES.find((entry) => entry.key === key);
  return descriptor?.strategy ?? randomStrategy;
};

export const selectAIMove = async (
  state: GameState,
  options?: AIOptions
): Promise<AIMove | null> => {
  const strategy = getStrategy(options);
  return strategy.pickMove(state);
};
