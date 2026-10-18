import {
  CLASSIFICATIONS,
  QUARANTINE_REASON_CODES,
  type CandidateClassification,
  type CandidateClassificationResult,
  type CandidateEvidence,
  type ProposedOperation,
  type QuarantineReasonCode,
  type TargetComparison,
} from "./legacyMigrationTypes.js";

const uniqueOrdered = (reasons: readonly QuarantineReasonCode[]): readonly QuarantineReasonCode[] => {
  const present = new Set(reasons);
  return Object.freeze(QUARANTINE_REASON_CODES.filter((code) => present.has(code)));
};

export const deriveQuarantineReasonCodes = (
  reasons: readonly QuarantineReasonCode[],
): readonly QuarantineReasonCode[] => uniqueOrdered(reasons);

export const deriveHumanReviewRequired = (
  reasons: readonly QuarantineReasonCode[],
  targetComparison?: TargetComparison,
): boolean => {
  if (targetComparison === "CONFLICT" || targetComparison === "UNCOMPARABLE") return true;
  return reasons.some((reason) => [
    "CONFLICTING_ORGANIZATION_INSTITUTION_MAPPING",
    "INSUFFICIENT_ADMIN_TENANT_SCOPE",
    "INSUFFICIENT_USER_ROLE_EVIDENCE",
    "AMBIGUOUS_ENROLLMENT_EVIDENCE",
    "CONFLICTING_TARGET_STATE",
    "TARGET_COMPARISON_IMPOSSIBLE",
    "UNSUPPORTED_LEGACY_SOURCE_STATE",
  ].includes(reason));
};

export const deriveProposedOperation = (
  classification: CandidateClassification,
  targetComparison: TargetComparison,
): ProposedOperation => {
  if (classification === "ELIGIBLE_CREATE" && targetComparison === "TARGET_ABSENT") return "CREATE";
  if (classification === "NO_OP_IDEMPOTENT" && targetComparison === "SEMANTIC_MATCH") return "NO_OP";
  return "NO_WRITE";
};

export const deriveCandidateClassification = (
  evidence: CandidateEvidence,
  targetComparison: TargetComparison,
  reasons: readonly QuarantineReasonCode[],
): CandidateClassificationResult => {
  const candidateReasons: QuarantineReasonCode[] = [...evidence.reasonCodes, ...reasons];
  if (targetComparison === "CONFLICT") candidateReasons.push("CONFLICTING_TARGET_STATE");
  if (targetComparison === "UNCOMPARABLE") candidateReasons.push("TARGET_COMPARISON_IMPOSSIBLE");
  const normalizedReasons = deriveQuarantineReasonCodes(candidateReasons);
  const review = evidence.humanReviewRequired
    || deriveHumanReviewRequired(normalizedReasons, targetComparison);
  let classification: CandidateClassification;
  if (normalizedReasons.length > 0) {
    classification = review ? "HUMAN_REVIEW_REQUIRED" : "QUARANTINE";
  } else if (targetComparison === "SEMANTIC_MATCH") {
    classification = "NO_OP_IDEMPOTENT";
  } else if (targetComparison === "TARGET_ABSENT" && evidence.eligible) {
    classification = "ELIGIBLE_CREATE";
  } else if (targetComparison === "CONFLICT") {
    classification = "HUMAN_REVIEW_REQUIRED";
  } else if (targetComparison === "UNCOMPARABLE") {
    classification = "HUMAN_REVIEW_REQUIRED";
  } else {
    classification = "QUARANTINE";
  }
  if (normalizedReasons.includes("SOURCE_FIELD_NOT_DISCOVERED")) classification = "SOURCE_DISCOVERY_REQUIRED";
  if (normalizedReasons.includes("UNSUPPORTED_LEGACY_SOURCE_STATE")) classification = "UNSUPPORTED_SOURCE";
  return Object.freeze({
    classification,
    reasonCodes: normalizedReasons,
    humanReviewRequired: review,
    proposedOperation: deriveProposedOperation(classification, targetComparison),
  });
};

export const isClosedCandidateClassification = (value: string): value is CandidateClassification =>
  (CLASSIFICATIONS as readonly string[]).includes(value);
