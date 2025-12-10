import type {
  AdventureOpenPayload,
  AdventureResolvePayload,
  MovePayload,
  NetworkEventPayload,
  ResetPayload,
} from "./types";

// 修复点 1: 去掉 : Record<...> 注解
// 修复点 2: 在对象最后加上 as const
export const NETWORK_EVENT_TYPES = {
  move: "move",
  "adventure-open": "adventure-open",
  "adventure-resolve": "adventure-resolve",
  reset: "reset",
} as const;

export const createMoveEvent = (payload: MovePayload): NetworkEventPayload => ({
  type: NETWORK_EVENT_TYPES.move,
  payload,
});

export const createAdventureOpenEvent = (
  payload: AdventureOpenPayload
): NetworkEventPayload => ({
  type: NETWORK_EVENT_TYPES["adventure-open"],
  payload,
});

export const createAdventureResolveEvent = (
  payload: AdventureResolvePayload
): NetworkEventPayload => ({
  type: NETWORK_EVENT_TYPES["adventure-resolve"],
  payload,
});

export const createResetEvent = (payload: ResetPayload): NetworkEventPayload => ({
  type: NETWORK_EVENT_TYPES.reset,
  payload,
});