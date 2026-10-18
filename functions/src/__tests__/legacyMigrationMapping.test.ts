import assert from "node:assert/strict";
import test from "node:test";
import { MEMBERSHIP_ROLES } from "@mipymetic/saas-contracts/domain";
import { createMappingTableInput, evaluateOrganizationInstitutionMapping } from "../migration/mappingTable.js";
import { evaluateEnrollmentEvidence, evaluateLegacyRole } from "../migration/legacyMigrationMapping.js";
import { APPROVED_LEGACY_TENANT_ID, type ApprovedMappingRow } from "../migration/legacyMigrationTypes.js";

const row = (mappingId: string, targetTenantId: string = APPROVED_LEGACY_TENANT_ID, legacySourceKind: "organization" | "institution" = "organization"): ApprovedMappingRow => ({
  mappingTableId: "mapping-table",
  mappingTableVersion: "v1",
  mappingId,
  legacySourceKind,
  legacyOrganizationId: "org-1",
  legacyInstitutionId: "inst-1",
  targetTenantId,
  mappingStatus: "approved",
  provenanceCode: "PRODUCT_OWNER_APPROVED_MAPPING",
  approvalEvidenceCode: "reviewed",
  reviewReference: "review-1",
  effectiveLogicalTime: "2026-01-01T00:00:00.000Z",
  schemaVersion: "v1",
});

const table = createMappingTableInput("mapping-table", "v1", [row("mapping-1")]);
const source = { organizationId: "org-1", institutionId: "inst-1" };

test("approved organization/institution mapping is exact and immutable", () => {
  const result = evaluateOrganizationInstitutionMapping(source, table);
  assert.equal(result.matched, true);
  assert.equal(result.targetTenantId, APPROVED_LEGACY_TENANT_ID);
  assert.equal(result.mappingId, "mapping-1");
  assert.throws(() => (table.approvedRows as Array<unknown>).push(row("bad")), TypeError);
});

test("missing mappings and aliases fail closed", () => {
  const missing = evaluateOrganizationInstitutionMapping({ organizationId: "org-2", institutionId: "inst-1" }, table);
  assert.deepEqual(missing.reasonCodes, ["MISSING_ORGANIZATION_INSTITUTION_MAPPING"]);
  const alias = evaluateOrganizationInstitutionMapping({ organizationId: "ORG-1", institutionId: "inst-1" }, table);
  assert.deepEqual(alias.reasonCodes, ["MISSING_ORGANIZATION_INSTITUTION_MAPPING"]);
  const malformed = evaluateOrganizationInstitutionMapping({ organizationId: "bad/id", institutionId: "inst-1" }, table);
  assert.deepEqual(malformed.reasonCodes, ["MALFORMED_SOURCE_DATA"]);
});

test("conflicting approved mappings require review", () => {
  const conflicting = createMappingTableInput("mapping-table", "v1", [row("mapping-1"), row("mapping-2", APPROVED_LEGACY_TENANT_ID, "institution")]);
  const result = evaluateOrganizationInstitutionMapping(source, conflicting);
  assert.equal(result.conflict, true);
  assert.equal(result.humanReviewRequired, true);
  assert.deepEqual(result.reasonCodes, ["CONFLICTING_ORGANIZATION_INSTITUTION_MAPPING"]);
});

test("role mapping requires the accepted authority evidence", () => {
  const mapping = evaluateOrganizationInstitutionMapping(source, table);
  const admin = evaluateLegacyRole({ legacyRole: "admin", validIdentity: true, tenantScopeProven: true, supportingCourseEvidence: false }, mapping);
  assert.equal(admin.mappedRole, MEMBERSHIP_ROLES.TENANT_ADMIN);
  const adminWithoutScope = evaluateLegacyRole({ legacyRole: "admin", validIdentity: true, tenantScopeProven: false, supportingCourseEvidence: false }, mapping);
  assert.equal(adminWithoutScope.eligible, false);
  assert.ok(adminWithoutScope.reasonCodes.includes("INSUFFICIENT_ADMIN_TENANT_SCOPE"));
  const student = evaluateLegacyRole({ legacyRole: "user", validIdentity: true, tenantScopeProven: false, supportingCourseEvidence: true }, mapping);
  assert.equal(student.mappedRole, MEMBERSHIP_ROLES.STUDENT);
  const roleAlone = evaluateLegacyRole({ legacyRole: "user", validIdentity: true, tenantScopeProven: false, supportingCourseEvidence: false }, mapping);
  assert.equal(roleAlone.eligible, false);
  assert.deepEqual(roleAlone.reasonCodes, ["INSUFFICIENT_USER_ROLE_EVIDENCE"]);
});

const identity = { stable: true, uid: "uid-1" };
const tenant = { approved: true, tenantId: APPROVED_LEGACY_TENANT_ID };
const membership = { valid: true, membershipId: "membership-1", tenantId: APPROVED_LEGACY_TENANT_ID };
const course = { valid: true, courseId: "course-1", tenantId: APPROVED_LEGACY_TENANT_ID };

test("enrollment evidence requires explicit, unambiguous relationship evidence", () => {
  const complete = evaluateEnrollmentEvidence(identity, tenant, membership, course, { explicit: true, ambiguous: false }, "TARGET_ABSENT");
  assert.equal(complete.eligible, true);
  const missingRelationship = evaluateEnrollmentEvidence(identity, tenant, membership, course, { explicit: false, ambiguous: false }, "TARGET_ABSENT");
  assert.equal(missingRelationship.eligible, false);
  assert.deepEqual(missingRelationship.reasonCodes, ["AMBIGUOUS_ENROLLMENT_EVIDENCE"]);
  const ambiguous = evaluateEnrollmentEvidence(identity, tenant, membership, course, { explicit: true, ambiguous: true }, "TARGET_ABSENT");
  assert.equal(ambiguous.humanReviewRequired, true);
});

test("enrollment target conflict never becomes eligible", () => {
  const result = evaluateEnrollmentEvidence(identity, tenant, membership, course, { explicit: true, ambiguous: false }, "CONFLICT");
  assert.equal(result.eligible, false);
  assert.deepEqual(result.reasonCodes, ["CONFLICTING_TARGET_STATE"]);
  assert.equal(result.humanReviewRequired, true);
});
