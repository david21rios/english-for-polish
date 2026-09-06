import assert from "node:assert/strict";
import test from "node:test";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { createEnrollmentWriteStore, enrollmentClaimDocumentPath } from "../persistence/enrollmentWriteStore.js";
import type { TransactionPort, TransactionRunnerPort } from "../persistence/ports.js";
import type { JsonValue } from "../contracts/types.js";

class Memory implements TransactionRunnerPort {
  readonly docs = new Map<string, Record<string, unknown>>();
  async run<T>(operation: (tx: TransactionPort) => Promise<T>): Promise<T> {
    const writes: Array<() => void> = [];
    const tx: TransactionPort = { get: async (path) => ({ exists: this.docs.has(path), data: (this.docs.get(path) ?? null) as Readonly<Record<string, JsonValue>> | null }),
      create: (path, data) => { if (this.docs.has(path)) throw new Error("exists"); writes.push(() => this.docs.set(path, { ...data })); },
      set: () => { throw new Error("unused"); }, update: () => { throw new Error("unused"); } };
    const result = await operation(tx); writes.forEach((write) => write()); return result;
  }
}

const input = (overrides: Partial<{ tenantId: string; membershipId: string; courseId: string; enrollmentId: string }> = {}) => ({
  tenantId: "tenant-1", membershipId: "membership-1", courseId: "course-1", enrollmentId: "enrollment-1", ...overrides,
});

test("free logical claim creates exactly one pending enrollment and claim", async () => {
  const memory = new Memory(); await createEnrollmentWriteStore(memory).createPending(input());
  assert.equal(memory.docs.size, 2); assert.equal(memory.docs.get(enrollmentClaimDocumentPath(input()))?.enrollmentId, "enrollment-1");
});

test("same tuple maps to one claim and duplicate is conflict", async () => {
  const memory = new Memory(); const store = createEnrollmentWriteStore(memory); await store.createPending(input());
  await assert.rejects(() => store.createPending(input({ enrollmentId: "enrollment-2" })), (error: { code: string }) => error.code === BACKEND_ERROR_CODES.CONFLICT);
  assert.equal(memory.docs.size, 2);
});

test("distinct tuple gets an independent claim", async () => {
  assert.notEqual(enrollmentClaimDocumentPath(input()), enrollmentClaimDocumentPath(input({ tenantId: "tenant-2" })));
  assert.notEqual(enrollmentClaimDocumentPath(input()), enrollmentClaimDocumentPath(input({ membershipId: "membership-2" })));
  assert.notEqual(enrollmentClaimDocumentPath(input()), enrollmentClaimDocumentPath(input({ courseId: "course-2" })));
});

test("malformed claim fails closed", async () => {
  const memory = new Memory(); memory.docs.set(enrollmentClaimDocumentPath(input()), { status: "pending" });
  await assert.rejects(() => createEnrollmentWriteStore(memory).createPending(input()), (error: { code: string }) => error.code === BACKEND_ERROR_CODES.FAILED_PRECONDITION);
});

test("missing, terminal, and mismatched holders fail closed", async () => {
  for (const holder of [null, { ...input(), status: "completed" }, { ...input(), membershipId: "membership-2", status: "pending" }]) {
    const memory = new Memory();
    memory.docs.set(enrollmentClaimDocumentPath(input()), { ...input(), status: "pending", createdAt: "t", updatedAt: "t" });
    if (holder) memory.docs.set(`tenants/${holder.tenantId}/enrollments/${holder.enrollmentId}`, holder);
    await assert.rejects(() => createEnrollmentWriteStore(memory).createPending(input()), (error: { code: string }) => error.code === BACKEND_ERROR_CODES.FAILED_PRECONDITION);
  }
});

test("transaction failure commits no registered writes", async () => {
  const memory = new Memory();
  const failing: TransactionRunnerPort = { run: async (operation) => { const tx: TransactionPort = { get: async () => ({ exists: false, data: null }), create: () => undefined, set: () => undefined, update: () => undefined }; await operation(tx); throw new Error("rollback"); } };
  await assert.rejects(() => createEnrollmentWriteStore(failing).createPending(input()));
  assert.equal(memory.docs.size, 0);
});
