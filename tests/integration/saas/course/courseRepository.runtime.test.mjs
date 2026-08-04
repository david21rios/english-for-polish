import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import {
  PROJECT_ID, TENANTS, USERS, authenticatedFirestore, cleanup, clearFirestore,
  createCourseRepositoryForContext, createCourseRuntimeEnvironment, sdk, unauthenticatedFirestore
} from "./runtimeHarness.mjs";
import { COURSE_FIXTURES, seedCourseFixtures } from "./fixtures.mjs";

assert.equal(PROJECT_ID, "demo-polish-learning");
let environment;
before(async () => { environment = await createCourseRuntimeEnvironment(); });
beforeEach(async () => { await clearFirestore(environment); await seedCourseFixtures(environment); });
after(async () => { if (environment) await cleanup(environment); });

const repository = (uid) => createCourseRepositoryForContext(authenticatedFirestore(environment, uid));
const anonymousRepository = () => createCourseRepositoryForContext(unauthenticatedFirestore(environment));
const cases = [];
const matchesRepositoryError = (code, operation, resource) => (error) =>
  error.code === code && error.operation === operation && error.resource === resource;
const runtime = (id, expected, title, execute, outcome = expected === "ALLOW" ? "SUCCESS" : "RULES_DENY") => {
  cases.push({ id, expected, outcome });
  test(`${id} [${expected}] — ${title}`, execute);
};
const ids = (page) => page.items.map((item) => item.courseId);
const assertCatalog = (page, statuses) => {
  assert(page.items.length > 0);
  assert(page.items.every((item) => statuses.includes(item.status) && item.tenantId === TENANTS.a));
  assert.deepEqual(page.items.map((x) => `${x.displayName}:${x.courseId}`),
    page.items.map((x) => `${x.displayName}:${x.courseId}`).toSorted());
};
const active = (options) => repository(USERS.student).listActiveCoursesForTenant(TENANTS.a, options);
const teacher = (options) => repository(USERS.teacher).listTeacherCoursesForTenant(TENANTS.a, options);
const admin = (options) => repository(USERS.admin).listTenantAdminCoursesForTenant(TENANTS.a, options);
const decode = (token) => JSON.parse(new TextDecoder().decode(Uint8Array.from(
  atob(token.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - token.length % 4) % 4)),
  (character) => character.charCodeAt(0)
)));
const encode = (value) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const changed = (token, change) => { const value = decode(token); change(value); return encode(value); };

for (const [id, uid, courseId, allowed] of [
  ["001", USERS.student, "course-active-a1", true], ["002", USERS.student, "course-draft-a", false],
  ["003", USERS.student, "course-archived-a", false], ["004", USERS.teacher, "course-draft-a", true],
  ["005", USERS.teacher, "course-active-a1", true], ["006", USERS.teacher, "course-archived-a", false],
  ["007", USERS.admin, "course-draft-a", true], ["008", USERS.admin, "course-active-a1", true],
  ["009", USERS.admin, "course-archived-a", true], ["010", USERS.suspended, "course-active-a1", false],
  ["011", USERS.removed, "course-active-a1", false], ["012", USERS.foreign, "course-active-a1", false]
]) runtime(`RT-CRS-REP-${id}`, allowed ? "ALLOW" : "DENY", `point get ${uid} ${courseId}`, async () => {
  const operation = repository(uid).getCourse(TENANTS.a, courseId);
  if (!allowed) return assert.rejects(() => operation, matchesRepositoryError("FORBIDDEN", "get_course", "course"));
  const value = await operation;
  assert.equal(value.courseId, courseId); assert.equal(value.tenantId, TENANTS.a);
  assert.equal(value.status, courseId.includes("draft") ? "draft" : courseId.includes("archived") ? "archived" : "active");
  assert.match(value.createdAt, /Z$/u); assert(Object.isFrozen(value));
});
runtime("RT-CRS-REP-013", "DENY", "anonymous point get", () => assert.rejects(
  () => anonymousRepository().getCourse(TENANTS.a, "course-active-a1"),
  (e) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(e.code) && e.operation === "get_course" && e.resource === "course"
));
runtime("RT-CRS-REP-014", "DENY", "suspended Tenant blocks point get", () => assert.rejects(
  () => repository(USERS.student).getCourse(TENANTS.suspended, "course-c-active"), (e) => e.code === "FORBIDDEN"
));
runtime("RT-CRS-REP-015", "DENY", "archived Tenant blocks point get", () => assert.rejects(
  () => repository(USERS.student).getCourse(TENANTS.archived, "course-d-active"), (e) => e.code === "FORBIDDEN"
));
runtime("RT-CRS-REP-016", "DENY", "platform client has no bypass", () => assert.rejects(
  () => repository(USERS.platform).getCourse(TENANTS.a, "course-active-a1"), (e) => e.code === "FORBIDDEN"
));
runtime("RT-CRS-REP-017", "DENY", "protected missing Course is concealed", () => assert.rejects(
  () => repository(USERS.student).getCourse(TENANTS.a, "course-missing"), (e) => e.code === "FORBIDDEN"
));
runtime("RT-CRS-REP-018", "DENY", "isolated incompatible Course fails serializer", () => assert.rejects(
  () => repository(USERS.incompatible).getCourse(TENANTS.incompatible, "course-incompatible"),
  (e) => e.code === "CONTRACT_VIOLATION" && e.operation === "serialize_course" && e.resource === "course"
), "CONTRACT_ERROR");
runtime("RT-CRS-REP-019", "DENY", "member of another Tenant cannot read this Tenant", () => assert.rejects(
  () => repository(USERS.tenantBStudent).getCourse(TENANTS.a, "course-active-a1"),
  matchesRepositoryError("FORBIDDEN", "get_course", "course")
));

for (const [id, options, field, value] of [
  ["020", undefined, null, null], ["021", { learningLanguageCode: "en" }, "learningLanguage.languageCode", "en"],
  ["022", { supportLanguageCode: "es" }, "supportLanguageCode", "es"],
  ["023", { learningLanguageCode: "en", supportLanguageCode: "es" }, "supportLanguageCode", "es"]
]) runtime(`RT-CRS-REP-${id}`, "ALLOW", "student catalog filter shape", async () => {
  const page = await active(options); assertCatalog(page, ["active"]);
  assert(!ids(page).includes("course-draft-a") && !ids(page).includes("course-archived-a"));
  if (field) assert(page.items.every((item) => field.includes("learning") ? item.learningLanguage.languageCode === value : item[field] === value));
});
for (const [id, options] of [["030", undefined], ["031", { learningLanguageCode: "en" }],
  ["032", { supportLanguageCode: "es" }], ["033", { learningLanguageCode: "pl", supportLanguageCode: "es" }]])
  runtime(`RT-CRS-REP-${id}`, "ALLOW", "teacher catalog filter shape", async () => {
    const page = await teacher(options); assertCatalog(page, ["draft", "active"]); assert(!ids(page).includes("course-archived-a"));
    if (options?.learningLanguageCode) assert(page.items.every((item) => item.learningLanguage.languageCode === options.learningLanguageCode));
    if (options?.supportLanguageCode) assert(page.items.every((item) => item.supportLanguageCode === options.supportLanguageCode));
  });
runtime("RT-CRS-REP-034", "DENY", "student cannot invoke teacher draft query", () => assert.rejects(
  () => repository(USERS.student).listTeacherCoursesForTenant(TENANTS.a), (e) => e.code === "FORBIDDEN"
));
for (const [id, options] of [["040", undefined], ["041", { status: "draft" }],
  ["042", { status: "active" }], ["043", { status: "archived" }]])
  runtime(`RT-CRS-REP-${id}`, "ALLOW", "tenant-admin status shape", async () => {
    const page = await admin(options); assert(page.items.length > 0);
    if (options) assert(page.items.every((item) => item.status === options.status));
    else assert.deepEqual(new Set(page.items.map((item) => item.status)), new Set(["draft", "active", "archived"]));
    assert.deepEqual(page.items.map((x) => `${x.updatedAt}:${x.courseId}`),
      page.items.map((x) => `${x.updatedAt}:${x.courseId}`).toSorted().reverse());
  });
for (const [id, uid] of [["044", USERS.student], ["045", USERS.teacher], ["046", USERS.platform]])
  runtime(`RT-CRS-REP-${id}`, "DENY", "non-admin cannot use admin query", () => assert.rejects(
    () => repository(uid).listTenantAdminCoursesForTenant(TENANTS.a), (e) => e.code === "FORBIDDEN"
  ));

for (const [id, method, tenantId, uid] of [
  ["094", "listActiveCoursesForTenant", TENANTS.a, null],
  ["095", "listActiveCoursesForTenant", TENANTS.a, USERS.suspended],
  ["096", "listActiveCoursesForTenant", TENANTS.a, USERS.removed],
  ["097", "listActiveCoursesForTenant", TENANTS.a, USERS.foreign],
  ["098", "listActiveCoursesForTenant", TENANTS.suspended, USERS.student],
  ["099", "listActiveCoursesForTenant", TENANTS.archived, USERS.student],
  ["100", "listTeacherCoursesForTenant", TENANTS.a, null],
  ["101", "listTeacherCoursesForTenant", TENANTS.a, USERS.foreign],
  ["102", "listTeacherCoursesForTenant", TENANTS.a, USERS.teacherSuspended],
  ["103", "listTeacherCoursesForTenant", TENANTS.a, USERS.teacherRemoved],
  ["104", "listTeacherCoursesForTenant", TENANTS.suspended, USERS.suspendedTenantTeacher],
  ["105", "listTenantAdminCoursesForTenant", TENANTS.a, null],
  ["106", "listTenantAdminCoursesForTenant", TENANTS.a, USERS.foreign],
  ["107", "listTenantAdminCoursesForTenant", TENANTS.a, USERS.adminSuspended],
  ["108", "listTenantAdminCoursesForTenant", TENANTS.a, USERS.adminRemoved],
  ["109", "listTenantAdminCoursesForTenant", TENANTS.archived, USERS.archivedTenantAdmin]
]) runtime(`RT-CRS-SEC-${id}`, "DENY", `${method} rejects unauthorized actor or Tenant state`, () => {
  const target = uid ? repository(uid) : anonymousRepository();
  return assert.rejects(() => target[method](tenantId), (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code));
});

runtime("RT-CRS-REP-124", "ALLOW", "student catalog can return an explicit empty result", async () => {
  const page = await active({ learningLanguageCode: "de" });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});
runtime("RT-CRS-REP-125", "ALLOW", "teacher catalog can return an explicit empty result", async () => {
  const page = await teacher({ learningLanguageCode: "de" });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});
runtime("RT-CRS-REP-126", "ALLOW", "tenant-admin exact status can return an explicit empty result", async () => {
  const page = await repository(USERS.tenantBAdmin).listTenantAdminCoursesForTenant(TENANTS.b, { status: "draft" });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});

const paginate = async (call, pageSize, positionKind) => {
  const collected = []; let cursor; let terminal = false;
  for (let guard = 0; guard < 20; guard += 1) {
    const page = await call({ pageSize, ...(cursor ? { cursor } : {}) });
    assert(page.items.length <= pageSize); collected.push(...ids(page));
    if (!page.hasMore) { assert.equal(page.nextCursor, null); terminal = true; break; }
    assert.equal(page.items.length, pageSize); assert.equal(typeof page.nextCursor, "string");
    const position = decode(page.nextCursor); const last = page.items.at(-1);
    assert.equal(position.position.documentPath, `tenants/${last.tenantId}/courses/${last.courseId}`);
    assert.equal(position.position[positionKind], last[positionKind]); cursor = page.nextCursor;
  }
  assert(terminal); assert.equal(new Set(collected).size, collected.length); return collected;
};
runtime("RT-CRS-REP-050", "ALLOW", "student pagination reconstructs pageSize 1", async () => {
  assert.deepEqual(await paginate(active, 1, "displayName"), ids(await active({ pageSize: 20 })));
});
runtime("RT-CRS-REP-051", "ALLOW", "student pagination reconstructs pageSize 2", async () => {
  assert.deepEqual(await paginate(active, 2, "displayName"), ids(await active({ pageSize: 20 })));
});
runtime("RT-CRS-REP-052", "ALLOW", "teacher filtered pagination reconstructs", async () => {
  const call = (o) => teacher({ ...o, learningLanguageCode: "en" });
  assert.deepEqual(await paginate(call, 1, "displayName"), ids(await call({ pageSize: 20 })));
});
runtime("RT-CRS-REP-053", "ALLOW", "admin pagination reconstructs all states", async () => {
  assert.deepEqual(await paginate(admin, 2, "updatedAt"), ids(await admin({ pageSize: 20 })));
});
runtime("RT-CRS-REP-054", "ALLOW", "admin exact-status pagination reconstructs", async () => {
  const call = (o) => admin({ ...o, status: "active" });
  assert.deepEqual(await paginate(call, 1, "updatedAt"), ids(await call({ pageSize: 20 })));
});
runtime("RT-CRS-REP-127", "ALLOW", "pageSize 20 is terminal without exposing lookahead", async () => {
  const page = await active({ pageSize: 20 });
  assert(page.items.length > 0 && page.items.length < 20); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});

const firstCursor = async (call, options = {}) => (await call({ ...options, pageSize: 1 })).nextCursor;
runtime("RT-CRS-REP-060", "ALLOW", "student cursor is reusable", async () => assert((await active({ cursor: await firstCursor(active) })).items.length > 0));
runtime("RT-CRS-REP-061", "ALLOW", "teacher cursor is reusable", async () => assert((await teacher({ cursor: await firstCursor(teacher) })).items.length > 0));
runtime("RT-CRS-REP-062", "ALLOW", "admin cursor is reusable", async () => assert((await admin({ cursor: await firstCursor(admin) })).items.length > 0));
for (const [id, mutate, target] of [
  ["063", (x) => { x.binding.tenantId = TENANTS.b; }, active],
  ["064", (x) => { x.binding.learningLanguageCode = "es"; }, active],
  ["065", (x) => { x.binding.policy = "other"; }, active],
  ["066", (x) => { x.version = 2; }, active]
]) runtime(`RT-CRS-REP-${id}`, "DENY", "incompatible cursor fails closed", async () => {
  const token = changed(await firstCursor(active), mutate);
  await assert.rejects(() => target({ cursor: token }), (e) => e.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
for (const [id, cursor] of [["067", ""], ["068", "   "], ["069", "***"], ["070", "a".repeat(2049)]])
  runtime(`RT-CRS-REP-${id}`, "DENY", "malformed cursor is rejected", () => assert.rejects(
    () => active({ cursor }), (e) => e.code === "INVALID_ARGUMENT"
  ), "CONTRACT_ERROR");

for (const [id, source, sourceOptions, target, targetOptions] of [
  ["110", teacher, {}, active, {}],
  ["111", active, { supportLanguageCode: "es" }, active, { supportLanguageCode: "pl" }],
  ["112", admin, { status: "active" }, admin, { status: "draft" }]
]) runtime(`RT-CRS-REP-${id}`, "DENY", "cross-binding cursor is rejected", async () => {
  const cursor = await firstCursor(source, sourceOptions);
  await assert.rejects(() => target({ ...targetOptions, cursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
for (const [id, source, mutate] of [
  ["113", active, (value) => { value.binding.statusContract = "draft_active"; }],
  ["114", active, (value) => { value.binding.order = "updatedAt_desc_documentId_desc"; }]
]) runtime(`RT-CRS-REP-${id}`, "DENY", "mutated supported binding is rejected", async () => {
  const cursor = changed(await firstCursor(source), mutate);
  await assert.rejects(() => source({ cursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
for (const [id, tokenFactory] of [
  ["115", async () => `${await firstCursor(active)}=`],
  ["116", async () => encode("not-json")],
  ["117", async () => "_w"],
  ["118", async () => changed(await firstCursor(active), (value) => { value.extra = true; })],
  ["119", async () => changed(await firstCursor(active), (value) => { delete value.position; })],
  ["120", async () => changed(await firstCursor(active), (value) => { value.position.documentPath = `tenants/${TENANTS.b}/courses/course-active-a1`; })],
  ["121", async () => changed(await firstCursor(active), (value) => { value.position.documentPath = `tenants/${TENANTS.a}/lessons/course-active-a1`; })],
  ["122", async () => changed(await firstCursor(admin), (value) => { value.position.updatedAt = "not-a-timestamp"; })],
  ["123", async () => changed(await firstCursor(active), (value) => { value.position = { displayName: value.position.displayName }; })]
]) runtime(`RT-CRS-REP-${id}`, "DENY", "malformed cursor schema or position is rejected", async () => {
  const cursor = await tokenFactory();
  await assert.rejects(() => active({ cursor }), (error) => error.code === "INVALID_ARGUMENT");
}, "CONTRACT_ERROR");
for (const [id, mutate] of [
  ["128", (value) => { value.binding.extra = true; }],
  ["129", (value) => { delete value.binding.policy; }],
  ["130", (value) => { value.position.extra = true; }]
]) runtime(`RT-CRS-REP-${id}`, "DENY", "cursor nested schema is exact", async () => {
  const cursor = changed(await firstCursor(active), mutate);
  await assert.rejects(() => active({ cursor }), (error) => error.code === "INVALID_ARGUMENT" &&
    error.operation === "decode_course_cursor" && error.resource === "course_cursor");
}, "CONTRACT_ERROR");

runtime("RT-CRS-REP-071", "ALLOW", "runtime serialization is deep frozen and SDK-free", async () => {
  const value = await repository(USERS.student).getCourse(TENANTS.a, "course-active-a1");
  assert(Object.isFrozen(value) && Object.isFrozen(value.learningLanguage) && Object.isFrozen(value.interfaceLanguages));
  assert(Object.isFrozen(value.interfaceLanguages[0])); assert.match(value.createdAt, /Z$/u); assert.equal(value.archivedAt, null);
  assert.equal("ref" in value || "metadata" in value || "toDate" in value, false);
});
runtime("RT-CRS-REP-072", "ALLOW", "archived runtime timestamp serializes for admin", async () => {
  const value = await repository(USERS.admin).getCourse(TENANTS.a, "course-archived-a"); assert.match(value.archivedAt, /Z$/u);
});

for (const [id, action] of [
  ["080", (db) => sdk.setDoc(sdk.doc(db, `tenants/${TENANTS.a}/courses/course-new`),
    { ...COURSE_FIXTURES[0], courseId: "course-new" })],
  ["081", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/courses/course-active-a1`), { displayName: "Changed" })],
  ["082", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/courses/course-active-a1`), { status: "draft" })],
  ["078", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/courses/course-active-a1`),
    { status: "archived", archivedAt: COURSE_FIXTURES.find((course) => course.status === "archived").archivedAt })],
  ["083", (db) => sdk.deleteDoc(sdk.doc(db, `tenants/${TENANTS.a}/courses/course-active-a1`))]
]) runtime(`RT-CRS-SEC-${id}`, "DENY", "client Course write denied", async () => assertFails(action(
  authenticatedFirestore(environment, USERS.admin)
)));
for (const [id, uid] of [["084", USERS.student], ["085", USERS.admin], ["086", USERS.platform], ["087", null]])
  runtime(`RT-CRS-SEC-${id}`, "DENY", "Course collection-group denied", async () => {
    const db = uid ? authenticatedFirestore(environment, uid) : unauthenticatedFirestore(environment);
    await assertFails(sdk.getDocs(sdk.query(sdk.collectionGroup(db, "courses"), sdk.where("status", "==", "active"))));
  });
for (const [id, uid] of [["110", USERS.student], ["111", null]])
  runtime(`RT-CRS-SEC-${id}`, "DENY", "unfiltered Course collection-group denied", async () => {
    const db = uid ? authenticatedFirestore(environment, uid) : unauthenticatedFirestore(environment);
    await assertFails(sdk.getDocs(sdk.collectionGroup(db, "courses")));
  });
for (const [id, uid, constraints] of [
  ["088", USERS.student, []], ["089", USERS.student, [sdk.where("status", "==", "draft")]],
  ["090", USERS.teacher, [sdk.where("status", "in", ["draft", "active", "archived"])]],
  ["091", USERS.foreign, [sdk.where("status", "==", "active")]],
  ["092", USERS.suspended, [sdk.where("status", "==", "active")]],
  ["093", USERS.removed, [sdk.where("status", "==", "active")]]
]) runtime(`RT-CRS-SEC-${id}`, "DENY", "unsafe tenant query denied", async () => {
  const db = authenticatedFirestore(environment, uid);
  await assertFails(sdk.getDocs(sdk.query(sdk.collection(db, `tenants/${TENANTS.a}/courses`), ...constraints,
    sdk.orderBy("displayName", "asc"), sdk.orderBy(sdk.documentId(), "asc"))));
});
for (const [id, uid, tenantId, constraints] of [
  ["112", USERS.admin, TENANTS.a, []],
  ["113", USERS.platform, TENANTS.a, [sdk.where("status", "==", "active")]],
  ["114", null, TENANTS.a, [sdk.where("status", "==", "active")]],
  ["115", USERS.student, TENANTS.suspended, [sdk.where("status", "==", "active")]],
  ["116", USERS.student, TENANTS.archived, [sdk.where("status", "==", "active")]]
]) runtime(`RT-CRS-SEC-${id}`, "DENY", "unsafe actor or Tenant query denied by Rules", async () => {
  const db = uid ? authenticatedFirestore(environment, uid) : unauthenticatedFirestore(environment);
  const adminShape = constraints.length === 0;
  await assertFails(sdk.getDocs(sdk.query(sdk.collection(db, `tenants/${tenantId}/courses`), ...constraints,
    sdk.orderBy(adminShape ? "updatedAt" : "displayName", adminShape ? "desc" : "asc"),
    sdk.orderBy(sdk.documentId(), adminShape ? "desc" : "asc"))));
});
for (const [id, uid, status] of [
  ["117", USERS.student, "archived"],
  ["118", USERS.tenantBStudent, "active"]
]) runtime(`RT-CRS-SEC-${id}`, "DENY", "student unsafe status or foreign-Tenant query denied", async () => {
  const db = authenticatedFirestore(environment, uid);
  await assertFails(sdk.getDocs(sdk.query(sdk.collection(db, `tenants/${TENANTS.a}/courses`),
    sdk.where("status", "==", status), sdk.orderBy("displayName", "asc"), sdk.orderBy(sdk.documentId(), "asc"))));
});

test("Course runtime metadata self-control", () => {
  const idsSeen = cases.map((item) => item.id);
  assert.equal(new Set(idsSeen).size, idsSeen.length);
  assert(cases.every((item) => /^RT-CRS-(REP|SEC)-\d+$/u.test(item.id)));
  assert(cases.every((item) => ["ALLOW", "DENY"].includes(item.expected)));
  assert(cases.every((item) => ["SUCCESS", "RULES_DENY", "CONTRACT_ERROR", "NOT_FOUND"].includes(item.outcome)));
  assert(cases.every((item) => item.expected === "ALLOW" ? item.outcome === "SUCCESS" : item.outcome !== "SUCCESS"));
  const count = (field, value) => cases.filter((item) => item[field] === value).length;
  assert.equal(cases.length, 114); assert.equal(count("expected", "ALLOW"), 32); assert.equal(count("expected", "DENY"), 82);
  assert.equal(count("outcome", "SUCCESS"), 32); assert.equal(count("outcome", "RULES_DENY"), 56);
  assert.equal(count("outcome", "CONTRACT_ERROR"), 26); assert.equal(count("outcome", "NOT_FOUND"), 0);
});
