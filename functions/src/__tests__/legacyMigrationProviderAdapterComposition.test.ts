import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  validateLegacyMigrationSourceDiscoveryConfig,
} from "../migration/legacyMigrationSourceDiscovery.js";
import { deriveLegacyMigrationProviderBindingPlan } from "../migration/legacyMigrationProviderBindingPlan.js";
import { deriveLegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";
import {
  createLegacyMigrationSourceReadPort,
  type LegacyMigrationProviderClients,
} from "../migration/legacyMigrationProviderClientFactory.js";

const plan = (sourceSet: readonly string[]) => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS, supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT], discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION, discoveryMode: "ALLOWLIST_ONLY", sourceSet,
  }));
  const bound = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "legacy-project", databaseId: "legacy-database" });
  assert.equal(bound.kind, "resolved");
  if (bound.kind !== "resolved") throw new Error("binding did not resolve");
  return bound.plan;
};

const clients = (calls: { authReads: number; firestoreReads: number }): LegacyMigrationProviderClients => ({
  selectedProjectId: "legacy-project",
  selectedDatabaseId: "legacy-database",
  auth: { getUser: async () => { calls.authReads += 1; return { uid: "uid-1" }; } },
  firestore: { getDocument: async () => { calls.firestoreReads += 1; return { exists: false, id: "", data: null }; } },
});

test("AUTH entries select the Auth adapter without reading", () => {
  const calls = { authReads: 0, firestoreReads: 0 };
  const binding = plan(["legacy.auth_identity"]).entries[0]!;
  const port = createLegacyMigrationSourceReadPort(binding, clients(calls), { authUid: "uid-1" });
  assert.equal((port as { binding?: { providerSurface?: string } }).binding?.providerSurface, "AUTH");
  assert.deepEqual(calls, { authReads: 0, firestoreReads: 0 });
});

test("FIRESTORE entries select the Firestore adapter without reading", () => {
  const calls = { authReads: 0, firestoreReads: 0 };
  const binding = plan(["legacy.user_profile"]).entries[0]!;
  const port = createLegacyMigrationSourceReadPort(binding, clients(calls), { pathBindings: { uid: "uid-1" } });
  assert.equal((port as { binding?: { providerSurface?: string } }).binding?.providerSurface, "FIRESTORE");
  assert.deepEqual(calls, { authReads: 0, firestoreReads: 0 });
});

test("mixed entries preserve deterministic binding ordering and selection", () => {
  const mixed = plan(["legacy.user_progress", "legacy.auth_identity", "legacy.user_profile"]);
  assert.deepEqual(mixed.entries.map((entry) => entry.logicalSourceId), ["legacy.auth_identity", "legacy.user_profile", "legacy.user_progress"]);
  const calls = { authReads: 0, firestoreReads: 0 };
  const ports = mixed.entries.map((entry) => createLegacyMigrationSourceReadPort(entry, clients(calls), entry.providerSurface === "AUTH" ? { authUid: "uid-1" } : { pathBindings: { uid: "uid-1", progressId: "progress-1" } }));
  assert.deepEqual(ports.map((port) => (port as unknown as { binding: { providerSurface: string } }).binding.providerSurface), ["AUTH", "FIRESTORE", "FIRESTORE"]);
  assert.deepEqual(calls, { authReads: 0, firestoreReads: 0 });
});

test("cross-surface mismatch rejects before provider read", () => {
  const calls = { authReads: 0, firestoreReads: 0 };
  const binding = plan(["legacy.auth_identity"]).entries[0]!;
  assert.throws(() => createLegacyMigrationSourceReadPort({ ...binding, sourceKind: "user_profile" } as never, clients(calls), { authUid: "uid-1" }), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED");
  assert.deepEqual(calls, { authReads: 0, firestoreReads: 0 });
});
