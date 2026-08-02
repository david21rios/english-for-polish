import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import {
  PROJECT_ID, TENANTS, USERS, anonymousDatabase, createRuntimeEnvironment,
  createRuntimeRepository, databaseFor, sdk
} from "./runtimeHarness.mjs";
import { seedRegistrationRequests } from "./fixtures.mjs";

assert.equal(PROJECT_ID, "demo-polish-learning");
let environment;
before(async () => { environment = await createRuntimeEnvironment(); });
beforeEach(async () => { await environment.clearFirestore(); await seedRegistrationRequests(environment); });
after(async () => { await environment?.cleanup(); });

const repo = (uid = USERS.studentA) => createRuntimeRepository(databaseFor(environment, uid));
const ids = (result) => result.items.map((item) => item.requestId);
const ownTenant = (options) => repo().listOwnRegistrationRequestsForTenant(TENANTS.a, USERS.studentA, options);
const ownAcross = (options) => repo().listOwnRegistrationRequestsAcrossTenants(USERS.studentA, options);
const assertDescending = (items) => assert.deepEqual(
  items.map((item) => item.requestedAt),
  [...items].map((item) => item.requestedAt).sort().reverse()
);
const assertOwnTenantItems = (items, status) => {
  assert(items.length > 0);
  assert(items.every((item) => item.uid === USERS.studentA));
  assert(items.every((item) => item.tenantId === TENANTS.a));
  assert(items.every((item) => item.status === status));
  assertDescending(items);
};

const cases = [];
const runtime = (id, expected, title, execute, outcome = expected === "ALLOW" ? "SUCCESS" : "RULES_DENY") => {
  cases.push({ id, expected, outcome });
  test(`${id} [${expected}] — ${title}`, execute);
};

runtime("RT-RRQ-REP-001", "ALLOW", "owner point get", async () => {
  const result = await repo().getOwnRegistrationRequest(TENANTS.a, "request-a05", USERS.studentA);
  assert.deepEqual(
    { requestId: result.requestId, tenantId: result.tenantId, uid: result.uid, status: result.status },
    { requestId: "request-a05", tenantId: TENANTS.a, uid: USERS.studentA, status: "pending" }
  );
  assert.match(result.requestedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert(Object.isFrozen(result));
});
runtime("RT-RRQ-REP-002", "ALLOW", "owner approved history get", async () => {
  const result = await repo().getOwnRegistrationRequest(TENANTS.a, "request-a03", USERS.studentA);
  assert.equal(result.status, "approved");
  assert.match(result.reviewedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(result.approvedMembershipId, "membership-request-a03");
});
runtime("RT-RRQ-REP-003", "ALLOW", "owner cancelled history get", async () => {
  const result = await repo().getOwnRegistrationRequest(TENANTS.a, "request-a02", USERS.studentA);
  assert.equal(result.status, "cancelled");
  assert.match(result.cancelledAt, /^\d{4}-\d{2}-\d{2}T/);
});
runtime("RT-RRQ-REP-004", "DENY", "foreign point get", async () => assert.rejects(() => repo(USERS.studentB).getOwnRegistrationRequest(TENANTS.a, "request-a05", USERS.studentB), (error) => error.code === "FORBIDDEN"));
runtime("RT-RRQ-REP-005", "DENY", "anonymous point get", async () => assert.rejects(() => createRuntimeRepository(anonymousDatabase(environment)).getOwnRegistrationRequest(TENANTS.a, "request-a05", USERS.studentA), (error) => error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"));
runtime("RT-RRQ-REP-006", "DENY", "missing point get is denied without disclosing existence", async () => assert.rejects(() => repo().getOwnRegistrationRequest(TENANTS.a, "missing", USERS.studentA), (error) => error.code === "FORBIDDEN"));

runtime("RT-RRQ-REP-010", "ALLOW", "tenant list returns owner only", async () => { const items=(await ownTenant()).items; assert(items.length > 0); assert(items.every((item) => item.uid === USERS.studentA)); });
runtime("RT-RRQ-REP-011", "ALLOW", "tenant list excludes foreign UID", async () => assert(!ids(await ownTenant()).includes("request-a04")));
runtime("RT-RRQ-REP-012", "ALLOW", "tenant list excludes other Tenant", async () => assert((await ownTenant()).items.every((item) => item.tenantId === TENANTS.a)));
runtime("RT-RRQ-REP-013", "ALLOW", "tenant list orders requestedAt descending", async () => assertDescending((await ownTenant()).items));
runtime("RT-RRQ-REP-014", "ALLOW", "tenant list breaks timestamp ties by document ID descending", async () => { const result=ids(await ownTenant()); assert(result.indexOf("request-tie-z") < result.indexOf("request-tie-a")); });
runtime("RT-RRQ-REP-015", "ALLOW", "tenant list empty result", async () => assert.deepEqual((await repo(USERS.teacherA).listOwnRegistrationRequestsForTenant(TENANTS.c, USERS.teacherA)).items, []));

for (const [id, status] of [["RT-RRQ-REP-020","pending"],["RT-RRQ-REP-021","approved"],["RT-RRQ-REP-022","rejected"],["RT-RRQ-REP-023","cancelled"],["RT-RRQ-REP-024","expired"]]) {
  runtime(id, "ALLOW", `tenant status ${status}`, async () => assertOwnTenantItems((await ownTenant({ status })).items, status));
}

runtime("RT-RRQ-REP-030", "ALLOW", "collection group returns owner across Tenants", async () => { const items=(await ownAcross()).items; assert(items.length > 0); assert(items.every((item) => item.uid === USERS.studentA)); });
runtime("RT-RRQ-REP-031", "ALLOW", "collection group excludes foreign UID", async () => { const result=ids(await ownAcross()); assert(!result.includes("request-a04") && !result.includes("request-b01")); });
runtime("RT-RRQ-REP-032", "ALLOW", "collection group contains Tenant A and B", async () => { const tenants=new Set((await ownAcross()).items.map((i)=>i.tenantId)); assert(tenants.has(TENANTS.a) && tenants.has(TENANTS.b)); });
runtime("RT-RRQ-REP-033", "ALLOW", "collection group global requestedAt order", async () => assertDescending((await ownAcross()).items));
runtime("RT-RRQ-REP-034", "ALLOW", "collection group full-path tie break", async () => { const result=ids(await ownAcross()); assert(result.indexOf("request-b03") < result.indexOf("request-tie-z")); assert(result.indexOf("request-tie-z") < result.indexOf("request-tie-a")); });
runtime("RT-RRQ-REP-035", "DENY", "anonymous collection-group query", async () => assert.rejects(() => createRuntimeRepository(anonymousDatabase(environment)).listOwnRegistrationRequestsAcrossTenants(USERS.studentA)));

for (const [id, status] of [["RT-RRQ-REP-040","pending"],["RT-RRQ-REP-041","approved"],["RT-RRQ-REP-042","cancelled"]]) {
  runtime(id, "ALLOW", `collection-group status ${status}`, async () => { const items=(await ownAcross({ status })).items; assert(items.length > 0); assert(items.every((item) => item.status === status && item.uid === USERS.studentA)); assertDescending(items); });
}
runtime("RT-RRQ-REP-043", "ALLOW", "collection-group status excludes other states", async () => { const items=(await ownAcross({ status: "approved" })).items; assert(items.length > 0); assert(items.every((item) => item.status === "approved")); });
runtime("RT-RRQ-REP-044", "ALLOW", "collection-group status excludes foreign UID", async () => { const items=(await ownAcross({ status: "pending" })).items; assert(items.length > 0); assert(items.every((item) => item.uid === USERS.studentA)); });

runtime("RT-RRQ-REP-050", "ALLOW", "first page hasMore", async () => assert.equal((await ownTenant({ pageSize: 1 })).hasMore, true));
runtime("RT-RRQ-REP-051", "ALLOW", "first page nextCursor", async () => assert.equal(typeof (await ownTenant({ pageSize: 1 })).nextCursor, "string"));
runtime("RT-RRQ-REP-052", "ALLOW", "second page uses cursor", async () => { const first=await ownTenant({pageSize:1}); assert.equal((await ownTenant({pageSize:1,cursor:first.nextCursor})).items.length,1); });
runtime("RT-RRQ-REP-053", "ALLOW", "pages contain no duplicates and reconstruct the full result", async () => { const expected=ids(await ownTenant({pageSize:20})); const collected=[]; let cursor=null; do { const page=await ownTenant({pageSize:2,cursor}); collected.push(...ids(page)); cursor=page.nextCursor; } while(cursor!==null); assert.equal(new Set(collected).size,collected.length); assert.deepEqual(collected,expected); });
runtime("RT-RRQ-REP-054", "ALLOW", "last page hasMore false", async () => { let page=await ownTenant({pageSize:20}); assert.equal(page.hasMore,false); });
runtime("RT-RRQ-REP-055", "ALLOW", "last page cursor null", async () => assert.equal((await ownTenant({pageSize:20})).nextCursor,null));
runtime("RT-RRQ-REP-056", "ALLOW", "tenant status pagination", async () => { const first=await ownTenant({status:"pending",pageSize:1}); assert.equal((await ownTenant({status:"pending",pageSize:1,cursor:first.nextCursor})).items.length,1); });
runtime("RT-RRQ-REP-057", "ALLOW", "collection-group pagination", async () => { const first=await ownAcross({pageSize:2}); assert.equal((await ownAcross({pageSize:2,cursor:first.nextCursor})).items.length,2); });

runtime("RT-RRQ-REP-060", "ALLOW", "tenant cursor reuse", async () => { const first=await ownTenant({pageSize:1}); await ownTenant({pageSize:1,cursor:first.nextCursor}); });
runtime("RT-RRQ-REP-061", "ALLOW", "collection-group cursor reuse", async () => { const first=await ownAcross({pageSize:1}); await ownAcross({pageSize:1,cursor:first.nextCursor}); });
runtime("RT-RRQ-REP-062", "DENY", "tenant cursor cannot cross Tenants", async () => { const first=await ownTenant({pageSize:1}); await assert.rejects(()=>repo().listOwnRegistrationRequestsForTenant(TENANTS.b,USERS.studentA,{cursor:first.nextCursor}),(e)=>e.code==="CONTRACT_VIOLATION"); }, "CONTRACT_ERROR");
runtime("RT-RRQ-REP-063", "DENY", "status cursor cannot lose status", async () => { const first=await ownTenant({status:"pending",pageSize:1}); await assert.rejects(()=>ownTenant({cursor:first.nextCursor}),(e)=>e.code==="CONTRACT_VIOLATION"); }, "CONTRACT_ERROR");
runtime("RT-RRQ-REP-064", "DENY", "tenant cursor cannot become collection-group cursor", async () => { const first=await ownTenant({pageSize:1}); await assert.rejects(()=>ownAcross({cursor:first.nextCursor}),(e)=>e.code==="CONTRACT_VIOLATION"); }, "CONTRACT_ERROR");
runtime("RT-RRQ-REP-065", "DENY", "cursor cannot cross UID", async () => { const first=await ownTenant({pageSize:1}); await assert.rejects(()=>repo(USERS.studentB).listOwnRegistrationRequestsForTenant(TENANTS.a,USERS.studentB,{cursor:first.nextCursor}),(e)=>e.code==="CONTRACT_VIOLATION"); }, "CONTRACT_ERROR");

runtime("RT-RRQ-SEC-001", "DENY", "client create denied", async () => assertFails(sdk.setDoc(sdk.doc(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequests/new-request`),{uid:USERS.studentA})));
runtime("RT-RRQ-SEC-002", "DENY", "owner update denied", async () => assertFails(sdk.updateDoc(sdk.doc(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequests/request-a05`),{status:"cancelled"})));
runtime("RT-RRQ-SEC-003", "DENY", "owner delete denied", async () => assertFails(sdk.deleteDoc(sdk.doc(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequests/request-a05`))));
runtime("RT-RRQ-SEC-004", "DENY", "request key point read denied", async () => assertFails(sdk.getDoc(sdk.doc(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequestKeys/key-a`))));
runtime("RT-RRQ-SEC-005", "DENY", "request key create denied", async () => assertFails(sdk.setDoc(sdk.doc(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequestKeys/key-a`),{uid:USERS.studentA})));

runtime("RT-RRQ-SEC-010", "DENY", "tenant list without UID denied", async () => assertFails(sdk.getDocs(sdk.query(sdk.collection(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequests`),sdk.orderBy("requestedAt","desc"),sdk.limit(20)))));
runtime("RT-RRQ-SEC-011", "DENY", "tenant list foreign UID denied", async () => assertFails(sdk.getDocs(sdk.query(sdk.collection(databaseFor(environment,USERS.studentA),`tenants/${TENANTS.a}/registrationRequests`),sdk.where("uid","==",USERS.studentB),sdk.limit(20)))));
runtime("RT-RRQ-SEC-012", "DENY", "collection-group without UID denied", async () => assertFails(sdk.getDocs(sdk.query(sdk.collectionGroup(databaseFor(environment,USERS.studentA),"registrationRequests"),sdk.orderBy("requestedAt","desc"),sdk.limit(20)))));
runtime("RT-RRQ-SEC-013", "DENY", "collection-group foreign UID denied", async () => assertFails(sdk.getDocs(sdk.query(sdk.collectionGroup(databaseFor(environment,USERS.studentA),"registrationRequests"),sdk.where("uid","==",USERS.studentB),sdk.limit(20)))));
runtime("RT-RRQ-SEC-014", "DENY", "anonymous unsafe query denied", async () => assertFails(sdk.getDocs(sdk.query(sdk.collectionGroup(anonymousDatabase(environment),"registrationRequests"),sdk.where("uid","==",USERS.studentA),sdk.limit(20)))));

assert.equal(cases.length, 52);
assert.equal(new Set(cases.map(({ id }) => id)).size, 52);
assert.equal(cases.filter(({ expected }) => expected === "ALLOW").length, 34);
assert.equal(cases.filter(({ expected }) => expected === "DENY").length, 18);
assert.equal(cases.filter(({ outcome }) => outcome === "SUCCESS").length, 34);
assert.equal(cases.filter(({ outcome }) => outcome === "RULES_DENY").length, 14);
assert.equal(cases.filter(({ outcome }) => outcome === "CONTRACT_ERROR").length, 4);
assert.equal(cases.filter(({ outcome }) => outcome === "NOT_FOUND").length, 0);
