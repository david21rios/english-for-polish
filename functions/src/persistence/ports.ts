import type { JsonValue } from "../contracts/types.js";

export interface DocumentSnapshotPort {
  readonly exists: boolean;
  readonly data: Readonly<Record<string, JsonValue>> | null;
}

export type PersistedDocumentShape = "platform_authority" | "platform_authority_registry";
declare const serverOwnedTimestampBrand: unique symbol;
export type ServerOwnedTimestamp = Readonly<{ readonly [serverOwnedTimestampBrand]: true }>;
export type TransactionWriteValue = unknown | ServerOwnedTimestamp;

const serverOwnedTimestampToken: ServerOwnedTimestamp = Object.freeze({}) as ServerOwnedTimestamp;
export const serverOwnedTimestamp = (): ServerOwnedTimestamp => serverOwnedTimestampToken;
export const isServerOwnedTimestamp = (value: unknown): value is ServerOwnedTimestamp => value === serverOwnedTimestampToken;

export interface TransactionPort {
  get(path: string, shape?: PersistedDocumentShape): Promise<DocumentSnapshotPort>;
  create(path: string, data: Readonly<Record<string, unknown>>): void;
  set(path: string, data: Readonly<Record<string, unknown>>, options?: { merge: boolean }): void;
  update(path: string, data: Readonly<Record<string, unknown>>): void;
}

export interface TransactionRunnerPort {
  run<T>(operation: (transaction: TransactionPort) => Promise<T>): Promise<T>;
}

export interface AuthoritativeReaderPort {
  read(path: string): Promise<DocumentSnapshotPort>;
}
