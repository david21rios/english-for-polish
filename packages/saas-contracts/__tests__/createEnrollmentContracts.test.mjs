import test from "node:test";
import assert from "node:assert/strict";
import { ATOMIC_TENANT_COMMAND_TYPES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES, createEnrollmentBehavioralPayload, validateCreateEnrollmentInput, validateCreateEnrollmentResult, isPrivilegedCommandStageAllowed } from "../src/commands/index.js";

const input = { commandId: "cmd-1", correlationId: "corr-1", tenantId: "tenant-1", membershipId: "member-1", courseId: "course-1" };
test("CreateEnrollment command and stages are authorized", () => {
  assert.equal(ATOMIC_TENANT_COMMAND_TYPES.includes(COMMAND_TYPES.CREATE_ENROLLMENT), true);
  for (const stage of Object.values(PRIVILEGED_COMMAND_STAGES)) assert.equal(isPrivilegedCommandStageAllowed(COMMAND_TYPES.CREATE_ENROLLMENT, stage), true);
});
test("CreateEnrollment validates exact input and behavioral payload", () => {
  assert.equal(validateCreateEnrollmentInput(input).ok, true);
  assert.deepEqual(createEnrollmentBehavioralPayload(input), { tenantId: "tenant-1", membershipId: "member-1", courseId: "course-1" });
  assert.equal(validateCreateEnrollmentInput({ ...input, enrollmentId: "x" }).ok, false);
});
test("CreateEnrollment validates exact result", () => {
  assert.equal(validateCreateEnrollmentResult({ enrollmentId: "enrollment-1" }).ok, true);
  assert.equal(validateCreateEnrollmentResult({ enrollmentId: "enrollment-1", extra: true }).ok, false);
});
