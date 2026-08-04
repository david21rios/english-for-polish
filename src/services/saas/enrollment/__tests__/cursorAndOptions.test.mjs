import assert from "node:assert/strict";
import test from "node:test";
import {
  ENROLLMENT_CURSOR_MAX_LENGTH, ENROLLMENT_QUERY_KINDS, createEnrollmentBinding,
  decodeEnrollmentCursor, encodeEnrollmentCursor
} from "../enrollmentCursor.js";
import { validateEnrollmentOptions } from "../enrollmentQueries.js";

const iso = "2026-08-03T12:00:00.000Z";
const selfBinding = () => createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId: "tenant-1", membershipId: "membership-1" });
const adminBinding = () => createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.ADMIN, tenantId: "tenant-1" });
const token = (kind = ENROLLMENT_QUERY_KINDS.SELF, binding = selfBinding(), path = "tenants/tenant-1/enrollments/enrollment-1") =>
  encodeEnrollmentCursor({ queryKind: kind, binding, position: kind === ENROLLMENT_QUERY_KINDS.SELF
    ? { enrolledAt: iso, documentPath: path } : { updatedAt: iso, documentPath: path } });
const rawToken = (value) => {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
const envelope = (overrides = {}) => ({
  version: 1,
  queryKind: ENROLLMENT_QUERY_KINDS.SELF,
  binding: { ...selfBinding() },
  position: { enrolledAt: iso, documentPath: "tenants/tenant-1/enrollments/enrollment-1" },
  ...overrides
});

test("[positive] validates absent options and canonical boundaries", () => {
  assert.deepEqual(validateEnrollmentOptions(), { status: null, pageSize: 20, cursor: null });
  for (const pageSize of [1, 20, 50]) assert.equal(validateEnrollmentOptions({ pageSize }).pageSize, pageSize);
  for (const status of ["pending", "active", "completed", "cancelled"]) assert.equal(validateEnrollmentOptions({ status }).status, status);
});
test("[negative] rejects non-plain, unknown and explicitly undefined options", () => {
  for (const value of [null, [], new Date(), Object.create(null), { role: "student" }, { status: undefined }]) {
    assert.throws(() => validateEnrollmentOptions(value));
  }
});
test("[negative] rejects invalid page sizes", () => {
  for (const pageSize of [0, -1, 51, "20", 1.5, NaN, Infinity, true, null]) assert.throws(() => validateEnrollmentOptions({ pageSize }));
});
test("[negative] rejects invalid status and cursor input", () => {
  for (const status of [null, ["active"], "ACTIVE", "removed"]) assert.throws(() => validateEnrollmentOptions({ status }));
  for (const cursor of [null, "", "   ", 4]) assert.throws(() => validateEnrollmentOptions({ cursor }));
});
test("[positive] self cursor round-trips with canonical unpadded Base64URL", () => {
  const value = token(); assert.match(value, /^[A-Za-z0-9_-]+$/u); assert(!value.includes("="));
  assert.deepEqual(decodeEnrollmentCursor(value, { queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding() }),
    { enrolledAt: iso, documentPath: "tenants/tenant-1/enrollments/enrollment-1" });
});
test("[positive] admin cursor round-trips", () => {
  const binding = adminBinding(); const value = token(ENROLLMENT_QUERY_KINDS.ADMIN, binding);
  assert.deepEqual(decodeEnrollmentCursor(value, { queryKind: ENROLLMENT_QUERY_KINDS.ADMIN, binding }),
    { updatedAt: iso, documentPath: "tenants/tenant-1/enrollments/enrollment-1" });
});
test("[positive] cursor supports Unicode identifiers through UTF-8", () => {
  const binding = createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId: "tenant-ż", membershipId: "membership-ą" });
  const value = token(ENROLLMENT_QUERY_KINDS.SELF, binding, "tenants/tenant-ż/enrollments/enrollment-ł");
  assert.equal(decodeEnrollmentCursor(value, { queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding }).documentPath,
    "tenants/tenant-ż/enrollments/enrollment-ł");
});
test("[negative] rejects malformed token forms and excessive size", () => {
  for (const value of ["", " ", "abc=", "***", "e30", "a".repeat(ENROLLMENT_CURSOR_MAX_LENGTH + 1)]) {
    assert.throws(() => decodeEnrollmentCursor(value, { queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding() }),
      (error) => error.code === "INVALID_ARGUMENT");
  }
});
test("[negative] rejects malformed paths independently", () => {
  for (const path of ["tenant/tenant-1/enrollments/enrollment-1", "tenants/tenant-1/courses/enrollment-1",
    "tenants/tenant-1/enrollments", "tenants/tenant-1/enrollments/enrollment-1/extra"]) {
    assert.throws(() => token(ENROLLMENT_QUERY_KINDS.SELF, selfBinding(), path), (error) => error.code === "INVALID_ARGUMENT");
  }
});
test("[negative] canonical path outside binding is incompatible", () => {
  assert.throws(() => token(ENROLLMENT_QUERY_KINDS.SELF, selfBinding(), "tenants/tenant-2/enrollments/enrollment-1"),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] rejects cross-query cursor", () => {
  assert.throws(() => decodeEnrollmentCursor(token(), { queryKind: ENROLLMENT_QUERY_KINDS.ADMIN, binding: adminBinding() }),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] rejects cross-Tenant, Membership and status bindings", () => {
  const value = token();
  const bindings = [
    createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId: "tenant-2", membershipId: "membership-1" }),
    createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId: "tenant-1", membershipId: "membership-2" }),
    createEnrollmentBinding({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId: "tenant-1", membershipId: "membership-1", status: "active" })
  ];
  for (const binding of bindings) assert.throws(() => decodeEnrollmentCursor(value, { queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding }),
    (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] rejects noncanonical timestamps", () => {
  for (const enrolledAt of ["bad", "2026-08-03", "2026-08-03T12:00:00Z"]) {
    assert.throws(() => encodeEnrollmentCursor({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding(),
      position: { enrolledAt, documentPath: "tenants/tenant-1/enrollments/enrollment-1" } }));
  }
});
test("[negative] rejects extra or incomplete binding and position schemas", () => {
  assert.throws(() => encodeEnrollmentCursor({ queryKind: ENROLLMENT_QUERY_KINDS.SELF,
    binding: { ...selfBinding(), extra: true }, position: { enrolledAt: iso, documentPath: "tenants/tenant-1/enrollments/enrollment-1" } }));
  assert.throws(() => encodeEnrollmentCursor({ queryKind: ENROLLMENT_QUERY_KINDS.SELF,
    binding: selfBinding(), position: { enrolledAt: iso } }));
});
test("[negative] rejects policy and order changes in binding", () => {
  for (const binding of [{ ...selfBinding(), policy: "other" }, { ...selfBinding(), order: "updatedAt_desc" }]) {
    assert.throws(() => encodeEnrollmentCursor({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding,
      position: { enrolledAt: iso, documentPath: "tenants/tenant-1/enrollments/enrollment-1" } }));
  }
});
test("[negative] classifies a supported-shape version mismatch as incompatible", () => {
  assert.throws(() => decodeEnrollmentCursor(rawToken(envelope({ version: 2 })), {
    queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding()
  }), (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] rejects decoded binding policy and order values", () => {
  for (const binding of [{ ...selfBinding(), policy: "other" }, { ...selfBinding(), order: "other" }]) {
    assert.throws(() => decodeEnrollmentCursor(rawToken(envelope({ binding })), {
      queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding()
    }), (error) => error.code === "CONTRACT_VIOLATION");
  }
});
test("[negative] rejects extra root fields and noncanonical JSON key order", () => {
  assert.throws(() => decodeEnrollmentCursor(rawToken({ ...envelope(), extra: true }), {
    queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding()
  }), (error) => error.code === "INVALID_ARGUMENT");
  const value = envelope();
  const reordered = JSON.stringify({ queryKind: value.queryKind, version: value.version, binding: value.binding, position: value.position });
  assert.throws(() => decodeEnrollmentCursor(rawToken(reordered), {
    queryKind: ENROLLMENT_QUERY_KINDS.SELF, binding: selfBinding()
  }), (error) => error.code === "INVALID_ARGUMENT");
});
