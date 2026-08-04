import assert from "node:assert/strict";
import test from "node:test";
import { createCourseRepository } from "../index.js";
import { courseData, createSdk, snapshot, timestamp } from "./testDoubles.mjs";

const db = Object.freeze({ kind: "db" });
const make = (config) => {
  const doubles = createSdk(config);
  return { ...doubles, repository: createCourseRepository({ db, sdk: doubles.sdk }) };
};
const whereCalls = (calls) => calls.filter(([name]) => name === "where").map(([, ...args]) => args);
const assertTenantFirst = (calls, tenantId = "tenant-1") => {
  const filters = whereCalls(calls);
  assert.deepEqual(filters[0], ["tenantId", "==", tenantId]);
};

test("[positive] point get uses canonical path and exactly one read", async () => {
  const { repository, calls } = make();
  assert.equal((await repository.getCourse("tenant-1", "course-1")).courseId, "course-1");
  assert.deepEqual(calls.find(([name]) => name === "doc"), ["doc", db, "tenants/tenant-1/courses/course-1"]);
  assert.equal(calls.filter(([name]) => name === "getDoc").length, 1);
  assert.equal(calls.filter(([name]) => name === "getDocs").length, 0);
});
test("[negative] point get validates IDs and maps absence and Firebase errors", async () => {
  await assert.rejects(() => make().repository.getCourse("", "course-1"));
  await assert.rejects(() => make({ getDocResult: { exists: () => false } }).repository.getCourse("tenant-1", "course-1"),
    (error) => error.code === "NOT_FOUND");
  const denied = createSdk(); denied.sdk.getDoc = async () => { throw { code: "permission-denied" }; };
  await assert.rejects(() => createCourseRepository({ db, sdk: denied.sdk }).getCourse("tenant-1", "course-1"),
    (error) => error.code === "FORBIDDEN");
  const unavailable = createSdk(); unavailable.sdk.getDoc = async () => { throw { code: "unavailable" }; };
  await assert.rejects(() => createCourseRepository({ db, sdk: unavailable.sdk }).getCourse("tenant-1", "course-1"),
    (error) => error.code === "UNAVAILABLE");
});
test("[negative] unknown point-get errors are normalized without sensitive values", async () => {
  const unknown = createSdk();
  unknown.sdk.getDoc = async () => { throw new Error("tenant-1 course-1 secret-token"); };
  await assert.rejects(
    () => createCourseRepository({ db, sdk: unknown.sdk }).getCourse("tenant-1", "course-1"),
    (error) => error.code === "UNKNOWN" && error.operation === "get_course" && error.resource === "course" &&
      !JSON.stringify(error).includes("tenant-1") && !JSON.stringify(error).includes("course-1") &&
      !JSON.stringify(error).includes("secret-token")
  );
});
test("[positive] active list fixes active status and four language combinations", async () => {
  for (const options of [{}, { learningLanguageCode: "en" }, { supportLanguageCode: "pl" },
    { learningLanguageCode: "en", supportLanguageCode: "pl" }]) {
    const { repository, calls } = make(); await repository.listActiveCoursesForTenant("tenant-1", options);
    const filters = whereCalls(calls);
    assertTenantFirst(calls);
    assert(filters.some(([field, operator, value]) => field === "status" && operator === "==" && value === "active"));
    assert.equal(filters.some(([field]) => field === "learningLanguage.languageCode"), Object.hasOwn(options, "learningLanguageCode"));
    assert.equal(filters.some(([field]) => field === "supportLanguageCode"), Object.hasOwn(options, "supportLanguageCode"));
  }
});
test("[positive] teacher list fixes draft-active status and catalog order", async () => {
  for (const options of [{}, { learningLanguageCode: "en" }, { supportLanguageCode: "pl" },
    { learningLanguageCode: "en", supportLanguageCode: "pl" }]) {
    const { repository, calls } = make();
    await repository.listTeacherCoursesForTenant("tenant-1", options);
    const filters = whereCalls(calls);
    assertTenantFirst(calls);
    assert(filters.some(([field, operator, value]) => field === "status" && operator === "in" &&
      JSON.stringify(value) === JSON.stringify(["draft", "active"])));
    assert.equal(filters.some(([field]) => field === "learningLanguage.languageCode"),
      Object.hasOwn(options, "learningLanguageCode"));
    assert.equal(filters.some(([field]) => field === "supportLanguageCode"),
      Object.hasOwn(options, "supportLanguageCode"));
    assert(calls.some((call) => call[0] === "orderBy" && call[1] === "displayName" && call[2] === "asc"));
    assert(!JSON.stringify(calls).includes("archived"));
  }
});
test("[positive] admin omitted status uses fixed canonical set", async () => {
  const { repository, calls } = make(); await repository.listTenantAdminCoursesForTenant("tenant-1");
  assertTenantFirst(calls);
  assert(whereCalls(calls).some(([field, operator, value]) => field === "status" && operator === "in" &&
    JSON.stringify(value) === JSON.stringify(["draft", "active", "archived"])));
});
test("[positive] admin exact statuses use equality and administrative order", async () => {
  for (const status of ["draft", "active", "archived"]) {
    const { repository, calls } = make(); await repository.listTenantAdminCoursesForTenant("tenant-1", { status });
    assertTenantFirst(calls);
    assert(whereCalls(calls).some(([field, operator, value]) => field === "status" && operator === "==" && value === status));
    assert(calls.some((call) => call[0] === "orderBy" && call[1] === "updatedAt" && call[2] === "desc"));
  }
});
test("[positive] lookahead creates frozen page and excludes extra item", async () => {
  const docs = [snapshot(), snapshot(courseData({ courseId: "course-2", displayName: "Polish A1" }), "tenants/tenant-1/courses/course-2")];
  const { repository, calls } = make({ getDocsResult: { docs } });
  const page = await repository.listActiveCoursesForTenant("tenant-1", { pageSize: 1 });
  assert.equal(page.items.length, 1); assert.equal(page.hasMore, true); assert.equal(typeof page.nextCursor, "string");
  assert(Object.isFrozen(page)); assert(Object.isFrozen(page.items));
  assert(calls.some((call) => call[0] === "limit" && call[1] === 2));
});
test("[positive] omitted pageSize requests the default limit plus one", async () => {
  const { repository, calls } = make();
  await repository.listActiveCoursesForTenant("tenant-1");
  assert(calls.some((call) => call[0] === "limit" && call[1] === 21));
});
test("[positive] empty and terminal pages have no continuation", async () => {
  for (const docs of [[], [snapshot()]]) {
    const page = await make({ getDocsResult: { docs } }).repository.listActiveCoursesForTenant("tenant-1", { pageSize: 2 });
    assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
  }
});
test("[positive] catalog cursor uses displayName and simple course ID", async () => {
  const docs = [snapshot(), snapshot(courseData({ courseId: "course-2" }), "tenants/tenant-1/courses/course-2")];
  const first = await make({ getDocsResult: { docs } }).repository.listTeacherCoursesForTenant("tenant-1", { pageSize: 1 });
  const second = make(); await second.repository.listTeacherCoursesForTenant("tenant-1", { cursor: first.nextCursor });
  const call = second.calls.find(([name]) => name === "startAfter");
  assert.deepEqual(call.slice(1), ["English A1", "course-1"]);
});
test("[positive] student cursor uses displayName and simple course ID", async () => {
  const docs = [snapshot(), snapshot(courseData({ courseId: "course-2" }), "tenants/tenant-1/courses/course-2")];
  const first = await make({ getDocsResult: { docs } }).repository.listActiveCoursesForTenant("tenant-1", { pageSize: 1 });
  const second = make();
  await second.repository.listActiveCoursesForTenant("tenant-1", { cursor: first.nextCursor });
  assert.deepEqual(second.calls.find(([name]) => name === "startAfter").slice(1), ["English A1", "course-1"]);
});
test("[positive] admin cursor uses Date and simple course ID", async () => {
  const docs = [snapshot(), snapshot(courseData({ courseId: "course-2" }), "tenants/tenant-1/courses/course-2")];
  const first = await make({ getDocsResult: { docs } }).repository.listTenantAdminCoursesForTenant("tenant-1", { pageSize: 1 });
  const second = make(); await second.repository.listTenantAdminCoursesForTenant("tenant-1", { cursor: first.nextCursor });
  const call = second.calls.find(([name]) => name === "startAfter");
  assert(call[1] instanceof Date); assert.equal(call[2], "course-1");
});
test("[negative] list rejects foreign and noncanonical result paths", async () => {
  for (const path of ["tenants/tenant-2/courses/course-1", "organizations/tenant-1/courses/course-1",
    "tenants/tenant-1/nested/value/courses/course-1", "tenants/tenant-1/Courses/course-1"]) {
    await assert.rejects(() => make({ getDocsResult: { docs: [snapshot(courseData(), path)] } }).repository
      .listActiveCoursesForTenant("tenant-1"), (error) => error.code === "CONTRACT_VIOLATION");
  }
});
test("[negative] list errors normalize and incompatible cursors fail closed", async () => {
  const failing = createSdk(); failing.sdk.getDocs = async () => { throw { code: "unavailable" }; };
  await assert.rejects(() => createCourseRepository({ db, sdk: failing.sdk }).listActiveCoursesForTenant("tenant-1"),
    (error) => error.code === "UNAVAILABLE");
  const docs = [snapshot(), snapshot(courseData({ courseId: "course-2" }), "tenants/tenant-1/courses/course-2")];
  const page = await make({ getDocsResult: { docs } }).repository.listActiveCoursesForTenant("tenant-1", { pageSize: 1 });
  await assert.rejects(() => make().repository.listTeacherCoursesForTenant("tenant-1", { cursor: page.nextCursor }),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] every exact dependency is required", () => {
  const { sdk } = createSdk(); assert.throws(() => createCourseRepository({ sdk }));
  for (const name of Object.keys(sdk)) {
    const incomplete = { ...sdk }; delete incomplete[name];
    assert.throws(() => createCourseRepository({ db, sdk: incomplete }));
  }
  assert.throws(() => createCourseRepository({ db, sdk: { ...sdk, setDoc: () => {} } }));
});
test("[positive] public API and repository are minimal and immutable", async () => {
  assert.deepEqual(Object.keys(await import("../index.js")), ["createCourseRepository"]);
  const repository = make().repository; assert(Object.isFrozen(repository));
  assert.deepEqual(Object.keys(repository), ["getCourse", "listActiveCoursesForTenant",
    "listTeacherCoursesForTenant", "listTenantAdminCoursesForTenant"]);
});
