import assert from "node:assert/strict";
import test from "node:test";
import { validatePersistedCourse } from "@mipymetic/saas-contracts/persistence";

const instant = "2026-08-13T12:00:00.000Z";
const course = {
  courseId: "course-1", tenantId: "tenant-1", displayName: "Course",
  description: "Description", learningLanguage: { languageCode: "en-US", displayName: "English" },
  supportLanguageCode: "pl-PL", interfaceLanguages: [{ locale: "pl-PL", displayName: "Polski" }],
  cefrLevel: "A1", version: 1, status: "draft", createdAt: instant, updatedAt: instant, archivedAt: null,
};

test("Course persisted version is required, strict and integer >= 1", () => {
  assert.equal(validatePersistedCourse(course).ok, true);
  for (const version of [undefined, null, 0, -1, 1.5, NaN, Infinity, "1", true]) {
    assert.equal(validatePersistedCourse({ ...course, version }).ok, false);
  }
  assert.equal(validatePersistedCourse({ ...course, version: 999 }).ok, true);
  assert.equal(validatePersistedCourse({ ...course, extra: true }).ok, false);
});

test("versionless Course is rejected without compatibility coercion", () => {
  const { version: _version, ...legacy } = course;
  assert.equal(validatePersistedCourse(legacy).ok, false);
});
