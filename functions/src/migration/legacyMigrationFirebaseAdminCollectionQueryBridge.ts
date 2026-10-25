import { createRequire } from "node:module";
import type {
  LegacyMigrationAppHandle,
  LegacyMigrationFirestoreCollectionReadDependency,
} from "./legacyMigrationProviderClientFactory.js";
import type {
  LegacyMigrationFirestoreCollectionPageQueryInput,
  LegacyMigrationFirestoreCollectionRawDocument,
} from "./legacyMigrationFirestoreCollectionReadAdapter.js";

type CollectionQueryDocument = Readonly<{
  id: string;
  ref: Readonly<{ path: string }>;
  data: () => unknown;
}>;

type CollectionQuerySnapshot = Readonly<{
  docs: readonly CollectionQueryDocument[];
}>;

type CollectionQuery = {
  select: (...fields: string[]) => CollectionQuery;
  orderBy: (field: unknown, direction: "asc") => CollectionQuery;
  startAfter: (...values: unknown[]) => CollectionQuery;
  limit: (value: number) => CollectionQuery;
  get: () => Promise<CollectionQuerySnapshot>;
};

type FirestoreCollectionClient = Readonly<{
  collection: (path: string) => CollectionQuery;
}>;

export type LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime = Readonly<{
  getFirestore: (app: LegacyMigrationAppHandle, databaseId: string) => FirestoreCollectionClient;
  documentId: () => unknown;
}>;

export type LegacyMigrationFirebaseAdminCollectionQueryBridgeInput = Readonly<{
  app: LegacyMigrationAppHandle;
  runtime?: Partial<LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime>;
}>;

const require = createRequire(import.meta.url);

type FirebaseAdminFirestoreModule = Readonly<{
  getFirestore: (app: unknown, databaseId: string) => unknown;
  FieldPath: Readonly<{ documentId: () => unknown }>;
}>;

const firebaseAdminFirestore = (): FirebaseAdminFirestoreModule =>
  require("firebase-admin/firestore") as FirebaseAdminFirestoreModule;

const defaultRuntime: LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime = {
  getFirestore: (app, databaseId) => firebaseAdminFirestore().getFirestore(app, databaseId) as FirestoreCollectionClient,
  documentId: () => firebaseAdminFirestore().FieldPath.documentId(),
};

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const copySnapshotData = (value: unknown): unknown =>
  isObjectRecord(value) ? { ...value } : value;

const validateCollectionPath = (value: unknown): void => {
  if (!nonEmpty(value) || value.startsWith("/") || value.endsWith("/") || value.includes("//")) {
    throw new TypeError("collectionPath must be a non-empty collection path.");
  }
  const segments = value.split("/");
  if (segments.length % 2 === 0 || segments.some((segment) => segment.length === 0)) {
    throw new TypeError("collectionPath must identify a collection.");
  }
};

const validateInput = (input: LegacyMigrationFirestoreCollectionPageQueryInput): void => {
  if (!nonEmpty(input.projectId)) throw new TypeError("projectId is required.");
  if (!nonEmpty(input.databaseId)) throw new TypeError("databaseId is required.");
  validateCollectionPath(input.collectionPath);
  if (!Array.isArray(input.fieldProjection) || input.fieldProjection.length === 0 ||
    input.fieldProjection.some((field) => !nonEmpty(field))) {
    throw new TypeError("fieldProjection must be non-empty.");
  }
  if (!Number.isSafeInteger(input.pageSize) || input.pageSize <= 0) {
    throw new TypeError("pageSize must be a positive safe integer.");
  }
  if (input.order !== "DOCUMENT_PATH_ASC") throw new TypeError("Unsupported collection query order.");
  if (input.startAfterDocumentId !== null && !nonEmpty(input.startAfterDocumentId)) {
    throw new TypeError("startAfterDocumentId must be null or a non-empty string.");
  }
};

const validateProjectBinding = (app: LegacyMigrationAppHandle, projectId: string): void => {
  if (!nonEmpty(projectId) || !nonEmpty(app?.options?.projectId)) {
    throw new TypeError("Explicit project binding is required.");
  }
  if (app.options?.projectId !== projectId) {
    throw new TypeError("Requested project does not match the Firebase App project.");
  }
};

export const createLegacyMigrationFirebaseAdminCollectionQueryBridge = (
  input: LegacyMigrationFirebaseAdminCollectionQueryBridgeInput,
): LegacyMigrationFirestoreCollectionReadDependency => {
  if (input?.app === undefined || input.app === null) throw new TypeError("Firebase App is required.");
  const runtime: LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime = {
    ...defaultRuntime,
    ...(input.runtime ?? {}),
  };
  if (typeof runtime.getFirestore !== "function" || typeof runtime.documentId !== "function") {
    throw new TypeError("Firebase Admin collection query runtime is incomplete.");
  }

  return Object.freeze({
    runCollectionPageQuery: async (
      queryInput: LegacyMigrationFirestoreCollectionPageQueryInput,
    ): Promise<readonly LegacyMigrationFirestoreCollectionRawDocument[]> => {
      validateInput(queryInput);
      validateProjectBinding(input.app, queryInput.projectId);
      const firestore = runtime.getFirestore(input.app, queryInput.databaseId);
      let query = firestore.collection(queryInput.collectionPath)
        .select(...queryInput.fieldProjection)
        .orderBy(runtime.documentId(), "asc");
      if (queryInput.startAfterDocumentId !== null) {
        query = query.startAfter(queryInput.startAfterDocumentId);
      }
      const snapshot = await query.limit(queryInput.pageSize).get();
      return snapshot.docs.map((document) => ({
        id: document.id,
        path: document.ref.path,
        data: copySnapshotData(document.data()),
      }));
    },
  });
};

export const LEGACY_MIGRATION_FIREBASE_ADMIN_COLLECTION_QUERY_ORDER = "DOCUMENT_PATH_ASC" as const;
