import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import {
  PROJECT_ID, TENANTS, USERS, authenticatedFirestore, cleanup, clearFirestore,
  createEnrollmentRepositoryForContext, createEnrollmentRuntimeEnvironment, sdk, unauthenticatedFirestore,
  withSecurityRulesDisabled
} from "./runtimeHarness.mjs";
import { ENROLLMENT_FIXTURES, INCOMPATIBLE_ENROLLMENT, membershipFor, seedEnrollmentFixtures } from "./fixtures.mjs";

assert.equal(PROJECT_ID, "demo-polish-learning");
let environment;
before(async () => { environment = await createEnrollmentRuntimeEnvironment(); });
beforeEach(async () => { await clearFirestore(environment); await seedEnrollmentFixtures(environment); });
after(async () => { if (environment) await cleanup(environment); });

const repository = (uid) => createEnrollmentRepositoryForContext(authenticatedFirestore(environment, uid));
const anonymousRepository = () => createEnrollmentRepositoryForContext(unauthenticatedFirestore(environment));
const ownMembership = membershipFor(TENANTS.a, USERS.student).membershipId;
const suspendedMembership = membershipFor(TENANTS.a, USERS.suspended).membershipId;
const removedMembership = membershipFor(TENANTS.a, USERS.removed).membershipId;
const cases = [];
const runtime = (id, access, title, execute, outcome = access === "ALLOW" ? "SUCCESS" : "RULES_DENY") => {
  const uniqueTitle = `${title} (${id})`;
  cases.push({ id, access, title: uniqueTitle, outcome });
  test(`${id} [${access}] — ${uniqueTitle}`, execute);
};
const matches = (code, operation, resource) => (error) =>
  error.code === code && error.operation === operation && error.resource === resource;
const self = (uid = USERS.student, tenantId = TENANTS.a, membershipId = ownMembership) =>
  (options) => repository(uid).listOwnEnrollmentsForMembership(tenantId, membershipId, options);
const admin = (uid = USERS.admin, tenantId = TENANTS.a) =>
  (options) => repository(uid).listTenantEnrollmentsForAdmin(tenantId, options);
const ids = (page) => page.items.map((item) => item.enrollmentId);
const assertOrder = (items, field) => assert.deepEqual(
  items.map((item) => `${item[field]}:${item.enrollmentId}`),
  items.map((item) => `${item[field]}:${item.enrollmentId}`).toSorted().reverse()
);
const decode = (token) => JSON.parse(new TextDecoder().decode(Uint8Array.from(
  atob(token.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - token.length % 4) % 4)),
  (character) => character.charCodeAt(0)
)));
const encode = (value) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const changed = (token, change) => { const value = decode(token); change(value); return encode(value); };

for (const [number, uid, tenantId, enrollmentId, allowed] of [
  ["001", USERS.student, TENANTS.a, "enr-pending-z", true],
  ["002", USERS.student, TENANTS.a, "enr-active-z", true],
  ["003", USERS.student, TENANTS.a, "enr-completed", true],
  ["004", USERS.student, TENANTS.a, "enr-cancelled", true],
  ["005", USERS.suspended, TENANTS.a, "enr-suspended-history", true],
  ["006", USERS.removed, TENANTS.a, "enr-removed-history", true],
  ["007", USERS.admin, TENANTS.a, "enr-pending-z", true],
  ["008", USERS.admin, TENANTS.a, "enr-active-z", true],
  ["009", USERS.admin, TENANTS.a, "enr-completed", true],
  ["010", USERS.admin, TENANTS.a, "enr-cancelled", true],
  ["011", USERS.foreign, TENANTS.a, "enr-active-z", false],
  ["012", USERS.tenantBStudent, TENANTS.a, "enr-active-z", false],
  ["013", USERS.suspendedTenantStudent, TENANTS.suspended, "enr-suspended-tenant", true],
  ["014", USERS.suspendedTenantAdmin, TENANTS.suspended, "enr-suspended-tenant", false],
  ["015", USERS.archivedTenantStudent, TENANTS.archived, "enr-archived-tenant", false],
  ["016", USERS.adminSuspended, TENANTS.a, "enr-active-z", false],
  ["017", USERS.adminRemoved, TENANTS.a, "enr-active-z", false],
  ["018", USERS.platform, TENANTS.a, "enr-active-z", false]
]) runtime(`RT-ENR-REP-${number}`, allowed ? "ALLOW" : "DENY", `point get ${enrollmentId} for ${uid}`, async () => {
  const operation = repository(uid).getEnrollment(tenantId, enrollmentId);
  if (!allowed) return assert.rejects(() => operation, matches("FORBIDDEN", "get_enrollment", "enrollment"));
  const value = await operation;
  const physical = ENROLLMENT_FIXTURES.find((item) => item.tenantId === tenantId && item.enrollmentId === enrollmentId);
  assert.equal(value.enrollmentId, enrollmentId); assert.equal(value.tenantId, tenantId); assert.equal(value.status, physical.status);
  assert.equal(value.membershipId, physical.membershipId); assert.equal(value.courseId, physical.courseId); assert(Object.isFrozen(value));
  assert.equal(value.completedAt === null, physical.status !== "completed");
  assert.equal(value.cancelledAt === null, physical.status !== "cancelled");
});
runtime("RT-ENR-REP-019", "DENY", "anonymous point get is denied", () => assert.rejects(
  () => anonymousRepository().getEnrollment(TENANTS.a, "enr-active-z"),
  (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)
));
runtime("RT-ENR-REP-020", "DENY", "protected missing Enrollment is concealed", () => assert.rejects(
  () => repository(USERS.student).getEnrollment(TENANTS.a, "enr-missing"),
  matches("FORBIDDEN", "get_enrollment", "enrollment")
));
runtime("RT-ENR-REP-021", "DENY", "isolated incompatible Enrollment reaches serializer", () => assert.rejects(
  () => repository(USERS.incompatible).getEnrollment(TENANTS.incompatible, "enr-incompatible"),
  matches("CONTRACT_VIOLATION", "serialize_enrollment", "enrollment")
), "CONTRACT_ERROR");
runtime("RT-ENR-REP-022", "DENY", "self cannot read an Enrollment owned by another Membership", () => assert.rejects(
  () => repository(USERS.student).getEnrollment(TENANTS.a, "enr-suspended-history"),
  matches("FORBIDDEN", "get_enrollment", "enrollment")
));

runtime("RT-ENR-REP-030", "ALLOW", "self all-status list is non-empty and isolated", async () => {
  const page = await self()(); assert.equal(page.items.length, 6);
  assert(page.items.every((item) => item.tenantId === TENANTS.a && item.membershipId === ownMembership));
  assertOrder(page.items, "enrolledAt");
});
for (const [number, status] of [["031", "pending"], ["032", "active"], ["033", "completed"], ["034", "cancelled"]])
  runtime(`RT-ENR-REP-${number}`, "ALLOW", `self exact ${status} list`, async () => {
    const page = await self()({ status }); assert(page.items.length > 0);
    assert(page.items.every((item) => item.status === status && item.membershipId === ownMembership));
  });
runtime("RT-ENR-REP-035", "ALLOW", "self exact status can return empty", async () => {
  const page = await self(USERS.tenantBStudent, TENANTS.b, membershipFor(TENANTS.b, USERS.tenantBStudent).membershipId)({ status: "pending" });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});
runtime("RT-ENR-REP-036", "ALLOW", "suspended Membership can list own history", async () => {
  const page = await self(USERS.suspended, TENANTS.a, suspendedMembership)();
  assert.equal(page.items.length, 1); assert.equal(page.items[0].enrollmentId, "enr-suspended-history");
});
runtime("RT-ENR-REP-037", "ALLOW", "removed Membership can list own history", async () => {
  const page = await self(USERS.removed, TENANTS.a, removedMembership)();
  assert.equal(page.items.length, 1); assert.equal(page.items[0].enrollmentId, "enr-removed-history");
});
runtime("RT-ENR-REP-038", "ALLOW", "suspended Tenant permits self historical list", async () => {
  const membershipId = membershipFor(TENANTS.suspended, USERS.suspendedTenantStudent).membershipId;
  const page = await self(USERS.suspendedTenantStudent, TENANTS.suspended, membershipId)();
  assert.equal(page.items.length, 1); assert.equal(page.items[0].tenantId, TENANTS.suspended);
});
for (const [number, uid, tenantId, membershipId] of [
  ["039", USERS.student, TENANTS.a, suspendedMembership],
  ["040", USERS.tenantBStudent, TENANTS.a, ownMembership],
  ["041", USERS.platform, TENANTS.a, ownMembership],
  ["042", USERS.archivedTenantStudent, TENANTS.archived, membershipFor(TENANTS.archived, USERS.archivedTenantStudent).membershipId]
]) runtime(`RT-ENR-REP-${number}`, "DENY", "unauthorized self list is denied", () => assert.rejects(
  () => self(uid, tenantId, membershipId)(), (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)
));
runtime("RT-ENR-REP-043", "DENY", "anonymous self list is denied", () => assert.rejects(
  () => anonymousRepository().listOwnEnrollmentsForMembership(TENANTS.a, ownMembership),
  (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)
));

runtime("RT-ENR-REP-050", "ALLOW", "admin all-status list is non-empty and ordered", async () => {
  const page = await admin()(); assert.equal(page.items.length, 8); assertOrder(page.items, "updatedAt");
  assert.deepEqual(new Set(page.items.map((item) => item.status)), new Set(["pending", "active", "completed", "cancelled"]));
});
for (const [number, status] of [["051", "pending"], ["052", "active"], ["053", "completed"], ["054", "cancelled"]])
  runtime(`RT-ENR-REP-${number}`, "ALLOW", `admin exact ${status} list`, async () => {
    const page = await admin()({ status }); assert(page.items.length > 0);
    assert(page.items.every((item) => item.status === status && item.tenantId === TENANTS.a));
  });
runtime("RT-ENR-REP-055", "ALLOW", "admin exact status can return empty", async () => {
  const page = await admin(USERS.tenantBAdmin, TENANTS.b)({ status: "completed" });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});
for (const [number, uid, tenantId] of [
  ["056", USERS.student, TENANTS.a], ["057", USERS.teacher, TENANTS.a], ["058", USERS.platform, TENANTS.a],
  ["059", USERS.adminSuspended, TENANTS.a], ["060", USERS.adminRemoved, TENANTS.a],
  ["061", USERS.suspendedTenantAdmin, TENANTS.suspended], ["062", USERS.archivedTenantAdmin, TENANTS.archived],
  ["063", USERS.admin, TENANTS.b]
]) runtime(`RT-ENR-REP-${number}`, "DENY", "unauthorized admin list is denied", () => assert.rejects(
  () => admin(uid, tenantId)(), (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)
));
runtime("RT-ENR-REP-064", "DENY", "anonymous admin list is denied", () => assert.rejects(
  () => anonymousRepository().listTenantEnrollmentsForAdmin(TENANTS.a),
  (error) => ["FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)
));

const paginate = async (call, pageSize, positionField, base = {}) => {
  const collected = []; let cursor = null; let terminal = false;
  for (let guard = 0; guard < 20; guard += 1) {
    const page = await call({ ...base, pageSize, ...(cursor ? { cursor } : {}) });
    assert(page.items.length <= pageSize); collected.push(...ids(page));
    if (!page.hasMore) { assert.equal(page.nextCursor, null); terminal = true; break; }
    assert.equal(page.items.length, pageSize); assert.equal(typeof page.nextCursor, "string");
    const envelope = decode(page.nextCursor); const last = page.items.at(-1);
    assert.equal(envelope.position.documentPath, `tenants/${last.tenantId}/enrollments/${last.enrollmentId}`);
    assert.equal(envelope.position[positionField], last[positionField]); cursor = page.nextCursor;
  }
  assert(terminal); assert.equal(new Set(collected).size, collected.length); return collected;
};
for (const [number, call, size, field, options] of [
  ["070", self(), 1, "enrolledAt", {}], ["071", self(), 2, "enrolledAt", {}],
  ["072", self(), 20, "enrolledAt", {}], ["073", self(), 1, "enrolledAt", { status: "pending" }],
  ["074", admin(), 1, "updatedAt", {}], ["075", admin(), 2, "updatedAt", {}],
  ["076", admin(), 20, "updatedAt", {}], ["077", admin(), 1, "updatedAt", { status: "active" }]
]) runtime(`RT-ENR-REP-${number}`, "ALLOW", `pagination reconstructs ${field} with pageSize ${size}`, async () => {
  const actual = await paginate(call, size, field, options); const expected = ids(await call({ ...options, pageSize: 20 }));
  assert.deepEqual(actual, expected);
});
runtime("RT-ENR-REP-078", "ALLOW", "default page size returns the complete terminal self page", async () => {
  const page = await self()(); assert.equal(page.items.length, 6); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
  assertOrder(page.items, "enrolledAt");
});
runtime("RT-ENR-REP-079", "ALLOW", "paginated empty self result remains terminal", async () => {
  const membershipId = membershipFor(TENANTS.b, USERS.tenantBStudent).membershipId;
  const page = await self(USERS.tenantBStudent, TENANTS.b, membershipId)({ status: "pending", pageSize: 1 });
  assert.deepEqual(page.items, []); assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
});

const firstCursor = async (call, options = {}) => {
  const page = await call({ ...options, pageSize: 1 }); assert.equal(page.hasMore, true); return page.nextCursor;
};
runtime("RT-ENR-REP-080", "ALLOW", "self cursor is reusable", async () => {
  const page = await self()({ cursor: await firstCursor(self()) }); assert(page.items.length > 0);
});
runtime("RT-ENR-REP-081", "ALLOW", "admin cursor is reusable", async () => {
  const page = await admin()({ cursor: await firstCursor(admin()) }); assert(page.items.length > 0);
});
for (const [number, source, target, sourceOptions, targetOptions] of [
  ["082", self(), self(USERS.tenantBStudent, TENANTS.b, membershipFor(TENANTS.b, USERS.tenantBStudent).membershipId), {}, {}],
  ["083", self(), self(USERS.suspended, TENANTS.a, suspendedMembership), {}, {}],
  ["084", self(), self(), { status: "active" }, { status: "pending" }],
  ["085", self(), admin(), {}, {}]
]) runtime(`RT-ENR-REP-${number}`, "DENY", "cross-binding cursor is incompatible", async () => {
  const cursor = await firstCursor(source, sourceOptions);
  await assert.rejects(() => target({ ...targetOptions, cursor }), matches("CONTRACT_VIOLATION", "decode_enrollment_cursor", "enrollment_cursor"));
}, "CONTRACT_ERROR");
for (const [number, mutate] of [
  ["086", (value) => { value.binding.order = "other"; }],
  ["087", (value) => { value.binding.policy = "other"; }],
  ["088", (value) => { value.version = 2; }],
  ["089", (value) => { value.position.documentPath = `tenants/${TENANTS.b}/enrollments/enr-tenant-b`; }]
]) runtime(`RT-ENR-REP-${number}`, "DENY", "supported cursor shape with incompatible contract is rejected", async () => {
  const cursor = changed(await firstCursor(self()), mutate);
  await assert.rejects(() => self()({ cursor }), matches("CONTRACT_VIOLATION", "decode_enrollment_cursor", "enrollment_cursor"));
}, "CONTRACT_ERROR");
for (const [number, cursor] of [["090", ""], ["091", "   "]])
  runtime(`RT-ENR-REP-${number}`, "DENY", "empty cursor is rejected by option validation", () => assert.rejects(
    () => self()({ cursor }), matches("INVALID_ARGUMENT", "validate_enrollment_options", "enrollment_collection")
  ), "CONTRACT_ERROR");
for (const [number, factory] of [
  ["092", async () => "***"],
  ["093", async () => `${await firstCursor(self())}=`], ["094", async () => "_w"],
  ["095", async () => encode("not-json")], ["096", async () => "a".repeat(2049)],
  ["097", async () => changed(await firstCursor(self()), (value) => { value.extra = true; })],
  ["098", async () => changed(await firstCursor(self()), (value) => { delete value.binding; })],
  ["099", async () => changed(await firstCursor(self()), (value) => { value.binding.extra = true; })],
  ["100", async () => changed(await firstCursor(self()), (value) => { delete value.binding.policy; })],
  ["101", async () => changed(await firstCursor(self()), (value) => { value.position.extra = true; })],
  ["102", async () => changed(await firstCursor(self()), (value) => { delete value.position.enrolledAt; })],
  ["103", async () => changed(await firstCursor(self()), (value) => { value.position.enrolledAt = "invalid"; })],
  ["104", async () => changed(await firstCursor(self()), (value) => { value.position.enrolledAt = "2026-08-04T12:40:00Z"; })],
  ["105", async () => changed(await firstCursor(self()), (value) => { value.position.documentPath = `tenants/${TENANTS.a}/enrollments/nested/enr-active-z`; })],
  ["106", async () => changed(await firstCursor(self()), (value) => { value.position.documentPath = `tenants/${TENANTS.a}/courses/enr-active-z`; })]
]) runtime(`RT-ENR-REP-${number}`, "DENY", "malformed cursor is rejected as invalid argument", async () => {
  const cursor = await factory();
  await assert.rejects(() => self()({ cursor }), matches("INVALID_ARGUMENT", "decode_enrollment_cursor", "enrollment_cursor"));
}, "CONTRACT_ERROR");
runtime("RT-ENR-REP-107", "DENY", "noncanonical JSON cursor is rejected", async () => {
  const value = decode(await firstCursor(self()));
  const noncanonical = encode({ queryKind: value.queryKind, version: value.version, binding: value.binding, position: value.position });
  await assert.rejects(() => self()({ cursor: noncanonical }), matches("INVALID_ARGUMENT", "decode_enrollment_cursor", "enrollment_cursor"));
}, "CONTRACT_ERROR");

runtime("RT-ENR-REP-110", "ALLOW", "runtime serializer preserves exact frozen SDK-free shape", async () => {
  const value = await repository(USERS.student).getEnrollment(TENANTS.a, "enr-active-z");
  assert.deepEqual(Object.keys(value), ["enrollmentId", "tenantId", "membershipId", "courseId", "status", "enrolledAt", "updatedAt", "completedAt", "cancelledAt"]);
  assert(Object.isFrozen(value)); assert.equal(value.completedAt, null); assert.equal(value.cancelledAt, null);
  assert.match(value.enrolledAt, /\.000Z$/u); assert.equal("ref" in value || "metadata" in value || "toDate" in value, false);
});
runtime("RT-ENR-REP-111", "ALLOW", "completed lifecycle serializes terminal timestamp", async () => {
  const value = await repository(USERS.student).getEnrollment(TENANTS.a, "enr-completed");
  assert.match(value.completedAt, /\.000Z$/u); assert.equal(value.cancelledAt, null);
});
runtime("RT-ENR-REP-112", "ALLOW", "cancelled lifecycle serializes terminal timestamp", async () => {
  const value = await repository(USERS.student).getEnrollment(TENANTS.a, "enr-cancelled");
  assert.match(value.cancelledAt, /\.000Z$/u); assert.equal(value.completedAt, null);
});
runtime("RT-ENR-REP-113", "DENY", "isolated unknown physical field fails serialization", async () => {
  await withSecurityRulesDisabled(environment, async (context) => sdk.setDoc(
    sdk.doc(context.firestore(), `tenants/${TENANTS.incompatible}/enrollments/enr-incompatible`),
    { ...INCOMPATIBLE_ENROLLMENT, completedAt: null, unexpected: true }
  ));
  await assert.rejects(
    () => repository(USERS.incompatible).getEnrollment(TENANTS.incompatible, "enr-incompatible"),
    matches("CONTRACT_VIOLATION", "serialize_snapshot", "enrollment")
  );
}, "CONTRACT_ERROR");

for (const [number, action] of [
  ["120", (db) => sdk.setDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-new`), { ...ENROLLMENT_FIXTURES[0], enrollmentId: "enr-new" })],
  ["121", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`), { status: "completed" })],
  ["122", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`), { completedAt: new Date() })],
  ["123", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`), { cancelledAt: new Date() })],
  ["124", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`), { membershipId: suspendedMembership })],
  ["125", (db) => sdk.updateDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`), { courseId: "course-b" })],
  ["126", (db) => sdk.deleteDoc(sdk.doc(db, `tenants/${TENANTS.a}/enrollments/enr-active-z`))]
]) runtime(`RT-ENR-SEC-${number}`, "DENY", "client Enrollment write is denied", async () => {
  await assertFails(action(authenticatedFirestore(environment, USERS.admin)));
});
for (const [number, uid] of [["130", USERS.student], ["131", USERS.admin], ["132", null]])
  runtime(`RT-ENR-SEC-${number}`, "DENY", "Enrollment collection-group query is denied", async () => {
    const db = uid ? authenticatedFirestore(environment, uid) : unauthenticatedFirestore(environment);
    await assertFails(sdk.getDocs(sdk.query(sdk.collectionGroup(db, "enrollments"), sdk.where("status", "==", "active"))));
  });
for (const [number, uid, constraints] of [
  ["133", USERS.student, [sdk.where("membershipId", "==", ownMembership), sdk.where("status", "==", "active")]],
  ["134", USERS.student, [sdk.where("tenantId", "==", TENANTS.a), sdk.where("status", "==", "active")]],
  ["135", USERS.admin, [sdk.where("status", "==", "active")]],
  ["136", USERS.teacher, [sdk.where("tenantId", "==", TENANTS.a), sdk.where("courseId", "==", "course-a"), sdk.where("status", "==", "active")]],
  ["138", USERS.student, []],
  ["139", USERS.tenantBStudent, [sdk.where("tenantId", "==", TENANTS.a), sdk.where("membershipId", "==", ownMembership), sdk.where("status", "==", "active")]],
  ["140", USERS.platform, [sdk.where("tenantId", "==", TENANTS.a), sdk.where("status", "==", "active")]]
]) runtime(`RT-ENR-SEC-${number}`, "DENY", "unsafe Enrollment query is denied", async () => {
  const db = authenticatedFirestore(environment, uid);
  await assertFails(sdk.getDocs(sdk.query(sdk.collection(db, `tenants/${TENANTS.a}/enrollments`), ...constraints,
    sdk.orderBy(uid === USERS.admin ? "updatedAt" : "enrolledAt", "desc"), sdk.orderBy(sdk.documentId(), "desc"))));
});
runtime("RT-ENR-SEC-137", "ALLOW", "bounded admin Course filter is Rules-compatible but API-deferred", async () => {
  const db = authenticatedFirestore(environment, USERS.admin);
  const result = await sdk.getDocs(sdk.query(sdk.collection(db, `tenants/${TENANTS.a}/enrollments`),
    sdk.where("tenantId", "==", TENANTS.a), sdk.where("courseId", "==", "course-a"),
    sdk.where("status", "==", "active"), sdk.orderBy("updatedAt", "desc"), sdk.orderBy(sdk.documentId(), "desc")));
  assert(result.size > 0);
  assert(result.docs.every((snapshot) => snapshot.data().tenantId === TENANTS.a &&
    snapshot.data().courseId === "course-a" && snapshot.data().status === "active"));
});

test("Enrollment runtime metadata self-control", () => {
  const allIds = cases.map((item) => item.id); const titles = cases.map((item) => item.title);
  assert.equal(new Set(allIds).size, allIds.length); assert.equal(new Set(titles).size, titles.length);
  assert(cases.every((item) => /^RT-ENR-(REP|SEC)-\d+$/u.test(item.id)));
  assert(cases.every((item) => ["ALLOW", "DENY"].includes(item.access)));
  assert(cases.every((item) => ["SUCCESS", "RULES_DENY", "CONTRACT_ERROR", "NOT_FOUND"].includes(item.outcome)));
  assert(cases.every((item) => item.access === "ALLOW" ? item.outcome === "SUCCESS" : item.outcome !== "SUCCESS"));
  const count = (field, value) => cases.filter((item) => item[field] === value).length;
  assert.equal(count("access", "ALLOW"), count("outcome", "SUCCESS"));
  assert.equal(count("access", "DENY"), count("outcome", "RULES_DENY") + count("outcome", "CONTRACT_ERROR") + count("outcome", "NOT_FOUND"));
  assert.equal(cases.length, 111); assert.equal(count("access", "ALLOW"), 42); assert.equal(count("access", "DENY"), 69);
  assert.equal(count("outcome", "SUCCESS"), 42); assert.equal(count("outcome", "RULES_DENY"), 41);
  assert.equal(count("outcome", "CONTRACT_ERROR"), 28); assert.equal(count("outcome", "NOT_FOUND"), 0);
});
