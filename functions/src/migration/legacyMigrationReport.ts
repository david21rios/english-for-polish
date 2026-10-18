import {
  CANDIDATE_TYPES,
  CLASSIFICATIONS,
  QUARANTINE_REASON_CODES,
  APPROVED_LEGACY_TENANT_ID,
  MIGRATION_CONTRACT_VERSION,
  type CandidateClassificationResult,
  type CandidateType,
  type MigrationDryRunReport,
  type MigrationCandidateResult,
  type QuarantineReasonCode,
} from "./legacyMigrationTypes.js";
import {
  deriveMigrationCandidateId,
  deriveMigrationCandidateSortKey,
  deriveMigrationIdempotencyKey,
  type MigrationDeterminismInput,
} from "./legacyMigrationDeterminism.js";

const emptyCounts = (): Record<(typeof CLASSIFICATIONS)[number], number> =>
  Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, 0])) as Record<(typeof CLASSIFICATIONS)[number], number>;

const emptyTypeCounts = (): Record<CandidateType, number> =>
  Object.fromEntries(CANDIDATE_TYPES.map((candidateType) => [candidateType, 0])) as Record<CandidateType, number>;

const emptyReasonCounts = (): Record<QuarantineReasonCode, number> =>
  Object.fromEntries(QUARANTINE_REASON_CODES.map((reason) => [reason, 0])) as Record<QuarantineReasonCode, number>;

export const createMigrationCandidateResult = (
  input: MigrationDeterminismInput,
  classification: CandidateClassificationResult,
): MigrationCandidateResult => Object.freeze({
  candidateType: input.candidateType,
  classification: classification.classification,
  reasonCodes: Object.freeze([...classification.reasonCodes]),
  humanReviewRequired: classification.humanReviewRequired,
  proposedOperation: classification.proposedOperation,
  candidateId: deriveMigrationCandidateId(input),
  idempotencyKey: deriveMigrationIdempotencyKey(input),
  sortKey: deriveMigrationCandidateSortKey(input),
});

export const aggregateMigrationReport = (input: Readonly<{
  runId: string;
  legacyTenantId: typeof APPROVED_LEGACY_TENANT_ID;
  mappingTableVersion: string;
  migrationContractVersion?: typeof MIGRATION_CONTRACT_VERSION;
  candidates: readonly MigrationCandidateResult[];
  startedLogicalTime?: string | null;
  completedLogicalTime?: string | null;
}>): MigrationDryRunReport => {
  if (input.legacyTenantId !== APPROVED_LEGACY_TENANT_ID) {
    throw new TypeError("legacyTenantId is not the approved Phase05 tenant.");
  }
  const counts = emptyCounts();
  const countsByCandidateType = emptyTypeCounts();
  const countsByReasonCode = emptyReasonCounts();
  for (const candidate of input.candidates) {
    counts[candidate.classification] += 1;
    countsByCandidateType[candidate.candidateType] += 1;
    for (const reason of new Set(candidate.reasonCodes)) countsByReasonCode[reason] += 1;
  }
  return Object.freeze({
    runId: input.runId,
    legacyTenantId: input.legacyTenantId,
    mappingTableVersion: input.mappingTableVersion,
    migrationContractVersion: input.migrationContractVersion ?? MIGRATION_CONTRACT_VERSION,
    counts: Object.freeze({
      totalCandidates: input.candidates.length,
      eligibleCreate: counts.ELIGIBLE_CREATE,
      noOpIdempotent: counts.NO_OP_IDEMPOTENT,
      quarantined: counts.QUARANTINE,
      humanReviewRequired: counts.HUMAN_REVIEW_REQUIRED,
      unsupportedSource: counts.UNSUPPORTED_SOURCE,
      sourceDiscoveryRequired: counts.SOURCE_DISCOVERY_REQUIRED,
    }),
    countsByCandidateType: Object.freeze({ ...countsByCandidateType }),
    countsByReasonCode: Object.freeze({ ...countsByReasonCode }),
    startedLogicalTime: input.startedLogicalTime ?? null,
    completedLogicalTime: input.completedLogicalTime ?? null,
    writesOccurred: false,
    executionAuthorized: false,
  });
};
