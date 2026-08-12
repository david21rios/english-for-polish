import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { validatePlatformAuthority, validatePlatformAuthorityRegistry, PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, PLATFORM_AUTHORITY_REGISTRY_STATES, PLATFORM_AUTHORITY_SCHEMA_VERSION } from "@mipymetic/saas-contracts/authority";
import { BackendError } from "../errors/backendError.js";
import { normalizeFirestoreDocument, transformFirestoreWrite } from "../persistence/adapters/firestore.js";
import { isServerOwnedTimestamp, serverOwnedTimestamp } from "../persistence/ports.js";
import { validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES } from "@mipymetic/saas-contracts/commands";

const instant = Timestamp.fromDate(new Date("2026-08-12T12:34:56.123Z"));
test("server-owned timestamp intent is identity-safe and transformed", () => {
  const token = serverOwnedTimestamp();
  assert.equal(isServerOwnedTimestamp(token), true); assert.equal(isServerOwnedTimestamp({}), false);
  const transformed = transformFirestoreWrite({ createdAt: token, nested: { updatedAt: token }, ordinary: "value" }) as Record<string, unknown>;
  assert.equal(transformed.ordinary, "value"); assert.notEqual(transformed.createdAt, token);
  assert.notEqual((transformed.nested as Record<string, unknown>).updatedAt, token);
});
test("Firestore Authority timestamps normalize before logical validation", () => {
  const normalized = normalizeFirestoreDocument({ schemaVersion: PLATFORM_AUTHORITY_SCHEMA_VERSION, transitionCommandId: null, uid: "user-1", authority: "platform_admin", status: "active", createdAt: instant, createdBy: "command-1", updatedAt: instant, updatedBy: "command-1", activatedAt: instant, revokedAt: null, revokedBy: null, bootstrapCommandId: null, lastClaimSyncAt: null }, "platform_authority");
  assert.equal(normalized.createdAt, "2026-08-12T12:34:56.123Z"); assert.equal(validatePlatformAuthority(normalized).ok, true);
  assert.throws(() => normalizeFirestoreDocument({ createdAt: "2026-08-12T12:34:56.123Z" }, "platform_authority"), BackendError);
});
test("Firestore Registry timestamp normalizes before exact validation", () => {
  const normalized = normalizeFirestoreDocument({ schemaVersion: PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, bootstrapState: PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED, activeCount: 0, revision: 0, lastCommandId: null, updatedAt: instant }, "platform_authority_registry");
  assert.equal(validatePlatformAuthorityRegistry(normalized).ok, true);
  const missing = normalizeFirestoreDocument({ schemaVersion: 1, bootstrapState: "uninitialized", activeCount: 0, revision: 0, lastCommandId: null }, "platform_authority_registry");
  assert.equal(validatePlatformAuthorityRegistry(missing).ok, false);
});
test("Firestore Command timestamps normalize before v2 validation", () => {
  const normalized = normalizeFirestoreDocument({ commandId: "command-1", commandType: COMMAND_TYPES.REVOKE_PLATFORM_ADMIN, payloadHash: "a".repeat(64), actorUid: "actor-1", actorType: "platform_admin", authority: "platform_admin", tenantId: null, status: COMMAND_STATUSES.RUNNING, stage: PRIVILEGED_COMMAND_STAGES.PREPARED, startedAt: instant, completedAt: null, failedAt: null, result: null, errorCode: null, attemptCount: 1, correlationId: "correlation-1", expiresAt: null, leaseExpiresAt: instant, schemaVersion: COMMAND_SCHEMA_VERSION }, "privileged_command");
  assert.equal(normalized.startedAt, "2026-08-12T12:34:56.123Z");
  assert.doesNotThrow(() => validatePersistedCommandRecord(normalized));
  assert.throws(() => normalizeFirestoreDocument({ startedAt: {} }, "privileged_command"), BackendError);
});
test("Firestore Audit required timestamps normalize fail-closed", () => {
  const normalized = normalizeFirestoreDocument({ requestedAt: instant, executedAt: instant }, "platform_audit");
  assert.equal(normalized.requestedAt, "2026-08-12T12:34:56.123Z");
  assert.equal(normalized.executedAt, "2026-08-12T12:34:56.123Z");
  assert.throws(() => normalizeFirestoreDocument({ requestedAt: null, executedAt: instant }, "platform_audit"), BackendError);
});

test("Firestore Identity timestamps normalize before Bootstrap validation", () => {
  const data = normalizeFirestoreDocument({ createdAt: instant, updatedAt: instant }, "identity");
  assert.equal(data.createdAt, "2026-08-12T12:34:56.123Z");
  assert.equal(data.updatedAt, "2026-08-12T12:34:56.123Z");
  for (const field of ["createdAt", "updatedAt"]) assert.throws(() => normalizeFirestoreDocument({ createdAt: instant, updatedAt: instant, [field]: "bad" }, "identity"), BackendError);
});
