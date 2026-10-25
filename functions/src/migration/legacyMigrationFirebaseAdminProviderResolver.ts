import { createRequire } from "node:module";
import type {
  LegacyMigrationAppHandle,
  LegacyMigrationAuthReadDependency,
  LegacyMigrationFirestoreReadDependency,
  LegacyMigrationProviderClientResolver,
} from "./legacyMigrationProviderClientFactory.js";
import { createLegacyMigrationFirebaseAdminCollectionQueryBridge, type LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime } from "./legacyMigrationFirebaseAdminCollectionQueryBridge.js";

type AuthClient = Readonly<{
  getUser: (uid: string) => Promise<unknown>;
}>;

type PointDocumentSnapshot = Readonly<{
  exists: boolean;
  id: string;
  data: () => unknown;
}>;

type PointFirestoreClient = Readonly<{
  doc: (path: string) => Readonly<{ get: () => Promise<PointDocumentSnapshot> }>;
}>;

export type LegacyMigrationFirebaseAdminProviderResolverRuntime = Readonly<{
  getAuth: (app: LegacyMigrationAppHandle) => AuthClient;
  getFirestore: (app: LegacyMigrationAppHandle, databaseId: string) => PointFirestoreClient;
  collectionQueryRuntime?: Partial<LegacyMigrationFirebaseAdminCollectionQueryBridgeRuntime>;
}>;

export type LegacyMigrationFirebaseAdminProviderResolverInput = Readonly<{
  runtime?: Partial<LegacyMigrationFirebaseAdminProviderResolverRuntime>;
}>;

const require = createRequire(import.meta.url);

type FirebaseAdminAuthModule = Readonly<{
  getAuth: (app: unknown) => AuthClient;
}>;

type FirebaseAdminFirestoreModule = Readonly<{
  getFirestore: (app: unknown, databaseId: string) => unknown;
}>;

const firebaseAdminAuth = (): FirebaseAdminAuthModule => require("firebase-admin/auth") as FirebaseAdminAuthModule;
const firebaseAdminFirestore = (): FirebaseAdminFirestoreModule => require("firebase-admin/firestore") as FirebaseAdminFirestoreModule;

const defaultRuntime: LegacyMigrationFirebaseAdminProviderResolverRuntime = {
  getAuth: (app) => firebaseAdminAuth().getAuth(app),
  getFirestore: (app, databaseId) => firebaseAdminFirestore().getFirestore(app, databaseId) as PointFirestoreClient,
};

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();

const copyData = (value: unknown): unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : value;

const validateBinding = (app: LegacyMigrationAppHandle, projectId: string, databaseId?: string): void => {
  if (!nonEmpty(projectId) || !nonEmpty(app?.options?.projectId) || app.options?.projectId !== projectId) {
    throw new TypeError("Requested project does not match the Firebase App project.");
  }
  if (databaseId !== undefined && !nonEmpty(databaseId)) throw new TypeError("Explicit database binding is required.");
};

export const createLegacyMigrationFirebaseAdminProviderResolver = (
  input: LegacyMigrationFirebaseAdminProviderResolverInput = {},
): LegacyMigrationProviderClientResolver => {
  const runtime: LegacyMigrationFirebaseAdminProviderResolverRuntime = {
    ...defaultRuntime,
    ...(input.runtime ?? {}),
  };
  if (typeof runtime.getAuth !== "function" || typeof runtime.getFirestore !== "function") {
    throw new TypeError("Firebase Admin provider resolver runtime is incomplete.");
  }

  return Object.freeze({
    resolveAuth: (app, projectId): LegacyMigrationAuthReadDependency => {
      validateBinding(app, projectId);
      const auth = runtime.getAuth(app);
      return Object.freeze({
        getUser: async (uid: string) => {
          if (!nonEmpty(uid)) throw new TypeError("Auth user ID is required.");
          const user = await auth.getUser(uid);
          return copyData(user) as Readonly<Record<string, unknown>>;
        },
      });
    },
    resolveFirestore: (app, projectId, databaseId): LegacyMigrationFirestoreReadDependency => {
      validateBinding(app, projectId, databaseId);
      const firestore = runtime.getFirestore(app, databaseId);
      return Object.freeze({
        getDocument: async (path: string) => {
          if (!nonEmpty(path)) throw new TypeError("Firestore document path is required.");
          const snapshot = await firestore.doc(path).get();
          return {
            exists: snapshot.exists,
            id: snapshot.id,
            data: snapshot.exists ? copyData(snapshot.data()) : null,
          };
        },
      });
    },
    resolveFirestoreCollection: (app, projectId, databaseId) => {
      validateBinding(app, projectId, databaseId);
      return createLegacyMigrationFirebaseAdminCollectionQueryBridge({
        app,
        ...(runtime.collectionQueryRuntime === undefined ? {} : { runtime: runtime.collectionQueryRuntime }),
      });
    },
  });
};
