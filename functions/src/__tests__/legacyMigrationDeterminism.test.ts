import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveMigrationCandidateId,
  deriveMigrationCandidateSortKey,
  deriveMigrationIdempotencyKey,
} from "../migration/legacyMigrationDeterminism.js";
import { APPROVED_LEGACY_TENANT_ID } from "../migration/legacyMigrationTypes.js";
import { type MigrationDeterminismInput } from "../migration/legacyMigrationDeterminism.js";

const input = (overrides: Partial<MigrationDeterminismInput> = {}): MigrationDeterminismInput => ({
  migrationContractVersion: "phase05-legacy-mapping-dry-run-v1",
  candidateType: "identity_migration" as const,
  legacyTenantId: APPROVED_LEGACY_TENANT_ID,
  sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "user-1" },
  targetReference: { tenantId: APPROVED_LEGACY_TENANT_ID, entityType: "identity", targetId: "uid-1", targetReference: "identities/uid-1" },
  runId: "run-a",
  logicalTime: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test("candidate identity and idempotency are stable and exclude run metadata", () => {
  const first = input();
  const second = input({ runId: "run-b", logicalTime: "2027-02-02T00:00:00.000Z" });
  assert.equal(deriveMigrationCandidateId(first), deriveMigrationCandidateId(second));
  assert.equal(deriveMigrationIdempotencyKey(first), deriveMigrationIdempotencyKey(second));
  assert.match(deriveMigrationIdempotencyKey(first), new RegExp(`^phase05-legacy-mapping-dry-run-v1\\|identity_migration\\|${APPROVED_LEGACY_TENANT_ID}\\|`));
  assert.ok(deriveMigrationIdempotencyKey(first).endsWith("|identity|uid-1"));
});

test("semantic identity changes candidate id and idempotency key", () => {
  const first = input();
  const changedSource = input({ sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "user-2" } });
  const changedTarget = input({ targetReference: { tenantId: APPROVED_LEGACY_TENANT_ID, entityType: "identity" as const, targetId: "uid-2", targetReference: "identities/uid-2" } });
  assert.notEqual(deriveMigrationCandidateId(first), deriveMigrationCandidateId(changedSource));
  assert.notEqual(deriveMigrationIdempotencyKey(first), deriveMigrationIdempotencyKey(changedTarget));
});

test("sort key uses the exact locale-independent NUL-delimited structure", () => {
  const value = deriveMigrationCandidateSortKey(input({ targetReference: { tenantId: APPROVED_LEGACY_TENANT_ID, entityType: "identity" as const, targetId: null, targetReference: null } }));
  assert.equal(value, "identity_migration\u0000users\u0000user-1\u0000");
  const fixtures = [
    input({ sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "z" } }),
    input({ sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "a" } }),
    input({ sourceReference: { collectionPath: "users", entityKind: "identity", recordId: "m" } }),
  ];
  const forward = fixtures.map(deriveMigrationCandidateSortKey).sort();
  const reversed = [...fixtures].reverse().map(deriveMigrationCandidateSortKey).sort();
  assert.deepEqual(forward, reversed);
});
