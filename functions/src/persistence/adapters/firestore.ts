import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { DocumentSnapshotPort, TransactionPort, TransactionRunnerPort } from "../ports.js";

const snapshotPort = (snapshot: { exists: boolean; data(): FirebaseFirestore.DocumentData | undefined }): DocumentSnapshotPort => Object.freeze({
  exists: snapshot.exists,
  data: (snapshot.data() ?? null) as DocumentSnapshotPort["data"],
});

class FirestoreTransactionPort implements TransactionPort {
  constructor(private readonly firestore: Firestore, private readonly transaction: Transaction) {}
  async get(path: string): Promise<DocumentSnapshotPort> { return snapshotPort(await this.transaction.get(this.firestore.doc(path))); }
  create(path: string, data: Readonly<Record<string, unknown>>): void { this.transaction.create(this.firestore.doc(path), data); }
  set(path: string, data: Readonly<Record<string, unknown>>, options?: { merge: boolean }): void {
    if (options === undefined) this.transaction.set(this.firestore.doc(path), data);
    else this.transaction.set(this.firestore.doc(path), data, options);
  }
  update(path: string, data: Readonly<Record<string, unknown>>): void { this.transaction.update(this.firestore.doc(path), data); }
}

export class FirestoreAdminTransactionRunner implements TransactionRunnerPort {
  constructor(private readonly firestore: Firestore) {}
  run<T>(operation: (transaction: TransactionPort) => Promise<T>): Promise<T> {
    return this.firestore.runTransaction((transaction) => operation(new FirestoreTransactionPort(this.firestore, transaction)));
  }
}
