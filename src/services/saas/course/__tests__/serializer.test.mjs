import assert from "node:assert/strict";
import test from "node:test";
import { serializeCourse } from "../courseSerializer.js";
import { courseData, snapshot, timestamp } from "./testDoubles.mjs";

test("[positive] serializes draft, active and archived lifecycle states", () => {
  for (const [status, archivedAt] of [["draft", null], ["active", null], ["archived", timestamp()]]) {
    const result = serializeCourse(snapshot(courseData({ status, archivedAt })));
    assert.equal(result.status, status);
    assert.equal(result.archivedAt, archivedAt === null ? null : "2026-08-02T12:00:00.000Z");
  }
});
test("[positive] preserves all twelve fields and converts timestamps", () => {
  const result = serializeCourse(snapshot());
  assert.deepEqual(Object.keys(result), ["courseId", "tenantId", "displayName", "description", "learningLanguage",
    "supportLanguageCode", "interfaceLanguages", "cefrLevel", "status", "createdAt", "updatedAt", "archivedAt"]);
  assert.equal(result.createdAt, "2026-08-02T12:00:00.000Z");
});
test("[positive] deeply copies, freezes and preserves nested order", () => {
  const data = courseData({ interfaceLanguages: [
    { locale: "pl-PL", displayName: "Polski" }, { locale: "en-US", displayName: "English" }
  ] });
  const result = serializeCourse(snapshot(data));
  assert.notEqual(result.learningLanguage, data.learningLanguage);
  assert.notEqual(result.interfaceLanguages, data.interfaceLanguages);
  assert.notEqual(result.interfaceLanguages[0], data.interfaceLanguages[0]);
  assert(Object.isFrozen(result)); assert(Object.isFrozen(result.learningLanguage));
  assert(Object.isFrozen(result.interfaceLanguages)); assert(Object.isFrozen(result.interfaceLanguages[0]));
  assert.deepEqual(result.interfaceLanguages.map(({ locale }) => locale), ["pl-PL", "en-US"]);
});
test("[positive] accepts canonical regional BCP 47 tags and isolates later source mutation", () => {
  const source = courseData({
    learningLanguage: { languageCode: "en-US", displayName: "English (US)" },
    supportLanguageCode: "es-CO",
    interfaceLanguages: [{ locale: "pl-PL", displayName: "Polski" }]
  });
  const result = serializeCourse(snapshot(source));
  source.learningLanguage.displayName = "changed";
  source.interfaceLanguages[0].displayName = "changed";
  source.interfaceLanguages.push({ locale: "es", displayName: "Español" });
  assert.equal(result.learningLanguage.displayName, "English (US)");
  assert.deepEqual(result.interfaceLanguages, [{ locale: "pl-PL", displayName: "Polski" }]);
});
test("[negative] rejects missing and unknown physical fields", () => {
  const missing = courseData(); delete missing.archivedAt;
  assert.throws(() => serializeCourse(snapshot(missing)), (error) => error.code === "CONTRACT_VIOLATION");
  assert.throws(() => serializeCourse(snapshot(courseData({ visibility: "public" }))),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] rejects nonexistent snapshots and non-plain data", () => {
  assert.throws(() => serializeCourse({ exists: () => false }), (error) => error.code === "NOT_FOUND");
  assert.throws(() => serializeCourse({ id: "course-1", exists: () => true, data: () => [] }));
});
test("[negative] rejects course and Tenant identity mismatches", () => {
  assert.throws(() => serializeCourse(snapshot(courseData({ courseId: "course-2" }))));
  assert.throws(() => serializeCourse(snapshot(), { expectedCourseId: "course-2" }));
  assert.throws(() => serializeCourse(snapshot(), { expectedTenantId: "tenant-2" }));
});
test("[negative] rejects noncanonical and mismatched snapshot paths", () => {
  for (const path of ["organizations/tenant-1/courses/course-1", "tenants/tenant-1/nested/course-1",
    "tenants/tenant-2/courses/course-1", "tenants/tenant-1/courses/course-2"]) {
    assert.throws(() => serializeCourse(snapshot(courseData(), path)));
  }
});
test("[negative] rejects invalid status and CEFR values", () => {
  assert.throws(() => serializeCourse(snapshot(courseData({ status: "published" }))));
  assert.throws(() => serializeCourse(snapshot(courseData({ cefrLevel: "A0" }))));
});
test("[negative] enforces archivedAt lifecycle", () => {
  assert.throws(() => serializeCourse(snapshot(courseData({ status: "draft", archivedAt: timestamp() }))));
  assert.throws(() => serializeCourse(snapshot(courseData({ status: "active", archivedAt: timestamp() }))));
  assert.throws(() => serializeCourse(snapshot(courseData({ status: "archived", archivedAt: null }))));
});
test("[negative] rejects invalid required timestamps", () => {
  for (const field of ["createdAt", "updatedAt"]) {
    assert.throws(() => serializeCourse(snapshot(courseData({ [field]: "2026-08-02" }))));
  }
  assert.throws(() => serializeCourse(snapshot(courseData({ status: "archived", archivedAt: "bad" }))));
});
test("[negative] rejects invalid learningLanguage shapes", () => {
  for (const value of [null, [], { languageCode: "en" },
    { languageCode: "en", displayName: "English", extra: true },
    { languageCode: "EN", displayName: "English" }, { languageCode: "en", displayName: " " }]) {
    assert.throws(() => serializeCourse(snapshot(courseData({ learningLanguage: value }))));
  }
});
test("[negative] rejects nested objects with non-plain prototypes", () => {
  class Language { constructor() { this.languageCode = "en"; this.displayName = "English"; } }
  assert.throws(() => serializeCourse(snapshot(courseData({ learningLanguage: new Language() }))));
  assert.throws(() => serializeCourse(snapshot(courseData({
    interfaceLanguages: [Object.assign(Object.create({ inherited: true }), {
      locale: "pl-PL", displayName: "Polski"
    })]
  }))));
});
test("[negative] rejects invalid interfaceLanguages containers and elements", () => {
  const sparse = Array(2); sparse[0] = { locale: "pl-PL", displayName: "Polski" };
  for (const value of [[], sparse, [null], ["pl-PL"], [{ locale: "pl-PL" }],
    [{ locale: "pl-PL", displayName: "Polski", extra: true }]]) {
    assert.throws(() => serializeCourse(snapshot(courseData({ interfaceLanguages: value }))));
  }
});
test("[negative] rejects duplicate and noncanonical interface locales", () => {
  assert.throws(() => serializeCourse(snapshot(courseData({ interfaceLanguages: [
    { locale: "pl-PL", displayName: "A" }, { locale: "pl-PL", displayName: "B" }
  ] }))));
  assert.throws(() => serializeCourse(snapshot(courseData({ interfaceLanguages: [{ locale: "PL-pl", displayName: "A" }] }))));
});
test("[negative] rejects padded, invalid and noncanonical language tags", () => {
  for (const supportLanguageCode of [" pl", "not_a_tag", "EN"]) {
    assert.throws(() => serializeCourse(snapshot(courseData({ supportLanguageCode }))));
  }
});
test("[negative] rejects invalid simple strings without trimming source", () => {
  assert.throws(() => serializeCourse(snapshot(courseData({ displayName: " " }))));
  assert.throws(() => serializeCourse(snapshot(courseData({ description: null }))));
  const result = serializeCourse(snapshot(courseData({ description: "  retained  " })));
  assert.equal(result.description, "  retained  ");
});
