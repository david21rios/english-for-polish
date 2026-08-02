import assert from "node:assert/strict";
import test from "node:test";
import { REPOSITORY_ERROR_CODES } from "../../shared/index.js";
import {
  REGISTRATION_REQUEST_QUERY_KINDS, createRegistrationRequestBinding,
  decodeRegistrationRequestCursor, encodeRegistrationRequestCursor
} from "../registrationRequestCursor.js";
import { validateRegistrationRequestListOptions } from "../registrationRequestQueries.js";
import { iso } from "./testDoubles.mjs";

const binding = createRegistrationRequestBinding({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, tenantId: "tenant-1", uid: "uid-1", status: null });
const token = () => encodeRegistrationRequestCursor({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding, position: { requestedAt: iso, documentPath: "tenants/tenant-1/registrationRequests/request-1" } });

test("[positive] options default to 20 and accept closed fields", () => {
  assert.deepEqual(validateRegistrationRequestListOptions(), { status: null, pageSize: 20, cursor: null });
  assert.deepEqual(validateRegistrationRequestListOptions({ status: "pending", pageSize: 1, cursor: null }), { status: "pending", pageSize: 1, cursor: null });
  assert.equal(validateRegistrationRequestListOptions({ pageSize: 50 }).pageSize, 50);
});

test("[negative] options reject null, unknown, invalid status, size and cursor", () => {
  for (const value of [null, [], { extra: true }, { status: "open" }, { pageSize: 0 }, { pageSize: 51 }, { pageSize: 1.5 }, { cursor: "" }]) {
    assert.throws(() => validateRegistrationRequestListOptions(value));
  }
});

test("[positive] cursor round-trips through portable base64url", () => {
  const encoded = token();
  assert.match(encoded, /^[A-Za-z0-9_-]+$/u);
  assert.deepEqual(decodeRegistrationRequestCursor(encoded, { queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding }), { requestedAt: iso, documentPath: "tenants/tenant-1/registrationRequests/request-1" });
});

test("[negative] malformed cursors fail INVALID_ARGUMENT", () => {
  for (const value of ["", "***", "e30", "a".repeat(2049)]) {
    assert.throws(() => decodeRegistrationRequestCursor(value, { queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding }), (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT);
  }
});

test("[negative] incompatible bindings fail CONTRACT_VIOLATION", () => {
  const encoded = token();
  const other = createRegistrationRequestBinding({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, tenantId: "tenant-2", uid: "uid-1", status: null });
  assert.throws(() => decodeRegistrationRequestCursor(encoded, { queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding: other }), (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION);
});

test("[negative] encoder rejects noncanonical positions and bindings", () => {
  assert.throws(() => encodeRegistrationRequestCursor({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding, position: { requestedAt: "2026-01-01", documentPath: "bad" } }));
  assert.throws(() => encodeRegistrationRequestCursor({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding, position: { requestedAt: iso, documentPath: "tenants/other/registrationRequests/request-1" } }));
});
