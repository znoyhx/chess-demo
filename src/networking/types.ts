import type { Position } from "../data/pieces";
import type { AdventureType } from "../data/adventure";
import type { GameMode } from "../context/GameContext";

export interface MovePayload {
  from: Position;
  to: Position;
  capture: boolean;
  adventureType: AdventureType | null;
  adventureIndex: number | null;
}

export interface AdventureOpenPayload {
  moveId: string;
  adventureType: AdventureType;
  adventureIndex: number;
}

export interface AdventureResolvePayload {
  moveId: string;
}

export interface ResetPayload {
  roomId: string | null;
  mode: GameMode;
}

export type NetworkEventType =
  | "move"
  | "adventure-open"
  | "adventure-resolve"
  | "reset";

export type NetworkEventPayload =
  | { type: "move"; payload: MovePayload }
  | { type: "adventure-open"; payload: AdventureOpenPayload }
  | { type: "adventure-resolve"; payload: AdventureResolvePayload }
  | { type: "reset"; payload: ResetPayload };

export type NetworkEventHandler<T extends NetworkEventPayload["type"]> = (
  payload: Extract<NetworkEventPayload, { type: T }>["payload"]
) => void;
