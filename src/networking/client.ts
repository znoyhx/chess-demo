import type {
  AdventureOpenPayload,
  AdventureResolvePayload,
  MovePayload,
  NetworkEventHandler,
  NetworkEventPayload,
  NetworkEventType,
  ResetPayload,
} from "./types";

export interface NetworkClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  syncMove(payload: MovePayload): Promise<void>;
  emitAdventureOpen(payload: AdventureOpenPayload): Promise<void>;
  emitAdventureResolve(payload: AdventureResolvePayload): Promise<void>;
  emitReset(payload: ResetPayload): Promise<void>;
  on<T extends NetworkEventType>(type: T, handler: NetworkEventHandler<T>): void;
  off<T extends NetworkEventType>(type: T, handler: NetworkEventHandler<T>): void;
  once<T extends NetworkEventType>(type: T, handler: NetworkEventHandler<T>): void;
}

export interface ClientOptions {
  endpoint?: string;
  roomId?: string;
}

export const createClient = (_options: ClientOptions = {}): NetworkClient => {
  const noopAsync = async () => {};
  const noop = () => {};

  return {
    connect: noopAsync,
    disconnect: noopAsync,
    syncMove: noopAsync,
    emitAdventureOpen: noopAsync,
    emitAdventureResolve: noopAsync,
    emitReset: noopAsync,
    on: noop,
    off: noop,
    once: noop,
  };
};

export const serializeEvent = (event: NetworkEventPayload): string =>
  JSON.stringify(event);

export const parseEvent = (raw: string): NetworkEventPayload | null => {
  try {
    const parsed = JSON.parse(raw) as NetworkEventPayload;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
