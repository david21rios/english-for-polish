import { LegacyMigrationDryRunError } from "./legacyMigrationDryRunOrchestrator.js";
import {
  type LegacyMigrationReadOnlyProviderAdapterAuthEntry,
  type LegacyMigrationReadOnlyProviderAdapterFirestoreEntry,
  type LegacyMigrationReadOnlyProviderAdapterPlan,
} from "./legacyMigrationProviderBindingPlan.js";
import type { LegacyMigrationSourceReadPort } from "./legacyMigrationReadPorts.js";
import { createLegacyMigrationAuthReadAdapter } from "./legacyMigrationAuthReadAdapter.js";
import { createLegacyMigrationFirestoreReadAdapter } from "./legacyMigrationFirestoreReadAdapter.js";

export type LegacyMigrationRawAuthUser = Readonly<Record<string, unknown>>;

export type LegacyMigrationRawFirestoreDocument = Readonly<{
  exists: boolean;
  id: string;
  data: unknown;
}>;

/** Minimal application handle contract; App construction remains outside migration adapters. */
export type LegacyMigrationAppHandle = Readonly<{
  options?: Readonly<{ projectId?: string | null }>;
}>;

export type LegacyMigrationAuthReadDependency = Readonly<{
  getUser: (uid: string) => Promise<LegacyMigrationRawAuthUser>;
}>;

export type LegacyMigrationFirestoreReadDependency = Readonly<{
  getDocument: (path: string) => Promise<LegacyMigrationRawFirestoreDocument>;
}>;

export type LegacyMigrationProviderClientResolver = Readonly<{
  resolveAuth: (app: LegacyMigrationAppHandle, projectId: string) => LegacyMigrationAuthReadDependency;
  resolveFirestore: (app: LegacyMigrationAppHandle, projectId: string, databaseId: string) => LegacyMigrationFirestoreReadDependency;
}>;

export type LegacyMigrationProviderClients = Readonly<{
  selectedProjectId?: string;
  selectedDatabaseId?: string;
  auth?: LegacyMigrationAuthReadDependency;
  firestore?: LegacyMigrationFirestoreReadDependency;
}>;

export type LegacyMigrationProviderClientFactoryFailureReason =
  "PROJECT_CONFLICT" | "DATABASE_CONFLICT" | "INVALID_SOURCE_PLAN" | "INVALID_BINDING_CONFIG";

export type LegacyMigrationProviderClientFactoryResult =
  | Readonly<{ kind: "resolved"; clients: LegacyMigrationProviderClients }>
  | Readonly<{ kind: "provider_selection_required"; missing: "PROJECT" | "DATABASE" }>
  | Readonly<{
    kind: "unsupported_or_conflicting_binding";
    reason: LegacyMigrationProviderClientFactoryFailureReason;
  }>;

export type LegacyMigrationAdapterRuntimeBindings = Readonly<{
  authUid?: string;
  pathBindings?: Readonly<Record<string, string>>;
}>;

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const hasAuth = (plan: LegacyMigrationReadOnlyProviderAdapterPlan): boolean =>
  plan.entries.some((entry) => entry.providerSurface === "AUTH");

const hasFirestore = (plan: LegacyMigrationReadOnlyProviderAdapterPlan): boolean =>
  plan.entries.some((entry) => entry.providerSurface === "FIRESTORE");

const reject = (reason: LegacyMigrationProviderClientFactoryFailureReason): LegacyMigrationProviderClientFactoryResult => ({
  kind: "unsupported_or_conflicting_binding",
  reason,
});

export const createLegacyMigrationProviderClients = (
  app: LegacyMigrationAppHandle,
  plan: LegacyMigrationReadOnlyProviderAdapterPlan,
  resolver: LegacyMigrationProviderClientResolver,
): LegacyMigrationProviderClientFactoryResult => {
  if (!nonEmpty(plan.selectedProjectId)) {
    return hasAuth(plan) || hasFirestore(plan)
      ? { kind: "provider_selection_required", missing: "PROJECT" }
      : { kind: "resolved", clients: Object.freeze({}) };
  }
  if (typeof app?.options?.projectId !== "string" || app.options.projectId !== plan.selectedProjectId) {
    return reject("PROJECT_CONFLICT");
  }
  if (hasFirestore(plan) && !nonEmpty(plan.selectedDatabaseId)) {
    return { kind: "provider_selection_required", missing: "DATABASE" };
  }
  if (plan.entries.some((entry) => entry.selectedProjectId !== plan.selectedProjectId)) {
    return reject("PROJECT_CONFLICT");
  }
  if (plan.entries.some((entry) => entry.providerSurface === "FIRESTORE" && entry.selectedDatabaseId !== plan.selectedDatabaseId)) {
    return reject("DATABASE_CONFLICT");
  }
  try {
    const clients: {
      selectedProjectId: string;
      selectedDatabaseId?: string;
      auth?: LegacyMigrationAuthReadDependency;
      firestore?: LegacyMigrationFirestoreReadDependency;
    } = { selectedProjectId: plan.selectedProjectId };
    if (hasAuth(plan)) clients.auth = resolver.resolveAuth(app, plan.selectedProjectId);
    if (hasFirestore(plan)) clients.firestore = resolver.resolveFirestore(app, plan.selectedProjectId, plan.selectedDatabaseId!);
    if (plan.selectedDatabaseId !== undefined) clients.selectedDatabaseId = plan.selectedDatabaseId;
    return { kind: "resolved", clients: Object.freeze(clients) };
  } catch (error) {
    throw new LegacyMigrationDryRunError("SOURCE_READ_FAILURE", "Provider client resolution failed.", error);
  }
};

export const createLegacyMigrationSourceReadPort = (
  entry: LegacyMigrationReadOnlyProviderAdapterAuthEntry | LegacyMigrationReadOnlyProviderAdapterFirestoreEntry,
  clients: LegacyMigrationProviderClients,
  runtimeBindings: LegacyMigrationAdapterRuntimeBindings = {},
): LegacyMigrationSourceReadPort => {
  if (!nonEmpty(clients.selectedProjectId) || entry.selectedProjectId !== clients.selectedProjectId) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "Provider binding project does not match the selected client.");
  }
  if (entry.providerSurface === "AUTH") {
    if (entry.sourceKind !== "auth_identity" || clients.auth === undefined || !nonEmpty(runtimeBindings.authUid)) {
      throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "Auth source binding is incomplete.");
    }
    return createLegacyMigrationAuthReadAdapter({ entry, dependency: clients.auth, uid: runtimeBindings.authUid });
  }
  if (entry.sourceKind === "auth_identity" || clients.firestore === undefined ||
    !nonEmpty(clients.selectedDatabaseId) || entry.selectedDatabaseId !== clients.selectedDatabaseId) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "Firestore source binding is incomplete.");
  }
  return createLegacyMigrationFirestoreReadAdapter({
    entry,
    dependency: clients.firestore,
    pathBindings: runtimeBindings.pathBindings ?? {},
  });
};
