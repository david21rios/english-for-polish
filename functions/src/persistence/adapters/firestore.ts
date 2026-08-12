import { FieldValue, Timestamp, type Firestore, type Transaction } from "firebase-admin/firestore";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { BackendError } from "../../errors/backendError.js";
import { isServerOwnedTimestamp, type DocumentSnapshotPort, type PersistedDocumentShape, type TransactionPort, type TransactionRunnerPort } from "../ports.js";

const timestampFields: Readonly<Record<PersistedDocumentShape, Readonly<Record<string, boolean>>>> = Object.freeze({
  platform_authority: Object.freeze({ createdAt: false, updatedAt: false, activatedAt: true, revokedAt: true, lastClaimSyncAt: true }),
  platform_authority_registry: Object.freeze({ updatedAt: false }),
  privileged_command: Object.freeze({ startedAt: false, completedAt: true, failedAt: true, expiresAt: true, leaseExpiresAt: true }),
  platform_audit: Object.freeze({ requestedAt: false, executedAt: false }),
});

export const normalizeFirestoreDocument = (data: FirebaseFirestore.DocumentData, shape?: PersistedDocumentShape): FirebaseFirestore.DocumentData => {
  if (shape === undefined) return data;
  const fields = timestampFields[shape];
  const result = { ...data };
  for (const [field, nullable] of Object.entries(fields)) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    if (value === null && nullable) continue;
    if (!(value instanceof Timestamp)) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The persisted timestamp is invalid.");
    result[field] = value.toDate().toISOString();
  }
  return result;
};

export const transformFirestoreWrite = (value: unknown): unknown => {
  if (isServerOwnedTimestamp(value)) return FieldValue.serverTimestamp();
  if (Array.isArray(value)) return value.map(transformFirestoreWrite);
  if (value === null || typeof value !== "object") return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transformFirestoreWrite(item)]));
};

const snapshotPort = (snapshot: { exists: boolean; data(): FirebaseFirestore.DocumentData | undefined }, shape?: PersistedDocumentShape): DocumentSnapshotPort => Object.freeze({
  exists: snapshot.exists,
  data: snapshot.data() === undefined ? null : normalizeFirestoreDocument(snapshot.data() ?? {}, shape) as DocumentSnapshotPort["data"],
});

class FirestoreTransactionPort implements TransactionPort {
  constructor(private readonly firestore: Firestore, private readonly transaction: Transaction) {}
  async get(path: string, shape?: PersistedDocumentShape): Promise<DocumentSnapshotPort> { return snapshotPort(await this.transaction.get(this.firestore.doc(path)), shape); }
  create(path: string, data: Readonly<Record<string, unknown>>): void { this.transaction.create(this.firestore.doc(path), transformFirestoreWrite(data) as FirebaseFirestore.DocumentData); }
  set(path: string, data: Readonly<Record<string, unknown>>, options?: { merge: boolean }): void {
    const transformed = transformFirestoreWrite(data) as FirebaseFirestore.DocumentData;
    if (options === undefined) this.transaction.set(this.firestore.doc(path), transformed);
    else this.transaction.set(this.firestore.doc(path), transformed, options);
  }
  update(path: string, data: Readonly<Record<string, unknown>>): void { this.transaction.update(this.firestore.doc(path), transformFirestoreWrite(data) as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>); }
}

export class FirestoreAdminTransactionRunner implements TransactionRunnerPort {
  constructor(private readonly firestore: Firestore) {}
  run<T>(operation: (transaction: TransactionPort) => Promise<T>): Promise<T> {
    return this.firestore.runTransaction((transaction) => operation(new FirestoreTransactionPort(this.firestore, transaction)));
  }
}
