import { deepFreezeJsonValue, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import {
  APPROVED_LEGACY_TENANT_ID,
  type ApprovedMappingRow,
  type MappingEvidence,
  type MappingTableInput,
  type OrganizationInstitutionSourceEvidence,
} from "./legacyMigrationTypes.js";

const text = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${field} must be a non-empty string.`);
  return value;
};

const nullableText = (value: string | null, field: string): string | null =>
  value === null ? null : text(value, field);

const optionalIdentifier = (value: string | null, field: string): string | null => {
  if (value === null) return null;
  const result = validateDocumentIdentifier(value, field);
  if (!result.ok) throw new TypeError(`${field} must be a valid document identifier or null.`);
  return result.value;
};

const sourceIdentifier = (value: unknown, field: string): Readonly<{ value: string | null; malformed: boolean }> => {
  if (value === null) return Object.freeze({ value: null, malformed: false });
  if (!validateDocumentIdentifier(value, field).ok) return Object.freeze({ value: null, malformed: true });
  return Object.freeze({ value: value as string, malformed: false });
};

const cloneRow = (row: ApprovedMappingRow, tableId: string, tableVersion: string): ApprovedMappingRow => {
  const cloned: ApprovedMappingRow = {
    mappingTableId: text(row.mappingTableId, "mappingTableId"),
    mappingTableVersion: text(row.mappingTableVersion, "mappingTableVersion"),
    mappingId: text(row.mappingId, "mappingId"),
    legacySourceKind: row.legacySourceKind,
    legacyOrganizationId: optionalIdentifier(row.legacyOrganizationId, "legacyOrganizationId"),
    legacyInstitutionId: optionalIdentifier(row.legacyInstitutionId, "legacyInstitutionId"),
    targetTenantId: optionalIdentifier(row.targetTenantId, "targetTenantId")!,
    mappingStatus: row.mappingStatus,
    provenanceCode: row.provenanceCode,
    approvalEvidenceCode: text(row.approvalEvidenceCode, "approvalEvidenceCode"),
    reviewReference: nullableText(row.reviewReference, "reviewReference"),
    effectiveLogicalTime: nullableText(row.effectiveLogicalTime, "effectiveLogicalTime"),
    schemaVersion: text(row.schemaVersion, "schemaVersion"),
  };
  if (cloned.targetTenantId !== APPROVED_LEGACY_TENANT_ID) {
    throw new TypeError("Mapping row targetTenantId must be the approved Phase05 tenant.");
  }
  if (cloned.mappingStatus !== "approved" && cloned.mappingStatus !== "quarantined" && cloned.mappingStatus !== "superseded") {
    throw new TypeError("Mapping row mappingStatus is not a closed Phase05 status.");
  }
  if (cloned.legacySourceKind !== "organization" && cloned.legacySourceKind !== "institution") {
    throw new TypeError("Mapping row legacySourceKind is not a closed Phase05 source kind.");
  }
  if (cloned.provenanceCode !== "PRODUCT_OWNER_APPROVED_MAPPING") {
    throw new TypeError("Mapping row provenanceCode is not the approved mapping provenance.");
  }
  if (cloned.mappingTableId !== tableId || cloned.mappingTableVersion !== tableVersion) {
    throw new TypeError("Mapping row metadata must match the enclosing mapping table.");
  }
  if (cloned.legacyOrganizationId === null && cloned.legacyInstitutionId === null) {
    throw new TypeError("Mapping row must identify an organization or institution.");
  }
  return Object.freeze(cloned);
};

export const createMappingTableInput = (
  mappingTableId: string,
  mappingTableVersion: string,
  approvedRows: readonly ApprovedMappingRow[],
): MappingTableInput => {
  const tableId = text(mappingTableId, "mappingTableId");
  const tableVersion = text(mappingTableVersion, "mappingTableVersion");
  if (!Array.isArray(approvedRows)) throw new TypeError("approvedRows must be an array.");
  const rows = approvedRows.map((row) => cloneRow(row, tableId, tableVersion));
  return deepFreezeJsonValue({
    mappingTableId: tableId,
    mappingTableVersion: tableVersion,
    approvedRows: rows,
  }) as MappingTableInput;
};

export const evaluateOrganizationInstitutionMapping = (
  sourceEvidence: OrganizationInstitutionSourceEvidence,
  immutableMappingTable: MappingTableInput,
): MappingEvidence => {
  const organization = sourceIdentifier(sourceEvidence.organizationId, "organizationId");
  const institution = sourceIdentifier(sourceEvidence.institutionId, "institutionId");
  if (organization.malformed || institution.malformed) {
    return Object.freeze({
      targetTenantId: null,
      mappingId: null,
      matched: false,
      conflict: false,
      reasonCodes: Object.freeze(["MALFORMED_SOURCE_DATA"] as const),
      humanReviewRequired: false,
    });
  }
  const organizationId = organization.value;
  const institutionId = institution.value;
  if (organizationId === null && institutionId === null) {
    return Object.freeze({
      targetTenantId: null,
      mappingId: null,
      matched: false,
      conflict: false,
      reasonCodes: Object.freeze(["MISSING_ORGANIZATION_INSTITUTION_MAPPING"] as const),
      humanReviewRequired: false,
    });
  }
  const matches = immutableMappingTable.approvedRows.filter((row) =>
    row.mappingStatus === "approved"
    && row.legacyOrganizationId === organizationId
    && row.legacyInstitutionId === institutionId);
  const targetScopes = new Set(matches.map((match) => `${match.legacySourceKind}\u0000${match.targetTenantId}`));
  if (matches.length > 0 && targetScopes.size === 1) {
    const match = [...matches].sort((left, right) => left.mappingId < right.mappingId ? -1 : left.mappingId > right.mappingId ? 1 : 0)[0]!;
    return Object.freeze({
      targetTenantId: match.targetTenantId,
      mappingId: match.mappingId,
      matched: true,
      conflict: false,
      reasonCodes: Object.freeze([]),
      humanReviewRequired: false,
    });
  }
  if (targetScopes.size > 1) {
    return Object.freeze({
      targetTenantId: null,
      mappingId: null,
      matched: false,
      conflict: true,
      reasonCodes: Object.freeze(["CONFLICTING_ORGANIZATION_INSTITUTION_MAPPING"] as const),
      humanReviewRequired: true,
    });
  }
  return Object.freeze({
    targetTenantId: null,
    mappingId: null,
    matched: false,
    conflict: false,
    reasonCodes: Object.freeze(["MISSING_ORGANIZATION_INSTITUTION_MAPPING"] as const),
    humanReviewRequired: false,
  });
};
