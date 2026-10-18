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
import { createLegacyMigrationFirestoreReadAdapter } from "../migration/legacyMigrationFirestoreReadAdapter.js";
import type { LegacyMigrationReadOnlyProviderAdapterFirestoreEntry } from "../migration/legacyMigrationProviderBindingPlan.js";
import type { LegacyMigrationFirestoreReadDependency } from "../migration/legacyMigrationFirestoreReadAdapter.js";

const entry = (sourceId = "legacy.user_profile"): LegacyMigrationReadOnlyProviderAdapterFirestoreEntry => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet: [sourceId],
  }));
  const binding = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "legacy-project", databaseId: "legacy-database" });
  assert.equal(binding.kind, "resolved");
  if (binding.kind !== "resolved" || binding.plan.entries[0]?.providerSurface !== "FIRESTORE") throw new Error("Firestore entry did not resolve");
  return binding.plan.entries[0];
};

const dependency = (document: unknown, paths?: string[]): LegacyMigrationFirestoreReadDependency => Object.freeze({
  getDocument: async (path: string) => { paths?.push(path); return document as never; },
});

test("Firestore adapter propagates explicit project and database", () => {
  const binding = entry();
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: binding, dependency: dependency({ exists: false, id: "", data: null }), pathBindings: { uid: "uid-1" } });
  assert.equal(adapter.binding.selectedProjectId, "legacy-project");
  assert.equal(adapter.binding.selectedDatabaseId, "legacy-database");
});

test("Firestore adapter resolves the exact path and normalizes a document", async () => {
  const paths: string[] = [];
  const adapter = createLegacyMigrationFirestoreReadAdapter({
    entry: entry(),
    dependency: dependency({ exists: true, id: "uid-1", data: { uid: "uid-1", displayName: "User" } }, paths),
    pathBindings: { uid: "uid-1" },
  });
  const result = await adapter.readCandidates();
  assert.deepEqual(paths, ["users/uid-1"]);
  assert.equal(result.kind, "records");
  if (result.kind !== "records") return;
  assert.deepEqual(result.records[0]?.sourceReference, { collectionPath: "users/uid-1", entityKind: "user_profile", recordId: "uid-1" });
  assert.equal(result.records[0]?.expectedTargetProjection.semanticFields.displayName, "User");
  assert.equal(result.records[0]?.provenance.logicalSourceId, "legacy.user_profile");
  assert.equal(result.records[0]?.provenance.sourceReference.collectionPath, "users/uid-1");
  assert.equal(result.records[0]?.provenance.legacyDocumentId, "uid-1");
  assert.equal(result.records[0]?.providerBinding.logicalSourceId, "legacy.user_profile");
  assert.equal(result.records[0]?.providerBinding.providerSurface, "FIRESTORE");
  assert.equal(result.records[0]?.providerBinding.selectedProjectId, "legacy-project");
  assert.equal(result.records[0]?.providerBinding.selectedDatabaseId, "legacy-database");
  assert.deepEqual(result.records[0]?.providerBinding.resolvedPathBindings, { uid: "uid-1" });
});

test("Firestore adapter preserves canonical binding and path coherence for all six Firestore sources", async () => {
  const firestoreSourceIds = PROVEN_LEGACY_SOURCE_DESCRIPTORS
    .filter((descriptor) => descriptor.logicalSourceId !== "legacy.auth_identity")
    .map((descriptor) => descriptor.logicalSourceId);
  assert.equal(firestoreSourceIds.length, 6);
  for (const sourceId of firestoreSourceIds) {
    const binding = entry(sourceId);
    const pathBindings = Object.fromEntries(binding.pathTemplate.bindings.map((name) => [name, `${name}-1`])) as Record<string, string>;
    const paths: string[] = [];
    const adapter = createLegacyMigrationFirestoreReadAdapter({
      entry: binding,
      dependency: dependency({ exists: true, id: "document-1", data: { sourceId } }, paths),
      pathBindings,
    });
    const result = await adapter.readCandidates();
    assert.equal(result.kind, "records");
    if (result.kind !== "records") continue;
    const record = result.records[0];
    const expectedPath = binding.pathTemplate.template.replace(/\{([^}]+)\}/gu, (_token, name: string) => pathBindings[name]!);
    assert.deepEqual(paths, [expectedPath]);
    assert.equal(record?.providerBinding.logicalSourceId, sourceId);
    assert.equal(record?.providerBinding.providerSurface, "FIRESTORE");
    assert.equal(record?.providerBinding.selectedProjectId, "legacy-project");
    assert.equal(record?.providerBinding.selectedDatabaseId, "legacy-database");
    assert.deepEqual(record?.providerBinding.resolvedPathBindings, pathBindings);
    assert.equal(record?.sourceReference.collectionPath, expectedPath);
    assert.equal(record?.provenance.sourceReference.collectionPath, expectedPath);
    assert.equal(record?.provenance.legacyDocumentId, "document-1");
  }
});

test("unresolved Firestore bindings fail before any provider read", async () => {
  const paths: string[] = [];
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: entry(), dependency: dependency({ exists: false, id: "", data: null }, paths), pathBindings: {} });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED");
  assert.deepEqual(paths, []);
});

test("unexpected Firestore bindings fail before any provider read", async () => {
  const paths: string[] = [];
  const adapter = createLegacyMigrationFirestoreReadAdapter({
    entry: entry(),
    dependency: dependency({ exists: false, id: "", data: null }, paths),
    pathBindings: { uid: "uid-1", unexpected: "value" },
  });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED");
  assert.deepEqual(paths, []);
});

test("Firestore adapter preserves scope, metadata, and provenance", async () => {
  const descriptor = { ...PROVEN_LEGACY_SOURCE_DESCRIPTORS.find((item) => item.logicalSourceId === "legacy.user_profile")!, organizationId: "org-1", institutionId: "inst-1", stableSourceIdentity: "profile-1" };
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: [descriptor], supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT], discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION, discoveryMode: "ALLOWLIST_ONLY", sourceSet: [descriptor.logicalSourceId],
  }));
  const bound = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "legacy-project", databaseId: "legacy-database" });
  assert.equal(bound.kind, "resolved");
  if (bound.kind !== "resolved" || bound.plan.entries[0]?.providerSurface !== "FIRESTORE") return;
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: bound.plan.entries[0], dependency: dependency({ exists: true, id: "uid-1", data: { uid: "uid-1" } }), pathBindings: { uid: "uid-1" } });
  assert.deepEqual(adapter.binding.scopeDiscriminators, { organizationId: "org-1", institutionId: "inst-1", stableSourceIdentity: "profile-1" });
  assert.deepEqual(adapter.binding.provenanceInput, { logicalSourceId: "legacy.user_profile", collectionPathTemplate: "users/{uid}", entityKind: "user_profile", schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT, discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION, organizationId: "org-1", institutionId: "inst-1", stableSourceIdentity: "profile-1" });
  const result = await adapter.readCandidates();
  assert.equal(result.kind, "records");
  if (result.kind === "records") {
    assert.deepEqual(result.records[0]?.providerBinding.scopeDiscriminators, {
      organizationId: "org-1",
      institutionId: "inst-1",
      stableSourceIdentity: "profile-1",
    });
    assert.equal(result.records[0]?.provenance.logicalSourceId, "legacy.user_profile");
  }
});

test("Firestore adapter output is deterministic", async () => {
  const make = () => createLegacyMigrationFirestoreReadAdapter({ entry: entry(), dependency: dependency({ exists: true, id: "uid-1", data: { uid: "uid-1" } }), pathBindings: { uid: "uid-1" } });
  assert.deepEqual(await make().readCandidates(), await make().readCandidates());
});

test("Firestore provider read failure maps to SOURCE_READ_FAILURE", async () => {
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: entry(), dependency: Object.freeze({ getDocument: async () => { throw new Error("fake failure"); } }), pathBindings: { uid: "uid-1" } });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_READ_FAILURE");
});

test("malformed Firestore records map to MALFORMED_SOURCE_DATA", async () => {
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: entry(), dependency: dependency({ exists: true, id: "uid-1", data: null }), pathBindings: { uid: "uid-1" } });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "MALFORMED_SOURCE_DATA");
});

test("Firestore adapter rejects noncanonical and wrong-surface source metadata", () => {
  const binding = entry();
  assert.throws(
    () => createLegacyMigrationFirestoreReadAdapter({
      entry: { ...binding, logicalSourceId: "legacy.auth_identity" } as never,
      dependency: dependency({ exists: false, id: "", data: null }),
      pathBindings: { uid: "uid-1" },
    }),
    (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED",
  );
  assert.throws(
    () => createLegacyMigrationFirestoreReadAdapter({
      entry: { ...binding, providerSurface: "AUTH" } as never,
      dependency: dependency({ exists: false, id: "", data: null }),
      pathBindings: { uid: "uid-1" },
    }),
    (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED",
  );
});

test("Firestore adapter requires only a narrow read dependency", () => {
  const narrow = Object.freeze({ getDocument: async () => ({ exists: false, id: "", data: null }) });
  const adapter = createLegacyMigrationFirestoreReadAdapter({ entry: entry(), dependency: narrow, pathBindings: { uid: "uid-1" } });
  assert.deepEqual(Object.keys(narrow), ["getDocument"]);
  assert.equal(typeof adapter.readCandidates, "function");
});
