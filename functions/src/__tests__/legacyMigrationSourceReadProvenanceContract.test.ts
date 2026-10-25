import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  createLegacyMigrationSourceProvenance,
} from "../migration/legacyMigrationSourceDiscovery.js";
import {
  resolveLegacyMigrationProviderSourcePlanForLogicalSource,
  type LegacyMigrationPathTemplateAnalysis,
  type LegacyMigrationSourceProvenanceInput,
} from "../migration/legacyMigrationProviderSourcePlan.js";
import {
  type LegacyMigrationSourceProviderBindingContext,
  type LegacyMigrationSourceRecord,
} from "../migration/legacyMigrationReadPorts.js";

const pathTemplate = (template: string): LegacyMigrationPathTemplateAnalysis => ({
  template,
  pathSegments: template.split("/"),
  bindings: [...template.matchAll(/\{([^}]+)\}/gu)].map((match) => match[1]!),
});

const provenanceInput = (logicalSourceId: string, template: string): LegacyMigrationSourceProvenanceInput => ({
  logicalSourceId,
  collectionPathTemplate: template,
  entityKind: "user_profile",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  organizationId: "org-1",
  institutionId: "inst-1",
  stableSourceIdentity: "stable-1",
});

const authBinding = (): LegacyMigrationSourceProviderBindingContext => ({
  logicalSourceId: "legacy.auth_identity",
  providerSurface: "AUTH",
  sourceKind: "auth_identity",
  selectedProjectId: "demo-project",
  collectionPathTemplate: "auth",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  scopeDiscriminators: { organizationId: null, institutionId: null, stableSourceIdentity: null },
  pathTemplate: pathTemplate("auth"),
  provenanceInput: provenanceInput("legacy.auth_identity", "auth"),
  resolvedPathBindings: { uid: "user-1" },
});

const firestoreBinding = (): LegacyMigrationSourceProviderBindingContext => ({
  logicalSourceId: "legacy.user_profile",
  providerSurface: "FIRESTORE",
  sourceKind: "user_profile",
  selectedProjectId: "demo-project",
  selectedDatabaseId: "(default)",
  collectionPathTemplate: "users/{uid}",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  scopeDiscriminators: { organizationId: "org-1", institutionId: "inst-1", stableSourceIdentity: "stable-1" },
  pathTemplate: pathTemplate("users/{uid}"),
  provenanceInput: provenanceInput("legacy.user_profile", "users/{uid}"),
  resolvedPathBindings: { uid: "user-1" },
});

const provenance = (logicalSourceId: string, collectionPath: string | null, recordId: string) => createLegacyMigrationSourceProvenance({
  logicalSourceId,
  collectionPath,
  legacyDocumentId: recordId,
  sourceKind: logicalSourceId === "legacy.auth_identity" ? "auth_identity" : "user_profile",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  sourceReference: { collectionPath, entityKind: "identity", recordId },
  organizationId: "org-1",
  institutionId: "inst-1",
});

test("source records require canonical provenance and typed provider binding context", () => {
  const record: LegacyMigrationSourceRecord = {
    candidateType: "identity_migration",
    sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "user-1" },
    targetReference: { tenantId: "tenant-1", entityType: "identity", targetId: "user-1", targetReference: "identities/user-1" },
    expectedTargetProjection: {
      exists: false,
      comparable: true,
      entityType: "identity",
      targetId: "user-1",
      tenantId: "tenant-1",
      semanticFields: {},
    },
    provenance: provenance("legacy.user_profile", "users", "user-1"),
    providerBinding: firestoreBinding(),
  };
  assert.equal(record.provenance.logicalSourceId, "legacy.user_profile");
  assert.equal(record.providerBinding.providerSurface, "FIRESTORE");
  assert.equal(record.providerBinding.selectedDatabaseId, "(default)");
});

test("canonical source resolution proves exactly eight sources and rejects unknown ids", () => {
  const resolvedIds = PROVEN_LEGACY_SOURCE_DESCRIPTORS.map((descriptor) => {
    const plan = resolveLegacyMigrationProviderSourcePlanForLogicalSource(descriptor.logicalSourceId);
    assert.equal(plan.kind, "resolved");
    if (plan.kind !== "resolved") throw new Error("expected resolved source");
    assert.deepEqual(plan.selectedSourceIds, [descriptor.logicalSourceId]);
    assert.equal(plan.entries[0]?.collectionPathTemplate, descriptor.collectionPathTemplate);
    assert.equal(
      plan.entries[0]?.providerSurface,
      descriptor.logicalSourceId === "legacy.auth_identity" ? "AUTH" : "FIRESTORE",
    );
    return plan.selectedSourceIds[0];
  });
  assert.deepEqual(resolvedIds.sort(), PROVEN_LEGACY_SOURCE_DESCRIPTORS.map((descriptor) => descriptor.logicalSourceId).sort());
  assert.deepEqual(
    resolveLegacyMigrationProviderSourcePlanForLogicalSource("__unknown_source__"),
    { kind: "source_discovery_required" },
  );
});

test("AUTH binding has project and uid without a database; Firestore requires named database and bindings", () => {
  const auth = authBinding();
  assert.equal(auth.providerSurface, "AUTH");
  assert.equal(auth.selectedProjectId, "demo-project");
  assert.equal(auth.resolvedPathBindings.uid, "user-1");
  assert.equal("selectedDatabaseId" in auth, false);

  const firestore = firestoreBinding();
  assert.equal(firestore.providerSurface, "FIRESTORE");
  assert.equal(firestore.selectedProjectId, "demo-project");
  assert.equal(firestore.selectedDatabaseId, "(default)");
  assert.deepEqual(firestore.pathTemplate.bindings, ["uid"]);
  assert.equal(firestore.scopeDiscriminators.organizationId, "org-1");
  assert.equal(firestore.scopeDiscriminators.institutionId, "inst-1");
  assert.equal(firestore.provenanceInput.stableSourceIdentity, "stable-1");
});
