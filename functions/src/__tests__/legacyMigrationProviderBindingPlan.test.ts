import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS,
  LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS,
  deriveLegacyMigrationProviderBindingPlan,
  type LegacyMigrationProviderBindingConfig,
} from "../migration/legacyMigrationProviderBindingPlan.js";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  validateLegacyMigrationSourceDiscoveryConfig,
} from "../migration/legacyMigrationSourceDiscovery.js";
import type { LegacyMigrationSourceDescriptor } from "../migration/legacyMigrationSourceDiscovery.js";
import { deriveLegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";
import type { LegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";

const makeSourcePlan = (sourceSet: readonly string[], overrides: Partial<{
  projectId?: string | null;
  databaseId?: string | null;
}> = {}): LegacyMigrationProviderSourcePlan => deriveLegacyMigrationProviderSourcePlan(
  validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet,
    ...overrides,
  }),
);

const bind = (overrides: LegacyMigrationProviderBindingConfig = {}): LegacyMigrationProviderBindingConfig => ({
  projectId: "legacy-project",
  databaseId: "legacy-database",
  ...overrides,
});

const makeCustomSourcePlan = (
  descriptors: readonly LegacyMigrationSourceDescriptor[],
  sourceSet: readonly string[],
): LegacyMigrationProviderSourcePlan => deriveLegacyMigrationProviderSourcePlan(
  validateLegacyMigrationSourceDiscoveryConfig({
    allowlistedSourceDescriptors: descriptors,
    supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet,
  }),
);

test("resolved empty source plan produces zero adapter bindings without selection", () => {
  const result = deriveLegacyMigrationProviderBindingPlan(makeSourcePlan([]), {});
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.deepEqual(result.plan.entries, []);
  assert.equal(result.plan.selectedProjectId, undefined);
  assert.equal(result.plan.selectedDatabaseId, undefined);
});

test("unresolved source discovery is propagated without provider selection", () => {
  const result = deriveLegacyMigrationProviderBindingPlan(makeSourcePlan(["legacy.missing"]), bind());
  assert.deepEqual(result, { kind: "source_discovery_required" });
});

test("AUTH-only binding requires project but never requires or emits a database", () => {
  const sourcePlan = makeSourcePlan(["legacy.auth_identity"]);
  const missing = deriveLegacyMigrationProviderBindingPlan(sourcePlan, {});
  assert.deepEqual(missing, { kind: "provider_selection_required", missing: "PROJECT" });
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind({ databaseId: null }));
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.equal(result.plan.entries.length, 1);
  assert.equal(result.plan.entries[0]?.providerSurface, "AUTH");
  assert.equal("selectedDatabaseId" in (result.plan.entries[0] ?? {}), false);
  assert.equal(result.plan.selectedDatabaseId, undefined);
});

test("FIRESTORE-only binding requires explicit project and database", () => {
  const sourcePlan = makeSourcePlan(["legacy.user_profile"]);
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(sourcePlan, { databaseId: "db" }), {
    kind: "provider_selection_required",
    missing: "PROJECT_AND_DATABASE",
  });
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "project" }), {
    kind: "provider_selection_required",
    missing: "DATABASE",
  });
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.equal(result.plan.entries.length, 1);
  assert.equal(result.plan.entries[0]?.providerSurface, "FIRESTORE");
  assert.equal(result.plan.entries[0]?.selectedDatabaseId, "legacy-database");
});

test("mixed AUTH and FIRESTORE plan binds one Auth and six Firestore entries", () => {
  const sourcePlan = makeSourcePlan(PROVEN_LEGACY_SOURCE_DESCRIPTORS.map((descriptor) => descriptor.logicalSourceId));
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.equal(result.plan.entries.filter((entry) => entry.providerSurface === "AUTH").length, 1);
  assert.equal(result.plan.entries.filter((entry) => entry.providerSurface === "FIRESTORE").length, 6);
  assert.equal(result.plan.selectedProjectId, "legacy-project");
  assert.equal(result.plan.selectedDatabaseId, "legacy-database");
  assert.equal(result.plan.entries.find((entry) => entry.logicalSourceId === "legacy.level")?.provenanceInput.logicalSourceId, "legacy.level");
  assert.equal(result.plan.entries.find((entry) => entry.logicalSourceId === "legacy.user_profile")?.pathTemplate.template, "users/{uid}");
});

test("matching source metadata is accepted, while project/database conflicts fail closed", () => {
  const matching = makeSourcePlan(["legacy.user_profile"], { projectId: "legacy-project", databaseId: "legacy-database" });
  assert.equal(deriveLegacyMigrationProviderBindingPlan(matching, bind()).kind, "resolved");
  const projectConflict = makeSourcePlan(["legacy.user_profile"], { projectId: "source-project" });
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(projectConflict, bind()), {
    kind: "unsupported_or_conflicting_binding",
    reason: "PROJECT_CONFLICT",
  });
  const databaseConflict = makeSourcePlan(["legacy.user_profile"], { databaseId: "source-database" });
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(databaseConflict, bind()), {
    kind: "unsupported_or_conflicting_binding",
    reason: "DATABASE_CONFLICT",
  });
});

test("adapter construction is permutation invariant and does not mutate caller inputs", () => {
  const ids = ["legacy.user_progress", "legacy.auth_identity", "legacy.level"] as const;
  const first = makeSourcePlan(ids);
  const second = makeSourcePlan([...ids].reverse());
  const firstResult = deriveLegacyMigrationProviderBindingPlan(first, bind());
  const secondResult = deriveLegacyMigrationProviderBindingPlan(second, bind());
  assert.deepEqual(secondResult, firstResult);
  assert.deepEqual(ids, ["legacy.user_progress", "legacy.auth_identity", "legacy.level"]);
  if (firstResult.kind === "resolved") {
    assert.deepEqual(firstResult.plan.entries.map((entry) => entry.logicalSourceId), [
      "legacy.auth_identity",
      "legacy.level",
      "legacy.user_progress",
    ]);
    assert.deepEqual(firstResult.plan.forbiddenOperations, LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS);
  }
});

test("duplicate and unsupported runtime entries fail closed", () => {
  const base = makeSourcePlan(["legacy.user_profile"]);
  assert.equal(base.kind, "resolved");
  if (base.kind !== "resolved") return;
  const duplicate = { ...base, entries: [base.entries[0]!, base.entries[0]!], selectedSourceIds: ["legacy.user_profile", "legacy.user_profile"] };
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(duplicate, bind()), {
    kind: "unsupported_or_conflicting_binding",
    reason: "DUPLICATE_LOGICAL_SOURCE_ID",
  });
  const unsupported = { ...base, entries: [{ ...base.entries[0]!, providerSurface: "OTHER" as never }] };
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(unsupported, bind()), {
    kind: "unsupported_or_conflicting_binding",
    reason: "UNSUPPORTED_PROVIDER_SURFACE",
  });
});

test("malformed binding values fail closed without importing provider SDKs", () => {
  const sourcePlan = makeSourcePlan(["legacy.auth_identity"]);
  assert.deepEqual(deriveLegacyMigrationProviderBindingPlan(sourcePlan, { projectId: "   " }), {
    kind: "unsupported_or_conflicting_binding",
    reason: "INVALID_BINDING_CONFIG",
  });
});

test("provider binding preserves every source metadata field", () => {
  const descriptor = {
    ...PROVEN_LEGACY_SOURCE_DESCRIPTORS.find((item) => item.logicalSourceId === "legacy.user_progress_attempt")!,
    organizationId: "metadata-org",
    institutionId: "metadata-institution",
    stableSourceIdentity: "metadata-stable-source",
  };
  const sourcePlan = makeCustomSourcePlan([descriptor], [descriptor.logicalSourceId]);
  assert.equal(sourcePlan.kind, "resolved");
  if (sourcePlan.kind !== "resolved") return;
  const sourceEntry = sourcePlan.entries[0]!;
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind({
    projectId: "binding-project",
    databaseId: "binding-database",
  }));
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  const boundEntry = result.plan.entries[0]!;
  assert.equal(boundEntry.logicalSourceId, sourceEntry.logicalSourceId);
  assert.equal(boundEntry.providerSurface, sourceEntry.providerSurface);
  assert.equal(boundEntry.sourceKind, sourceEntry.sourceKind);
  assert.equal(boundEntry.collectionPathTemplate, sourceEntry.collectionPathTemplate);
  assert.equal(boundEntry.schemaVariant, sourceEntry.schemaVariant);
  assert.equal(boundEntry.discoveryStrategyVersion, sourceEntry.discoveryStrategyVersion);
  assert.deepEqual(boundEntry.scopeDiscriminators, sourceEntry.scopeDiscriminators);
  assert.deepEqual(boundEntry.pathTemplate, sourceEntry.pathTemplate);
  assert.deepEqual(boundEntry.unresolvedPathBindings, sourceEntry.unresolvedPathBindings);
  assert.deepEqual(boundEntry.dependencies, sourceEntry.dependencies);
  assert.deepEqual(boundEntry.provenanceInput, sourceEntry.provenanceInput);
  assert.equal(boundEntry.selectedProjectId, "binding-project");
  assert.equal(boundEntry.providerSurface, "FIRESTORE");
  if (boundEntry.providerSurface !== "FIRESTORE") return;
  assert.equal(boundEntry.selectedDatabaseId, "binding-database");
  assert.equal(boundEntry.readOnly, true);
});

test("provider binding preserves provenance input without rewriting supported fields", () => {
  const descriptor = {
    ...PROVEN_LEGACY_SOURCE_DESCRIPTORS.find((item) => item.logicalSourceId === "legacy.user_profile")!,
    organizationId: "provenance-org",
    institutionId: "provenance-institution",
    stableSourceIdentity: "provenance-stable-source",
  };
  const sourcePlan = makeCustomSourcePlan([descriptor], [descriptor.logicalSourceId]);
  assert.equal(sourcePlan.kind, "resolved");
  if (sourcePlan.kind !== "resolved") return;
  const sourceEntry = sourcePlan.entries[0]!;
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  const boundEntry = result.plan.entries[0]!;
  assert.deepEqual(boundEntry.provenanceInput, sourceEntry.provenanceInput);
  assert.deepEqual(Object.keys(boundEntry.provenanceInput).sort(), Object.keys(sourceEntry.provenanceInput).sort());
  assert.equal(boundEntry.provenanceInput.organizationId, "provenance-org");
  assert.equal(boundEntry.provenanceInput.institutionId, "provenance-institution");
  assert.equal(boundEntry.provenanceInput.stableSourceIdentity, "provenance-stable-source");
});

test("provider binding preserves the ordered dependency graph", () => {
  const descriptor = PROVEN_LEGACY_SOURCE_DESCRIPTORS.find((item) => item.logicalSourceId === "legacy.user_progress_attempt")!;
  const sourcePlan = makeCustomSourcePlan([descriptor], [descriptor.logicalSourceId]);
  assert.equal(sourcePlan.kind, "resolved");
  if (sourcePlan.kind !== "resolved") return;
  const sourceEntry = sourcePlan.entries[0]!;
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  const boundEntry = result.plan.entries[0]!;
  assert.deepEqual(boundEntry.dependencies, sourceEntry.dependencies);
  assert.deepEqual(boundEntry.dependencies.map((dependency) => dependency.binding), [
    "uid",
    "progressId",
    "attemptId",
  ]);
  assert.deepEqual(boundEntry.dependencies[2]?.requiresBindings, ["uid", "progressId"]);
  assert.deepEqual(boundEntry.unresolvedPathBindings, sourceEntry.unresolvedPathBindings);
});

test("resolved binding plans expose exact read-only capability semantics", () => {
  const sourcePlan = makeSourcePlan(PROVEN_LEGACY_SOURCE_DESCRIPTORS.map((descriptor) => descriptor.logicalSourceId));
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  assert.equal(result.plan.capability, "READ_ONLY");
  assert.deepEqual(result.plan.allowedOperations, LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS);
  assert.deepEqual(result.plan.allowedOperations, ["READ"]);
  assert.deepEqual(result.plan.forbiddenOperations, LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS);
  assert.deepEqual(result.plan.forbiddenOperations, [
    "WRITE",
    "UPDATE",
    "DELETE",
    "TRANSACTION_WRITE",
    "BATCH_WRITE",
    "MIGRATION_APPLY",
  ]);
  assert.equal(result.plan.allowedOperations.some((operation) => result.plan.forbiddenOperations.includes(operation as never)), false);
  for (const entry of result.plan.entries) assert.equal(entry.readOnly, true);
  assert.equal(result.plan.entries.some((entry) => entry.providerSurface === "AUTH" && entry.readOnly !== true), false);
  assert.equal(result.plan.entries.some((entry) => entry.providerSurface === "FIRESTORE" && entry.readOnly !== true), false);
});

test("provider binding does not mutate deeply nested source-plan input", () => {
  const descriptor = {
    ...PROVEN_LEGACY_SOURCE_DESCRIPTORS.find((item) => item.logicalSourceId === "legacy.user_progress_attempt")!,
    organizationId: "immutable-org",
    institutionId: "immutable-institution",
    stableSourceIdentity: "immutable-stable-source",
  };
  const sourcePlan = makeCustomSourcePlan([descriptor], [descriptor.logicalSourceId]);
  const before = JSON.parse(JSON.stringify(sourcePlan)) as unknown;
  const result = deriveLegacyMigrationProviderBindingPlan(sourcePlan, bind());
  assert.deepEqual(sourcePlan, before);
  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") return;
  const sourceEntry = sourcePlan.kind === "resolved" ? sourcePlan.entries[0]! : undefined;
  const boundEntry = result.plan.entries[0]!;
  assert.notStrictEqual(boundEntry.scopeDiscriminators, sourceEntry?.scopeDiscriminators);
  assert.notStrictEqual(boundEntry.pathTemplate, sourceEntry?.pathTemplate);
  assert.notStrictEqual(boundEntry.unresolvedPathBindings, sourceEntry?.unresolvedPathBindings);
  assert.notStrictEqual(boundEntry.dependencies, sourceEntry?.dependencies);
  assert.notStrictEqual(boundEntry.dependencies[0]?.requiresBindings, sourceEntry?.dependencies[0]?.requiresBindings);
  assert.notStrictEqual(boundEntry.provenanceInput, sourceEntry?.provenanceInput);
});
