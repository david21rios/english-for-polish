import assert from "node:assert/strict";
import test from "node:test";
import { createMembershipRepository } from "../index.js";
import { createSdk, membershipData, snapshot } from "./testDoubles.mjs";

const db = Object.freeze({ kind: "db" });
const make = (config) => {
  const doubles = createSdk(config);
  return { ...doubles, repository: createMembershipRepository({ db, sdk: doubles.sdk }) };
};
test("[positive] point get uses the canonical path and one read", async () => {
  const { repository, calls } = make();
  assert.equal((await repository.getOwnMembership("tenant-1", "membership-1", "uid-1")).membershipId, "membership-1");
  assert.deepEqual(calls.find(([name]) => name === "doc"), ["doc", db, "tenants/tenant-1/memberships/membership-1"]);
  assert.equal(calls.filter(([name]) => name === "getDoc").length, 1);
});
test("[negative] point get validates identifiers, absence and Firebase errors", async () => {
  await assert.rejects(() => make().repository.getOwnMembership("", "membership-1", "uid-1"));
  await assert.rejects(() => make({ getDocResult: { exists: () => false } }).repository
    .getOwnMembership("tenant-1", "membership-1", "uid-1"));
  const doubles = createSdk(); doubles.sdk.getDoc = async () => { throw { code: "permission-denied" }; };
  await assert.rejects(() => createMembershipRepository({ db, sdk: doubles.sdk })
    .getOwnMembership("tenant-1", "membership-1", "uid-1"), (error) => error.code === "FORBIDDEN");
});
test("[positive] tenant list applies all filter combinations, order and lookahead", async () => {
  for (const options of [{}, { status: "approved" }, { role: "student" }, { status: "approved", role: "student" }]) {
    const docs = [snapshot(), snapshot(membershipData({ membershipId: "membership-2" }), "tenants/tenant-1/memberships/membership-2")];
    const { repository, calls } = make({ getDocsResult: { docs } });
    const result = await repository.listOwnMembershipsForTenant("tenant-1", "uid-1", { ...options, pageSize: 1 });
    assert.equal(result.items.length, 1); assert.equal(result.hasMore, true); assert.equal(typeof result.nextCursor, "string");
    assert(calls.some((call) => call[0] === "where" && call[1] === "uid" && call[3] === "uid-1"));
    assert.equal(calls.filter((call) => call[0] === "where" && call[1] === "status").length,
      Object.hasOwn(options, "status") ? 1 : 0);
    assert.equal(calls.filter((call) => call[0] === "where" && call[1] === "role").length,
      Object.hasOwn(options, "role") ? 1 : 0);
    assert(calls.some((call) => call[0] === "orderBy" && call[1] === "createdAt" && call[2] === "desc"));
    assert(calls.some((call) => call[0] === "limit" && call[1] === 2));
  }
});
test("[positive] terminal and empty pages have no continuation", async () => {
  for (const docs of [[snapshot()], []]) {
    const result = await make({ getDocsResult: { docs } }).repository
      .listOwnMembershipsForTenant("tenant-1", "uid-1", { pageSize: 2 });
    assert.equal(result.hasMore, false);
    assert.equal(result.nextCursor, null);
    assert(Object.isFrozen(result));
    assert(Object.isFrozen(result.items));
  }
});
test("[positive] tenant cursor uses Date and simple membership ID", async () => {
  const first = make({ getDocsResult: { docs: [snapshot(), snapshot(membershipData({ membershipId: "membership-2" }), "tenants/tenant-1/memberships/membership-2")] } });
  const page = await first.repository.listOwnMembershipsForTenant("tenant-1", "uid-1", { pageSize: 1 });
  const second = make();
  await second.repository.listOwnMembershipsForTenant("tenant-1", "uid-1", { cursor: page.nextCursor });
  const call = second.calls.find(([name]) => name === "startAfter");
  assert(call[1] instanceof Date); assert.equal(call[2], "membership-1");
});
test("[positive] collection-group list and cursor use full path", async () => {
  const docs = [snapshot(), snapshot(membershipData({ membershipId: "membership-2", tenantId: "tenant-2" }), "tenants/tenant-2/memberships/membership-2")];
  const first = make({ getDocsResult: { docs } });
  const page = await first.repository.listOwnMembershipsAcrossTenants("uid-1", { role: "student", pageSize: 1 });
  const second = make();
  await second.repository.listOwnMembershipsAcrossTenants("uid-1", { role: "student", cursor: page.nextCursor });
  const call = second.calls.find(([name]) => name === "startAfter");
  assert(call[1] instanceof Date); assert.equal(call[2], "tenants/tenant-1/memberships/membership-1");
  assert(first.calls.some((entry) => entry[0] === "collectionGroup" && entry[2] === "memberships"));
});
test("[negative] lists reject invalid options, foreign results and incompatible cursors", async () => {
  await assert.rejects(() => make().repository.listOwnMembershipsAcrossTenants("uid-1", null));
  await assert.rejects(() => make().repository.listOwnMembershipsAcrossTenants("uid-1", { role: "owner" }));
  await assert.rejects(() => make({ getDocsResult: { docs: [snapshot(membershipData({ uid: "other" }))] } }).repository
    .listOwnMembershipsForTenant("tenant-1", "uid-1"));
  const first = make({ getDocsResult: { docs: [snapshot(), snapshot(membershipData({ membershipId: "membership-2" }), "tenants/tenant-1/memberships/membership-2")] } });
  const page = await first.repository.listOwnMembershipsForTenant("tenant-1", "uid-1", { pageSize: 1 });
  await assert.rejects(() => make().repository.listOwnMembershipsAcrossTenants("uid-1", { cursor: page.nextCursor }),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] tenant list rejects a result path from another Tenant", async () => {
  const misplaced = snapshot(membershipData(), "tenants/tenant-2/memberships/membership-1");
  await assert.rejects(() => make({ getDocsResult: { docs: [misplaced] } }).repository
    .listOwnMembershipsForTenant("tenant-1", "uid-1"), (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] collection-group rejects non-canonical and nested Membership paths", async () => {
  for (const path of [
    "organizations/tenant-1/memberships/membership-1",
    "tenants/tenant-1/nested/value/memberships/membership-1",
    "tenants/tenant-1/Memberships/membership-1"
  ]) {
    await assert.rejects(() => make({ getDocsResult: { docs: [snapshot(membershipData(), path)] } }).repository
      .listOwnMembershipsAcrossTenants("uid-1"));
  }
});
test("[negative] dependencies fail early and list Firebase errors map", async () => {
  const { sdk } = createSdk();
  assert.throws(() => createMembershipRepository({ sdk }));
  for (const name of Object.keys(sdk)) {
    const incomplete = { ...sdk }; delete incomplete[name];
    assert.throws(() => createMembershipRepository({ db, sdk: incomplete }));
  }
  const failing = createSdk(); failing.sdk.getDocs = async () => { throw { code: "unavailable" }; };
  await assert.rejects(() => createMembershipRepository({ db, sdk: failing.sdk }).listOwnMembershipsAcrossTenants("uid-1"),
    (error) => error.code === "UNAVAILABLE");
});
test("[positive] public API and repository are immutable and minimal", async () => {
  assert.deepEqual(Object.keys(await import("../index.js")), ["createMembershipRepository"]);
  const repository = make().repository;
  assert(Object.isFrozen(repository));
  assert.deepEqual(Object.keys(repository), ["getOwnMembership", "listOwnMembershipsForTenant", "listOwnMembershipsAcrossTenants"]);
});
