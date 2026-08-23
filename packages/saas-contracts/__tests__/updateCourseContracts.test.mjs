import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMAND_TYPES, UPDATE_COURSE_INPUT_FIELDS, UPDATE_COURSE_PATCH_FIELDS,
  UPDATE_COURSE_RESULT_FIELDS, UPDATE_COURSE_OPERATION, UPDATE_COURSE_RESOURCE_TYPE,
  UPDATE_COURSE_REQUIRED_CAPABILITY, UPDATE_COURSE_AUDIT_OPERATION,
  UPDATE_COURSE_AUDIT_BEFORE_FIELDS, UPDATE_COURSE_AUDIT_AFTER_FIELDS,
  UPDATE_COURSE_AUDIT_METADATA_FIELDS, validateUpdateCourseInput,
  updateCourseBehavioralPayload, validateUpdateCourseResult,
  isPrivilegedCommandStageAllowed,
  CAPABILITY_IDS,
} from "../src/index.js";

const base = () => ({
  commandId: "cmd-update-1", correlationId: "corr-update-1", tenantId: "tenant-1",
  courseId: "course-1", expectedVersion: 1,
  patch: { displayName: "Updated course" },
});

test("UpdateCourse exposes exact identity, stage and constants", () => {
  assert.equal(COMMAND_TYPES.UPDATE_COURSE, "UpdateCourse");
  assert.deepEqual(UPDATE_COURSE_INPUT_FIELDS, ["commandId", "correlationId", "tenantId", "courseId", "expectedVersion", "patch"]);
  assert.deepEqual(UPDATE_COURSE_PATCH_FIELDS, ["displayName", "description", "learningLanguage", "supportLanguageCode", "interfaceLanguages", "cefrLevel"]);
  assert.deepEqual(UPDATE_COURSE_RESULT_FIELDS, ["commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed"]);
  assert.equal(UPDATE_COURSE_OPERATION, "UpdateCourse");
  assert.equal(UPDATE_COURSE_RESOURCE_TYPE, "course");
  assert.equal(UPDATE_COURSE_REQUIRED_CAPABILITY, "course.update");
  assert.equal(UPDATE_COURSE_REQUIRED_CAPABILITY, CAPABILITY_IDS.COURSE_UPDATE);
  assert.equal(UPDATE_COURSE_AUDIT_OPERATION, "UpdateCourse.update");
  assert.equal(isPrivilegedCommandStageAllowed("UpdateCourse", "not_started"), false);
  assert.equal(isPrivilegedCommandStageAllowed("UpdateCourse", "completed"), false);
  assert(Object.isFrozen(UPDATE_COURSE_INPUT_FIELDS));
});

test("validates minimal and complete patches", () => {
  assert.equal(validateUpdateCourseInput(base()).ok, true);
  const value = base();
  value.patch = {
    displayName: "Updated", description: "Description", learningLanguage: { languageCode: "en", displayName: "English" },
    supportLanguageCode: "pl", interfaceLanguages: [{ locale: "en", displayName: "English" }, { locale: "pl", displayName: "Polski" }], cefrLevel: "B1",
  };
  assert.equal(validateUpdateCourseInput(value).ok, true);
});

test("rejects malformed envelope, versions, empty/unknown/forbidden patches", () => {
  for (const id of ["", " ", ".", "..", "a/b"]) {
    const value = base(); value.courseId = id;
    assert.equal(validateUpdateCourseInput(value).ok, false);
  }
  for (const version of [0, -1, 1.5, "1"]) {
    const value = base(); value.expectedVersion = version;
    assert.equal(validateUpdateCourseInput(value).ok, false);
  }
  for (const patch of [{}, { unknown: "x" }, { status: "active" }, { version: 2 }, { updatedAt: null }, { displayName: undefined }, { displayName: null }]) {
    const value = base(); value.patch = patch;
    assert.equal(validateUpdateCourseInput(value).ok, false);
  }
});

test("validates Course value objects strictly", () => {
  const cases = [
    { learningLanguage: { languageCode: "not a locale", displayName: "English" } },
    { supportLanguageCode: "not a locale" },
    { interfaceLanguages: [] },
    { interfaceLanguages: [{ locale: "en", displayName: "English" }, { locale: "en", displayName: "Duplicate" }] },
    { cefrLevel: "D9" },
    { description: "  " },
  ];
  for (const patch of cases) { const value = base(); value.patch = patch; assert.equal(validateUpdateCourseInput(value).ok, false); }
});

test("behavioral payload is exact, detached and frozen", () => {
  const input = base();
  const payload = updateCourseBehavioralPayload(input);
  assert.deepEqual(Object.keys(payload), ["tenantId", "courseId", "expectedVersion", "patch"]);
  assert.equal(Object.hasOwn(payload, "commandId"), false);
  assert.equal(Object.hasOwn(payload, "correlationId"), false);
  assert(Object.isFrozen(payload));
  assert(Object.isFrozen(payload.patch));
  input.patch.displayName = "mutated";
  assert.equal(payload.patch.displayName, "Updated course");
});

test("result and audit contracts remain bounded", () => {
  const result = { commandId: "cmd-1", correlationId: "corr-1", operation: "UpdateCourse", resourceType: "course", resourceId: "course-1", status: "succeeded", replayed: false };
  assert.equal(validateUpdateCourseResult(result).ok, true);
  assert.equal(validateUpdateCourseResult({ ...result, resultingVersion: 2 }).ok, false);
  assert.deepEqual(UPDATE_COURSE_AUDIT_BEFORE_FIELDS, ["courseExists", "courseStatus"]);
  assert.deepEqual(UPDATE_COURSE_AUDIT_AFTER_FIELDS, ["courseStatus"]);
  assert.deepEqual(UPDATE_COURSE_AUDIT_METADATA_FIELDS, ["stage", "changedFieldCount", "expectedVersion"]);
});
