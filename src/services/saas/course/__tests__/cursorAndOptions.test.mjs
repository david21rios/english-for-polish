import assert from "node:assert/strict";
import test from "node:test";
import {
  COURSE_ADMIN_ORDER, COURSE_CATALOG_ORDER, COURSE_CURSOR_POLICY, COURSE_QUERY_KINDS,
  createCourseBinding, decodeCourseCursor, encodeCourseCursor
} from "../courseCursor.js";
import { validateAdminOptions, validateCatalogOptions } from "../courseQueries.js";

const catalogBinding = (queryKind = COURSE_QUERY_KINDS.ACTIVE, overrides = {}) => createCourseBinding({
  queryKind, tenantId: "tenant-1", learningLanguageCode: null, supportLanguageCode: null, ...overrides
});
const catalogToken = (queryKind = COURSE_QUERY_KINDS.ACTIVE, binding = catalogBinding(queryKind)) => encodeCourseCursor({
  queryKind, binding, position: { displayName: "English", documentPath: "tenants/tenant-1/courses/course-1" }
});
const mutateToken = (token, mutate) => {
  const padding = "=".repeat((4 - token.length % 4) % 4);
  const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(
    atob(token.replaceAll("-", "+").replaceAll("_", "/") + padding), (character) => character.charCodeAt(0)
  )));
  mutate(value);
  const binary = Array.from(new TextEncoder().encode(JSON.stringify(value)), (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
test("[positive] catalog options default and accept all four language combinations", () => {
  for (const options of [undefined, {}, { learningLanguageCode: "en" }, { supportLanguageCode: "pl" },
    { learningLanguageCode: "en", supportLanguageCode: "pl", pageSize: 50 }]) {
    const value = validateCatalogOptions(options); assert(value.pageSize >= 1); assert(Object.isFrozen(value));
  }
});
test("[positive] admin options accept omitted and each exact status", () => {
  for (const options of [{}, { status: "draft" }, { status: "active" }, { status: "archived" }]) {
    assert(Object.isFrozen(validateAdminOptions(options)));
  }
});
test("[negative] options reject null, arrays, unknown and explicit undefined", () => {
  for (const options of [null, [], { status: "active" }, { role: "student" }, { pageSize: undefined }, { cursor: null }]) {
    assert.throws(() => validateCatalogOptions(options));
  }
  for (const options of [null, [], { learningLanguageCode: "en" }, { status: undefined }]) {
    assert.throws(() => validateAdminOptions(options));
  }
});
test("[negative] page sizes are closed to integer 1 through 50", () => {
  for (const pageSize of [0, -1, 51, 1.5, "20", true, NaN, Infinity, null]) {
    assert.throws(() => validateCatalogOptions({ pageSize }));
  }
  assert.equal(validateCatalogOptions({ pageSize: 1 }).pageSize, 1);
  assert.equal(validateCatalogOptions({ pageSize: 50 }).pageSize, 50);
});
test("[negative] language and status option values are fail-closed", () => {
  for (const value of [" EN", "EN", "bad_tag", 3]) assert.throws(() => validateCatalogOptions({ learningLanguageCode: value }));
  for (const status of ["published", ["active"], null]) assert.throws(() => validateAdminOptions({ status }));
});
test("[positive] active and teacher bindings are exact and immutable", () => {
  assert.deepEqual(catalogBinding(), {
    tenantId: "tenant-1", statusContract: "active", learningLanguageCode: null,
    supportLanguageCode: null, order: COURSE_CATALOG_ORDER, policy: COURSE_CURSOR_POLICY
  });
  assert.equal(catalogBinding(COURSE_QUERY_KINDS.TEACHER).statusContract, "draft_active");
});
test("[positive] admin binding is exact", () => {
  assert.deepEqual(createCourseBinding({ queryKind: COURSE_QUERY_KINDS.ADMIN, tenantId: "tenant-1", status: null }), {
    tenantId: "tenant-1", status: null, order: COURSE_ADMIN_ORDER, policy: COURSE_CURSOR_POLICY
  });
});
test("[positive] all three cursor kinds round-trip canonical positions", () => {
  for (const queryKind of [COURSE_QUERY_KINDS.ACTIVE, COURSE_QUERY_KINDS.TEACHER]) {
    const binding = catalogBinding(queryKind); const token = catalogToken(queryKind, binding);
    assert.deepEqual(decodeCourseCursor(token, { queryKind, binding }), {
      displayName: "English", documentPath: "tenants/tenant-1/courses/course-1"
    });
    assert(!token.includes("="));
  }
  const queryKind = COURSE_QUERY_KINDS.ADMIN;
  const binding = createCourseBinding({ queryKind, tenantId: "tenant-1", status: "archived" });
  const token = encodeCourseCursor({ queryKind, binding, position: {
    updatedAt: "2026-08-02T12:00:00.000Z", documentPath: "tenants/tenant-1/courses/course-1"
  } });
  assert.equal(decodeCourseCursor(token, { queryKind, binding }).updatedAt, "2026-08-02T12:00:00.000Z");
});
test("[negative] malformed cursors are INVALID_ARGUMENT", () => {
  for (const token of [null, "", "   ", "abc=", "***", "a".repeat(2049)]) {
    assert.throws(() => decodeCourseCursor(token, { queryKind: COURSE_QUERY_KINDS.ACTIVE, binding: catalogBinding() }),
      (error) => error.code === "INVALID_ARGUMENT");
  }
});
test("[negative] cursor binding mismatches are CONTRACT_VIOLATION", () => {
  const token = catalogToken();
  const cases = [
    { queryKind: COURSE_QUERY_KINDS.TEACHER, binding: catalogBinding(COURSE_QUERY_KINDS.TEACHER) },
    { queryKind: COURSE_QUERY_KINDS.ACTIVE, binding: catalogBinding(COURSE_QUERY_KINDS.ACTIVE, { tenantId: "tenant-2" }) },
    { queryKind: COURSE_QUERY_KINDS.ACTIVE, binding: catalogBinding(COURSE_QUERY_KINDS.ACTIVE, { learningLanguageCode: "en" }) }
  ];
  for (const expected of cases) assert.throws(() => decodeCourseCursor(token, expected), (error) => error.code === "CONTRACT_VIOLATION");
});
test("[negative] cursor rejects noncanonical JSON key order", () => {
  const token = catalogToken();
  const reordered = mutateToken(token, (value) => {
    value.binding = { policy: value.binding.policy, order: value.binding.order,
      supportLanguageCode: value.binding.supportLanguageCode, learningLanguageCode: value.binding.learningLanguageCode,
      statusContract: value.binding.statusContract, tenantId: value.binding.tenantId };
  });
  assert.throws(() => decodeCourseCursor(reordered, { queryKind: COURSE_QUERY_KINDS.ACTIVE, binding: catalogBinding() }),
    (error) => error.code === "INVALID_ARGUMENT");
});
test("[negative] supported schema with incompatible version or policy is CONTRACT_VIOLATION", () => {
  const token = catalogToken(); const expected = { queryKind: COURSE_QUERY_KINDS.ACTIVE, binding: catalogBinding() };
  for (const incompatibleToken of [
    mutateToken(token, (value) => { value.version = 2; }),
    mutateToken(token, (value) => { value.binding.policy = "other_policy"; })
  ]) {
    assert.throws(() => decodeCourseCursor(incompatibleToken, expected), (error) => error.code === "CONTRACT_VIOLATION");
  }
});
test("[negative] cursor positions reject invalid path and timestamp", () => {
  const binding = catalogBinding();
  for (const documentPath of ["/tenants/tenant-1/courses/course-1", "groups/tenant-1/courses/course-1",
    "tenants/tenant-1/nested/x/courses/course-1"]) {
    assert.throws(() => encodeCourseCursor({ queryKind: COURSE_QUERY_KINDS.ACTIVE, binding,
      position: { displayName: "English", documentPath } }));
  }
  const admin = createCourseBinding({ queryKind: COURSE_QUERY_KINDS.ADMIN, tenantId: "tenant-1", status: null });
  assert.throws(() => encodeCourseCursor({ queryKind: COURSE_QUERY_KINDS.ADMIN, binding: admin,
    position: { updatedAt: "2026-08-02", documentPath: "tenants/tenant-1/courses/course-1" } }));
});
test("[negative] canonical cross-Tenant documentPath is CONTRACT_VIOLATION", () => {
  const token = mutateToken(catalogToken(), (value) => {
    value.position.documentPath = "tenants/tenant-2/courses/course-1";
  });
  assert.throws(() => decodeCourseCursor(token, {
    queryKind: COURSE_QUERY_KINDS.ACTIVE,
    binding: catalogBinding()
  }), (error) => error.code === "CONTRACT_VIOLATION" &&
    error.operation === "decode_course_cursor" && error.resource === "course_cursor" &&
    error.message === "Course cursor position is outside its Tenant binding.");
});
test("[negative] structurally invalid documentPath is INVALID_ARGUMENT", () => {
  const token = mutateToken(catalogToken(), (value) => {
    value.position.documentPath = "tenants/tenant-1/courses/nested/course-1";
  });
  assert.throws(() => decodeCourseCursor(token, {
    queryKind: COURSE_QUERY_KINDS.ACTIVE,
    binding: catalogBinding()
  }), (error) => error.code === "INVALID_ARGUMENT" &&
    error.operation === "decode_course_cursor" && error.resource === "course_cursor" &&
    error.message === "Course cursor path is not canonical.");
});
test("[positive] canonical same-Tenant documentPath is valid", () => {
  const binding = catalogBinding();
  const token = catalogToken(COURSE_QUERY_KINDS.ACTIVE, binding);
  assert.deepEqual(decodeCourseCursor(token, {
    queryKind: COURSE_QUERY_KINDS.ACTIVE,
    binding
  }), { displayName: "English", documentPath: "tenants/tenant-1/courses/course-1" });
});
test("[positive] canonical same-Tenant alternate courseId remains valid", () => {
  const token = mutateToken(catalogToken(), (value) => {
    value.position.documentPath = "tenants/tenant-1/courses/course-2";
  });
  assert.deepEqual(decodeCourseCursor(token, {
    queryKind: COURSE_QUERY_KINDS.ACTIVE,
    binding: catalogBinding()
  }), { displayName: "English", documentPath: "tenants/tenant-1/courses/course-2" });
});
