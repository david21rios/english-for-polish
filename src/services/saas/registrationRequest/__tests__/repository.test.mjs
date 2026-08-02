import assert from "node:assert/strict";
import test from "node:test";
import { createRegistrationRequestRepository } from "../index.js";
import { createSdk, requestData, snapshot } from "./testDoubles.mjs";

const db = Object.freeze({ kind: "db" });
const make = (config) => { const doubles = createSdk(config); return { ...doubles, repository: createRegistrationRequestRepository({ db, sdk: doubles.sdk }) }; };

test("[positive] point get uses one canonical read and returns serialized data", async () => {
  const { repository, calls } = make();
  const value = await repository.getOwnRegistrationRequest("tenant-1", "request-1", "uid-1");
  assert.equal(value.requestId, "request-1");
  assert.deepEqual(calls.filter(([name]) => name === "doc")[0], ["doc", db, "tenants/tenant-1/registrationRequests/request-1"]);
  assert.equal(calls.filter(([name]) => name === "getDoc").length, 1);
});

test("[negative] point get rejects bad IDs, missing docs and Firebase errors", async () => {
  const missing = make({ getDocResult: { exists: () => false } }).repository;
  await assert.rejects(() => missing.getOwnRegistrationRequest("tenant-1", "request-1", "uid-1"));
  await assert.rejects(() => missing.getOwnRegistrationRequest("", "request-1", "uid-1"));
  const doubles = createSdk(); doubles.sdk.getDoc = async () => { throw { code: "permission-denied" }; };
  await assert.rejects(() => createRegistrationRequestRepository({ db, sdk: doubles.sdk }).getOwnRegistrationRequest("tenant-1", "request-1", "uid-1"), (error) => error.code === "FORBIDDEN");
});

test("[positive] tenant list enforces self filter, deterministic order and limit plus one", async () => {
  const docs = Array.from({ length: 3 }, (_, index) => snapshot(requestData({ requestId: `request-${index + 1}` }), `tenants/tenant-1/registrationRequests/request-${index + 1}`));
  const { repository, calls } = make({ getDocsResult: { docs } });
  const result = await repository.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1", { pageSize: 2 });
  assert.equal(result.items.length, 2); assert.equal(result.hasMore, true); assert.equal(typeof result.nextCursor, "string");
  assert(calls.some((call) => call[0] === "collection" && call[2] === "tenants/tenant-1/registrationRequests"));
  assert(calls.some((call) => call[0] === "where" && call[1] === "uid" && call[3] === "uid-1"));
  assert(calls.some((call) => call[0] === "limit" && call[1] === 3));
  assert.equal(Object.isFrozen(result.items), true);
});

test("[positive] tenant list applies status and cursor using Date plus DocumentReference", async () => {
  const first = make({ getDocsResult: { docs: [snapshot(), snapshot(requestData({ requestId: "request-2" }), "tenants/tenant-1/registrationRequests/request-2")] } });
  const page = await first.repository.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1", { status: "pending", pageSize: 1 });
  const second = make();
  await second.repository.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1", { status: "pending", cursor: page.nextCursor });
  const call = second.calls.find(([name]) => name === "startAfter");
  assert(call[1] instanceof Date); assert.equal(call[2].path, "tenants/tenant-1/registrationRequests/request-1");
});

test("[positive] collection-group list is self-only and supports multiple tenants", async () => {
  const docs = [snapshot(), snapshot(requestData({ requestId: "request-2", tenantId: "tenant-2" }), "tenants/tenant-2/registrationRequests/request-2")];
  const { repository, calls } = make({ getDocsResult: { docs } });
  const result = await repository.listOwnRegistrationRequestsAcrossTenants("uid-1");
  assert.equal(result.items.length, 2); assert(calls.some((call) => call[0] === "collectionGroup" && call[2] === "registrationRequests"));
});

test("[negative] lists reject foreign results and invalid options", async () => {
  const foreign = make({ getDocsResult: { docs: [snapshot(requestData({ uid: "other" }))] } }).repository;
  await assert.rejects(() => foreign.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1"));
  await assert.rejects(() => foreign.listOwnRegistrationRequestsAcrossTenants("uid-1", null));
});

test("[negative] list Firebase errors are mapped", async () => {
  const doubles = createSdk(); doubles.sdk.getDocs = async () => { throw { code: "unavailable" }; };
  const repository = createRegistrationRequestRepository({ db, sdk: doubles.sdk });
  await assert.rejects(() => repository.listOwnRegistrationRequestsAcrossTenants("uid-1"), (error) => error.code === "UNAVAILABLE");
});

test("[negative] every required dependency fails early", () => {
  const { sdk } = createSdk();
  assert.throws(() => createRegistrationRequestRepository({ sdk }));
  for (const name of Object.keys(sdk)) {
    const incomplete = { ...sdk }; delete incomplete[name];
    assert.throws(() => createRegistrationRequestRepository({ db, sdk: incomplete }));
  }
});

test("[positive] repository and public API are immutable and limited", async () => {
  const module = await import("../index.js");
  assert.deepEqual(Object.keys(module), ["createRegistrationRequestRepository"]);
  assert(Object.isFrozen(make().repository));
});
