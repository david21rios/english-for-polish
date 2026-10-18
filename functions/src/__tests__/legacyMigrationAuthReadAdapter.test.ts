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
import { createLegacyMigrationAuthReadAdapter } from "../migration/legacyMigrationAuthReadAdapter.js";
import type { LegacyMigrationReadOnlyProviderAdapterAuthEntry } from "../migration/legacyMigrationProviderBindingPlan.js";
import type { LegacyMigrationAuthReadDependency } from "../migration/legacyMigrationAuthReadAdapter.js";

const entry = (): LegacyMigrationReadOnlyProviderAdapterAuthEntry => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet: ["legacy.auth_identity"],
  }));
  const binding = deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "legacy-project" });
  assert.equal(binding.kind, "resolved");
  if (binding.kind !== "resolved" || binding.plan.entries[0]?.providerSurface !== "AUTH") throw new Error("Auth entry did not resolve");
  return binding.plan.entries[0];
};

const dependency = (user: unknown, onRead?: () => void): LegacyMigrationAuthReadDependency => Object.freeze({
  getUser: async () => { onRead?.(); return user as never; },
});

test("Auth adapter propagates explicit project and metadata", async () => {
  const binding = entry();
  const adapter = createLegacyMigrationAuthReadAdapter({ entry: binding, dependency: dependency({ uid: "uid-1", email: "u@example.test" }), uid: "uid-1" });
  assert.equal(adapter.binding.selectedProjectId, "legacy-project");
  assert.equal(adapter.binding.logicalSourceId, binding.logicalSourceId);
  assert.deepEqual(adapter.binding.provenanceInput, binding.provenanceInput);
  assert.deepEqual(adapter.binding.scopeDiscriminators, binding.scopeDiscriminators);
});

test("Auth adapter preserves provenance and returns normalized output", async () => {
  const adapter = createLegacyMigrationAuthReadAdapter({
    entry: entry(),
    dependency: dependency({ uid: "uid-1", email: "u@example.test", emailVerified: true, disabled: false }),
    uid: "uid-1",
  });
  const result = await adapter.readCandidates();
  assert.equal(result.kind, "records");
  if (result.kind !== "records") return;
  assert.equal(result.records.length, 1);
  assert.deepEqual(result.records[0]?.sourceReference, { collectionPath: "auth", entityKind: "auth_identity", recordId: "uid-1" });
  assert.equal(result.records[0]?.targetReference.targetReference, "identities/uid-1");
  assert.equal(result.records[0]?.expectedTargetProjection.semanticFields.email, "u@example.test");
  assert.equal(result.records[0]?.expectedTargetProjection.semanticFields.emailVerified, true);
  assert.equal(result.records[0]?.provenance.logicalSourceId, "legacy.auth_identity");
  assert.equal(result.records[0]?.provenance.legacyDocumentId, "uid-1");
  assert.equal(result.records[0]?.provenance.sourceReference.recordId, "uid-1");
  assert.equal(result.records[0]?.providerBinding.logicalSourceId, "legacy.auth_identity");
  assert.equal(result.records[0]?.providerBinding.providerSurface, "AUTH");
  assert.equal(result.records[0]?.providerBinding.selectedProjectId, "legacy-project");
  assert.equal(result.records[0]?.providerBinding.collectionPathTemplate, "auth");
  assert.equal(result.records[0]?.providerBinding.resolvedPathBindings.uid, "uid-1");
  assert.equal("selectedDatabaseId" in (result.records[0]?.providerBinding ?? {}), false);
  assert.deepEqual(result.records[0]?.providerBinding.scopeDiscriminators, {
    organizationId: null,
    institutionId: null,
    stableSourceIdentity: null,
  });
});

test("Auth adapter output is deterministic", async () => {
  const make = () => createLegacyMigrationAuthReadAdapter({ entry: entry(), dependency: dependency({ uid: "uid-1", email: "u@example.test" }), uid: "uid-1" });
  assert.deepEqual(await make().readCandidates(), await make().readCandidates());
});

test("Auth adapter rejects malformed configuration and unsupported source", () => {
  const binding = entry();
  assert.throws(() => createLegacyMigrationAuthReadAdapter({ entry: { ...binding, selectedProjectId: "   " }, dependency: dependency({ uid: "uid-1" }), uid: "uid-1" }), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "REQUEST_INVALID");
  assert.throws(() => createLegacyMigrationAuthReadAdapter({ entry: { ...binding, sourceKind: "user_profile" } as never, dependency: dependency({ uid: "uid-1" }), uid: "uid-1" }), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED");
  assert.throws(() => createLegacyMigrationAuthReadAdapter({ entry: { ...binding, logicalSourceId: "legacy.user_profile" } as never, dependency: dependency({ uid: "uid-1" }), uid: "uid-1" }), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "SOURCE_DISCOVERY_REQUIRED");
});

test("Auth provider read failure maps to SOURCE_READ_FAILURE", async () => {
  const adapter = createLegacyMigrationAuthReadAdapter({ entry: entry(), dependency: Object.freeze({ getUser: async () => { throw new Error("fake provider failure"); } }), uid: "uid-1" });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && error.name === "LegacyMigrationDryRunError" && (error as { category?: string }).category === "SOURCE_READ_FAILURE");
});

test("malformed Auth provider records map to MALFORMED_SOURCE_DATA", async () => {
  const adapter = createLegacyMigrationAuthReadAdapter({ entry: entry(), dependency: dependency({ email: "missing uid" }), uid: "uid-1" });
  await assert.rejects(adapter.readCandidates(), (error: unknown) => error instanceof Error && (error as { category?: string }).category === "MALFORMED_SOURCE_DATA");
});

test("Auth adapter requires only a narrow read dependency", () => {
  const calls: string[] = [];
  const narrow = Object.freeze({ getUser: async (uid: string) => { calls.push(uid); return { uid }; } });
  const adapter = createLegacyMigrationAuthReadAdapter({ entry: entry(), dependency: narrow, uid: "uid-1" });
  assert.deepEqual(Object.keys(narrow), ["getUser"]);
  assert.equal(typeof adapter.readCandidates, "function");
  assert.deepEqual(calls, []);
});
