import {
  LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
  PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  sortLegacyMigrationSourceDescriptors,
  validateLegacyMigrationSourceDescriptor,
  validateLegacyMigrationSourceDiscoveryConfig,
  type LegacyMigrationSourceDescriptor,
  type LegacyMigrationSourceDiscoveryConfig,
} from "./legacyMigrationSourceDiscovery.js";
import {
  type LegacyMigrationPathTemplateAnalysis,
  type LegacyMigrationSourceProvenanceInput,
} from "./legacyMigrationTypes.js";

export type {
  LegacyMigrationPathTemplateAnalysis,
  LegacyMigrationSourceProvenanceInput,
} from "./legacyMigrationTypes.js";

export type LegacyMigrationProviderSurface = "AUTH" | "FIRESTORE";

export type LegacyMigrationProviderSourceDependency = Readonly<{
  binding: string;
  requiresBindings: readonly string[];
}>;

export type LegacyMigrationProviderSourcePlanEntry = Readonly<{
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
}>;

export type LegacyMigrationProviderSourcePlan = Readonly<{
  kind: "resolved";
  entries: readonly LegacyMigrationProviderSourcePlanEntry[];
  selectedSourceIds: readonly string[];
  discoveryStrategyVersion: string;
  projectId?: string | null;
  databaseId?: string | null;
}> | Readonly<{
  kind: "source_discovery_required";
}>;

const tokenPattern = /^[A-Za-z][A-Za-z0-9_]*$/u;

export const analyzeLegacySourcePathTemplate = (
  template: string,
): LegacyMigrationPathTemplateAnalysis => {
  if (typeof template !== "string" || template.length === 0 || template.startsWith("/") || template.endsWith("/")) {
    throw new TypeError("source path template must be a non-empty relative path.");
  }
  if (template.includes("//")) throw new TypeError("source path template cannot contain empty segments.");
  const pathSegments = template.split("/");
  const bindings: string[] = [];
  for (const segment of pathSegments) {
    const open = segment.indexOf("{");
    const close = segment.indexOf("}");
    if (open === -1 && close === -1) continue;
    if (open !== 0 || close !== segment.length - 1 || segment.indexOf("{", open + 1) !== -1 || segment.indexOf("}", close + 1) !== -1) {
      throw new TypeError("source path template contains malformed binding tokens.");
    }
    const token = segment.slice(open + 1, close);
    if (!tokenPattern.test(token)) throw new TypeError("source path template contains an invalid binding token.");
    bindings.push(token);
  }
  return Object.freeze({
    template,
    pathSegments: Object.freeze(pathSegments),
    bindings: Object.freeze(bindings),
  });
};

const classifyProviderSurface = (
  descriptor: LegacyMigrationSourceDescriptor,
): LegacyMigrationProviderSurface | null => {
  if (descriptor.sourceKind === "auth_identity" && descriptor.collectionPathTemplate === "auth") return "AUTH";
  if (knownDescriptor(descriptor)) return "FIRESTORE";
  return null;
};

const sameKnownSourceIdentity = (
  left: LegacyMigrationSourceDescriptor,
  right: LegacyMigrationSourceDescriptor,
): boolean => left.logicalSourceId === right.logicalSourceId
  && left.sourceKind === right.sourceKind
  && left.collectionPathTemplate === right.collectionPathTemplate
  && left.schemaVariant === right.schemaVariant
  && left.discoveryStrategyVersion === right.discoveryStrategyVersion;

const knownDescriptor = (descriptor: LegacyMigrationSourceDescriptor): boolean =>
  PROVEN_LEGACY_SOURCE_DESCRIPTORS.some((candidate) => sameKnownSourceIdentity(candidate, descriptor));

const deriveDependencies = (bindings: readonly string[]): readonly LegacyMigrationProviderSourceDependency[] =>
  Object.freeze(bindings.map((binding, index) => Object.freeze({
    binding,
    requiresBindings: Object.freeze(bindings.slice(0, index)),
  })));

const descriptorEntry = (
  descriptor: LegacyMigrationSourceDescriptor,
  providerSurface: LegacyMigrationProviderSurface,
): LegacyMigrationProviderSourcePlanEntry => {
  const pathTemplate = analyzeLegacySourcePathTemplate(descriptor.collectionPathTemplate);
  return Object.freeze({
    logicalSourceId: descriptor.logicalSourceId,
    providerSurface,
    sourceKind: descriptor.sourceKind,
    collectionPathTemplate: descriptor.collectionPathTemplate,
    schemaVariant: descriptor.schemaVariant,
    discoveryStrategyVersion: descriptor.discoveryStrategyVersion,
    scopeDiscriminators: Object.freeze({
      organizationId: descriptor.organizationId ?? null,
      institutionId: descriptor.institutionId ?? null,
      stableSourceIdentity: descriptor.stableSourceIdentity ?? null,
    }),
    pathTemplate,
    unresolvedPathBindings: pathTemplate.bindings,
    dependencies: deriveDependencies(pathTemplate.bindings),
    provenanceInput: Object.freeze({
      logicalSourceId: descriptor.logicalSourceId,
      collectionPathTemplate: descriptor.collectionPathTemplate,
      entityKind: descriptor.sourceKind,
      schemaVariant: descriptor.schemaVariant,
      discoveryStrategyVersion: descriptor.discoveryStrategyVersion,
      ...(descriptor.organizationId !== undefined ? { organizationId: descriptor.organizationId } : {}),
      ...(descriptor.institutionId !== undefined ? { institutionId: descriptor.institutionId } : {}),
      ...(descriptor.stableSourceIdentity !== undefined ? { stableSourceIdentity: descriptor.stableSourceIdentity } : {}),
    }),
  });
};

const withOptionalMetadata = <T extends object>(
  target: T,
  field: string,
  value: string | null | undefined,
): T => value === undefined ? target : { ...target, [field]: value } as T;

export const deriveLegacyMigrationProviderSourcePlan = (
  input: LegacyMigrationSourceDiscoveryConfig,
): LegacyMigrationProviderSourcePlan => {
  let config: LegacyMigrationSourceDiscoveryConfig;
  try {
    config = validateLegacyMigrationSourceDiscoveryConfig(input);
  } catch {
    return { kind: "source_discovery_required" };
  }
  if (config.sourceSet.length === 0) {
    const empty: LegacyMigrationProviderSourcePlan = {
      kind: "resolved",
      entries: [],
      selectedSourceIds: [],
      discoveryStrategyVersion: config.discoveryStrategyVersion,
    };
    return Object.freeze(withOptionalMetadata(
      withOptionalMetadata(empty, "projectId", config.projectId),
      "databaseId",
      config.databaseId,
    ));
  }
  const descriptorsById = new Map<string, LegacyMigrationSourceDescriptor>();
  for (const rawDescriptor of config.allowlistedSourceDescriptors) {
    const descriptor = validateLegacyMigrationSourceDescriptor(rawDescriptor);
    if (descriptorsById.has(descriptor.logicalSourceId)) return { kind: "source_discovery_required" };
    descriptorsById.set(descriptor.logicalSourceId, descriptor);
  }
  const selected: LegacyMigrationSourceDescriptor[] = [];
  for (const sourceId of config.sourceSet) {
    const descriptor = descriptorsById.get(sourceId);
    if (descriptor === undefined || !knownDescriptor(descriptor)) return { kind: "source_discovery_required" };
    if (descriptor.discoveryStrategyVersion !== config.discoveryStrategyVersion) return { kind: "source_discovery_required" };
    if (!config.supportedSchemaVariants.includes(descriptor.schemaVariant)) return { kind: "source_discovery_required" };
    selected.push(descriptor);
  }
  const ordered = sortLegacyMigrationSourceDescriptors(selected);
  const entries: LegacyMigrationProviderSourcePlanEntry[] = [];
  try {
    for (const descriptor of ordered) {
      const providerSurface = classifyProviderSurface(descriptor);
      if (providerSurface === null) return { kind: "source_discovery_required" };
      entries.push(descriptorEntry(descriptor, providerSurface));
    }
  } catch {
    return { kind: "source_discovery_required" };
  }
  const resolved: LegacyMigrationProviderSourcePlan = {
    kind: "resolved",
    entries: Object.freeze(entries),
    selectedSourceIds: Object.freeze(ordered.map((descriptor) => descriptor.logicalSourceId)),
    discoveryStrategyVersion: config.discoveryStrategyVersion,
  };
  return Object.freeze(withOptionalMetadata(
    withOptionalMetadata(resolved, "projectId", config.projectId),
    "databaseId",
    config.databaseId,
  ));
};

/**
 * Resolve one logical source through the same proven descriptor authority used
 * by the full provider source-plan derivation.  This is intentionally pure:
 * it performs no provider access and returns the existing discovery-required
 * result for an unknown or unsupported source identifier.
 */
export const resolveLegacyMigrationProviderSourcePlanForLogicalSource = (
  logicalSourceId: string,
): LegacyMigrationProviderSourcePlan => deriveLegacyMigrationProviderSourcePlan({
  allowlistedSourceDescriptors: PROVEN_LEGACY_SOURCE_DESCRIPTORS,
  supportedSchemaVariants: [LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT],
  discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  discoveryMode: "ALLOWLIST_ONLY",
  sourceSet: [logicalSourceId],
});
