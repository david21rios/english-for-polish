import {
  type LegacyMigrationProviderSourcePlan,
  type LegacyMigrationProviderSourcePlanEntry,
  type LegacyMigrationProviderSurface,
  type LegacyMigrationProviderSourceDependency,
  type LegacyMigrationPathTemplateAnalysis,
  type LegacyMigrationSourceProvenanceInput,
} from "./legacyMigrationProviderSourcePlan.js";
import { compareSourceDescriptorKeys } from "./legacyMigrationSourceDiscovery.js";

/** Explicit, non-secret provider selection supplied by a later operator/configuration boundary. */
export type LegacyMigrationProviderBindingConfig = Readonly<{
  projectId?: string | null;
  databaseId?: string | null;
}>;

export type LegacyMigrationProviderBindingRequiredSelection =
  | "PROJECT"
  | "DATABASE"
  | "PROJECT_AND_DATABASE";

export type LegacyMigrationProviderBindingFailureReason =
  | "PROJECT_CONFLICT"
  | "DATABASE_CONFLICT"
  | "DUPLICATE_LOGICAL_SOURCE_ID"
  | "UNSUPPORTED_PROVIDER_SURFACE"
  | "INVALID_SOURCE_PLAN"
  | "INVALID_BINDING_CONFIG";

type ReadOnlyAdapterEntryBase = Readonly<{
  logicalSourceId: string;
  providerSurface: LegacyMigrationProviderSurface;
  sourceKind: string;
  collectionPathTemplate: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  scopeDiscriminators: Readonly<{
    organizationId: string | null;
    institutionId: string | null;
    stableSourceIdentity: string | null;
  }>;
  pathTemplate: LegacyMigrationPathTemplateAnalysis;
  unresolvedPathBindings: readonly string[];
  dependencies: readonly LegacyMigrationProviderSourceDependency[];
  provenanceInput: LegacyMigrationSourceProvenanceInput;
  selectedProjectId: string;
  readOnly: true;
}>;

export type LegacyMigrationReadOnlyProviderAdapterAuthEntry = Readonly<
  ReadOnlyAdapterEntryBase & {
    providerSurface: "AUTH";
  }
>;

export type LegacyMigrationReadOnlyProviderAdapterFirestoreEntry = Readonly<
  ReadOnlyAdapterEntryBase & {
    providerSurface: "FIRESTORE";
    selectedDatabaseId: string;
  }
>;

export type LegacyMigrationReadOnlyProviderAdapterPlanEntry =
  | LegacyMigrationReadOnlyProviderAdapterAuthEntry
  | LegacyMigrationReadOnlyProviderAdapterFirestoreEntry;

export const LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS = Object.freeze([
  "READ",
] as const);

export const LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS = Object.freeze([
  "WRITE",
  "UPDATE",
  "DELETE",
  "TRANSACTION_WRITE",
  "BATCH_WRITE",
  "MIGRATION_APPLY",
] as const);

/** A provider-neutral construction specification; it is not a live SDK adapter. */
export type LegacyMigrationReadOnlyProviderAdapterPlan = Readonly<{
  kind: "resolved";
  entries: readonly LegacyMigrationReadOnlyProviderAdapterPlanEntry[];
  selectedSourceIds: readonly string[];
  discoveryStrategyVersion: string;
  selectedProjectId?: string;
  selectedDatabaseId?: string;
  capability: "READ_ONLY";
  allowedOperations: typeof LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS;
  forbiddenOperations: typeof LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS;
}>;

export type LegacyMigrationProviderBindingPlan =
  | Readonly<{
    kind: "resolved";
    plan: LegacyMigrationReadOnlyProviderAdapterPlan;
  }>
  | Readonly<{
    kind: "provider_selection_required";
    missing: LegacyMigrationProviderBindingRequiredSelection;
  }>
  | Readonly<{
    kind: "source_discovery_required";
  }>
  | Readonly<{
    kind: "unsupported_or_conflicting_binding";
    reason: LegacyMigrationProviderBindingFailureReason;
  }>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const optionalSelectionValue = (value: unknown): string | null | undefined => {
  if (value === undefined || value === null) return value;
  return isNonEmptyString(value) ? value : null;
};

const compareBindingEntries = (
  left: LegacyMigrationProviderSourcePlanEntry,
  right: LegacyMigrationProviderSourcePlanEntry,
): number => compareSourceDescriptorKeys([
  left.logicalSourceId,
  left.providerSurface,
  left.collectionPathTemplate,
  left.schemaVariant,
  left.discoveryStrategyVersion,
].join("\u0000"), [
  right.logicalSourceId,
  right.providerSurface,
  right.collectionPathTemplate,
  right.schemaVariant,
  right.discoveryStrategyVersion,
].join("\u0000"));

export const compareLegacyMigrationProviderBindingEntries = compareBindingEntries;

const clonePathTemplate = (entry: LegacyMigrationProviderSourcePlanEntry): LegacyMigrationPathTemplateAnalysis =>
  Object.freeze({
    template: entry.pathTemplate.template,
    pathSegments: Object.freeze([...entry.pathTemplate.pathSegments]),
    bindings: Object.freeze([...entry.pathTemplate.bindings]),
  });

const cloneDependencies = (
  dependencies: readonly LegacyMigrationProviderSourceDependency[],
): readonly LegacyMigrationProviderSourceDependency[] => Object.freeze(dependencies.map((dependency) => Object.freeze({
  binding: dependency.binding,
  requiresBindings: Object.freeze([...dependency.requiresBindings]),
})));

const cloneProvenanceInput = (
  provenanceInput: LegacyMigrationSourceProvenanceInput,
): LegacyMigrationSourceProvenanceInput => Object.freeze({
  logicalSourceId: provenanceInput.logicalSourceId,
  collectionPathTemplate: provenanceInput.collectionPathTemplate,
  entityKind: provenanceInput.entityKind,
  schemaVariant: provenanceInput.schemaVariant,
  discoveryStrategyVersion: provenanceInput.discoveryStrategyVersion,
  ...(provenanceInput.organizationId !== undefined ? { organizationId: provenanceInput.organizationId } : {}),
  ...(provenanceInput.institutionId !== undefined ? { institutionId: provenanceInput.institutionId } : {}),
  ...(provenanceInput.stableSourceIdentity !== undefined ? { stableSourceIdentity: provenanceInput.stableSourceIdentity } : {}),
});

const cloneEntry = (
  entry: LegacyMigrationProviderSourcePlanEntry,
  projectId: string,
  databaseId: string | undefined,
): LegacyMigrationReadOnlyProviderAdapterPlanEntry => {
  const base = {
    logicalSourceId: entry.logicalSourceId,
    providerSurface: entry.providerSurface,
    sourceKind: entry.sourceKind,
    collectionPathTemplate: entry.collectionPathTemplate,
    schemaVariant: entry.schemaVariant,
    discoveryStrategyVersion: entry.discoveryStrategyVersion,
    scopeDiscriminators: Object.freeze({ ...entry.scopeDiscriminators }),
    pathTemplate: clonePathTemplate(entry),
    unresolvedPathBindings: Object.freeze([...entry.unresolvedPathBindings]),
    dependencies: cloneDependencies(entry.dependencies),
    provenanceInput: cloneProvenanceInput(entry.provenanceInput),
    selectedProjectId: projectId,
    readOnly: true as const,
  };
  if (entry.providerSurface === "AUTH") {
    return Object.freeze({ ...base, providerSurface: "AUTH" as const });
  }
  if (entry.providerSurface === "FIRESTORE" && databaseId !== undefined) {
    return Object.freeze({ ...base, selectedDatabaseId: databaseId });
  }
  throw new TypeError("unsupported provider surface or missing database binding");
};

const resolvedEmptyPlan = (discoveryStrategyVersion: string): LegacyMigrationReadOnlyProviderAdapterPlan => Object.freeze({
  kind: "resolved",
  entries: Object.freeze([]),
  selectedSourceIds: Object.freeze([]),
  discoveryStrategyVersion,
  capability: "READ_ONLY",
  allowedOperations: LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS,
  forbiddenOperations: LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS,
});

const unsupported = (reason: LegacyMigrationProviderBindingFailureReason): LegacyMigrationProviderBindingPlan => ({
  kind: "unsupported_or_conflicting_binding",
  reason,
});

/**
 * Derives a deterministic provider-neutral read-only adapter construction plan.
 * No SDKs are imported and no provider operation is performed here.
 */
export const deriveLegacyMigrationProviderBindingPlan = (
  sourcePlan: LegacyMigrationProviderSourcePlan,
  bindingConfig: LegacyMigrationProviderBindingConfig,
): LegacyMigrationProviderBindingPlan => {
  if (sourcePlan.kind === "source_discovery_required") return { kind: "source_discovery_required" };

  const configProjectId = optionalSelectionValue(bindingConfig.projectId);
  const configDatabaseId = optionalSelectionValue(bindingConfig.databaseId);
  if (bindingConfig.projectId !== undefined && bindingConfig.projectId !== null && configProjectId === null) {
    return unsupported("INVALID_BINDING_CONFIG");
  }
  if (bindingConfig.databaseId !== undefined && bindingConfig.databaseId !== null && configDatabaseId === null) {
    return unsupported("INVALID_BINDING_CONFIG");
  }

  if (!Array.isArray(sourcePlan.entries) || !Array.isArray(sourcePlan.selectedSourceIds) ||
    !isNonEmptyString(sourcePlan.discoveryStrategyVersion)) {
    return unsupported("INVALID_SOURCE_PLAN");
  }
  if (sourcePlan.entries.length === 0) {
    return { kind: "resolved", plan: resolvedEmptyPlan(sourcePlan.discoveryStrategyVersion) };
  }

  const sourceProjectId = optionalSelectionValue(sourcePlan.projectId);
  const sourceDatabaseId = optionalSelectionValue(sourcePlan.databaseId);
  if (sourcePlan.projectId !== undefined && sourcePlan.projectId !== null && sourceProjectId === null) {
    return unsupported("INVALID_SOURCE_PLAN");
  }
  if (sourcePlan.databaseId !== undefined && sourcePlan.databaseId !== null && sourceDatabaseId === null) {
    return unsupported("INVALID_SOURCE_PLAN");
  }
  if (sourceProjectId !== null && sourceProjectId !== undefined &&
    configProjectId !== null && configProjectId !== undefined && sourceProjectId !== configProjectId) {
    return unsupported("PROJECT_CONFLICT");
  }
  if (sourceDatabaseId !== null && sourceDatabaseId !== undefined &&
    configDatabaseId !== null && configDatabaseId !== undefined && sourceDatabaseId !== configDatabaseId) {
    return unsupported("DATABASE_CONFLICT");
  }

  const orderedEntries = [...sourcePlan.entries].sort(compareBindingEntries);
  const logicalSourceIds = orderedEntries.map((entry) => entry.logicalSourceId);
  if (new Set(logicalSourceIds).size !== logicalSourceIds.length) return unsupported("DUPLICATE_LOGICAL_SOURCE_ID");
  if (sourcePlan.selectedSourceIds.length !== logicalSourceIds.length ||
    [...sourcePlan.selectedSourceIds].sort(compareSourceDescriptorKeys).join("\u0000") !==
      [...logicalSourceIds].sort(compareSourceDescriptorKeys).join("\u0000")) {
    return unsupported("INVALID_SOURCE_PLAN");
  }
  if (orderedEntries.some((entry) => entry.providerSurface !== "AUTH" && entry.providerSurface !== "FIRESTORE")) {
    return unsupported("UNSUPPORTED_PROVIDER_SURFACE");
  }

  const hasFirestore = orderedEntries.some((entry) => entry.providerSurface === "FIRESTORE");
  if (configProjectId === null || configProjectId === undefined) {
    return { kind: "provider_selection_required", missing: hasFirestore ? "PROJECT_AND_DATABASE" : "PROJECT" };
  }
  if (hasFirestore && (configDatabaseId === null || configDatabaseId === undefined)) {
    return { kind: "provider_selection_required", missing: "DATABASE" };
  }

  try {
    const entries = Object.freeze(orderedEntries.map((entry) => cloneEntry(
      entry,
      configProjectId,
      hasFirestore ? configDatabaseId! : undefined,
    )));
    const planBase = {
      kind: "resolved" as const,
      entries,
      selectedSourceIds: Object.freeze(entries.map((entry) => entry.logicalSourceId)),
      discoveryStrategyVersion: sourcePlan.discoveryStrategyVersion,
      selectedProjectId: configProjectId,
      capability: "READ_ONLY" as const,
      allowedOperations: LEGACY_MIGRATION_READ_ONLY_ALLOWED_OPERATIONS,
      forbiddenOperations: LEGACY_MIGRATION_READ_ONLY_FORBIDDEN_OPERATIONS,
    };
    const plan = hasFirestore
      ? Object.freeze({ ...planBase, selectedDatabaseId: configDatabaseId! })
      : Object.freeze(planBase);
    return { kind: "resolved", plan };
  } catch {
    return unsupported("INVALID_SOURCE_PLAN");
  }
};
