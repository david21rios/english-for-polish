import assert from "node:assert/strict";
import { test } from "node:test";
import { createEnrollment } from "../commands/createEnrollment.js";
import { BackendError } from "../errors/backendError.js";
import { serverOwnedTimestamp, type AuthoritativeReaderPort, type DocumentSnapshotPort, type TransactionPort, type TransactionRunnerPort } from "../persistence/ports.js";
import { courseDocumentPath, enrollmentDocumentPath, identityDocumentPath, membershipDocumentPath, privilegedCommandDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { enrollmentClaimDocumentPath } from "../persistence/enrollmentWriteStore.js";
import type { JsonValue } from "../contracts/types.js";

const now = "2026-01-01T00:00:00.000Z";
const input = { commandId: "cmd-enrollment-1", correlationId: "corr-enrollment-1", tenantId: "tenant-1", membershipId: "membership-1", courseId: "course-1" };

class BufferedMemory implements TransactionRunnerPort, AuthoritativeReaderPort {
  readonly docs = new Map<string, Readonly<Record<string, unknown>>>(); readonly logs: string[][] = []; readonly txOverrides = new Map<string, Readonly<Record<string, unknown>> | null>(); invocations = 0; failAfterWrites = 0; bufferedBeforeFailure = 0;
  async read(path: string): Promise<DocumentSnapshotPort> { return this.snapshot(path); }
  private snapshot(path: string): DocumentSnapshotPort { const data = this.docs.get(path); return { exists: data !== undefined, data: (data ?? null) as Readonly<Record<string, JsonValue>> | null }; }
  async run<T>(operation: (transaction: TransactionPort) => Promise<T>): Promise<T> {
    this.invocations += 1; const log: string[] = []; this.logs.push(log); const pending = new Map<string, Readonly<Record<string, unknown>>>();
    const get = async (path: string) => { log.push(`get:${path}`); const data = pending.get(path) ?? (this.txOverrides.has(path) ? this.txOverrides.get(path) : this.docs.get(path)); return { exists: data !== undefined && data !== null, data: (data ?? null) as Readonly<Record<string, JsonValue>> | null }; };
    let writes = 0; const record = () => { writes += 1; if (this.failAfterWrites > 0 && this.invocations > 1 && writes >= this.failAfterWrites) { this.bufferedBeforeFailure = writes - 1; throw new Error("synthetic phase-B failure"); } };
    const tx: TransactionPort = { get, create: (path, data) => { log.push(`create:${path}`); if (pending.has(path) || this.docs.has(path)) throw new Error("already exists"); pending.set(path, data); record(); }, set: (path, data) => { log.push(`set:${path}`); pending.set(path, data); record(); }, update: (path, data) => { log.push(`update:${path}`); pending.set(path, { ...(pending.get(path) ?? this.docs.get(path) ?? {}), ...data }); record(); } };
    const result = await operation(tx); for (const [path, data] of pending) this.docs.set(path, materialize(data)); return result;
  }
}
const materialize = (data: Readonly<Record<string, unknown>>) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === serverOwnedTimestamp() ? now : v]));
const identity = () => ({ uid: "actor-1" });
const tenant = () => ({ tenantId: "tenant-1", status: "active" });
const membership = () => ({ membershipId: "membership-1", tenantId: "tenant-1", uid: "actor-1", role: "tenant_admin", status: "approved", originRequestId: null, createdAt: now, approvedAt: now, approvedBy: "actor-1", updatedAt: now, suspendedAt: null, removedAt: null });
const course = () => ({ courseId: "course-1", tenantId: "tenant-1", displayName: "Polish", description: "Course", learningLanguage: { languageCode: "pl-PL", displayName: "Polish" }, supportLanguageCode: "en-US", interfaceLanguages: [{ locale: "en-US", displayName: "English" }], cefrLevel: "A1", version: 1, status: "active", createdAt: now, updatedAt: now, archivedAt: null });
const setup = () => { const memory = new BufferedMemory(); memory.docs.set(identityDocumentPath("actor-1"), identity()); memory.docs.set("tenants/tenant-1", tenant()); memory.docs.set(membershipDocumentPath("tenant-1", "membership-1"), membership()); memory.docs.set(courseDocumentPath("tenant-1", "course-1"), course()); return memory; };

test("CreateEnrollment performs one complete first-create orchestration", async () => {
  const memory = setup(); const result = await createEnrollment(input, { auth: { uid: "actor-1", token: { email_verified: true } }, reader: memory, transactionRunner: memory });
  assert.deepEqual(Object.keys(result), ["enrollmentId"]); assert.equal(typeof result.enrollmentId, "string"); assert.ok(result.enrollmentId.length > 0);
  const enrollmentPath = enrollmentDocumentPath("tenant-1", result.enrollmentId); const claimPath = enrollmentClaimDocumentPath({ ...input, enrollmentId: result.enrollmentId }); const enrollment = memory.docs.get(enrollmentPath); const claim = memory.docs.get(claimPath); const command = memory.docs.get(privilegedCommandDocumentPath(input.commandId));
  assert.ok(enrollment); assert.equal(enrollment?.status, "pending"); assert.ok(claim); assert.equal(claim?.enrollmentId, result.enrollmentId); assert.equal(claim?.status, "pending"); assert.deepEqual(command?.result, result); assert.equal(command?.stage, "completed"); assert.notEqual(command?.stage, "succeeded");
  assert.deepEqual(memory.docs.get(courseDocumentPath("tenant-1", "course-1")), course()); assert.deepEqual(memory.docs.get(membershipDocumentPath("tenant-1", "membership-1")), membership()); assert.equal(memory.invocations, 2);
  const business = memory.logs[1]; assert.ok(business); const firstWrite = business.findIndex((x) => /^(create|set|update):/.test(x)); const lastGet = Math.max(...business.map((x, i) => x.startsWith("get:") ? i : -1)); assert.ok(lastGet < firstWrite); assert.ok(business.some((x) => x.includes(privilegedCommandDocumentPath(input.commandId)))); assert.ok(business.some((x) => x.includes(courseDocumentPath(input.tenantId, input.courseId)))); assert.ok(business.some((x) => x.includes(membershipDocumentPath(input.tenantId, input.membershipId)))); assert.ok(business.some((x) => x.includes("enrollmentClaims")));
});
test("CreateEnrollment rejects unauthenticated requests", async () => { const memory = setup(); await assert.rejects(() => createEnrollment(input, { auth: null, reader: memory, transactionRunner: memory }), (e: unknown) => e instanceof BackendError && e.code === "UNAUTHENTICATED"); });
test("CreateEnrollment rejects unknown fields", async () => { const memory = setup(); await assert.rejects(() => createEnrollment({ ...input, extra: true } as never, { auth: null, reader: memory, transactionRunner: memory }), (e: unknown) => e instanceof BackendError && e.code === "INVALID_ARGUMENT"); });

const deps = (memory: BufferedMemory) => ({ auth: { uid: "actor-1", token: { email_verified: true } }, reader: memory, transactionRunner: memory });
const codeOf = async (promise: Promise<unknown>, code: string) => { await assert.rejects(() => promise, (e: unknown) => e instanceof BackendError && e.code === code); };

test("CreateEnrollment completed replay reuses the persisted result without business writes", async () => {
  const memory = setup(); const first = await createEnrollment(input, deps(memory)); const before = memory.logs.length; const replay = await createEnrollment(input, deps(memory));
  assert.deepEqual(replay, first); assert.equal(memory.logs.length, before + 1); assert.equal(memory.logs[before]!.some((x) => x.includes("/courses/") || x.includes("enrollmentClaims")), false); assert.equal(memory.docs.size, 7);
});

test("CreateEnrollment payload mismatch conflicts before business transaction", async () => {
  const memory = setup(); await createEnrollment(input, deps(memory)); const before = memory.logs.length; await codeOf(createEnrollment({ ...input, courseId: "course-2" }, deps(memory)), "CONFLICT");
  assert.equal(memory.logs.length, before + 1); assert.equal(memory.logs[before]!.some((x) => x.includes("/courses/") || x.includes("enrollmentClaims")), false); assert.equal([...memory.docs.keys()].some((x) => x.includes("course-2")), false);
});

test("CreateEnrollment rejects missing and inactive courses", async () => {
  const missing = setup(); missing.docs.delete(courseDocumentPath("tenant-1", "course-1")); await codeOf(createEnrollment(input, deps(missing)), "NOT_FOUND");
  const inactive = setup(); inactive.docs.set(courseDocumentPath("tenant-1", "course-1"), { ...course(), status: "draft" }); await codeOf(createEnrollment(input, deps(inactive)), "FAILED_PRECONDITION");
});

test("CreateEnrollment rejects non-approved membership and preserves writes", async () => {
  const memory = setup(); memory.docs.set(membershipDocumentPath("tenant-1", "membership-1"), { ...membership(), status: "suspended" }); await codeOf(createEnrollment(input, deps(memory)), "FORBIDDEN"); assert.equal([...memory.docs.keys()].some((x) => x.includes("enrollments/")), false);
});

test("CreateEnrollment tenant isolation fails before business transaction", async () => {
  const memory = setup(); await codeOf(createEnrollment({ ...input, tenantId: "tenant-2" }, deps(memory)), "FAILED_PRECONDITION"); assert.equal(memory.invocations, 0);
});

const holderScenario = async (status: string | null, inconsistent = false) => { const memory = setup(); const claimPath = enrollmentClaimDocumentPath({ ...input, enrollmentId: "holder-1" }); memory.docs.set(claimPath, { tenantId: "tenant-1", membershipId: "membership-1", courseId: "course-1", enrollmentId: "holder-1", status: "pending", createdAt: now, updatedAt: now }); if (!inconsistent) memory.docs.set(enrollmentDocumentPath("tenant-1", "holder-1"), { enrollmentId: "holder-1", tenantId: "tenant-1", membershipId: "membership-1", courseId: "course-1", status, enrolledAt: now, updatedAt: now, completedAt: null, cancelledAt: null }); await codeOf(createEnrollment({ ...input, commandId: `cmd-${status ?? "bad"}` }, deps(memory)), inconsistent ? "FAILED_PRECONDITION" : "CONFLICT"); return memory; };
test("CreateEnrollment rejects pending, active, and inconsistent holders", async () => { const pending = await holderScenario("pending"); assert.equal(pending.docs.get(enrollmentDocumentPath("tenant-1", "holder-1"))?.status, "pending"); const active = await holderScenario("active"); assert.equal(active.docs.get(enrollmentDocumentPath("tenant-1", "holder-1"))?.status, "active"); await holderScenario(null, true); });

test("CreateEnrollment resumes a canonical recovery-required command", async () => { const memory = setup(); const first = await createEnrollment(input, deps(memory)); const commandPath = privilegedCommandDocumentPath(input.commandId); const command = memory.docs.get(commandPath)!; memory.docs.delete(enrollmentDocumentPath("tenant-1", first.enrollmentId)); memory.docs.delete(enrollmentClaimDocumentPath({ ...input, enrollmentId: first.enrollmentId })); memory.docs.set(commandPath, { ...command, status: "recovery_required", stage: "prepared", completedAt: null, result: null, failedAt: now, leaseExpiresAt: null }); const result = await createEnrollment(input, deps(memory)); assert.equal(typeof result.enrollmentId, "string"); assert.deepEqual(memory.docs.get(commandPath)?.result, result); assert.equal(memory.docs.get(commandPath)?.stage, "completed"); });

test("CreateEnrollment revalidates the same Membership inside Phase B", async () => { const missing = setup(); missing.txOverrides.set(membershipDocumentPath("tenant-1", "membership-1"), null); await codeOf(createEnrollment(input, deps(missing)), "NOT_FOUND"); assert.equal(missing.invocations, 2); assert.equal(missing.logs[1]!.some((x) => x.includes("memberships/membership-1")), true); const denied = setup(); denied.txOverrides.set(membershipDocumentPath("tenant-1", "membership-1"), { ...membership(), status: "suspended", suspendedAt: now }); await codeOf(createEnrollment(input, deps(denied)), "FAILED_PRECONDITION"); assert.equal(denied.invocations, 2); });

test("CreateEnrollment existing claim reads holder before any write", async () => { const memory = await holderScenario("pending"); const business = memory.logs[1]!; const gets = business.filter((x) => x.startsWith("get:")); assert.ok(gets.some((x) => x.includes("privilegedCommands"))); assert.ok(gets.some((x) => x.includes("/courses/"))); assert.ok(gets.some((x) => x.includes("/memberships/"))); assert.ok(gets.some((x) => x.includes("enrollmentClaims"))); assert.ok(gets.some((x) => x.includes("/enrollments/holder-1"))); assert.equal(business.filter((x) => /^(create|set|update):/.test(x)).length, 0); });

test("CreateEnrollment rolls back buffered Phase B writes", async () => { const memory = setup(); memory.failAfterWrites = 3; await assert.rejects(() => createEnrollment(input, deps(memory)), /synthetic phase-B failure/); assert.equal(memory.bufferedBeforeFailure, 2); assert.equal([...memory.docs.keys()].some((x) => x.includes("enrollments/")), false); assert.equal([...memory.docs.keys()].some((x) => x.includes("enrollmentClaims")), false); const command = memory.docs.get(privilegedCommandDocumentPath(input.commandId)); assert.equal(command?.stage, "not_started"); });
