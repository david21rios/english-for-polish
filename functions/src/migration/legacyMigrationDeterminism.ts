import { createHash } from "node:crypto";
import { canonicalJsonStringify, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import {
  APPROVED_LEGACY_TENANT_ID,
  CANDIDATE_TYPES,
  MIGRATION_CONTRACT_VERSION,
  TARGET_ENTITY_TYPES,
  type CandidateType,
  type MigrationCandidateIdentity,
  type StableSourceReference,
  type TargetReference,
} from "./legacyMigrationTypes.js";

export type MigrationDeterminismInput = Readonly<{
  migrationContractVersion: typeof MIGRATION_CONTRACT_VERSION;
  candidateType: CandidateType;
  legacyTenantId: string;
  sourceReference: StableSourceReference;
  targetReference: TargetReference;
  runId?: string;
  logicalTime?: string;
}>;

const identifier = (value: unknown, field: string): string => {
  const result = validateDocumentIdentifier(value, field);
  if (!result.ok) throw new TypeError(`${field} must be a valid document identifier.`);
  return result.value;
};

const nonEmpty = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${field} must be a non-empty string.`);
  return value;
};

export const stableSourceReference = (sourceReference: StableSourceReference): string => {
  const collectionPath = sourceReference.collectionPath;
  if (collectionPath !== null && typeof collectionPath !== "string") {
    throw new TypeError("sourceReference.collectionPath must be a string or null.");
  }
  const entityKind = nonEmpty(sourceReference.entityKind, "sourceReference.entityKind");
  return canonicalJsonStringify({
    collectionPath: collectionPath ?? "",
    entityKind,
    recordId: identifier(sourceReference.recordId, "sourceReference.recordId"),
  });
};

const identityInput = (input: MigrationDeterminismInput): MigrationCandidateIdentity => {
  if (input.migrationContractVersion !== MIGRATION_CONTRACT_VERSION) {
    throw new TypeError("migrationContractVersion is not the approved Phase05 contract version.");
  }
  if (!(CANDIDATE_TYPES as readonly string[]).includes(input.candidateType)) {
    throw new TypeError("candidateType is not a closed Phase05 candidate type.");
  }
  const legacyTenantId = identifier(input.legacyTenantId, "legacyTenantId");
  if (legacyTenantId !== APPROVED_LEGACY_TENANT_ID) throw new TypeError("legacyTenantId is not the approved Phase05 tenant.");
  const targetTenantId = identifier(input.targetReference.tenantId, "targetReference.tenantId");
  if (targetTenantId !== APPROVED_LEGACY_TENANT_ID) throw new TypeError("targetReference.tenantId is not the approved Phase05 tenant.");
  if (!(TARGET_ENTITY_TYPES as readonly string[]).includes(input.targetReference.entityType)) {
    throw new TypeError("targetReference.entityType is not a closed target entity type.");
  }
  return {
    migrationContractVersion: input.migrationContractVersion,
    candidateType: input.candidateType,
    legacyTenantId,
    stableSourceReference: stableSourceReference(input.sourceReference),
    targetEntityType: input.targetReference.entityType,
    targetId: input.targetReference.targetId === null
      ? null
      : identifier(input.targetReference.targetId, "targetReference.targetId"),
  };
};

const digest = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

export const deriveMigrationIdempotencyKey = (input: MigrationDeterminismInput): string => {
  const identity = identityInput(input);
  return [
    identity.migrationContractVersion,
    identity.candidateType,
    identity.legacyTenantId,
    identity.stableSourceReference,
    identity.targetEntityType,
    identity.targetId === null ? "null" : identity.targetId,
  ].join("|");
};

export const deriveMigrationCandidateId = (input: MigrationDeterminismInput): string =>
  digest(canonicalJsonStringify(identityInput(input)));

export const deriveMigrationCandidateSortKey = (input: MigrationDeterminismInput): string => {
  const collectionPath = input.sourceReference.collectionPath ?? "";
  const recordId = identifier(input.sourceReference.recordId, "sourceReference.recordId");
  const targetReference = input.targetReference.targetReference ?? "";
  return [input.candidateType, collectionPath, recordId, targetReference].join("\u0000");
};

export const compareMigrationSortKeys = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
