import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVATE_COURSE_AUDIT_AFTER_FIELDS,
  ACTIVATE_COURSE_AUDIT_BEFORE_FIELDS,
  ACTIVATE_COURSE_AUDIT_LEVEL,
  ACTIVATE_COURSE_AUDIT_METADATA_FIELDS,
  ACTIVATE_COURSE_AUDIT_OPERATION,
  ACTIVATE_COURSE_AUDIT_RESULT,
  ACTIVATE_COURSE_INPUT_FIELDS,
  ACTIVATE_COURSE_OPERATION,
  ACTIVATE_COURSE_REQUIRED_CAPABILITY,
  ACTIVATE_COURSE_RESOURCE_TYPE,
  ACTIVATE_COURSE_RESULT_FIELDS,
  activateCourseBehavioralPayload,
  CAPABILITY_IDS,
  validateActivateCourseInput,
  validateActivateCourseResult,
} from "../src/index.js";

const input = {
  commandId: "cmd-activate-1", correlationId: "corr-activate-1",
  tenantId: "tenant-1", courseId: "course-1", expectedVersion: 1,
};

test("ActivateCourse identity and capability are canonical", () => {
  assert.equal(ACTIVATE_COURSE_OPERATION, "ActivateCourse");
  assert.equal(ACTIVATE_COURSE_RESOURCE_TYPE, "course");
  assert.equal(ACTIVATE_COURSE_REQUIRED_CAPABILITY, CAPABILITY_IDS.COURSE_ACTIVATE);
});

test("validates exact input and rejects malformed or unknown fields", () => {
  assert.deepEqual([...ACTIVATE_COURSE_INPUT_FIELDS], ["commandId", "correlationId", "tenantId", "courseId", "expectedVersion"]);
  assert.equal(validateActivateCourseInput(input).ok, true);
  for (const bad of [0, -1, 1.5, "1", null]) assert.equal(validateActivateCourseInput({ ...input, expectedVersion: bad }).ok, false);
  assert.equal(validateActivateCourseInput({ ...input, metadata: {} }).ok, false);
  for (const field of ["actorUid", "membershipId", "status", "version", "createdAt", "updatedAt", "archivedAt", "authority", "role", "capability", "claims", "metadata"]) {
    assert.equal(validateActivateCourseInput({ ...input, [field]: "forbidden" }).ok, false);
  }
  for (const field of ["commandId", "correlationId", "tenantId", "courseId"]) {
    for (const value of ["", " ", ".", "..", "a/b"]) assert.equal(validateActivateCourseInput({ ...input, [field]: value }).ok, false);
  }
});

test("behavioral payload is exact and detached", () => {
  const payload = activateCourseBehavioralPayload(input);
  assert.deepEqual(payload, { tenantId: "tenant-1", courseId: "course-1", expectedVersion: 1 });
  assert.equal(Object.isFrozen(payload), true);
  assert.equal(Object.hasOwn(payload, "commandId"), false);
});

test("result and audit contracts are exact", () => {
  assert.deepEqual([...ACTIVATE_COURSE_RESULT_FIELDS], ["commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed"]);
  assert.equal(validateActivateCourseResult({ commandId: "cmd-1", correlationId: "corr-1", operation: "ActivateCourse", resourceType: "course", resourceId: "course-1", status: "succeeded", replayed: false }).ok, true);
  assert.equal(validateActivateCourseResult({ commandId: "cmd-1", correlationId: "corr-1", operation: "ActivateCourse", resourceType: "course", resourceId: "course-1", status: "active", replayed: false }).ok, false);
  assert.equal(ACTIVATE_COURSE_AUDIT_OPERATION, "ActivateCourse.activate");
  assert.equal(ACTIVATE_COURSE_AUDIT_LEVEL, "privileged");
  assert.equal(ACTIVATE_COURSE_AUDIT_RESULT, "succeeded");
  assert.deepEqual([...ACTIVATE_COURSE_AUDIT_BEFORE_FIELDS], ["courseExists", "courseStatus"]);
  assert.deepEqual([...ACTIVATE_COURSE_AUDIT_AFTER_FIELDS], ["courseStatus"]);
  assert.deepEqual([...ACTIVATE_COURSE_AUDIT_METADATA_FIELDS], ["stage", "expectedVersion"]);
});
