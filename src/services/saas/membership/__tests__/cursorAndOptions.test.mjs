import assert from "node:assert/strict";
import test from "node:test";
import {
  MEMBERSHIP_CURSOR_ORDER,
  MEMBERSHIP_CURSOR_POLICY,
  MEMBERSHIP_QUERY_KINDS,
  createMembershipBinding,
  decodeMembershipCursor,
  encodeMembershipCursor
} from "../membershipCursor.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  validateMembershipListOptions
} from "../membershipQueries.js";
import { iso } from "./testDoubles.mjs";

const binding = createMembershipBinding({
  queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
  tenantId: "tenant-1",
  uid: "uid-1",
  status: "approved",
  role: "student"
});
const token = () => encodeMembershipCursor({
  queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
  binding,
  position: { createdAt: iso, documentPath: "tenants/tenant-1/memberships/membership-1" }
});

test("[positive] freezes closed defaults and page-size boundaries", () => {
  assert.deepEqual(validateMembershipListOptions(), {
    status: null, role: null, pageSize: DEFAULT_PAGE_SIZE, cursor: null
  });
  assert.equal(validateMembershipListOptions({ pageSize: MIN_PAGE_SIZE }).pageSize, 1);
  assert.equal(validateMembershipListOptions({ pageSize: MAX_PAGE_SIZE }).pageSize, 50);
  assert(Object.isFrozen(validateMembershipListOptions({ status: "removed", role: "tenant_admin" })));
});
test("[negative] rejects non-plain, unknown, undefined and invalid options", () => {
  for (const options of [null, [], { unknown: true }, { status: undefined }, { role: "platform_admin" },
    { status: ["approved"] }, { role: ["student"] }, { pageSize: 0 }, { pageSize: -1 },
    { pageSize: 51 }, { pageSize: 1.5 }, { pageSize: "20" }, { pageSize: NaN },
    { pageSize: Infinity }, { pageSize: true }, { pageSize: null }, { cursor: " " }]) {
    assert.throws(() => validateMembershipListOptions(options), (error) => error.code === "INVALID_ARGUMENT");
  }
});
test("[negative] rejects each incompatible cursor binding independently", () => {
  const cases = [
    { ...binding, tenantId: "tenant-2" },
    { ...binding, uid: "uid-2" },
    { ...binding, status: "removed" },
    { ...binding, role: "teacher" },
    { ...binding, order: "createdAt_asc_documentId_asc" },
    { ...binding, policy: "membership_standard_v2" }
  ];
  for (const expectedBinding of cases) {
    assert.throws(() => decodeMembershipCursor(token(), {
      queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
      binding: expectedBinding
    }), (error) => error.code === "CONTRACT_VIOLATION");
  }
});
test("[negative] rejects overlong and non-canonical cursor positions", () => {
  assert.throws(() => decodeMembershipCursor("a".repeat(2049), {
    queryKind: MEMBERSHIP_QUERY_KINDS.TENANT, binding
  }), (error) => error.code === "INVALID_ARGUMENT");
  assert.throws(() => encodeMembershipCursor({
    queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
    binding,
    position: { createdAt: "2026-08-02", documentPath: "tenants/tenant-1/memberships/membership-1" }
  }), (error) => error.code === "INVALID_ARGUMENT");
  assert.throws(() => encodeMembershipCursor({
    queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
    binding,
    position: { createdAt: iso, documentPath: "organizations/tenant-1/memberships/membership-1" }
  }), (error) => error.code === "INVALID_ARGUMENT");
});
test("[positive] cursor has exact binding and round-trips its canonical position", () => {
  assert.deepEqual(binding, {
    tenantId: "tenant-1", uid: "uid-1", status: "approved", role: "student",
    order: MEMBERSHIP_CURSOR_ORDER, policy: MEMBERSHIP_CURSOR_POLICY
  });
  assert.deepEqual(decodeMembershipCursor(token(), { queryKind: MEMBERSHIP_QUERY_KINDS.TENANT, binding }), {
    createdAt: iso, documentPath: "tenants/tenant-1/memberships/membership-1"
  });
});
test("[negative] cursor validation distinguishes malformed and incompatible tokens", () => {
  assert.throws(() => decodeMembershipCursor("%%%", { queryKind: MEMBERSHIP_QUERY_KINDS.TENANT, binding }),
    (error) => error.code === "INVALID_ARGUMENT");
  assert.throws(() => decodeMembershipCursor(token(), {
    queryKind: MEMBERSHIP_QUERY_KINDS.TENANT,
    binding: { ...binding, uid: "uid-2" }
  }), (error) => error.code === "CONTRACT_VIOLATION");
  assert.throws(() => decodeMembershipCursor(token(), {
    queryKind: MEMBERSHIP_QUERY_KINDS.COLLECTION_GROUP,
    binding: createMembershipBinding({
      queryKind: MEMBERSHIP_QUERY_KINDS.COLLECTION_GROUP,
      tenantId: null, uid: "uid-1", status: "approved", role: "student"
    })
  }), (error) => error.code === "CONTRACT_VIOLATION");
});
