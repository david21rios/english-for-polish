import { MEMBERSHIP_ROLES } from "@mipymetic/saas-contracts/domain";
import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import {
  APPROVED_LEGACY_TENANT_ID,
  type EnrollmentCourseEvidence,
  type EnrollmentEvidenceEvaluation,
  type EnrollmentIdentityEvidence,
  type EnrollmentMembershipEvidence,
  type EnrollmentRelationshipEvidence,
  type EnrollmentTenantEvidence,
  type LegacyRoleEvidence,
  type MappingEvidence,
  type QuarantineReasonCode,
  type RoleMappingEvidence,
  type TargetComparison as TargetComparisonLiteral,
} from "./legacyMigrationTypes.js";

const validId = (value: string | null): boolean => value !== null && validateDocumentIdentifier(value).ok;

export const evaluateLegacyRole = (
  roleEvidence: LegacyRoleEvidence,
  mappingEvidence: MappingEvidence,
): RoleMappingEvidence => {
  if (roleEvidence.legacyRole === "admin") {
    const complete = mappingEvidence.matched
      && mappingEvidence.targetTenantId === APPROVED_LEGACY_TENANT_ID
      && roleEvidence.validIdentity
      && roleEvidence.tenantScopeProven;
    if (complete) {
      return Object.freeze({
        mappedRole: MEMBERSHIP_ROLES.TENANT_ADMIN,
        reasonCodes: Object.freeze([]),
        humanReviewRequired: false,
        eligible: true,
      });
    }
    const reasons: QuarantineReasonCode[] = [...mappingEvidence.reasonCodes];
    if (!roleEvidence.validIdentity) reasons.push("MISSING_MANDATORY_SOURCE_IDENTITY");
    if (!roleEvidence.tenantScopeProven) reasons.push("INSUFFICIENT_ADMIN_TENANT_SCOPE");
    return Object.freeze({
      mappedRole: null,
      reasonCodes: Object.freeze(reasons),
      humanReviewRequired: true,
      eligible: false,
    });
  }
  if (roleEvidence.legacyRole === "user") {
    const complete = mappingEvidence.matched
      && mappingEvidence.targetTenantId === APPROVED_LEGACY_TENANT_ID
      && roleEvidence.validIdentity
      && roleEvidence.supportingCourseEvidence;
    if (complete) {
      return Object.freeze({
        mappedRole: MEMBERSHIP_ROLES.STUDENT,
        reasonCodes: Object.freeze([]),
        humanReviewRequired: false,
        eligible: true,
      });
    }
    const reasons: QuarantineReasonCode[] = [...mappingEvidence.reasonCodes];
    reasons.push("INSUFFICIENT_USER_ROLE_EVIDENCE");
    return Object.freeze({
      mappedRole: null,
      reasonCodes: Object.freeze(reasons),
      humanReviewRequired: true,
      eligible: false,
    });
  }
  return Object.freeze({
    mappedRole: null,
    reasonCodes: Object.freeze(["UNKNOWN_LEGACY_ROLE"] as const),
    humanReviewRequired: false,
    eligible: false,
  });
};

export const evaluateEnrollmentEvidence = (
  identity: EnrollmentIdentityEvidence,
  tenant: EnrollmentTenantEvidence,
  membership: EnrollmentMembershipEvidence,
  course: EnrollmentCourseEvidence,
  relationshipEvidence: EnrollmentRelationshipEvidence,
  targetComparison: TargetComparisonLiteral,
): EnrollmentEvidenceEvaluation => {
  const reasons: QuarantineReasonCode[] = [];
  if (!identity.stable || !validId(identity.uid)) reasons.push("MISSING_MANDATORY_SOURCE_IDENTITY");
  if (!tenant.approved || tenant.tenantId !== APPROVED_LEGACY_TENANT_ID) reasons.push("INSUFFICIENT_ADMIN_TENANT_SCOPE");
  if (!membership.valid || !validId(membership.membershipId) || membership.tenantId !== tenant.tenantId) {
    reasons.push("MALFORMED_SOURCE_DATA");
  }
  if (!course.valid || !validId(course.courseId) || course.tenantId !== tenant.tenantId) {
    reasons.push("MALFORMED_SOURCE_DATA");
  }
  if (!relationshipEvidence.explicit || relationshipEvidence.ambiguous) reasons.push("AMBIGUOUS_ENROLLMENT_EVIDENCE");
  if (targetComparison === "CONFLICT") reasons.push("CONFLICTING_TARGET_STATE");
  if (targetComparison === "UNCOMPARABLE") reasons.push("TARGET_COMPARISON_IMPOSSIBLE");
  return Object.freeze({
    eligible: reasons.length === 0 && targetComparison !== "CONFLICT" && targetComparison !== "UNCOMPARABLE",
    reasonCodes: Object.freeze(reasons),
    humanReviewRequired: !relationshipEvidence.explicit
      || relationshipEvidence.ambiguous
      || targetComparison === "CONFLICT"
      || targetComparison === "UNCOMPARABLE"
      || reasons.includes("INSUFFICIENT_ADMIN_TENANT_SCOPE"),
  });
};
