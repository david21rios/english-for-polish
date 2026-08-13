import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORITY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY,
  PLATFORM_AUTHORITY_FIELDS,
  PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY_REGISTRY_STATES,
  PLATFORM_AUTHORITY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY_STATUSES,
  validatePlatformAuthority,
  validatePlatformAuthorityRegistry,
} from "@mipymetic/saas-contracts/authority";
import { validatePersistedTimestamp } from "@mipymetic/saas-contracts/validation";

const timestamp = "2026-08-12T12:34:56.123Z";
const registry = (bootstrapState = PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED) => ({
  schemaVersion: PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, bootstrapState, activeCount: 0,
  revision: bootstrapState === PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED ? 0 : 1,
  lastCommandId: bootstrapState === PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED ? null : "command-1", updatedAt: timestamp,
});

test("Platform Authority Registry states and validator are canonical", () => {
  assert.deepEqual(Object.keys(PLATFORM_AUTHORITY_REGISTRY_STATES), ["UNINITIALIZED", "IN_PROGRESS", "COMPLETED", "RECOVERY_REQUIRED"]);
  assert.deepEqual(Object.values(PLATFORM_AUTHORITY_REGISTRY_STATES), ["uninitialized", "in_progress", "completed", "recovery_required"]);
  assert.ok(Object.isFrozen(PLATFORM_AUTHORITY_REGISTRY_STATES));
  for (const state of Object.values(PLATFORM_AUTHORITY_REGISTRY_STATES)) assert.equal(validatePlatformAuthorityRegistry(registry(state)).ok, true, state);
});

test("Platform Authority Registry rejects malformed local invariants", () => {
  const valid = registry();
  for (const field of ["schemaVersion", "bootstrapState", "activeCount", "revision", "lastCommandId", "updatedAt"]) {
    const missing = { ...valid }; delete missing[field]; assert.equal(validatePlatformAuthorityRegistry(missing).ok, false, field);
  }
  for (const value of [{ ...valid, extra: true }, { ...valid, schemaVersion: 2 }, { ...valid, bootstrapState: "unknown" },
    { ...valid, activeCount: -1 }, { ...valid, activeCount: 0.5 }, { ...valid, revision: -1 }, { ...valid, revision: 0.5 },
    { ...valid, lastCommandId: "command-1" }, { ...valid, activeCount: 1 },
    { ...registry(PLATFORM_AUTHORITY_REGISTRY_STATES.COMPLETED), lastCommandId: null }, { ...valid, updatedAt: "invalid" }]) {
    assert.equal(validatePlatformAuthorityRegistry(value).ok, false);
  }
});
const authority = (status = PLATFORM_AUTHORITY_STATUSES.ACTIVE, transitionCommandId = null) => ({
  schemaVersion: PLATFORM_AUTHORITY_SCHEMA_VERSION,
  transitionCommandId,
  uid: "user-1",
  authority: PLATFORM_AUTHORITY,
  status,
  createdAt: timestamp,
  createdBy: "command-1",
  updatedAt: timestamp,
  updatedBy: "command-1",
  activatedAt: null,
  revokedAt: null,
  revokedBy: null,
  bootstrapCommandId: null,
  lastClaimSyncAt: null,
});

test("portable persisted timestamps accept only canonical UTC milliseconds", () => {
  for (const value of ["2026-08-12T12:34:56.000Z", timestamp]) {
    assert.deepEqual(validatePersistedTimestamp(value), { ok: true, value });
  }
  for (const value of [
    null, undefined, new Date(timestamp), 0, {}, [], { toDate: () => new Date(timestamp) }, "", "   ",
    "2026-08-12", "2026-08-12T14:34:56.123+02:00", "2026-08-12T12:34:56Z",
    "2026-08-12T12:34:56.123456Z", "2026-02-30T12:34:56.123Z", "not-a-date",
  ]) assert.equal(validatePersistedTimestamp(value).ok, false, String(value));
});

test("Authority and Registry versions are independent and the legacy alias remains compatible", () => {
  assert.equal(PLATFORM_AUTHORITY_SCHEMA_VERSION, 2);
  assert.equal(PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, 1);
  assert.equal(AUTHORITY_SCHEMA_VERSION, PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION);
  assert.deepEqual(PLATFORM_AUTHORITY_FIELDS, [
    "schemaVersion", "transitionCommandId", "uid", "authority", "status", "createdAt", "createdBy",
    "updatedAt", "updatedBy", "activatedAt", "revokedAt", "revokedBy", "bootstrapCommandId", "lastClaimSyncAt",
  ]);
  assert.ok(Object.isFrozen(PLATFORM_AUTHORITY_FIELDS));
});

test("Platform Authority exact current schema accepts the complete status-owner matrix", () => {
  const valid = [
    authority(PLATFORM_AUTHORITY_STATUSES.PROVISIONING, "command-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.ACTIVE, null),
    authority(PLATFORM_AUTHORITY_STATUSES.ACTIVE, "command-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKING, "command-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKED, null),
    authority(PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED, "command-1"),
  ];
  for (const value of valid) assert.equal(validatePlatformAuthority(value).ok, true, value.status);
  const invalid = [
    authority(PLATFORM_AUTHORITY_STATUSES.PROVISIONING, null),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKING, null),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKED, "command-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED, null),
  ];
  for (const value of invalid) assert.equal(validatePlatformAuthority(value).ok, false, value.status);
});

test("Platform Authority rejects legacy, unknown and incomplete exact shapes", () => {
  const valid = authority();
  const legacy = { ...valid };
  delete legacy.schemaVersion;
  delete legacy.transitionCommandId;
  const missingField = { ...valid };
  delete missingField.updatedBy;
  for (const value of [legacy, missingField, { ...valid, unexpected: true }]) {
    assert.equal(validatePlatformAuthority(value).ok, false);
  }
  for (const schemaVersion of [null, "1", 0, -1, 1, 1.5, 999]) {
    assert.equal(validatePlatformAuthority({ ...valid, schemaVersion }).ok, false);
  }
});

test("Platform Authority rejects invalid identifiers and timestamps field by field", () => {
  const valid = authority(PLATFORM_AUTHORITY_STATUSES.PROVISIONING, "command-1");
  for (const field of ["uid", "createdBy", "updatedBy", "transitionCommandId"]) {
    assert.equal(validatePlatformAuthority({ ...valid, [field]: "bad/id" }).ok, false, field);
  }
  for (const field of ["revokedBy", "bootstrapCommandId"]) {
    assert.equal(validatePlatformAuthority({ ...valid, [field]: ".." }).ok, false, field);
  }
  for (const field of ["createdAt", "updatedAt", "activatedAt", "revokedAt", "lastClaimSyncAt"]) {
    assert.equal(validatePlatformAuthority({ ...valid, [field]: "not-a-date" }).ok, false, field);
  }
  for (const field of ["createdAt", "updatedAt"]) {
    assert.equal(validatePlatformAuthority({ ...valid, [field]: null }).ok, false, field);
  }
  for (const field of ["activatedAt", "revokedAt", "lastClaimSyncAt"]) {
    assert.equal(validatePlatformAuthority({ ...valid, [field]: null }).ok, true, field);
  }
});

test("Authority schema characterizes Bootstrap, recovery and revoke without store behavior", () => {
  const bootstrapA = { ...authority(PLATFORM_AUTHORITY_STATUSES.PROVISIONING, "bootstrap-1"), bootstrapCommandId: "bootstrap-1" };
  const bootstrapB = { ...bootstrapA, uid: "user-2" };
  assert.equal(validatePlatformAuthority(bootstrapA).ok, true);
  assert.equal(validatePlatformAuthority(bootstrapB).ok, true);
  for (const value of [
    authority(PLATFORM_AUTHORITY_STATUSES.ACTIVE, null),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKING, "revoke-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED, "revoke-1"),
    authority(PLATFORM_AUTHORITY_STATUSES.REVOKED, null),
  ]) assert.equal(validatePlatformAuthority(value).ok, true);
});
