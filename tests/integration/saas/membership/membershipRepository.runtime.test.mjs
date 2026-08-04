import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { assertFails } from "@firebase/rules-unit-testing";
import {
  PROJECT_ID, TENANTS, USERS, authenticatedFirestore, cleanup, clearFirestore,
  createMembershipRepositoryForContext, createMembershipRuntimeEnvironment,
  sdk, unauthenticatedFirestore
} from "./runtimeHarness.mjs";
import { seedMembershipFixtures } from "./fixtures.mjs";

assert.equal(PROJECT_ID, "demo-polish-learning");

let environment;
before(async () => { environment = await createMembershipRuntimeEnvironment(); });
beforeEach(async () => {
  await clearFirestore(environment);
  await seedMembershipFixtures(environment);
});
after(async () => { if (environment) await cleanup(environment); });

const repository = (uid = USERS.studentA) =>
  createMembershipRepositoryForContext(authenticatedFirestore(environment, uid));
const anonymousRepository = () =>
  createMembershipRepositoryForContext(unauthenticatedFirestore(environment));
const ownTenant = (options) => repository().listOwnMembershipsForTenant(
  TENANTS.a, USERS.studentA, options
);
const ownAcross = (options) => repository().listOwnMembershipsAcrossTenants(
  USERS.studentA, options
);
const ids = (result) => result.items.map((item) => item.membershipId);
const assertDescending = (items) => assert.deepEqual(
  items.map((item) => item.createdAt),
  items.map((item) => item.createdAt).toSorted().reverse()
);
const assertFiltered = (items, expected) => {
  assert(items.length > 0);
  assert(items.every((item) => item.uid === USERS.studentA));
  if (expected.tenantId) assert(items.every((item) => item.tenantId === expected.tenantId));
  if (expected.status) assert(items.every((item) => item.status === expected.status));
  if (expected.role) assert(items.every((item) => item.role === expected.role));
  assertDescending(items);
};
const decodeToken = (token) => JSON.parse(new TextDecoder().decode(Uint8Array.from(
  atob(token.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - token.length % 4) % 4)),
  (character) => character.charCodeAt(0)
)));
const encodeToken = (value) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const changedCursor = (token, change) => {
  const value = decodeToken(token);
  change(value);
  return encodeToken(value);
};

const cases = [];
const runtime = (id, expected, title, execute, outcome = expected === "ALLOW" ? "SUCCESS" : "RULES_DENY") => {
  cases.push({ id, expected, outcome });
  test(`${id} [${expected}] — ${title}`, execute);
};

runtime("RT-MEM-REP-001", "ALLOW", "owner reads approved Membership", async () => {
  const value = await repository().getOwnMembership(TENANTS.a, "membership-a09", USERS.studentA);
  assert.deepEqual(
    { membershipId: value.membershipId, tenantId: value.tenantId, uid: value.uid, status: value.status },
    { membershipId: "membership-a09", tenantId: TENANTS.a, uid: USERS.studentA, status: "approved" }
  );
  assert.match(value.createdAt, /^2026-08-03T/);
});
runtime("RT-MEM-REP-002", "ALLOW", "owner reads suspended lifecycle", async () => {
  const value = await repository().getOwnMembership(TENANTS.a, "membership-a08", USERS.studentA);
  assert.equal(value.status, "suspended");
  assert.match(value.suspendedAt, /^2026-08-03T/);
  assert.equal(value.removedAt, null);
  assert.equal(value.originRequestId, null);
});
runtime("RT-MEM-REP-003", "ALLOW", "owner reads removed lifecycle", async () => {
  const value = await repository().getOwnMembership(TENANTS.a, "membership-a07", USERS.studentA);
  assert.equal(value.status, "removed");
  assert.match(value.removedAt, /^2026-08-03T/);
  assert.match(value.suspendedAt, /^2026-08-03T/);
});
runtime("RT-MEM-REP-004", "ALLOW", "teacher role serializes canonically", async () => {
  assert.equal((await repository().getOwnMembership(TENANTS.a, "membership-a07", USERS.studentA)).role, "teacher");
});
runtime("RT-MEM-REP-005", "ALLOW", "tenant admin role and retained history serialize", async () => {
  const value = await repository().getOwnMembership(TENANTS.a, "membership-a06", USERS.studentA);
  assert.equal(value.role, "tenant_admin");
  assert.equal(value.status, "approved");
  assert.match(value.suspendedAt, /^2026-08-03T/);
});
runtime("RT-MEM-REP-006", "ALLOW", "point result is detached and frozen", async () => {
  const value = await repository().getOwnMembership(TENANTS.a, "membership-a09", USERS.studentA);
  assert(Object.isFrozen(value));
  assert.equal(Object.values(value).some((entry) => entry && typeof entry === "object"), false);
});
runtime("RT-MEM-REP-007", "DENY", "foreign UID cannot point-read owner Membership", async () => {
  await assert.rejects(
    () => repository(USERS.studentB).getOwnMembership(TENANTS.a, "membership-a09", USERS.studentB),
    (error) => error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-008", "DENY", "anonymous point read is denied", async () => {
  await assert.rejects(
    () => anonymousRepository().getOwnMembership(TENANTS.a, "membership-a09", USERS.studentA),
    (error) => error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-009", "DENY", "wrong Tenant cannot disclose Membership", async () => {
  await assert.rejects(
    () => repository().getOwnMembership(TENANTS.b, "membership-a09", USERS.studentA),
    (error) => error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-010", "DENY", "wrong Membership ID cannot disclose Membership", async () => {
  await assert.rejects(
    () => repository().getOwnMembership(TENANTS.a, "membership-missing", USERS.studentA),
    (error) => error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-011", "DENY", "protected missing document maps to forbidden", async () => {
  await assert.rejects(
    () => repository().getOwnMembership(TENANTS.a, "membership-never-created", USERS.studentA),
    (error) => error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-012", "DENY", "incompatible physical document fails serialization", async () => {
  await assert.rejects(
    () => repository().getOwnMembership(TENANTS.a, "membership-invalid", USERS.studentA),
    (error) => error.code === "CONTRACT_VIOLATION"
  );
}, "CONTRACT_ERROR");

runtime("RT-MEM-REP-020", "ALLOW", "tenant list returns owner only", async () => {
  const items = (await ownTenant()).items;
  assert(items.length > 1);
  assert(items.every((item) => item.uid === USERS.studentA));
});
runtime("RT-MEM-REP-021", "ALLOW", "tenant list excludes foreign UIDs", async () => {
  const result = ids(await ownTenant());
  assert(!result.includes("membership-a05"));
  assert(!result.includes("membership-a04"));
});
runtime("RT-MEM-REP-022", "ALLOW", "tenant list stays in explicit Tenant", async () => {
  const items = (await ownTenant()).items;
  assert(items.length > 0);
  assert(items.every((item) => item.tenantId === TENANTS.a));
});
runtime("RT-MEM-REP-023", "ALLOW", "tenant list orders createdAt descending", async () => {
  assertDescending((await ownTenant()).items);
});
runtime("RT-MEM-REP-024", "ALLOW", "tenant list breaks ties by document ID descending", async () => {
  const result = ids(await ownTenant());
  assert(result.indexOf("membership-tie-z") < result.indexOf("membership-tie-a"));
});
runtime("RT-MEM-REP-025", "ALLOW", "tenant list returns a valid empty page", async () => {
  const result = await repository(USERS.teacherA).listOwnMembershipsForTenant(
    TENANTS.c, USERS.teacherA
  );
  assert.deepEqual(result.items, []);
  assert.equal(result.hasMore, false);
  assert.equal(result.nextCursor, null);
});
runtime("RT-MEM-REP-026", "DENY", "authenticated context cannot query another UID", async () => {
  await assert.rejects(
    () => repository(USERS.studentB).listOwnMembershipsForTenant(TENANTS.a, USERS.studentA),
    (error) => error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-027", "DENY", "anonymous tenant list is denied", async () => {
  await assert.rejects(
    () => anonymousRepository().listOwnMembershipsForTenant(TENANTS.a, USERS.studentA),
    (error) => error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
  );
});

for (const [id, status] of [
  ["RT-MEM-REP-030", "approved"], ["RT-MEM-REP-031", "suspended"], ["RT-MEM-REP-032", "removed"]
]) {
  runtime(id, "ALLOW", `tenant list filters status ${status}`, async () => {
    assertFiltered((await ownTenant({ status })).items, { tenantId: TENANTS.a, status });
  });
}
for (const [id, role] of [
  ["RT-MEM-REP-033", "student"], ["RT-MEM-REP-034", "teacher"], ["RT-MEM-REP-035", "tenant_admin"]
]) {
  runtime(id, "ALLOW", `tenant list filters role ${role}`, async () => {
    assertFiltered((await ownTenant({ role })).items, { tenantId: TENANTS.a, role });
  });
}
runtime("RT-MEM-REP-036", "ALLOW", "tenant list combines status and role", async () => {
  assertFiltered((await ownTenant({ status: "approved", role: "teacher" })).items, {
    tenantId: TENANTS.a, status: "approved", role: "teacher"
  });
});

runtime("RT-MEM-REP-040", "ALLOW", "collection group returns owner across Tenants", async () => {
  const items = (await ownAcross()).items;
  assert(items.length > 1);
  assert.deepEqual(new Set(items.map((item) => item.tenantId)), new Set([TENANTS.a, TENANTS.b, TENANTS.c]));
});
runtime("RT-MEM-REP-041", "ALLOW", "collection group contains only owner UID", async () => {
  const items = (await ownAcross()).items;
  assert(items.length > 0);
  assert(items.every((item) => item.uid === USERS.studentA));
});
runtime("RT-MEM-REP-042", "ALLOW", "collection group excludes foreign documents", async () => {
  const result = ids(await ownAcross());
  assert(!result.includes("membership-a05"));
  assert(!result.includes("membership-c00"));
});
runtime("RT-MEM-REP-043", "ALLOW", "collection group orders globally", async () => {
  assertDescending((await ownAcross()).items);
});
runtime("RT-MEM-REP-044", "ALLOW", "collection group uses full-path descending tie break", async () => {
  const result = ids(await ownAcross());
  assert(result.indexOf("membership-b05") < result.indexOf("membership-tie-z"));
  assert(result.indexOf("membership-tie-z") < result.indexOf("membership-tie-a"));
});
runtime("RT-MEM-REP-045", "ALLOW", "collection group supports empty self result", async () => {
  const result = await repository(USERS.foreign).listOwnMembershipsAcrossTenants(USERS.foreign, {
    status: "suspended"
  });
  assert.deepEqual(result.items, []);
  assert.equal(result.hasMore, false);
  assert.equal(result.nextCursor, null);
});
runtime("RT-MEM-REP-046", "DENY", "anonymous collection-group list is denied", async () => {
  await assert.rejects(
    () => anonymousRepository().listOwnMembershipsAcrossTenants(USERS.studentA),
    (error) => error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN"
  );
});
runtime("RT-MEM-REP-047", "DENY", "collection-group context cannot query another UID", async () => {
  await assert.rejects(
    () => repository(USERS.studentB).listOwnMembershipsAcrossTenants(USERS.studentA),
    (error) => error.code === "FORBIDDEN"
  );
});

for (const [id, status] of [
  ["RT-MEM-REP-050", "approved"], ["RT-MEM-REP-051", "suspended"], ["RT-MEM-REP-052", "removed"]
]) {
  runtime(id, "ALLOW", `collection group filters status ${status}`, async () => {
    assertFiltered((await ownAcross({ status })).items, { status });
  });
}
for (const [id, role] of [
  ["RT-MEM-REP-053", "student"], ["RT-MEM-REP-054", "teacher"], ["RT-MEM-REP-055", "tenant_admin"]
]) {
  runtime(id, "ALLOW", `collection group filters role ${role}`, async () => {
    assertFiltered((await ownAcross({ role })).items, { role });
  });
}
runtime("RT-MEM-REP-056", "ALLOW", "collection group combines status and role", async () => {
  assertFiltered((await ownAcross({ status: "suspended", role: "teacher" })).items, {
    status: "suspended", role: "teacher"
  });
});

runtime("RT-MEM-REP-060", "ALLOW", "tenant pageSize one exposes lookahead state", async () => {
  const page = await ownTenant({ pageSize: 1 });
  assert.equal(page.items.length, 1);
  assert.equal(page.hasMore, true);
  assert.equal(typeof page.nextCursor, "string");
});
runtime("RT-MEM-REP-061", "ALLOW", "tenant second page consumes cursor", async () => {
  const first = await ownTenant({ pageSize: 1 });
  const second = await ownTenant({ pageSize: 1, cursor: first.nextCursor });
  assert.equal(second.items.length, 1);
  assert.notEqual(second.items[0].membershipId, first.items[0].membershipId);
});
runtime("RT-MEM-REP-062", "ALLOW", "tenant pagination reconstructs static dataset", async () => {
  const expected = ids(await ownTenant({ pageSize: 20 }));
  const collected = [];
  let cursor = null;
  do {
    const page = await ownTenant({ pageSize: 2, cursor });
    collected.push(...ids(page));
    cursor = page.nextCursor;
  } while (cursor !== null);
  assert.equal(new Set(collected).size, collected.length);
  assert.deepEqual(collected, expected);
});
runtime("RT-MEM-REP-063", "ALLOW", "tenant terminal page has no continuation", async () => {
  const page = await ownTenant({ pageSize: 20 });
  assert(page.items.length > 0);
  assert.equal(page.hasMore, false);
  assert.equal(page.nextCursor, null);
});
runtime("RT-MEM-REP-064", "ALLOW", "tenant filtered pagination preserves binding", async () => {
  const first = await ownTenant({ status: "approved", role: "student", pageSize: 1 });
  const second = await ownTenant({ status: "approved", role: "student", pageSize: 1, cursor: first.nextCursor });
  assert.equal(second.items.length, 1);
  assertFiltered(second.items, { tenantId: TENANTS.a, status: "approved", role: "student" });
});
runtime("RT-MEM-REP-065", "ALLOW", "collection-group pageSize one exposes lookahead state", async () => {
  const page = await ownAcross({ pageSize: 1 });
  assert.equal(page.items.length, 1);
  assert.equal(page.hasMore, true);
  assert.equal(typeof page.nextCursor, "string");
});
runtime("RT-MEM-REP-066", "ALLOW", "collection-group second page consumes cursor", async () => {
  const first = await ownAcross({ pageSize: 2 });
  const second = await ownAcross({ pageSize: 2, cursor: first.nextCursor });
  assert.equal(second.items.length, 2);
  assert.equal(second.items.some((item) => ids(first).includes(item.membershipId)), false);
});
runtime("RT-MEM-REP-067", "ALLOW", "collection-group pagination reconstructs static dataset", async () => {
  const expected = ids(await ownAcross({ pageSize: 20 }));
  const collected = [];
  let cursor = null;
  do {
    const page = await ownAcross({ pageSize: 2, cursor });
    collected.push(...ids(page));
    cursor = page.nextCursor;
  } while (cursor !== null);
  assert.equal(new Set(collected).size, collected.length);
  assert.deepEqual(collected, expected);
});
runtime("RT-MEM-REP-068", "ALLOW", "collection-group terminal page has no continuation", async () => {
  const page = await ownAcross({ pageSize: 20 });
  assert(page.items.length > 0);
  assert.equal(page.hasMore, false);
  assert.equal(page.nextCursor, null);
});
runtime("RT-MEM-REP-069", "ALLOW", "lookahead item is not exposed", async () => {
  const first = await ownTenant({ pageSize: 1 });
  const second = await ownTenant({ pageSize: 1, cursor: first.nextCursor });
  const position = decodeToken(first.nextCursor).position;
  assert.equal(first.items.length, 1);
  assert.notEqual(first.items[0].membershipId, second.items[0].membershipId);
  assert.equal(position.createdAt, first.items[0].createdAt);
  assert.equal(position.documentPath, `tenants/${TENANTS.a}/memberships/${first.items[0].membershipId}`);
});

runtime("RT-MEM-REP-070", "ALLOW", "tenant cursor reuses Date and simple ID position", async () => {
  const first = await ownTenant({ pageSize: 1 });
  assert.equal((await ownTenant({ pageSize: 1, cursor: first.nextCursor })).items.length, 1);
});
runtime("RT-MEM-REP-071", "ALLOW", "collection-group cursor reuses full document path", async () => {
  const first = await ownAcross({ pageSize: 1 });
  assert.equal((await ownAcross({ pageSize: 1, cursor: first.nextCursor })).items.length, 1);
});
runtime("RT-MEM-REP-072", "DENY", "cursor cannot cross Tenant", async () => {
  const first = await ownTenant({ pageSize: 1 });
  await assert.rejects(
    () => repository().listOwnMembershipsForTenant(TENANTS.b, USERS.studentA, { cursor: first.nextCursor }),
    (error) => error.code === "CONTRACT_VIOLATION"
  );
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-073", "DENY", "cursor cannot cross UID", async () => {
  const first = await ownTenant({ pageSize: 1 });
  await assert.rejects(
    () => repository(USERS.studentB).listOwnMembershipsForTenant(TENANTS.a, USERS.studentB, { cursor: first.nextCursor }),
    (error) => error.code === "CONTRACT_VIOLATION"
  );
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-074", "DENY", "cursor cannot cross status binding", async () => {
  const first = await ownTenant({ status: "approved", pageSize: 1 });
  await assert.rejects(() => ownTenant({ cursor: first.nextCursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-075", "DENY", "cursor cannot cross role binding", async () => {
  const first = await ownAcross({ role: "student", pageSize: 1 });
  await assert.rejects(() => ownAcross({ cursor: first.nextCursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-076", "DENY", "cursor cannot cross query kind", async () => {
  const first = await ownTenant({ pageSize: 1 });
  await assert.rejects(() => ownAcross({ cursor: first.nextCursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-077", "DENY", "malformed cursor fails closed", async () => {
  await assert.rejects(() => ownTenant({ cursor: "%%%" }), (error) => error.code === "INVALID_ARGUMENT");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-078", "DENY", "unsupported cursor version fails closed", async () => {
  const first = await ownTenant({ pageSize: 1 });
  const cursor = changedCursor(first.nextCursor, (value) => { value.version = 2; });
  await assert.rejects(() => ownTenant({ cursor }), (error) => error.code === "CONTRACT_VIOLATION");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-079", "DENY", "noncanonical cursor path fails closed", async () => {
  const first = await ownTenant({ pageSize: 1 });
  const pathCursor = changedCursor(first.nextCursor, (value) => { value.position.documentPath = "memberships/bad"; });
  await assert.rejects(() => ownTenant({ cursor: pathCursor }), (error) => error.code === "INVALID_ARGUMENT");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-080", "DENY", "whitespace-only cursor fails closed", async () => {
  await assert.rejects(() => ownTenant({ cursor: "   " }), (error) => error.code === "INVALID_ARGUMENT");
}, "CONTRACT_ERROR");
runtime("RT-MEM-REP-081", "DENY", "invalid cursor timestamp fails closed", async () => {
  const first = await ownTenant({ pageSize: 1 });
  const dateCursor = changedCursor(first.nextCursor, (value) => { value.position.createdAt = "not-a-date"; });
  await assert.rejects(() => ownTenant({ cursor: dateCursor }), (error) => error.code === "INVALID_ARGUMENT");
}, "CONTRACT_ERROR");

runtime("RT-MEM-SEC-001", "DENY", "client create Membership denied", async () => assertFails(sdk.setDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/memberships/membership-new`),
  { membershipId: "membership-new", tenantId: TENANTS.a, uid: USERS.studentA }
)));
runtime("RT-MEM-SEC-002", "DENY", "owner update Membership denied", async () => assertFails(sdk.updateDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/memberships/membership-a09`),
  { updatedAt: new Date() }
)));
runtime("RT-MEM-SEC-003", "DENY", "owner delete Membership denied", async () => assertFails(sdk.deleteDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/memberships/membership-a09`)
)));
runtime("RT-MEM-SEC-004", "DENY", "client role change denied", async () => assertFails(sdk.updateDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/memberships/membership-a09`),
  { role: "tenant_admin" }
)));
runtime("RT-MEM-SEC-005", "DENY", "client status change denied", async () => assertFails(sdk.updateDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/memberships/membership-a09`),
  { status: "removed" }
)));

runtime("RT-MEM-SEC-010", "DENY", "membership key point read denied", async () => assertFails(sdk.getDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/membershipKeys/uid-student-a`)
)));
runtime("RT-MEM-SEC-011", "DENY", "membership key create denied", async () => assertFails(sdk.setDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/membershipKeys/new-key`),
  { uid: USERS.studentA, membershipId: "membership-a09" }
)));
runtime("RT-MEM-SEC-012", "DENY", "membership key update denied", async () => assertFails(sdk.updateDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/membershipKeys/uid-student-a`),
  { status: "removed" }
)));
runtime("RT-MEM-SEC-013", "DENY", "membership key delete denied", async () => assertFails(sdk.deleteDoc(
  sdk.doc(authenticatedFirestore(environment, USERS.studentA), `tenants/${TENANTS.a}/membershipKeys/uid-student-a`)
)));

const tenantUnsafe = (database, ...constraints) => sdk.getDocs(sdk.query(
  sdk.collection(database, `tenants/${TENANTS.a}/memberships`), ...constraints, sdk.limit(20)
));
const groupUnsafe = (database, ...constraints) => sdk.getDocs(sdk.query(
  sdk.collectionGroup(database, "memberships"), ...constraints, sdk.limit(20)
));
runtime("RT-MEM-SEC-020", "DENY", "tenant list without UID filter denied", async () => assertFails(tenantUnsafe(
  authenticatedFirestore(environment, USERS.studentA), sdk.orderBy("createdAt", "desc")
)));
runtime("RT-MEM-SEC-021", "DENY", "tenant list with foreign UID denied", async () => assertFails(tenantUnsafe(
  authenticatedFirestore(environment, USERS.studentA), sdk.where("uid", "==", USERS.studentB)
)));
runtime("RT-MEM-SEC-022", "DENY", "anonymous tenant list denied", async () => assertFails(tenantUnsafe(
  unauthenticatedFirestore(environment), sdk.where("uid", "==", USERS.studentA)
)));
runtime("RT-MEM-SEC-023", "DENY", "collection group without UID filter denied", async () => assertFails(groupUnsafe(
  authenticatedFirestore(environment, USERS.studentA), sdk.orderBy("createdAt", "desc")
)));
runtime("RT-MEM-SEC-024", "DENY", "collection group with foreign UID denied", async () => assertFails(groupUnsafe(
  authenticatedFirestore(environment, USERS.studentA), sdk.where("uid", "==", USERS.studentB)
)));
runtime("RT-MEM-SEC-025", "DENY", "anonymous collection group denied", async () => assertFails(groupUnsafe(
  unauthenticatedFirestore(environment), sdk.where("uid", "==", USERS.studentA)
)));
runtime("RT-MEM-SEC-026", "DENY", "tenant admin has no broad member-list bypass", async () => assertFails(tenantUnsafe(
  authenticatedFirestore(environment, USERS.adminA), sdk.orderBy("createdAt", "desc")
)));
runtime("RT-MEM-SEC-027", "DENY", "platform-style client has no collection-group bypass", async () => assertFails(groupUnsafe(
  authenticatedFirestore(environment, USERS.adminA), sdk.orderBy("createdAt", "desc")
)));

assert.equal(cases.length, 81);
assert.equal(new Set(cases.map(({ id }) => id)).size, 81);
assert.equal(cases.filter(({ expected }) => expected === "ALLOW").length, 44);
assert.equal(cases.filter(({ expected }) => expected === "DENY").length, 37);
assert.equal(cases.filter(({ outcome }) => outcome === "SUCCESS").length, 44);
assert.equal(cases.filter(({ outcome }) => outcome === "RULES_DENY").length, 26);
assert.equal(cases.filter(({ outcome }) => outcome === "CONTRACT_ERROR").length, 11);
assert.equal(cases.filter(({ outcome }) => outcome === "NOT_FOUND").length, 0);
