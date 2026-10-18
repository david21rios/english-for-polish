import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  canonicalSourceDescriptorKey,
  compareSourceDescriptorKeys,
  createLegacyMigrationSourceProvenance,
  evaluateLegacyMigrationSourceDiscovery,
  sortLegacyMigrationSourceDescriptors,
  validateLegacyMigrationSourceDescriptor,
  validateLegacyMigrationSourceDiscoveryConfig,
  type LegacyMigrationSourceDescriptor,
} from "../migration/legacyMigrationSourceDiscovery.js";
import {
  type LegacyMigrationSourceProviderBindingContext,
  type LegacyMigrationSourceReadPort,
  type LegacyMigrationSourceRecord,
} from "../migration/legacyMigrationReadPorts.js";
import { deriveLegacyMigrationProviderBindingPlan } from "../migration/legacyMigrationProviderBindingPlan.js";
import { deriveLegacyMigrationProviderSourcePlan } from "../migration/legacyMigrationProviderSourcePlan.js";

const descriptor = (overrides: Partial<LegacyMigrationSourceDescriptor> = {}): LegacyMigrationSourceDescriptor => ({
  logicalSourceId: "legacy.user_profile",
  sourceKind: "user_profile",
  collectionPathTemplate: "users/{uid}",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  ...overrides,
});

const config = () => validateLegacyMigrationSourceDiscoveryConfig({
  allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  discoveryMode: "ALLOWLIST_ONLY",
  sourceSet: ["legacy.user_profile"],
  projectId: "demo-project",
  databaseId: "(default)",
});

const identitySourceReference = { collectionPath: "users", entityKind: "identity", recordId: "u1" } as const;

const identityFixtureProvenance = createLegacyMigrationSourceProvenance({
  logicalSourceId: "legacy.user_profile",
  collectionPath: identitySourceReference.collectionPath,
  legacyDocumentId: identitySourceReference.recordId,
  sourceKind: "user_profile",
  schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  sourceReference: identitySourceReference,
});

const identityFixtureProviderBinding = (): LegacyMigrationSourceProviderBindingContext => {
  const sourcePlan = deriveLegacyMigrationProviderSourcePlan(config());
  const bindingPlan = deriveLegacyMigrationProviderBindingPlan(sourcePlan, {
    projectId: "demo-project",
    databaseId: "(default)",
  });
  if (bindingPlan.kind !== "resolved" || bindingPlan.plan.entries.length !== 1) {
    throw new Error("expected the canonical identity source binding to resolve");
  }
  const entry = bindingPlan.plan.entries[0];
  if (entry === undefined || entry.providerSurface !== "FIRESTORE") {
    throw new Error("expected the canonical identity source to use Firestore");
  }
  return Object.freeze({
    logicalSourceId: entry.logicalSourceId,
    providerSurface: "FIRESTORE",
    sourceKind: entry.sourceKind,
    selectedProjectId: entry.selectedProjectId,
    selectedDatabaseId: entry.selectedDatabaseId,
    collectionPathTemplate: entry.collectionPathTemplate,
    schemaVariant: entry.schemaVariant,
    discoveryStrategyVersion: entry.discoveryStrategyVersion,
    scopeDiscriminators: entry.scopeDiscriminators,
    pathTemplate: entry.pathTemplate,
    provenanceInput: entry.provenanceInput,
    resolvedPathBindings: Object.freeze({ uid: identitySourceReference.recordId }),
  });
};

test("validates provider-neutral descriptors and configured allowlists", () => {
  const valid = validateLegacyMigrationSourceDescriptor(descriptor(), PROVEN_LEGACY_SOURCE_DESCRIPTORS);
  assert.equal(valid.logicalSourceId, "legacy.user_profile");
  assert.throws(() => validateLegacyMigrationSourceDescriptor({ ...descriptor(), collectionPathTemplate: {} }));
  assert.throws(() => validateLegacyMigrationSourceDescriptor({ ...descriptor(), sourceKind: " " }));
  assert.throws(() => validateLegacyMigrationSourceDescriptor({ ...descriptor(), schemaVariant: "" }));
  assert.throws(() => validateLegacyMigrationSourceDescriptor({ ...descriptor(), credentials: "secret" }));
  assert.throws(() => validateLegacyMigrationSourceDescriptor(descriptor({ logicalSourceId: "unknown" }), PROVEN_LEGACY_SOURCE_DESCRIPTORS));
  assert.equal(config().databaseId, "(default)");
});

test("canonical descriptor keys use the required locale-independent components", () => {
  const value = canonicalSourceDescriptorKey(descriptor());
  assert.equal(
    value,
    [
      "user_profile",
      "users/{uid}",
      LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
      LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
      "legacy.user_profile",
      "",
      "",
      "",
    ].join("\u0000"),
  );
  assert.equal(compareSourceDescriptorKeys("z", "ä"), -1);
  assert.equal(compareSourceDescriptorKeys("ä", "z"), 1);
});

test("descriptor sorting is non-mutating and permutation invariant", () => {
  const values = [
    descriptor({ logicalSourceId: "legacy.z", sourceKind: "z" }),
    descriptor({ logicalSourceId: "legacy.a", sourceKind: "a" }),
    descriptor({ logicalSourceId: "legacy.middle", sourceKind: "m" }),
  ];
  const original = [...values];
  const forward = sortLegacyMigrationSourceDescriptors(values);
  const reverse = sortLegacyMigrationSourceDescriptors([...values].reverse());
  assert.deepEqual(forward, reverse);
  assert.deepEqual(values, original);
  assert.deepEqual(forward.map(canonicalSourceDescriptorKey), [
    canonicalSourceDescriptorKey(values[1]!),
    canonicalSourceDescriptorKey(values[2]!),
    canonicalSourceDescriptorKey(values[0]!),
  ]);
});

test("resolved and identified-empty sources use the existing records union", () => {
  const record: LegacyMigrationSourceRecord = {
    candidateType: "identity_migration" as const,
    sourceReference: identitySourceReference,
    targetReference: { tenantId: "tenant-1", entityType: "identity" as const, targetId: "u1", targetReference: "identities/u1" },
    expectedTargetProjection: {
      exists: false,
      comparable: true,
      entityType: "identity",
      targetId: "u1",
      tenantId: "tenant-1",
      semanticFields: {},
    },
    provenance: identityFixtureProvenance,
    providerBinding: identityFixtureProviderBinding(),
  };
  assert.deepEqual(evaluateLegacyMigrationSourceDiscovery("SUPPORTED_SOURCE_RESOLVED", [record]), {
    kind: "records",
    records: [record],
  });
  assert.deepEqual(evaluateLegacyMigrationSourceDiscovery("IDENTIFIED_SOURCE_EMPTY", [record]), {
    kind: "records",
    records: [],
  });
});

test("ambiguous, unsupported, and overlapping discovery states fail closed", () => {
  for (const state of [
    "MULTIPLE_PLAUSIBLE_SOURCES",
    "UNCLASSIFIABLE_SCHEMA",
    "KNOWLEDGE_INSUFFICIENT",
  ] as const) {
    assert.deepEqual(evaluateLegacyMigrationSourceDiscovery(state), { kind: "source_discovery_required" });
  }
  assert.throws(() => evaluateLegacyMigrationSourceDiscovery("PROVIDER_READ_FAILURE"));
});

test("provenance construction preserves stable identity and deterministic evidence", () => {
  const provenance = createLegacyMigrationSourceProvenance({
    logicalSourceId: "legacy.user_profile",
    collectionPath: "users",
    legacyDocumentId: "u1",
    sourceKind: "user_profile",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "u1" },
    organizationId: null,
    evidenceReferences: ["role", "identity", "role"],
  });
  assert.deepEqual(provenance.evidenceReferences, ["identity", "role"]);
  assert.equal(provenance.sourceReference.recordId, "u1");
  assert.throws(() => createLegacyMigrationSourceProvenance({
    logicalSourceId: "legacy.user_profile",
    collectionPath: "users",
    legacyDocumentId: "u1",
    sourceKind: "user_profile",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "u2" },
  }));
});

test("the existing source read port remains zero-argument and provider-neutral", () => {
  const port: LegacyMigrationSourceReadPort = {
    readCandidates: async () => ({ kind: "records", records: [] }),
  };
  assert.equal(port.readCandidates.length, 0);
  assert.deepEqual(Object.keys(port), ["readCandidates"]);
});
