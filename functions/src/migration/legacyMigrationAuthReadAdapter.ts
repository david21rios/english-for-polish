import {
  type LegacyMigrationSourceReadPort,
  type LegacyMigrationSourceReadResult,
  type LegacyMigrationSourceRecord,
} from "./legacyMigrationReadPorts.js";
import { APPROVED_LEGACY_TENANT_ID, type CandidateType, type JsonValue } from "./legacyMigrationTypes.js";
import { LegacyMigrationDryRunError } from "./legacyMigrationDryRunOrchestrator.js";
import type { LegacyMigrationReadOnlyProviderAdapterAuthEntry } from "./legacyMigrationProviderBindingPlan.js";
import {
  resolveLegacyMigrationProviderSourcePlanForLogicalSource,
  type LegacyMigrationProviderSourcePlanEntry,
} from "./legacyMigrationProviderSourcePlan.js";
import { createLegacyMigrationSourceProvenance } from "./legacyMigrationSourceDiscovery.js";
import type { LegacyMigrationSourceProviderBindingContext } from "./legacyMigrationReadPorts.js";

export type LegacyMigrationRawAuthUser = Readonly<Record<string, unknown>>;

export type LegacyMigrationAuthReadDependency = Readonly<{
  getUser: (uid: string) => Promise<LegacyMigrationRawAuthUser>;
}>;

export type LegacyMigrationAuthReadAdapterInput = Readonly<{
  entry: LegacyMigrationReadOnlyProviderAdapterAuthEntry;
  dependency: LegacyMigrationAuthReadDependency;
  uid: string;
}>;

export type LegacyMigrationAuthReadAdapter = LegacyMigrationSourceReadPort & Readonly<{
  binding: LegacyMigrationReadOnlyProviderAdapterAuthEntry;
}>;

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cloneJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(cloneJsonValue));
  if (!isRecord(value)) throw new LegacyMigrationDryRunError("MALFORMED_SOURCE_DATA", "The Auth provider record contains a non-portable value.");
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)])));
};

const throwInvalid = (message: string): never => {
  throw new LegacyMigrationDryRunError("REQUEST_INVALID", message);
};

const sameStringArray = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const sameOptionalString = (left: string | null | undefined, right: string | null | undefined): boolean =>
  left === right;

const canonicalAuthSource = (): LegacyMigrationProviderSourcePlanEntry => {
  const plan = resolveLegacyMigrationProviderSourcePlanForLogicalSource("legacy.auth_identity");
  if (plan.kind !== "resolved" || plan.entries.length !== 1 || plan.entries[0] === undefined) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The canonical Auth source could not be resolved.");
  }
  const source = plan.entries[0];
  if (source.providerSurface !== "AUTH") {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The canonical Auth source has an unsupported provider surface.");
  }
  return source;
};

const validateEntry = (entry: LegacyMigrationReadOnlyProviderAdapterAuthEntry): LegacyMigrationProviderSourcePlanEntry => {
  const canonical = canonicalAuthSource();
  if (entry.providerSurface !== canonical.providerSurface || entry.logicalSourceId !== canonical.logicalSourceId ||
    entry.sourceKind !== canonical.sourceKind || entry.collectionPathTemplate !== canonical.collectionPathTemplate ||
    entry.schemaVariant !== canonical.schemaVariant || entry.discoveryStrategyVersion !== canonical.discoveryStrategyVersion ||
    entry.pathTemplate.template !== canonical.pathTemplate.template ||
    !sameStringArray(entry.pathTemplate.pathSegments, canonical.pathTemplate.pathSegments) ||
    !sameStringArray(entry.pathTemplate.bindings, canonical.pathTemplate.bindings) ||
    !sameStringArray(entry.unresolvedPathBindings, canonical.unresolvedPathBindings) ||
    entry.scopeDiscriminators.organizationId !== canonical.scopeDiscriminators.organizationId ||
    entry.scopeDiscriminators.institutionId !== canonical.scopeDiscriminators.institutionId ||
    entry.scopeDiscriminators.stableSourceIdentity !== canonical.scopeDiscriminators.stableSourceIdentity ||
    entry.provenanceInput.logicalSourceId !== canonical.provenanceInput.logicalSourceId ||
    entry.provenanceInput.collectionPathTemplate !== canonical.provenanceInput.collectionPathTemplate ||
    entry.provenanceInput.entityKind !== canonical.provenanceInput.entityKind ||
    entry.provenanceInput.schemaVariant !== canonical.provenanceInput.schemaVariant ||
    entry.provenanceInput.discoveryStrategyVersion !== canonical.provenanceInput.discoveryStrategyVersion ||
    !sameOptionalString(entry.provenanceInput.organizationId, canonical.provenanceInput.organizationId) ||
    !sameOptionalString(entry.provenanceInput.institutionId, canonical.provenanceInput.institutionId) ||
    !sameOptionalString(entry.provenanceInput.stableSourceIdentity, canonical.provenanceInput.stableSourceIdentity)) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "The Auth binding does not describe the allowlisted Auth source.");
  }
  if (!nonEmpty(entry.selectedProjectId) || entry.readOnly !== true || entry.unresolvedPathBindings.length !== 0) {
    throwInvalid("The Auth binding is incomplete or not read-only.");
  }
  if (entry.scopeDiscriminators.organizationId !== null || entry.scopeDiscriminators.institutionId !== null ||
    entry.scopeDiscriminators.stableSourceIdentity !== null) {
    throw new LegacyMigrationDryRunError("SOURCE_DISCOVERY_REQUIRED", "Auth identity cannot infer organization or institution scope.");
  }
  return canonical;
};

const normalizedUser = (value: LegacyMigrationRawAuthUser, uid: string): Readonly<Record<string, JsonValue>> => {
  if (!isRecord(value) || value.uid !== uid) {
    throw new LegacyMigrationDryRunError("MALFORMED_SOURCE_DATA", "The Auth provider record is malformed.");
  }
  const fields: Record<string, JsonValue> = { uid };
  for (const field of ["email", "emailVerified", "disabled", "displayName"] as const) {
    if (field in value) fields[field] = cloneJsonValue(value[field]);
  }
  return Object.freeze(fields);
};

const toRecord = (
  entry: LegacyMigrationReadOnlyProviderAdapterAuthEntry,
  canonical: LegacyMigrationProviderSourcePlanEntry,
  uid: string,
  user: Readonly<Record<string, JsonValue>>,
): LegacyMigrationSourceRecord => {
  const candidateType: CandidateType = "identity_migration";
  const provenance = createLegacyMigrationSourceProvenance({
    logicalSourceId: canonical.logicalSourceId,
    collectionPath: canonical.collectionPathTemplate,
    legacyDocumentId: uid,
    sourceKind: canonical.sourceKind,
    schemaVariant: canonical.schemaVariant,
    discoveryStrategyVersion: canonical.discoveryStrategyVersion,
    sourceReference: { collectionPath: canonical.collectionPathTemplate, entityKind: canonical.sourceKind, recordId: uid },
    ...(canonical.provenanceInput.organizationId !== undefined ? { organizationId: canonical.provenanceInput.organizationId } : {}),
    ...(canonical.provenanceInput.institutionId !== undefined ? { institutionId: canonical.provenanceInput.institutionId } : {}),
  });
  const providerBinding: LegacyMigrationSourceProviderBindingContext = Object.freeze({
    logicalSourceId: canonical.logicalSourceId,
    providerSurface: "AUTH",
    sourceKind: canonical.sourceKind,
    selectedProjectId: entry.selectedProjectId,
    collectionPathTemplate: canonical.collectionPathTemplate,
    schemaVariant: canonical.schemaVariant,
    discoveryStrategyVersion: canonical.discoveryStrategyVersion,
    scopeDiscriminators: canonical.scopeDiscriminators,
    pathTemplate: canonical.pathTemplate,
    provenanceInput: canonical.provenanceInput,
    resolvedPathBindings: Object.freeze({ uid }),
  });
  return Object.freeze({
    candidateType,
    sourceReference: Object.freeze({ collectionPath: canonical.collectionPathTemplate, entityKind: canonical.sourceKind, recordId: uid }),
    targetReference: Object.freeze({
      tenantId: APPROVED_LEGACY_TENANT_ID,
      entityType: "identity",
      targetId: uid,
      targetReference: `identities/${uid}`,
    }),
    expectedTargetProjection: Object.freeze({
      exists: false,
      comparable: true,
      entityType: "identity",
      targetId: uid,
      tenantId: APPROVED_LEGACY_TENANT_ID,
      semanticFields: Object.freeze(user),
    }),
    provenance,
    providerBinding,
  });
};

export const createLegacyMigrationAuthReadAdapter = (
  input: LegacyMigrationAuthReadAdapterInput,
): LegacyMigrationAuthReadAdapter => {
  const canonical = validateEntry(input.entry);
  if (!nonEmpty(input.uid)) throwInvalid("Auth source uid must be explicit.");
  if (typeof input.dependency?.getUser !== "function") throwInvalid("Auth read dependency is missing getUser.");
  const binding = input.entry;
  return Object.freeze({
    binding,
    readCandidates: async (): Promise<LegacyMigrationSourceReadResult> => {
      let rawUser: LegacyMigrationRawAuthUser;
      try {
        rawUser = await input.dependency.getUser(input.uid);
      } catch (error) {
        throw new LegacyMigrationDryRunError("SOURCE_READ_FAILURE", "The Auth source read failed.", error);
      }
      const user = normalizedUser(rawUser, input.uid);
      return Object.freeze({
        kind: "records" as const,
        records: Object.freeze([toRecord(binding, canonical, input.uid, user)]),
      });
    },
  });
};
