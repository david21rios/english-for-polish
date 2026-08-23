import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_COURSE_AUDIT_AFTER_FIELDS, ARCHIVE_COURSE_AUDIT_BEFORE_FIELDS,
  ARCHIVE_COURSE_AUDIT_LEVEL, ARCHIVE_COURSE_AUDIT_METADATA_FIELDS,
  ARCHIVE_COURSE_AUDIT_OPERATION, ARCHIVE_COURSE_AUDIT_RESULT,
  ARCHIVE_COURSE_INPUT_FIELDS, ARCHIVE_COURSE_OPERATION,
  ARCHIVE_COURSE_REQUIRED_CAPABILITY, ARCHIVE_COURSE_RESOURCE_TYPE,
  ARCHIVE_COURSE_RESULT_FIELDS, archiveCourseBehavioralPayload,
  CAPABILITY_IDS, validateArchiveCourseInput, validateArchiveCourseResult,
} from "../src/index.js";

const input = {
  commandId: "cmd-archive-1", correlationId: "corr-archive-1",
  tenantId: "tenant-1", courseId: "course-1", expectedVersion: 1,
};

test("ArchiveCourse identity and capability are canonical", () => {
  assert.equal(ARCHIVE_COURSE_OPERATION, "ArchiveCourse");
  assert.equal(ARCHIVE_COURSE_RESOURCE_TYPE, "course");
  assert.equal(ARCHIVE_COURSE_REQUIRED_CAPABILITY, CAPABILITY_IDS.COURSE_ARCHIVE);
});

test("validates exact input and rejects malformed or forbidden fields", () => {
  assert.deepEqual([...ARCHIVE_COURSE_INPUT_FIELDS], ["commandId", "correlationId", "tenantId", "courseId", "expectedVersion"]);
  assert.equal(validateArchiveCourseInput(input).ok, true);
  for (const bad of [0, -1, 1.5, "1", null]) assert.equal(validateArchiveCourseInput({ ...input, expectedVersion: bad }).ok, false);
  for (const field of ["commandId", "correlationId", "tenantId", "courseId"]) {
    for (const value of ["", " ", ".", "..", "a/b"]) assert.equal(validateArchiveCourseInput({ ...input, [field]: value }).ok, false);
  }
  for (const field of ["status", "version", "archivedAt", "updatedAt", "createdAt", "actorUid", "membershipId", "authority", "role", "capability", "claims", "metadata"]) {
    assert.equal(validateArchiveCourseInput({ ...input, [field]: "forbidden" }).ok, false);
  }
});

test("behavioral payload is exact and frozen", () => {
  const payload = archiveCourseBehavioralPayload(input);
  assert.deepEqual(payload, { tenantId: "tenant-1", courseId: "course-1", expectedVersion: 1 });
  assert.equal(Object.isFrozen(payload), true);
  assert.equal(Object.hasOwn(payload, "commandId"), false);
});

test("result and bounded audit contracts are exact", () => {
  assert.deepEqual([...ARCHIVE_COURSE_RESULT_FIELDS], ["commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed"]);
  const result = { commandId: "cmd-1", correlationId: "corr-1", operation: "ArchiveCourse", resourceType: "course", resourceId: "course-1", status: "succeeded", replayed: false };
  assert.equal(validateArchiveCourseResult(result).ok, true);
  assert.equal(validateArchiveCourseResult({ ...result, status: "archived" }).ok, false);
  assert.equal(ARCHIVE_COURSE_AUDIT_OPERATION, "ArchiveCourse.archive");
  assert.equal(ARCHIVE_COURSE_AUDIT_LEVEL, "privileged");
  assert.equal(ARCHIVE_COURSE_AUDIT_RESULT, "succeeded");
  assert.deepEqual([...ARCHIVE_COURSE_AUDIT_BEFORE_FIELDS], ["courseExists", "courseStatus"]);
  assert.deepEqual([...ARCHIVE_COURSE_AUDIT_AFTER_FIELDS], ["courseStatus"]);
  assert.deepEqual([...ARCHIVE_COURSE_AUDIT_METADATA_FIELDS], ["stage", "expectedVersion"]);
});
