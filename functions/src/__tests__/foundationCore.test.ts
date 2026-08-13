import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES } from "@mipymetic/saas-contracts/commands";
import { CAPABILITY_IDS } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { canonicalJsonStringify } from "@mipymetic/saas-contracts/validation";
import { rejectActorAuthorityPayload, requireAuthenticatedActor } from "../authorization/authenticatedActor.js";
import { capabilitiesForMembershipRole, capabilitiesForPlatformRole, requireCapability } from "../authorization/capabilities.js";
import { requireValidAuthorityResolution } from "../authorization/resolvedAuthority.js";
import { createPendingCommandRecord, validateCommandEnvelope, validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { prepareCommandExecution } from "../commands/executor.js";
import type { AuthorityResolution, CommandEnvelope, CommandRecord, CommandStatus, JsonValue } from "../contracts/types.js";
import { loadBackendConfig } from "../config/config.js";
import { BackendError, mapFirebaseAdminError, sanitizeBackendError } from "../errors/backendError.js";
import { decideIdempotency } from "../idempotency/idempotency.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type { TransactionPort, TransactionRunnerPort } from "../persistence/ports.js";

const envelope = (payload: Readonly<Record<string, JsonValue>> = {}): CommandEnvelope => ({
  commandId: "command-1", commandType: COMMAND_TYPES.BOOTSTRAP_PLATFORM_ADMINS,
  correlationId: "correlation-1", tenantId: null, payload,
});

const authority: AuthorityResolution = Object.freeze({
  actorUid: "actor-1", actorType: "identity", authority: "tenant_admin", tenantId: "tenant-1",
  roles: Object.freeze(["tenant_admin"]), capabilities: Object.freeze([CAPABILITY_IDS.TENANT_UPDATE]),
});

const record = (status: CommandStatus, payloadHash = "hash-1"): CommandRecord => Object.freeze({
  commandId: "command-1", commandType: COMMAND_TYPES.BOOTSTRAP_PLATFORM_ADMINS, payloadHash,
  actorUid: "actor-1", actorType: "identity", authority: "tenant_admin", tenantId: null,
  status, startedAt: "2026-01-01T00:00:00.000Z", completedAt: null, failedAt: null,
  stage: status === COMMAND_STATUSES.SUCCEEDED ? PRIVILEGED_COMMAND_STAGES.COMPLETED
    : status === COMMAND_STATUSES.RECOVERY_REQUIRED ? PRIVILEGED_COMMAND_STAGES.PREPARED
      : PRIVILEGED_COMMAND_STAGES.NOT_STARTED,
  result: null, errorCode: null, attemptCount: 1, correlationId: "correlation-1",
  expiresAt: null, leaseExpiresAt: null, schemaVersion: COMMAND_SCHEMA_VERSION,
});

test("authenticated actor derives identity only from verified context", () => {
  assert.throws(() => requireAuthenticatedActor(null), (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.UNAUTHENTICATED);
  for (const uid of ["", "   ", ".", "..", "a/b"]) {
    assert.throws(
      () => requireAuthenticatedActor({ uid }),
      (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.UNAUTHENTICATED,
    );
  }
  assert.deepEqual(requireAuthenticatedActor({ uid: "actor-1", token: { email_verified: true }, appCheckVerified: true }), {
    uid: "actor-1", tokenEmailVerified: true, appCheckVerified: true,
  });
});

test("payload authority spoofing is rejected exhaustively", () => {
  for (const key of ["actorUid", "actorType", "authority", "platformRole", "role", "roles", "capability", "capabilities"]) {
    assert.throws(() => rejectActorAuthorityPayload({ [key]: "spoofed" }), BackendError);
  }
  assert.doesNotThrow(() => rejectActorAuthorityPayload({ displayName: "safe" }));
  for (const payload of [
    { actor: { uid: "descriptive-business-data" } },
    { identity: { uid: "descriptive-business-data" } },
    { authorityContext: { capabilities: ["descriptive-business-data"] } },
    { profile: { role: "descriptive-business-data" } },
  ]) assert.doesNotThrow(() => rejectActorAuthorityPayload(payload));
  assert.throws(() => rejectActorAuthorityPayload({ authority: { role: "spoofed" } }), BackendError);
});

test("capability resolution uses the shared matrices", () => {
  assert.ok(capabilitiesForMembershipRole("tenant_admin").includes(CAPABILITY_IDS.TENANT_UPDATE));
  assert.ok(capabilitiesForPlatformRole("platform_admin").includes(CAPABILITY_IDS.PLATFORM_TENANT_UPDATE));
  assert.throws(() => capabilitiesForMembershipRole("platform_admin"), BackendError);
  assert.throws(() => capabilitiesForPlatformRole("tenant_admin"), BackendError);
  assert.doesNotThrow(() => requireCapability([CAPABILITY_IDS.TENANT_UPDATE], CAPABILITY_IDS.TENANT_UPDATE));
  assert.throws(() => requireCapability([], CAPABILITY_IDS.TENANT_UPDATE), (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.FORBIDDEN);
  assert.throws(() => requireCapability([], "unknown.capability"), (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONTRACT_VIOLATION);
});

test("runtime authority composition accepts canonical evidence and rejects forged matrices", () => {
  const platformCapabilities = capabilitiesForPlatformRole("platform_admin");
  const valid = Object.freeze({ actorUid: "actor-1", actorType: "platform_admin", authority: "platform_admin", tenantId: null, roles: Object.freeze(["platform_admin"]), capabilities: platformCapabilities });
  assert.equal(requireValidAuthorityResolution(valid), valid);
  for (const value of [
    { ...valid, authority: "forged_authority" },
    { ...valid, capabilities: platformCapabilities.slice(1) },
    { ...valid, capabilities: [...platformCapabilities, CAPABILITY_IDS.TENANT_UPDATE] },
    { ...valid, tenantId: "tenant-1" },
    { ...valid, metadata: "forged" },
  ]) assert.throws(() => requireValidAuthorityResolution(value), (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONTRACT_VIOLATION);
  assert.doesNotThrow(() => requireValidAuthorityResolution({ actorUid: "operator-1", actorType: "system", authority: "platform_system", tenantId: null, roles: [], capabilities: [] }));
  assert.doesNotThrow(() => requireValidAuthorityResolution({ actorUid: "operator-2", actorType: "system", authority: "platform_recovery", tenantId: null, roles: [], capabilities: [] }));
});

test("command envelope is exact and rejects unknown commands", () => {
  assert.doesNotThrow(() => validateCommandEnvelope(envelope()));
  assert.doesNotThrow(() => validateCommandEnvelope({ ...envelope(), commandId: "firebase_document-ID_1" }));
  for (const field of ["commandId", "correlationId", "tenantId"] as const) {
    for (const value of ["", "   ", ".", "..", "a/b"]) {
      assert.throws(
        () => validateCommandEnvelope({ ...envelope(), [field]: value }),
        (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.INVALID_ARGUMENT,
      );
    }
  }
  assert.throws(() => validateCommandEnvelope({ ...envelope(), commandType: "Unknown" }), BackendError);
  assert.throws(() => validateCommandEnvelope({ ...envelope(), actorUid: "spoofed" } as CommandEnvelope), BackendError);
  assert.throws(() => validateCommandEnvelope({ ...envelope(), payload: [] } as unknown as CommandEnvelope), BackendError);
});

test("pending command record follows the shared schema", () => {
  const created = createPendingCommandRecord({ envelope: envelope(), payloadHash: "hash-1", authority });
  assert.equal(created.status, COMMAND_STATUSES.PENDING);
  assert.equal(created.schemaVersion, 2);
  assert.equal(created.stage, PRIVILEGED_COMMAND_STAGES.NOT_STARTED);
  assert.equal(created.result, null);
  assert.ok(Object.isFrozen(created));
});

test("persisted command records fail closed unless their exact contract is valid", () => {
  const valid = createPendingCommandRecord({
    envelope: envelope(), payloadHash: "a".repeat(64), authority,
  });
  const persisted = { ...valid, startedAt: "2026-01-01T00:00:00.000Z" };
  assert.deepEqual(validatePersistedCommandRecord(persisted), persisted);
  const invalidRecords: readonly unknown[] = [
    {},
    { payloadHash: valid.payloadHash, status: COMMAND_STATUSES.SUCCEEDED },
    Object.fromEntries(Object.entries(persisted).filter(([key]) => key !== "commandId")),
    { ...persisted, unknown: true }, { ...persisted, status: "unknown" },
    { ...persisted, schemaVersion: 1 }, { ...persisted, schemaVersion: 3 },
    { ...persisted, stage: null }, { ...persisted, stage: "unknown" },
    { ...persisted, payloadHash: "not-a-sha256" }, { ...persisted, startedAt: "not-a-timestamp" },
    { ...persisted, completedAt: "not-a-timestamp" }, { ...persisted, actorUid: "a/b" },
    { ...persisted, actorType: "client" }, { ...persisted, authority: "" },
    { ...persisted, tenantId: "a/b" }, { ...persisted, commandType: COMMAND_TYPES.BOOTSTRAP_TENANT },
    { ...persisted, attemptCount: -1 },
  ];
  for (const invalid of invalidRecords) {
    assert.throws(
      () => validatePersistedCommandRecord(invalid),
      (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    );
  }
});

test("persisted command record leases are restricted to running commands", () => {
  const valid = createPendingCommandRecord({
    envelope: envelope(), payloadHash: "a".repeat(64), authority,
  });
  const persisted = { ...valid, startedAt: "2026-01-01T00:00:00.000Z" };
  const leaseExpiresAt = "2026-01-01T00:01:00.000Z";
  for (const status of Object.values(COMMAND_STATUSES)) {
    const stage = status === COMMAND_STATUSES.SUCCEEDED ? PRIVILEGED_COMMAND_STAGES.COMPLETED
      : status === COMMAND_STATUSES.RECOVERY_REQUIRED ? PRIVILEGED_COMMAND_STAGES.PREPARED : PRIVILEGED_COMMAND_STAGES.NOT_STARTED;
    assert.doesNotThrow(() => validatePersistedCommandRecord({ ...persisted, status, stage, leaseExpiresAt: null }));
    if (status === COMMAND_STATUSES.RUNNING) {
      assert.doesNotThrow(() => validatePersistedCommandRecord({ ...persisted, status, stage, leaseExpiresAt }));
    } else {
      assert.throws(
        () => validatePersistedCommandRecord({ ...persisted, status, stage, leaseExpiresAt }),
        (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
      );
    }
  }
});

test("command execution rejects a malformed persisted replay before idempotency", async () => {
  const inputEnvelope = envelope({ safe: true });
  const payloadHash = canonicalPayloadHash(inputEnvelope.commandType, inputEnvelope.payload);
  const transaction: TransactionPort = {
    get: async () => ({ exists: true, data: { payloadHash, status: COMMAND_STATUSES.SUCCEEDED } }),
    create: () => assert.fail("malformed replay must not create a command"),
    set: () => {},
    update: () => {},
  };
  const transactionRunner: TransactionRunnerPort = {
    run: async <T>(operation: (port: TransactionPort) => Promise<T>): Promise<T> => operation(transaction),
  };
  await assert.rejects(
    prepareCommandExecution({
      auth: { uid: authority.actorUid },
      envelope: inputEnvelope,
      dependencies: { transactionRunner, resolveAuthority: async () => authority },
    }),
    (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );
});

test("canonical payload hash preserves UTF-8 and key-order determinism", () => {
  const left = canonicalPayloadHash(COMMAND_TYPES.BOOTSTRAP_TENANT, { z: "żółć", a: 1 });
  const right = canonicalPayloadHash(COMMAND_TYPES.BOOTSTRAP_TENANT, { a: 1, z: "żółć" });
  const expected = createHash("sha256").update(canonicalJsonStringify({ commandType: COMMAND_TYPES.BOOTSTRAP_TENANT, payload: { a: 1, z: "żółć" } }), "utf8").digest("hex");
  assert.equal(left, right);
  assert.equal(left, expected);
  assert.notEqual(left, canonicalPayloadHash(COMMAND_TYPES.RECOVER_PLATFORM_ADMIN, { a: 1, z: "żółć" }));
});

test("idempotency distinguishes new, replay, resume, terminal and conflict", () => {
  assert.deepEqual(decideIdempotency(null, "hash-1"), { kind: "new" });
  assert.equal(decideIdempotency(record(COMMAND_STATUSES.SUCCEEDED), "hash-1").kind, "replay");
  assert.equal(decideIdempotency(record(COMMAND_STATUSES.FAILED_RETRYABLE), "hash-1").kind, "resume");
  assert.equal(decideIdempotency(record(COMMAND_STATUSES.RECOVERY_REQUIRED), "hash-1").kind, "resume");
  assert.throws(() => decideIdempotency(record(COMMAND_STATUSES.FAILED_TERMINAL), "hash-1"), BackendError);
  assert.throws(() => decideIdempotency(record(COMMAND_STATUSES.PENDING), "hash-1"), BackendError);
  assert.throws(() => decideIdempotency(record(COMMAND_STATUSES.SUCCEEDED), "different"), (error: unknown) => error instanceof BackendError && error.code === BACKEND_ERROR_CODES.CONFLICT);
});

test("backend errors sanitize unknown values and map Admin failures", () => {
  assert.deepEqual(sanitizeBackendError(new Error("secret")), { code: BACKEND_ERROR_CODES.INTERNAL, message: "The privileged operation failed.", retryable: false });
  assert.equal(mapFirebaseAdminError({ code: "firestore/not-found", message: "private" }).code, BACKEND_ERROR_CODES.NOT_FOUND);
  assert.equal(mapFirebaseAdminError({ code: "firestore/aborted" }).code, BACKEND_ERROR_CODES.UNAVAILABLE);
  assert.equal(mapFirebaseAdminError({ code: "unexpected" }).code, BACKEND_ERROR_CODES.UNKNOWN);
});

test("configuration is closed, environment-aware and secret-free", () => {
  assert.equal(loadBackendConfig({ BACKEND_ENVIRONMENT: "local" }).environment, "local");
  assert.deepEqual(loadBackendConfig({ BACKEND_ENVIRONMENT: "demo-emulator", GCLOUD_PROJECT: "demo-polish-learning" }), {
    environment: "demo-emulator", projectId: "demo-polish-learning", deploymentRegion: null,
    emulator: true, maxApplicationAttempts: 5, commandTimeoutMs: 20_000, readBudgetTarget: 20, writeBudgetTarget: 20,
  });
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "unknown" }), BackendError);
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "production", GCLOUD_PROJECT: "project" }), BackendError);
  assert.deepEqual(loadBackendConfig({ BACKEND_ENVIRONMENT: "development", GCLOUD_PROJECT: "development-project" }).environment, "development");
  assert.deepEqual(loadBackendConfig({ BACKEND_ENVIRONMENT: "staging", GCLOUD_PROJECT: "staging-project", DEPLOYMENT_REGION: "region" }).environment, "staging");
  assert.deepEqual(loadBackendConfig({ BACKEND_ENVIRONMENT: "production", GCLOUD_PROJECT: "production-project", DEPLOYMENT_REGION: "region" }).environment, "production");
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "local", UNKNOWN: "value" }), BackendError);
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "local", UNKNOWN: "value", OTHER: "value" }), BackendError);
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "local", backend_environment: "local" }), BackendError);
  assert.throws(() => loadBackendConfig({ BACKEND_ENVIRONMENT: "local", API_TOKEN: "secret" }), BackendError);
});
