import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCandidateClassification,
  deriveHumanReviewRequired,
  deriveProposedOperation,
  deriveQuarantineReasonCodes,
} from "../migration/legacyMigrationClassification.js";
import { aggregateMigrationReport, createMigrationCandidateResult } from "../migration/legacyMigrationReport.js";
import { type CandidateEvidence } from "../migration/legacyMigrationTypes.js";
import { type MigrationDeterminismInput } from "../migration/legacyMigrationDeterminism.js";
import { APPROVED_LEGACY_TENANT_ID } from "../migration/legacyMigrationTypes.js";

const eligible: CandidateEvidence = { eligible: true, humanReviewRequired: false, reasonCodes: [] };
const cleanInput = (candidateType: "identity_migration" | "course_mapping", recordId: string): MigrationDeterminismInput => ({
  migrationContractVersion: "phase05-legacy-mapping-dry-run-v1",
  candidateType,
  legacyTenantId: APPROVED_LEGACY_TENANT_ID,
  sourceReference: { collectionPath: "legacy", entityKind: candidateType, recordId },
  targetReference: { tenantId: APPROVED_LEGACY_TENANT_ID, entityType: candidateType === "identity_migration" ? "identity" : "course", targetId: null, targetReference: null },
});

test("classification derives create, no-op, and safe no-write outcomes", () => {
  const create = deriveCandidateClassification(eligible, "TARGET_ABSENT", []);
  assert.deepEqual(create, { classification: "ELIGIBLE_CREATE", reasonCodes: [], humanReviewRequired: false, proposedOperation: "CREATE" });
  const replay = deriveCandidateClassification(eligible, "SEMANTIC_MATCH", []);
  assert.deepEqual(replay, { classification: "NO_OP_IDEMPOTENT", reasonCodes: [], humanReviewRequired: false, proposedOperation: "NO_OP" });
  const conflict = deriveCandidateClassification(eligible, "CONFLICT", []);
  assert.equal(conflict.classification, "HUMAN_REVIEW_REQUIRED");
  assert.equal(conflict.humanReviewRequired, true);
  assert.equal(conflict.proposedOperation, "NO_WRITE");
  assert.deepEqual(conflict.reasonCodes, ["CONFLICTING_TARGET_STATE"]);
  const uncomparable = deriveCandidateClassification(eligible, "UNCOMPARABLE", []);
  assert.equal(uncomparable.classification, "HUMAN_REVIEW_REQUIRED");
  assert.deepEqual(uncomparable.reasonCodes, ["TARGET_COMPARISON_IMPOSSIBLE"]);
});

test("ambiguity and unsupported source states never default to create", () => {
  const ambiguous = deriveCandidateClassification(
    { eligible: false, humanReviewRequired: true, reasonCodes: ["AMBIGUOUS_ENROLLMENT_EVIDENCE"] },
    "TARGET_ABSENT",
    [],
  );
  assert.equal(ambiguous.classification, "HUMAN_REVIEW_REQUIRED");
  assert.equal(ambiguous.proposedOperation, "NO_WRITE");
  const unsupported = deriveCandidateClassification(eligible, "TARGET_ABSENT", ["UNSUPPORTED_LEGACY_SOURCE_STATE"]);
  assert.equal(unsupported.classification, "UNSUPPORTED_SOURCE");
  assert.equal(unsupported.proposedOperation, "NO_WRITE");
});

test("reason codes are de-duplicated in policy order and review is deterministic", () => {
  const reasons = deriveQuarantineReasonCodes([
    "MALFORMED_SOURCE_DATA",
    "CONFLICTING_TARGET_STATE",
    "MALFORMED_SOURCE_DATA",
    "MISSING_MANDATORY_SOURCE_IDENTITY",
  ]);
  assert.deepEqual(reasons, ["CONFLICTING_TARGET_STATE", "MISSING_MANDATORY_SOURCE_IDENTITY", "MALFORMED_SOURCE_DATA"]);
  assert.equal(deriveHumanReviewRequired(reasons), true);
  assert.equal(deriveProposedOperation("QUARANTINE", "TARGET_ABSENT"), "NO_WRITE");
});

test("aggregate report counts candidates once and is provider-independent", () => {
  const first = createMigrationCandidateResult(cleanInput("identity_migration", "one"), deriveCandidateClassification(eligible, "TARGET_ABSENT", []));
  const second = createMigrationCandidateResult(cleanInput("course_mapping", "two"), deriveCandidateClassification(
    { eligible: false, humanReviewRequired: true, reasonCodes: ["AMBIGUOUS_ENROLLMENT_EVIDENCE"] },
    "TARGET_ABSENT",
    [],
  ));
  const report = aggregateMigrationReport({
    runId: "run-a",
    legacyTenantId: APPROVED_LEGACY_TENANT_ID,
    mappingTableVersion: "v1",
    candidates: [second, first],
    startedLogicalTime: "2026-01-01T00:00:00.000Z",
    completedLogicalTime: "2026-01-01T00:01:00.000Z",
  });
  assert.equal(report.counts.eligibleCreate, 1);
  assert.equal(report.counts.humanReviewRequired, 1);
  assert.equal(report.countsByCandidateType.identity_migration, 1);
  assert.equal(report.countsByCandidateType.course_mapping, 1);
  assert.equal(report.countsByReasonCode.AMBIGUOUS_ENROLLMENT_EVIDENCE, 1);
  assert.equal(report.writesOccurred, false);
  assert.equal(report.executionAuthorized, false);
  const reordered = aggregateMigrationReport({ ...report, runId: "run-b", startedLogicalTime: "other", completedLogicalTime: "other", candidates: [first, second] });
  assert.deepEqual(reordered.counts, report.counts);
  assert.deepEqual(reordered.countsByCandidateType, report.countsByCandidateType);
  assert.deepEqual(reordered.countsByReasonCode, report.countsByReasonCode);
});
