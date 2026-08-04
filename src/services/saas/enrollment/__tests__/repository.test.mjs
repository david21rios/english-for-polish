import assert from "node:assert/strict";
import test from "node:test";
import { createEnrollmentRepository } from "../index.js";
import { createSdk, enrollmentData, snapshot } from "./testDoubles.mjs";

const db = Object.freeze({ kind: "db" });
const make = (config) => { const doubles = createSdk(config); return { ...doubles, repository: createEnrollmentRepository({ db, sdk: doubles.sdk }) }; };
const whereCalls = (calls) => calls.filter(([name]) => name === "where").map(([, ...args]) => args);

test("[positive] point get uses canonical path and one read", async () => {
  const { repository, calls } = make(); const result = await repository.getEnrollment("tenant-1", "enrollment-1");
  assert.equal(result.enrollmentId, "enrollment-1");
  assert.deepEqual(calls.find(([name]) => name === "doc"), ["doc", db, "tenants/tenant-1/enrollments/enrollment-1"]);
  assert.equal(calls.filter(([name]) => name === "getDoc").length, 1); assert.equal(calls.filter(([name]) => name === "getDocs").length, 0);
});
test("[negative] point get rejects invalid IDs and missing document", async () => {
  await assert.rejects(() => make().repository.getEnrollment("", "enrollment-1"));
  await assert.rejects(() => make({ getDocResult: { exists: () => false } }).repository.getEnrollment("tenant-1", "enrollment-1"),
    (error) => error.code === "NOT_FOUND");
});
test("[negative] point get maps Firebase and sanitizes unknown errors", async () => {
  for (const [firebaseCode, expected] of [["permission-denied", "FORBIDDEN"], ["unavailable", "UNAVAILABLE"]]) {
    const value = createSdk(); value.sdk.getDoc = async () => { throw { code: firebaseCode }; };
    await assert.rejects(() => createEnrollmentRepository({ db, sdk: value.sdk }).getEnrollment("tenant-1", "enrollment-1"),
      (error) => error.code === expected);
  }
  const unknown = createSdk(); unknown.sdk.getDoc = async () => { throw new Error("tenant-1 secret"); };
  await assert.rejects(() => createEnrollmentRepository({ db, sdk: unknown.sdk }).getEnrollment("tenant-1", "enrollment-1"),
    (error) => error.code === "UNKNOWN" && !JSON.stringify(error).includes("tenant-1") && !JSON.stringify(error).includes("secret"));
});
test("[positive] self list without status uses exact canonical constraint order", async () => {
  const { repository, calls } = make(); await repository.listOwnEnrollmentsForMembership("tenant-1", "membership-1");
  assert.deepEqual(whereCalls(calls), [["tenantId", "==", "tenant-1"], ["membershipId", "==", "membership-1"],
    ["status", "in", ["pending", "active", "completed", "cancelled"]]]);
  assert.deepEqual(calls.filter(([name]) => name === "orderBy").map(([, ...args]) => args), [["enrolledAt", "desc"], ["__name__", "desc"]]);
});
test("[positive] self list supports every exact status", async () => {
  for (const status of ["pending", "active", "completed", "cancelled"]) {
    const { repository, calls } = make(); await repository.listOwnEnrollmentsForMembership("tenant-1", "membership-1", { status });
    assert.deepEqual(whereCalls(calls)[2], ["status", "==", status]);
  }
});
test("[positive] admin list without status uses tenant and canonical states", async () => {
  const { repository, calls } = make(); await repository.listTenantEnrollmentsForAdmin("tenant-1");
  assert.deepEqual(whereCalls(calls), [["tenantId", "==", "tenant-1"], ["status", "in", ["pending", "active", "completed", "cancelled"]]]);
  assert.deepEqual(calls.filter(([name]) => name === "orderBy").map(([, ...args]) => args), [["updatedAt", "desc"], ["__name__", "desc"]]);
});
test("[positive] admin list supports every exact status", async () => {
  for (const status of ["pending", "active", "completed", "cancelled"]) {
    const { repository, calls } = make(); await repository.listTenantEnrollmentsForAdmin("tenant-1", { status });
    assert.deepEqual(whereCalls(calls)[1], ["status", "==", status]);
  }
});
test("[positive] omitted and boundary page sizes use limit plus one", async () => {
  for (const [options, expected] of [[undefined, 21], [{ pageSize: 1 }, 2], [{ pageSize: 20 }, 21], [{ pageSize: 50 }, 51]]) {
    const { repository, calls } = make(); await repository.listTenantEnrollmentsForAdmin("tenant-1", options);
    assert(calls.some((call) => call[0] === "limit" && call[1] === expected));
  }
});
test("[positive] lookahead returns frozen page and cursor from included item", async () => {
  const docs = [snapshot(), snapshot(enrollmentData({ enrollmentId: "enrollment-2" }), "tenants/tenant-1/enrollments/enrollment-2")];
  const page = await make({ getDocsResult: { docs } }).repository.listOwnEnrollmentsForMembership("tenant-1", "membership-1", { pageSize: 1 });
  assert.equal(page.items.length, 1); assert.equal(page.hasMore, true); assert.equal(typeof page.nextCursor, "string");
  assert(Object.isFrozen(page)); assert(Object.isFrozen(page.items));
});
test("[positive] empty and terminal pages have no continuation", async () => {
  for (const docs of [[], [snapshot()]]) {
    const page = await make({ getDocsResult: { docs } }).repository.listTenantEnrollmentsForAdmin("tenant-1", { pageSize: 2 });
    assert.equal(page.hasMore, false); assert.equal(page.nextCursor, null);
  }
});
test("[positive] self and admin cursors use Date and simple document ID", async () => {
  const docs = [snapshot(), snapshot(enrollmentData({ enrollmentId: "enrollment-2" }), "tenants/tenant-1/enrollments/enrollment-2")];
  for (const kind of ["self", "admin"]) {
    const first = make({ getDocsResult: { docs } });
    const page = kind === "self" ? await first.repository.listOwnEnrollmentsForMembership("tenant-1", "membership-1", { pageSize: 1 })
      : await first.repository.listTenantEnrollmentsForAdmin("tenant-1", { pageSize: 1 });
    const second = make();
    if (kind === "self") await second.repository.listOwnEnrollmentsForMembership("tenant-1", "membership-1", { cursor: page.nextCursor });
    else await second.repository.listTenantEnrollmentsForAdmin("tenant-1", { cursor: page.nextCursor });
    const call = second.calls.find(([name]) => name === "startAfter"); assert(call[1] instanceof Date); assert.equal(call[2], "enrollment-1");
  }
});
test("[negative] self rejects foreign Tenant, Membership and path", async () => {
  const cases = [
    snapshot(enrollmentData({ tenantId: "tenant-2" }), "tenants/tenant-2/enrollments/enrollment-1"),
    snapshot(enrollmentData({ membershipId: "membership-2" })),
    snapshot(enrollmentData(), "organizations/tenant-1/enrollments/enrollment-1")
  ];
  for (const value of cases) await assert.rejects(() => make({ getDocsResult: { docs: [value] } }).repository
    .listOwnEnrollmentsForMembership("tenant-1", "membership-1"), (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] admin rejects foreign and noncanonical documents", async () => {
  for (const value of [snapshot(enrollmentData({ tenantId: "tenant-2" }), "tenants/tenant-2/enrollments/enrollment-1"),
    snapshot(enrollmentData(), "tenants/tenant-1/Enrollments/enrollment-1")]) {
    await assert.rejects(() => make({ getDocsResult: { docs: [value] } }).repository.listTenantEnrollmentsForAdmin("tenant-1"));
  }
});
test("[negative] list maps Firebase errors", async () => {
  const value = createSdk(); value.sdk.getDocs = async () => { throw { code: "permission-denied" }; };
  await assert.rejects(() => createEnrollmentRepository({ db, sdk: value.sdk }).listTenantEnrollmentsForAdmin("tenant-1"),
    (error) => error.code === "FORBIDDEN" && error.operation === "list_tenant_enrollments_for_admin");
});
test("[negative] every exact dependency is required and extras are rejected", () => {
  const { sdk } = createSdk(); assert.throws(() => createEnrollmentRepository({ sdk }));
  for (const name of Object.keys(sdk)) { const incomplete = { ...sdk }; delete incomplete[name]; assert.throws(() => createEnrollmentRepository({ db, sdk: incomplete })); }
  for (const name of ["setDoc", "collectionGroup", "runTransaction"]) assert.throws(() => createEnrollmentRepository({ db, sdk: { ...sdk, [name]: () => {} } }));
});
test("[positive] public barrel and repository surface are minimal and frozen", async () => {
  assert.deepEqual(Object.keys(await import("../index.js")), ["createEnrollmentRepository"]);
  const repository = make().repository; assert(Object.isFrozen(repository));
  assert.deepEqual(Object.keys(repository), ["getEnrollment", "listOwnEnrollmentsForMembership", "listTenantEnrollmentsForAdmin"]);
});
