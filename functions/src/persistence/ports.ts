import type { JsonValue } from "../contracts/types.js";

export interface DocumentSnapshotPort {
  readonly exists: boolean;
  readonly data: Readonly<Record<string, JsonValue>> | null;
}

export interface TransactionPort {
  get(path: string): Promise<DocumentSnapshotPort>;
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
