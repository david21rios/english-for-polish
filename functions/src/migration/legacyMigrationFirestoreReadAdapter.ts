import {
  APPROVED_LEGACY_TENANT_ID,
  type CandidateType,
  type JsonValue,
} from "./legacyMigrationTypes.js";
import {
  type LegacyMigrationSourceReadPort,
  type LegacyMigrationSourceReadResult,
  type LegacyMigrationSourceRecord,
} from "./legacyMigrationReadPorts.js";
import { LegacyMigrationDryRunError } from "./legacyMigrationDryRunOrchestrator.js";
import type { LegacyMigrationReadOnlyProviderAdapterFirestoreEntry } from "./legacyMigrationProviderBindingPlan.js";
import {
  resolveLegacyMigrationProviderSourcePlanForLogicalSource,
  type LegacyMigrationProviderSourcePlanEntry,
} from "./legacyMigrationProviderSourcePlan.js";
import { createLegacyMigrationSourceProvenance } from "./legacyMigrationSourceDiscovery.js";
import type { LegacyMigrationSourceProviderBindingContext } from "./legacyMigrationReadPorts.js";

export type LegacyMigrationPathBindingValues = Readonly<Record<string, string>>;

export type LegacyMigrationRawFirestoreDocument = Readonly<{
  exists: boolean;
  id: string;
  data: unknown;
}>;

export type LegacyMigrationFirestoreReadDependency = Readonly<{
  getDocument: (path: string) => Promise<LegacyMigrationRawFirestoreDocument>;
}>;

export type LegacyMigrationFirestoreReadAdapterInput = Readonly<{
  entry: LegacyMigrationReadOnlyProviderAdapterFirestoreEntry;
  dependency: LegacyMigrationFirestoreReadDependency;
  pathBindings: LegacyMigrationPathBindingValues;
}>;

export type LegacyMigrationFirestoreReadAdapter = LegacyMigrationSourceReadPort & Readonly<{
  binding: LegacyMigrationReadOnlyProviderAdapterFirestoreEntry;
}>;

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cloneJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(cloneJsonValue));
  if (!isRecord(value)) throw new LegacyMigrationDryRunError("MALFORMED_SOURCE_DATA", "The Firestore provider record contains a non-portable value.");
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)])));
};

const sameStringArray = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const sameOptionalString = (left: string | null | undefined, right: string | null | undefined): boolean =>
  left === right;

const canonicalFirestoreSource = (
  logicalSourceId: string,
): LegacyMigrationProviderSourcePlanEntry => {
  const plan = resolveLegacyMigrationProviderSourcePlanForLogicalSource(logicalSourceId);
  if (plan.kind !== "resolved" || plan.entries.length !== 1 || plan.entries[0] === undefined) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The canonical Firestore source could not be resolved.");
  }
  const source = plan.entries[0];
  if (source.providerSurface !== "FIRESTORE") {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The source is not a canonical Firestore source.");
  }
  return source;
};

const validateEntry = (entry: LegacyMigrationReadOnlyProviderAdapterFirestoreEntry): LegacyMigrationProviderSourcePlanEntry => {
  const canonical = canonicalFirestoreSource(entry.logicalSourceId);
  if (entry.providerSurface !== canonical.providerSurface || entry.sourceKind !== canonical.sourceKind ||
    entry.collectionPathTemplate !== canonical.collectionPathTemplate ||
    entry.schemaVariant !== canonical.schemaVariant || entry.discoveryStrategyVersion !== canonical.discoveryStrategyVersion ||
    entry.pathTemplate.template !== canonical.pathTemplate.template ||
    !sameStringArray(entry.pathTemplate.pathSegments, canonical.pathTemplate.pathSegments) ||
    !sameStringArray(entry.pathTemplate.bindings, canonical.pathTemplate.bindings) ||
    !sameStringArray(entry.unresolvedPathBindings, canonical.unresolvedPathBindings) ||
    entry.provenanceInput.logicalSourceId !== canonical.provenanceInput.logicalSourceId ||
    entry.provenanceInput.collectionPathTemplate !== canonical.provenanceInput.collectionPathTemplate ||
    entry.provenanceInput.entityKind !== canonical.provenanceInput.entityKind ||
    entry.provenanceInput.schemaVariant !== canonical.provenanceInput.schemaVariant ||
    entry.provenanceInput.discoveryStrategyVersion !== canonical.provenanceInput.discoveryStrategyVersion ||
    !sameOptionalString(entry.scopeDiscriminators.organizationId, entry.provenanceInput.organizationId ?? null) ||
    !sameOptionalString(entry.scopeDiscriminators.institutionId, entry.provenanceInput.institutionId ?? null) ||
    !sameOptionalString(entry.scopeDiscriminators.stableSourceIdentity, entry.provenanceInput.stableSourceIdentity ?? null)) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The Firestore binding does not describe an allowlisted Firestore source.");
  }
  if (!nonEmpty(entry.selectedProjectId) || !nonEmpty(entry.selectedDatabaseId) || entry.readOnly !== true) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "The Firestore binding is incomplete or not read-only.");
  }
  return canonical;
};

const resolvePath = (
  entry: LegacyMigrationReadOnlyProviderAdapterFirestoreEntry,
  pathBindings: LegacyMigrationPathBindingValues,
): string => {
  const expectedBindings = new Set(entry.pathTemplate.bindings);
  const providedBindings = Object.keys(pathBindings);
  if (providedBindings.length !== expectedBindings.size || providedBindings.some((binding) => !expectedBindings.has(binding))) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The Firestore path bindings do not match the canonical source template.");
  }
  const values = pathBindings;
  const segments = entry.pathTemplate.pathSegments.map((segment) => {
    if (!segment.startsWith("{") || !segment.endsWith("}")) return segment;
    const binding = segment.slice(1, -1);
    const value = values[binding];
    if (!nonEmpty(value) || value.includes("/") || value === "." || value === "..") {
      throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", `The Firestore path binding '${binding}' is unresolved.`);
    }
    return value;
  });
  if (segments.some((segment) => !nonEmpty(segment))) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "The Firestore path contains an empty segment.");
  }
  return segments.join("/");
};

const candidateTypeForSourceKind = (sourceKind: string): CandidateType => {
  if (sourceKind === "user_profile") return "identity_migration";
  if (sourceKind === "level" || sourceKind === "level_module_lesson") return "course_mapping";
  if (sourceKind === "user_progress" || sourceKind === "user_topic_progress" || sourceKind === "user_progress_attempt") {
    return "enrollment_bootstrap";
  }
  throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The Firestore source kind is not allowlisted.");
};

const targetEntityTypeForSourceKind = (sourceKind: string): "identity" | "course" | "enrollment" => {
  if (sourceKind === "user_profile") return "identity";
  if (sourceKind === "level" || sourceKind === "level_module_lesson") return "course";
  return "enrollment";
};

const toRecord = (
  entry: LegacyMigrationReadOnlyProviderAdapterFirestoreEntry,
  canonical: LegacyMigrationProviderSourcePlanEntry,
  path: string,
  pathBindings: LegacyMigrationPathBindingValues,
  document: LegacyMigrationRawFirestoreDocument,
): LegacyMigrationSourceRecord => {
  if (!document.exists || !nonEmpty(document.id) || !isRecord(document.data)) {
    throw new LegacyMigrationDryRunError("MALFORMED_SOURCE_DATA", "The Firestore provider document is malformed.");
  }
  const targetEntityType = targetEntityTypeForSourceKind(entry.sourceKind);
  const semanticFields = cloneJsonValue(document.data) as Readonly<Record<string, JsonValue>>;
  const provenance = createLegacyMigrationSourceProvenance({
    logicalSourceId: canonical.logicalSourceId,
    collectionPath: path,
    legacyDocumentId: document.id,
    sourceKind: canonical.sourceKind,
    schemaVariant: canonical.schemaVariant,
    discoveryStrategyVersion: canonical.discoveryStrategyVersion,
    sourceReference: { collectionPath: path, entityKind: canonical.sourceKind, recordId: document.id },
    ...(entry.provenanceInput.organizationId !== undefined ? { organizationId: entry.provenanceInput.organizationId } : {}),
    ...(entry.provenanceInput.institutionId !== undefined ? { institutionId: entry.provenanceInput.institutionId } : {}),
  });
  const providerBinding: LegacyMigrationSourceProviderBindingContext = Object.freeze({
    logicalSourceId: canonical.logicalSourceId,
    providerSurface: "FIRESTORE",
    sourceKind: canonical.sourceKind,
    selectedProjectId: entry.selectedProjectId,
    selectedDatabaseId: entry.selectedDatabaseId,
    collectionPathTemplate: canonical.collectionPathTemplate,
    schemaVariant: canonical.schemaVariant,
    discoveryStrategyVersion: canonical.discoveryStrategyVersion,
    scopeDiscriminators: entry.scopeDiscriminators,
    pathTemplate: entry.pathTemplate,
    provenanceInput: entry.provenanceInput,
    resolvedPathBindings: Object.freeze({ ...pathBindings }),
  });
  return Object.freeze({
    candidateType: candidateTypeForSourceKind(canonical.sourceKind),
    sourceReference: Object.freeze({ collectionPath: path, entityKind: canonical.sourceKind, recordId: document.id }),
    targetReference: Object.freeze({
      tenantId: APPROVED_LEGACY_TENANT_ID,
      entityType: targetEntityType,
      targetId: document.id,
      targetReference: `${targetEntityType}/${document.id}`,
    }),
    expectedTargetProjection: Object.freeze({
      exists: false,
      comparable: true,
      entityType: targetEntityType,
      targetId: document.id,
      tenantId: APPROVED_LEGACY_TENANT_ID,
      semanticFields,
    }),
    organizationInstitutionEvidence: Object.freeze({
      organizationId: entry.scopeDiscriminators.organizationId,
      institutionId: entry.scopeDiscriminators.institutionId,
    }),
    provenance,
    providerBinding,
  });
};

export const createLegacyMigrationFirestoreReadAdapter = (
  input: LegacyMigrationFirestoreReadAdapterInput,
): LegacyMigrationFirestoreReadAdapter => {
  const canonical = validateEntry(input.entry);
  if (typeof input.dependency?.getDocument !== "function") {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "Firestore read dependency is missing getDocument.");
  }
  const binding = input.entry;
  return Object.freeze({
    binding,
    readCandidates: async (): Promise<LegacyMigrationSourceReadResult> => {
      const path = resolvePath(binding, input.pathBindings);
      let document: LegacyMigrationRawFirestoreDocument;
      try {
        document = await input.dependency.getDocument(path);
      } catch (error) {
        throw new LegacyMigrationDryRunError("SOURCE_READ_FAILURE", "The Firestore source read failed.", error);
      }
      if (!document.exists) return Object.freeze({ kind: "records" as const, records: Object.freeze([]) });
      return Object.freeze({
        kind: "records" as const,
        records: Object.freeze([toRecord(binding, canonical, path, input.pathBindings, document)]),
      });
    },
  });
};
