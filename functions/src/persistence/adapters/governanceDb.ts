import type { App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const GOVERNANCE_DATABASE_ID = "governance";

export interface GovernanceDatabaseHandle {
  readonly databaseId: typeof GOVERNANCE_DATABASE_ID;
  readonly firestore: Firestore;
}

export const createGovernanceDatabaseHandle = (app: App): GovernanceDatabaseHandle =>
  Object.freeze({ databaseId: GOVERNANCE_DATABASE_ID, firestore: getFirestore(app, GOVERNANCE_DATABASE_ID) });
