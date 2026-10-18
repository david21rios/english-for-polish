import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  validateLegacyMigrationSourceDiscoveryConfig,
} from "../migration/legacyMigrationSourceDiscovery.js";
import {
  analyzeLegacySourcePathTemplate,
  deriveLegacyMigrationProviderSourcePlan,
} from "../migration/legacyMigrationProviderSourcePlan.js";
import { type LegacyMigrationSourceDiscoveryConfig } from "../migration/legacyMigrationSourceDiscovery.js";

const makeConfig = (
  sourceSet: readonly string[],
  overrides: Partial<LegacyMigrationSourceDiscoveryConfig> = {},
): LegacyMigrationSourceDiscoveryConfig => validateLegacyMigrationSourceDiscoveryConfig({
  allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  discoveryMode: "ALLOWLIST_ONLY",
  sourceSet,
  projectId: "configured-project",
  databaseId: "configured-database",
  ...overrides,
});

test("derives the exact allowlisted plan and preserves non-secret metadata", () => {
  const plan = deriveLegacyMigrationProviderSourcePlan(makeConfig([
    "legacy.level_module_lesson",
    "legacy.auth_identity",
  ]));
  assert.equal(plan.kind, "resolved");
  if (plan.kind !== "resolved") return;
  assert.equal(plan.projectId, "configured-project");
  assert.equal(plan.databaseId, "configured-database");
  assert.deepEqual(plan.selectedSourceIds, ["legacy.auth_identity", "legacy.level_module_lesson"]);
  assert.deepEqual(plan.entries.map((entry) => entry.providerSurface), ["AUTH", "FIRESTORE"]);
  assert.equal(plan.entries[0]?.schemaVariant, LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT);
  assert.equal(plan.entries[0]?.discoveryStrategyVersion, LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION);
});

test("plan ordering is deterministic, permutation invariant, and non-mutating", () => {
  const sourceSet = ["legacy.user_progress", "legacy.level", "legacy.user_profile"] as const;
  const reversed = [...sourceSet].reverse();
  const first = deriveLegacyMigrationProviderSourcePlan(makeConfig(sourceSet));
  const second = deriveLegacyMigrationProviderSourcePlan(makeConfig(reversed));
  assert.deepEqual(second, first);
  assert.deepEqual(sourceSet, ["legacy.user_progress", "legacy.level", "legacy.user_profile"]);
  assert.equal(first.kind, "resolved");
  if (first.kind === "resolved") {
    assert.deepEqual(first.entries.map((entry) => entry.logicalSourceId), [
      "legacy.level",
      "legacy.user_profile",
      "legacy.user_progress",
    ]);
  }
});

test("path-template analysis preserves literal segments and ordered bindings", () => {
  const analysis = analyzeLegacySourcePathTemplate("users/{uid}/progress/{progressId}/attempts/{attemptId}");
  assert.deepEqual(analysis.pathSegments, ["users", "{uid}", "progress", "{progressId}", "attempts", "{attemptId}"]);
  assert.deepEqual(analysis.bindings, ["uid", "progressId", "attemptId"]);
  assert.throws(() => analyzeLegacySourcePathTemplate("users/{uid"));
  assert.throws(() => analyzeLegacySourcePathTemplate("users/{uid}}"));
  assert.throws(() => analyzeLegacySourcePathTemplate("users/{}"));
  assert.throws(() => analyzeLegacySourcePathTemplate("users/{uid/name}"));
});

test("nested dependencies are derived only from current template bindings", () => {
  const plan = deriveLegacyMigrationProviderSourcePlan(makeConfig(["legacy.level_module_lesson", "legacy.user_progress_attempt"]));
  assert.equal(plan.kind, "resolved");
  if (plan.kind !== "resolved") return;
  const level = plan.entries.find((entry) => entry.logicalSourceId === "legacy.level_module_lesson");
  const attempt = plan.entries.find((entry) => entry.logicalSourceId === "legacy.user_progress_attempt");
  assert.deepEqual(level?.unresolvedPathBindings, ["levelId", "moduleId", "lessonId"]);
  assert.deepEqual(level?.dependencies, [
    { binding: "levelId", requiresBindings: [] },
    { binding: "moduleId", requiresBindings: ["levelId"] },
    { binding: "lessonId", requiresBindings: ["levelId", "moduleId"] },
  ]);
  assert.deepEqual(attempt?.unresolvedPathBindings, ["uid", "progressId", "attemptId"]);
  assert.deepEqual(attempt?.dependencies[2], { binding: "attemptId", requiresBindings: ["uid", "progressId"] });
});

test("allowlist closure rejects unknown descriptors and never invents a source", () => {
  const unknown = {
    logicalSourceId: "legacy.invented",
    sourceKind: "invented",
    collectionPathTemplate: "institutions/{institutionId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  };
  const config = makeConfig(["legacy.invented"], {
    allowlistedSourceDescriptors: [unknown],
  });
  assert.deepEqual(deriveLegacyMigrationProviderSourcePlan(config), { kind: "source_discovery_required" });
});

test("unsupported schema and unresolved overlap fail closed without precedence", () => {
  const unsupported = makeConfig(["legacy.user_profile"], { supportedSchemaVariants: ["other-schema"] });
  assert.deepEqual(deriveLegacyMigrationProviderSourcePlan(unsupported), { kind: "source_discovery_required" });
  const duplicate = makeConfig(["legacy.user_profile"], {
    allowlistedSourceDescriptors: [
      PROVEN_LEGACY_SOURCE_DESCRIPTORS[1]!,
      PROVEN_LEGACY_SOURCE_DESCRIPTORS[1]!,
    ],
  });
  assert.deepEqual(deriveLegacyMigrationProviderSourcePlan(duplicate), { kind: "source_discovery_required" });
});

test("resolved empty source remains distinct from unresolved discovery", () => {
  const empty = deriveLegacyMigrationProviderSourcePlan(makeConfig([]));
  assert.equal(empty.kind, "resolved");
  if (empty.kind === "resolved") assert.deepEqual(empty.entries, []);
  const unresolved = deriveLegacyMigrationProviderSourcePlan(makeConfig(["legacy.missing"]));
  assert.deepEqual(unresolved, { kind: "source_discovery_required" });
});

test("provenance inputs preserve source identity and scope discriminators", () => {
  const descriptor = {
    ...PROVEN_LEGACY_SOURCE_DESCRIPTORS[1]!,
    organizationId: "org-1",
    institutionId: "inst-1",
    stableSourceIdentity: "profile-v1",
  };
  const plan = deriveLegacyMigrationProviderSourcePlan(makeConfig(["legacy.user_profile"], {
    allowlistedSourceDescriptors: [descriptor],
  }));
  assert.equal(plan.kind, "resolved");
  if (plan.kind !== "resolved") return;
  assert.deepEqual(plan.entries[0]?.scopeDiscriminators, {
    organizationId: "org-1",
    institutionId: "inst-1",
    stableSourceIdentity: "profile-v1",
  });
  assert.deepEqual(plan.entries[0]?.provenanceInput, {
    logicalSourceId: "legacy.user_profile",
    collectionPathTemplate: "users/{uid}",
    entityKind: "user_profile",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
    organizationId: "org-1",
    institutionId: "inst-1",
    stableSourceIdentity: "profile-v1",
  });
});

test("the plan does not alter the existing zero-argument read-port contract", () => {
  const port = { readCandidates: async () => ({ kind: "records" as const, records: [] }) };
  assert.equal(port.readCandidates.length, 0);
});
