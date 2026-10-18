import {
  type LegacyMigrationSourceProvenance,
  type LegacyMigrationSourceReadResult,
  type LegacyMigrationSourceRecord,
  type StableSourceReference,
} from "./legacyMigrationTypes.js";

export type { LegacyMigrationSourceProvenance } from "./legacyMigrationTypes.js";

export const LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION =
  "phase05-source-discovery-v1" as const;

export const LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT = "legacy-v1" as const;

export type LegacyMigrationSourceDescriptor = Readonly<{
  logicalSourceId: string;
  sourceKind: string;
  collectionPathTemplate: string;
  schemaVariant: string;
  discoveryStrategyVersion: string;
  organizationId?: string | null;
  institutionId?: string | null;
  stableSourceIdentity?: string | null;
}>;

export type LegacyMigrationSourceDiscoveryConfig = Readonly<{
  allowlistedSourceDescriptors: readonly LegacyMigrationSourceDescriptor[];
  supportedSchemaVariants: readonly string[];
  discoveryStrategyVersion: string;
  discoveryMode: "ALLOWLIST_ONLY";
  sourceSet: readonly string[];
  projectId?: string | null;
  databaseId?: string | null;
}>;

export const PROVEN_LEGACY_SOURCE_DESCRIPTORS: readonly LegacyMigrationSourceDescriptor[] = Object.freeze([
  {
    logicalSourceId: "legacy.auth_identity",
    sourceKind: "auth_identity",
    collectionPathTemplate: "auth",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.user_profile",
    sourceKind: "user_profile",
    collectionPathTemplate: "users/{uid}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.user_progress",
    sourceKind: "user_progress",
    collectionPathTemplate: "users/{uid}/progress/{progressId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.user_topic_progress",
    sourceKind: "user_topic_progress",
    collectionPathTemplate: "users/{uid}/topicProgress/{progressId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.user_progress_attempt",
    sourceKind: "user_progress_attempt",
    collectionPathTemplate: "users/{uid}/progress/{progressId}/attempts/{attemptId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.level",
    sourceKind: "level",
    collectionPathTemplate: "levels/{levelId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
  {
    logicalSourceId: "legacy.level_module_lesson",
    sourceKind: "level_module_lesson",
    collectionPathTemplate: "levels/{levelId}/modules/{moduleId}/lessons/{lessonId}",
    schemaVariant: LEGACY_MIGRATION_SOURCE_SCHEMA_VARIANT,
    discoveryStrategyVersion: LEGACY_MIGRATION_SOURCE_DISCOVERY_STRATEGY_VERSION,
  },
]);

export const NON_CANDIDATE_LEGACY_SOURCE_SURFACES = Object.freeze([
  "temas",
  "tests",
  "userTests",
  "presentations",
  "forums",
  "messages",
  "supportTickets",
] as const);

const descriptorKeys = new Set([
  "logicalSourceId",
  "sourceKind",
  "collectionPathTemplate",
  "schemaVariant",
  "discoveryStrategyVersion",
  "organizationId",
  "institutionId",
  "stableSourceIdentity",
]);

const provenanceKeys = new Set([
  "logicalSourceId",
  "collectionPath",
  "legacyDocumentId",
  "sourceKind",
  "schemaVariant",
  "discoveryStrategyVersion",
  "sourceReference",
  "organizationId",
  "institutionId",
  "roleReference",
  "identityReference",
  "evidenceReferences",
]);

const configKeys = new Set([
  "allowlistedSourceDescriptors",
  "supportedSchemaVariants",
  "discoveryStrategyVersion",
  "discoveryMode",
  "sourceSet",
  "projectId",
  "databaseId",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError(`${label} must be a provider-neutral object.`);
  return value;
};

const requireNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value;
};

const optionalString = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined || value === null) return value;
  return requireNonEmptyString(value, field);
};

const rejectUnknownKeys = (record: Record<string, unknown>, allowed: Set<string>, label: string): void => {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unsupported field '${key}'.`);
  }
};

const withOptional = <T extends object>(
  target: T,
  field: string,
  value: unknown,
): T => {
  return value === undefined ? target : { ...target, [field]: value } as T;
};

export const validateLegacyMigrationSourceDescriptor = (
  value: unknown,
  allowlistedDescriptors?: readonly LegacyMigrationSourceDescriptor[],
): LegacyMigrationSourceDescriptor => {
  const record = requireRecord(value, "source descriptor");
  rejectUnknownKeys(record, descriptorKeys, "source descriptor");
  const descriptor: LegacyMigrationSourceDescriptor = {
    logicalSourceId: requireNonEmptyString(record.logicalSourceId, "logicalSourceId"),
    sourceKind: requireNonEmptyString(record.sourceKind, "sourceKind"),
    collectionPathTemplate: requireNonEmptyString(record.collectionPathTemplate, "collectionPathTemplate"),
    schemaVariant: requireNonEmptyString(record.schemaVariant, "schemaVariant"),
    discoveryStrategyVersion: requireNonEmptyString(record.discoveryStrategyVersion, "discoveryStrategyVersion"),
  };
  const normalized = withOptional(
    withOptional(
      withOptional({ ...descriptor }, "organizationId", optionalString(record.organizationId, "organizationId")),
      "institutionId",
      optionalString(record.institutionId, "institutionId"),
    ),
    "stableSourceIdentity",
    optionalString(record.stableSourceIdentity, "stableSourceIdentity"),
  );
  if (allowlistedDescriptors !== undefined && !allowlistedDescriptors.some((candidate) =>
    canonicalSourceDescriptorKey(candidate) === canonicalSourceDescriptorKey(normalized))) {
    throw new TypeError("source descriptor is not present in the configured allowlist.");
  }
  return Object.freeze(normalized);
};

export const canonicalSourceDescriptorKey = (descriptor: LegacyMigrationSourceDescriptor): string => [
  descriptor.sourceKind,
  descriptor.collectionPathTemplate,
  descriptor.schemaVariant,
  descriptor.discoveryStrategyVersion,
  descriptor.logicalSourceId,
  descriptor.organizationId ?? "",
  descriptor.institutionId ?? "",
  descriptor.stableSourceIdentity ?? "",
].join("\u0000");

export const compareSourceDescriptorKeys = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export const sortLegacyMigrationSourceDescriptors = (
  descriptors: readonly LegacyMigrationSourceDescriptor[],
): readonly LegacyMigrationSourceDescriptor[] => descriptors
  .map((descriptor) => validateLegacyMigrationSourceDescriptor(descriptor))
  .slice()
  .sort((left, right) => compareSourceDescriptorKeys(
    canonicalSourceDescriptorKey(left),
    canonicalSourceDescriptorKey(right),
  ));

export const createLegacyMigrationSourceProvenance = (
  value: unknown,
): LegacyMigrationSourceProvenance => {
  const record = requireRecord(value, "source provenance");
  rejectUnknownKeys(record, provenanceKeys, "source provenance");
  const sourceReference = requireRecord(record.sourceReference, "sourceReference");
  const collectionPath = sourceReference.collectionPath;
  if (collectionPath !== null && typeof collectionPath !== "string") {
    throw new TypeError("sourceReference.collectionPath must be a string or null.");
  }
  const sourceRecordId = requireNonEmptyString(sourceReference.recordId, "sourceReference.recordId");
  const legacyDocumentId = requireNonEmptyString(record.legacyDocumentId, "legacyDocumentId");
  if (sourceRecordId !== legacyDocumentId) {
    throw new TypeError("legacyDocumentId must match sourceReference.recordId.");
  }
  const evidenceReferencesValue = record.evidenceReferences;
  let evidenceReferences: readonly string[] | undefined;
  if (evidenceReferencesValue !== undefined) {
    if (!Array.isArray(evidenceReferencesValue)) throw new TypeError("evidenceReferences must be an array.");
    evidenceReferences = Object.freeze(Array.from(new Set(evidenceReferencesValue.map((item, index) =>
      requireNonEmptyString(item, `evidenceReferences[${index}]`),
    ))).sort(compareSourceDescriptorKeys));
  }
  const sourceReferenceValue: StableSourceReference = {
    collectionPath,
    entityKind: requireNonEmptyString(sourceReference.entityKind, "sourceReference.entityKind"),
    recordId: sourceRecordId,
  };
  const provenance: LegacyMigrationSourceProvenance = {
    logicalSourceId: requireNonEmptyString(record.logicalSourceId, "logicalSourceId"),
    collectionPath,
    legacyDocumentId,
    sourceKind: requireNonEmptyString(record.sourceKind, "sourceKind"),
    schemaVariant: requireNonEmptyString(record.schemaVariant, "schemaVariant"),
    discoveryStrategyVersion: requireNonEmptyString(record.discoveryStrategyVersion, "discoveryStrategyVersion"),
    sourceReference: sourceReferenceValue,
  };
  const normalized = withOptional(
    withOptional(
      withOptional(
        withOptional(
          withOptional({ ...provenance }, "organizationId", optionalString(record.organizationId, "organizationId")),
          "institutionId",
          optionalString(record.institutionId, "institutionId"),
        ),
        "roleReference",
        optionalString(record.roleReference, "roleReference"),
      ),
      "identityReference",
      optionalString(record.identityReference, "identityReference"),
    ),
    "evidenceReferences",
    evidenceReferences,
  );
  return Object.freeze(normalized);
};

export const validateLegacyMigrationSourceDiscoveryConfig = (
  value: unknown,
): LegacyMigrationSourceDiscoveryConfig => {
  const record = requireRecord(value, "source discovery configuration");
  rejectUnknownKeys(record, configKeys, "source discovery configuration");
  if (!Array.isArray(record.allowlistedSourceDescriptors)) {
    throw new TypeError("allowlistedSourceDescriptors must be an array.");
  }
  const allowlistedSourceDescriptors = Object.freeze(record.allowlistedSourceDescriptors.map((descriptor) =>
    validateLegacyMigrationSourceDescriptor(descriptor),
  ));
  if (!Array.isArray(record.supportedSchemaVariants)) {
    throw new TypeError("supportedSchemaVariants must be an array.");
  }
  const supportedSchemaVariants = Object.freeze(record.supportedSchemaVariants.map((variant, index) =>
    requireNonEmptyString(variant, `supportedSchemaVariants[${index}]`),
  ));
  if (record.discoveryMode !== "ALLOWLIST_ONLY") {
    throw new TypeError("discoveryMode must be ALLOWLIST_ONLY.");
  }
  if (!Array.isArray(record.sourceSet)) throw new TypeError("sourceSet must be an array.");
  const sourceSet = Object.freeze(record.sourceSet.map((sourceId, index) =>
    requireNonEmptyString(sourceId, `sourceSet[${index}]`),
  ));
  const config: LegacyMigrationSourceDiscoveryConfig = {
    allowlistedSourceDescriptors,
    supportedSchemaVariants,
    discoveryStrategyVersion: requireNonEmptyString(record.discoveryStrategyVersion, "discoveryStrategyVersion"),
    discoveryMode: "ALLOWLIST_ONLY",
    sourceSet,
  };
  const normalized = withOptional(
    withOptional({ ...config }, "projectId", optionalString(record.projectId, "projectId")),
    "databaseId",
    optionalString(record.databaseId, "databaseId"),
  );
  return Object.freeze(normalized);
};

export type LegacyMigrationSourceDiscoveryState =
  | "SUPPORTED_SOURCE_RESOLVED"
  | "IDENTIFIED_SOURCE_EMPTY"
  | "MULTIPLE_PLAUSIBLE_SOURCES"
  | "UNCLASSIFIABLE_SCHEMA"
  | "KNOWLEDGE_INSUFFICIENT"
  | "PROVIDER_READ_FAILURE";

export const evaluateLegacyMigrationSourceDiscovery = (
  state: LegacyMigrationSourceDiscoveryState,
  records: readonly LegacyMigrationSourceRecord[] = [],
): LegacyMigrationSourceReadResult => {
  if (state === "PROVIDER_READ_FAILURE") {
    throw new Error("Provider read failure must be thrown by the source adapter.");
  }
  if (state === "SUPPORTED_SOURCE_RESOLVED") return { kind: "records", records };
  if (state === "IDENTIFIED_SOURCE_EMPTY") return { kind: "records", records: [] };
  return { kind: "source_discovery_required" };
};

export const isLegacyMigrationSourceDescriptorAllowlisted = (
  descriptor: LegacyMigrationSourceDescriptor,
  config: LegacyMigrationSourceDiscoveryConfig,
): boolean => config.allowlistedSourceDescriptors.some((candidate) =>
  canonicalSourceDescriptorKey(candidate) === canonicalSourceDescriptorKey(descriptor));
