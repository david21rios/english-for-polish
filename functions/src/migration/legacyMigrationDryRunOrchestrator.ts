import {
  APPROVED_LEGACY_TENANT_ID,
  MIGRATION_CONTRACT_VERSION,
  type CandidateEvidence,
  type CandidateClassificationResult,
  type CandidateType,
  type MappingTableInput,
  type MigrationCandidateResult,
  type MigrationDryRunReport,
  type MigrationErrorCategory,
  type MigrationFailureScope,
  type QuarantineReasonCode,
  type TargetComparison,
} from "./legacyMigrationTypes.js";
import {
  compareMigrationSortKeys,
  deriveMigrationCandidateSortKey,
  type MigrationDeterminismInput,
} from "./legacyMigrationDeterminism.js";
import {
  deriveCandidateClassification,
  deriveQuarantineReasonCodes,
} from "./legacyMigrationClassification.js";
import { evaluateEnrollmentEvidence, evaluateLegacyRole } from "./legacyMigrationMapping.js";
import { createMappingTableInput, evaluateOrganizationInstitutionMapping } from "./mappingTable.js";
import { compareCanonicalTarget } from "./legacyMigrationTargetComparison.js";
import { aggregateMigrationReport, createMigrationCandidateResult } from "./legacyMigrationReport.js";
import {
  type LegacyMigrationSourceReadPort,
  type LegacyMigrationSourceReadResult,
  type LegacyMigrationSourceRecord,
  type LegacyMigrationTargetReadPort,
} from "./legacyMigrationReadPorts.js";

export type LegacyMigrationDryRunRequest = Readonly<{
  migrationContractVersion: typeof MIGRATION_CONTRACT_VERSION;
  runId: string;
  correlationId: string;
  legacyTenantId: typeof APPROVED_LEGACY_TENANT_ID;
  mode: "DRY_RUN";
  sourceSelection: Readonly<{
    sourceKinds: readonly string[];
    boundedSourceReferences: readonly string[] | null;
  }>;
  mappingTable: MappingTableInput;
  mappingTableId: string;
  mappingTableVersion: string;
  candidateFilters: Readonly<{
    candidateTypes: readonly CandidateType[] | null;
    stableSourceIds: readonly string[] | null;
  }>;
  operatorBoundary: Readonly<{
    actorType: "human_operator" | "system_process";
    actorReference: string | null;
  }>;
  startedLogicalTime?: string | null;
  completedLogicalTime?: string | null;
}>;

export type LegacyMigrationDryRunDependencies = Readonly<{
  sourceReadPort: LegacyMigrationSourceReadPort;
  targetReadPort: LegacyMigrationTargetReadPort;
}>;

export type LegacyMigrationDryRunResult = Readonly<{
  candidates: readonly MigrationCandidateResult[];
  report: MigrationDryRunReport;
}>;

export class LegacyMigrationDryRunError extends Error {
  readonly category: MigrationErrorCategory;
  readonly scope: MigrationFailureScope = "WHOLE_RUN";

  public constructor(category: MigrationErrorCategory, message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "LegacyMigrationDryRunError";
    this.category = category;
  }
}

const text = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", `${field} must be a non-empty string.`);
  }
  return value;
};

const immutableMappingTable = (mappingTable: MappingTableInput): MappingTableInput => {
  try {
    return createMappingTableInput(
      mappingTable.mappingTableId,
      mappingTable.mappingTableVersion,
      mappingTable.approvedRows,
    );
  } catch (error) {
    throw new LegacyMigrationDryRunError("MAPPING_TABLE_INVALID", "The supplied mapping table is invalid.", error);
  }
};

const sourceReadFailure = (message: string, cause?: unknown): LegacyMigrationDryRunError =>
  new LegacyMigrationDryRunError("SOURCE_READ_FAILURE", message, cause);

const targetReadFailure = (message: string, cause?: unknown): LegacyMigrationDryRunError =>
  new LegacyMigrationDryRunError("TARGET_READ_FAILURE", message, cause);

const normalizeReasons = (reasons: readonly QuarantineReasonCode[]): readonly QuarantineReasonCode[] =>
  deriveQuarantineReasonCodes(reasons);

const mappingRequired = (candidateType: CandidateType): boolean =>
  candidateType === "organization_institution_mapping"
  || candidateType === "membership_role_migration"
  || candidateType === "enrollment_bootstrap";

const roleRequired = (candidateType: CandidateType): boolean => candidateType === "membership_role_migration";

const enrollmentRequired = (candidateType: CandidateType): boolean => candidateType === "enrollment_bootstrap";

const candidateDeterminismInput = (
  candidate: LegacyMigrationSourceRecord,
): MigrationDeterminismInput => ({
  migrationContractVersion: MIGRATION_CONTRACT_VERSION,
  candidateType: candidate.candidateType,
  legacyTenantId: APPROVED_LEGACY_TENANT_ID,
  sourceReference: candidate.sourceReference,
  targetReference: candidate.targetReference,
});

const defaultRoleEvidence = Object.freeze({
  legacyRole: null,
  validIdentity: false,
  tenantScopeProven: false,
  supportingCourseEvidence: false,
});

const defaultEnrollmentEvidence = Object.freeze({
  identity: Object.freeze({ stable: false, uid: null }),
  tenant: Object.freeze({ approved: false, tenantId: null }),
  membership: Object.freeze({ valid: false, membershipId: null, tenantId: null }),
  course: Object.freeze({ valid: false, courseId: null, tenantId: null }),
  relationship: Object.freeze({ explicit: false, ambiguous: false }),
});

const directClassification = (
  evidence: CandidateEvidence,
  targetComparison: TargetComparison,
  reasons: readonly QuarantineReasonCode[],
): CandidateClassificationResult => deriveCandidateClassification(evidence, targetComparison, reasons);

const evaluateCandidate = async (
  candidate: LegacyMigrationSourceRecord,
  mappingTable: MappingTableInput,
  targetReadPort: LegacyMigrationTargetReadPort,
): Promise<MigrationCandidateResult> => {
  const determinismInput = candidateDeterminismInput(candidate);
  const reasons: QuarantineReasonCode[] = [...(candidate.reasonCodes ?? [])];
  let humanReviewRequired = false;
  let eligible = true;
  let targetComparison: TargetComparison = "TARGET_ABSENT";
  let targetReadRequired = true;

  if (candidate.sourceDiscoveryRequired) {
    reasons.push("SOURCE_FIELD_NOT_DISCOVERED");
    eligible = false;
    targetReadRequired = false;
  }
  if (candidate.reasonCodes?.includes("SOURCE_FIELD_NOT_DISCOVERED")) {
    eligible = false;
    targetReadRequired = false;
  }

  if (mappingRequired(candidate.candidateType)) {
    const mappingEvidence = evaluateOrganizationInstitutionMapping(
      candidate.organizationInstitutionEvidence ?? { organizationId: null, institutionId: null },
      mappingTable,
    );
    reasons.push(...mappingEvidence.reasonCodes);
    humanReviewRequired ||= mappingEvidence.humanReviewRequired;
    eligible &&= mappingEvidence.matched;
    if (!mappingEvidence.matched) targetReadRequired = false;

    if (roleRequired(candidate.candidateType)) {
      const roleEvidence = evaluateLegacyRole(candidate.roleEvidence ?? defaultRoleEvidence, mappingEvidence);
      reasons.push(...roleEvidence.reasonCodes);
      humanReviewRequired ||= roleEvidence.humanReviewRequired;
      eligible &&= roleEvidence.eligible;
      if (!roleEvidence.eligible) targetReadRequired = false;
    }
  } else if (roleRequired(candidate.candidateType)) {
    const roleEvidence = evaluateLegacyRole(candidate.roleEvidence ?? defaultRoleEvidence, {
      targetTenantId: null,
      mappingId: null,
      matched: false,
      conflict: false,
      reasonCodes: Object.freeze(["MISSING_ORGANIZATION_INSTITUTION_MAPPING"]),
      humanReviewRequired: false,
    });
    reasons.push(...roleEvidence.reasonCodes);
    humanReviewRequired ||= roleEvidence.humanReviewRequired;
    eligible &&= roleEvidence.eligible;
    targetReadRequired = false;
  }

  if (candidate.reasonCodes?.includes("MALFORMED_SOURCE_DATA")) {
    eligible = false;
    targetReadRequired = false;
  }
  if (candidate.reasonCodes?.includes("UNSUPPORTED_LEGACY_SOURCE_STATE")) {
    eligible = false;
    targetReadRequired = false;
  }

  if (enrollmentRequired(candidate.candidateType)) {
    if (candidate.enrollmentEvidence === undefined) {
      const enrollment = evaluateEnrollmentEvidence(
        defaultEnrollmentEvidence.identity,
        defaultEnrollmentEvidence.tenant,
        defaultEnrollmentEvidence.membership,
        defaultEnrollmentEvidence.course,
        defaultEnrollmentEvidence.relationship,
        "TARGET_ABSENT",
      );
      reasons.push(...enrollment.reasonCodes);
      humanReviewRequired ||= enrollment.humanReviewRequired;
      eligible &&= enrollment.eligible;
      targetReadRequired = false;
    }
  }

  if (targetReadRequired) {
    let actualTarget;
    try {
      actualTarget = await targetReadPort.readTarget(candidate);
    } catch (error) {
      throw targetReadFailure("The target read failed during the dry run.", error);
    }
    try {
      targetComparison = compareCanonicalTarget(candidate.expectedTargetProjection, actualTarget);
    } catch (error) {
      throw targetReadFailure("The normalized target projection could not be compared.", error);
    }
  }

  if (enrollmentRequired(candidate.candidateType) && candidate.enrollmentEvidence !== undefined) {
    const enrollment = evaluateEnrollmentEvidence(
      candidate.enrollmentEvidence.identity,
      candidate.enrollmentEvidence.tenant,
      candidate.enrollmentEvidence.membership,
      candidate.enrollmentEvidence.course,
      candidate.enrollmentEvidence.relationship,
      targetComparison,
    );
    reasons.push(...enrollment.reasonCodes);
    humanReviewRequired ||= enrollment.humanReviewRequired;
    eligible &&= enrollment.eligible;
  }

  const classification = directClassification(
    { eligible, humanReviewRequired, reasonCodes: normalizeReasons(reasons) },
    targetComparison,
    [],
  );
  return createMigrationCandidateResult(determinismInput, classification);
};

const readSourceRecords = async (
  sourceReadPort: LegacyMigrationSourceReadPort,
): Promise<readonly LegacyMigrationSourceRecord[]> => {
  let result: LegacyMigrationSourceReadResult;
  try {
    result = await sourceReadPort.readCandidates();
  } catch (error) {
    throw sourceReadFailure("The source read failed during the dry run.", error);
  }
  if (result === null || typeof result !== "object" || !("kind" in result)) {
    throw sourceReadFailure("The source read returned an invalid normalized result.");
  }
  if (result.kind === "source_discovery_required") {
    throw new LegacyMigrationDryRunError(
      "SOURCE_DISCOVERY_REQUIRED",
      "Source discovery is incomplete; the dry run cannot treat it as an empty source.",
    );
  }
  if (!Array.isArray(result.records)) {
    throw sourceReadFailure("The source read returned an invalid normalized record collection.");
  }
  return result.records;
};

export const runLegacyMigrationDryRun = async (
  request: LegacyMigrationDryRunRequest,
  dependencies: LegacyMigrationDryRunDependencies,
): Promise<LegacyMigrationDryRunResult> => {
  if (request.migrationContractVersion !== MIGRATION_CONTRACT_VERSION) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "migrationContractVersion is not the approved Phase05 contract version.");
  }
  if (request.legacyTenantId !== APPROVED_LEGACY_TENANT_ID) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "legacyTenantId is not the approved Phase05 tenant.");
  }
  text(request.runId, "runId");
  text(request.correlationId, "correlationId");
  text(request.mappingTableId, "mappingTableId");
  text(request.mappingTableVersion, "mappingTableVersion");
  if (request.mode !== "DRY_RUN") {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "mode must be DRY_RUN.");
  }
  if (request.operatorBoundary.actorType !== "human_operator" && request.operatorBoundary.actorType !== "system_process") {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "operatorBoundary.actorType is not a closed Phase05 actor type.");
  }
  if (request.operatorBoundary.actorReference !== null) text(request.operatorBoundary.actorReference, "operatorBoundary.actorReference");
  if (request.mappingTableId !== request.mappingTable.mappingTableId || request.mappingTableVersion !== request.mappingTable.mappingTableVersion) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "mapping table envelope metadata does not match the supplied table.");
  }
  if (dependencies.sourceReadPort === undefined || dependencies.targetReadPort === undefined) {
    throw new LegacyMigrationDryRunError("REQUEST_INVALID", "Both normalized read ports are required.");
  }
  const mappingTable = immutableMappingTable(request.mappingTable);
  const sourceRecords = await readSourceRecords(dependencies.sourceReadPort);
  const orderedRecords = [...sourceRecords].sort((left, right) => compareMigrationSortKeys(
    deriveMigrationCandidateSortKey(candidateDeterminismInput(left)),
    deriveMigrationCandidateSortKey(candidateDeterminismInput(right)),
  ));
  const candidates: MigrationCandidateResult[] = [];
  for (const candidate of orderedRecords) {
    candidates.push(await evaluateCandidate(candidate, mappingTable, dependencies.targetReadPort));
  }
  const report = aggregateMigrationReport({
    runId: request.runId,
    legacyTenantId: APPROVED_LEGACY_TENANT_ID,
    mappingTableVersion: mappingTable.mappingTableVersion,
    migrationContractVersion: MIGRATION_CONTRACT_VERSION,
    candidates,
    startedLogicalTime: request.startedLogicalTime ?? null,
    completedLogicalTime: request.completedLogicalTime ?? null,
  });
  return Object.freeze({ candidates: Object.freeze(candidates), report });
};
