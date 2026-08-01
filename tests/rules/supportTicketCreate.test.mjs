import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { arbitraryTimestamp, repeated, withoutKey } from "./helpers/testPayloads.mjs";
import { clearRulesTestData, legacyUserSeed, seedDocuments, stableTimestamp } from "./helpers/seedData.mjs";
import { SUPPORT_CATEGORIES, validSupportTicket } from "./fixtures/supportTickets.mjs";

let environment;
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    legacyUserSeed(TEST_CONTEXTS.LEGACY_ADMIN.uid, { role: "admin" }),
    legacyUserSeed(TEST_CONTEXTS.NON_ADMIN.uid),
    ["supportTickets/ticket-seed-01", { ...validSupportTicket(), createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  ]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-SUP-001", expected: "ALLOW", title: "valid own ticket" },
  { id: "RT-SUP-002", expected: "DENY", title: "anonymous create", actor: TEST_CONTEXTS.ANON },
  { id: "RT-SUP-003", expected: "ALLOW", title: "own userId" },
  { id: "RT-SUP-004", expected: "DENY", title: "foreign userId", patch: { userId: TEST_CONTEXTS.SUPPORT_OTHER.uid } },
  { id: "RT-SUP-005", expected: "ALLOW", title: "category technical", patch: { category: SUPPORT_CATEGORIES[0] } },
  { id: "RT-SUP-006", expected: "ALLOW", title: "category account", patch: { category: SUPPORT_CATEGORIES[1] } },
  { id: "RT-SUP-007", expected: "ALLOW", title: "category course", patch: { category: SUPPORT_CATEGORIES[2] } },
  { id: "RT-SUP-008", expected: "ALLOW", title: "category suggestion", patch: { category: SUPPORT_CATEGORIES[3] } },
  { id: "RT-SUP-009", expected: "ALLOW", title: "category bug", patch: { category: SUPPORT_CATEGORIES[4] } },
  { id: "RT-SUP-010", expected: "ALLOW", title: "category other", patch: { category: SUPPORT_CATEGORIES[5] } },
  { id: "RT-SUP-011", expected: "DENY", title: "unknown category", patch: { category: "unknown" } },
  { id: "RT-SUP-012", expected: "DENY", title: "empty category", patch: { category: "" } },
  { id: "RT-SUP-013", expected: "DENY", title: "category wrong type", patch: { category: [] } },
  { id: "RT-SUP-014", expected: "ALLOW", title: "subject length 4", patch: { subject: repeated(4) } },
  { id: "RT-SUP-015", expected: "ALLOW", title: "subject length 120", patch: { subject: repeated(120) } },
  { id: "RT-SUP-016", expected: "DENY", title: "subject length 3", patch: { subject: repeated(3) } },
  { id: "RT-SUP-017", expected: "DENY", title: "subject length 121", patch: { subject: repeated(121) } },
  { id: "RT-SUP-018", expected: "DENY", title: "subject wrong type", patch: { subject: 1 } },
  { id: "RT-SUP-019", expected: "ALLOW", title: "message length 20", patch: { message: repeated(20) } },
  { id: "RT-SUP-020", expected: "ALLOW", title: "message length 1000", patch: { message: repeated(1000) } },
  { id: "RT-SUP-021", expected: "DENY", title: "message length 19", patch: { message: repeated(19) } },
  { id: "RT-SUP-022", expected: "DENY", title: "message length 1001", patch: { message: repeated(1001) } },
  { id: "RT-SUP-023", expected: "DENY", title: "message wrong type", patch: { message: {} } },
  { id: "RT-SUP-024", expected: "ALLOW", title: "priority normal", patch: { priority: "normal" } },
  { id: "RT-SUP-025", expected: "DENY", title: "priority changed", patch: { priority: "high" } },
  { id: "RT-SUP-026", expected: "ALLOW", title: "status open", patch: { status: "open" } },
  { id: "RT-SUP-027", expected: "DENY", title: "status changed", patch: { status: "closed" } },
  { id: "RT-SUP-028", expected: "ALLOW", title: "source authenticated-support", patch: { source: "authenticated-support" } },
  { id: "RT-SUP-029", expected: "DENY", title: "source changed", patch: { source: "public" } },
  { id: "RT-SUP-030", expected: "ALLOW", title: "userEmail string", patch: { userEmail: "synthetic@example.test" } },
  { id: "RT-SUP-031", expected: "DENY", title: "userEmail wrong type", patch: { userEmail: null } },
  { id: "RT-SUP-032", expected: "ALLOW", title: "userName string", patch: { userName: "Synthetic User" } },
  { id: "RT-SUP-033", expected: "DENY", title: "userName wrong type", patch: { userName: [] } },
  { id: "RT-SUP-034", expected: "DENY", title: "required field absent", omit: "subject" },
  { id: "RT-SUP-035", expected: "DENY", title: "unknown field", patch: { unknown: true } },
  { id: "RT-SUP-036", expected: "DENY", title: "administrative field injected", patch: { assignedTo: "admin" } },
  { id: "RT-SUP-037", expected: "ALLOW", title: "server timestamps" },
  { id: "RT-SUP-038", expected: "DENY", title: "createdAt arbitrary", patch: { createdAt: arbitraryTimestamp() } },
  { id: "RT-SUP-039", expected: "DENY", title: "updatedAt arbitrary", patch: { updatedAt: arbitraryTimestamp() } },
  { id: "RT-SUP-040", expected: "ALLOW", title: "self read", operation: "read" },
  { id: "RT-SUP-041", expected: "ALLOW", title: "admin read", operation: "read", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-SUP-042", expected: "ALLOW", title: "admin update", operation: "update", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-SUP-043", expected: "ALLOW", title: "admin delete", operation: "delete", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-SUP-044", expected: "DENY", title: "non-owner read", operation: "read", actor: TEST_CONTEXTS.SUPPORT_OTHER },
  { id: "RT-SUP-045", expected: "DENY", title: "non-admin update", operation: "update", actor: TEST_CONTEXTS.NON_ADMIN },
  { id: "RT-SUP-046", expected: "DENY", title: "non-admin delete", operation: "delete", actor: TEST_CONTEXTS.NON_ADMIN },
];

assert.equal(cases.length, 46);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const context = testContext(environment, item.actor ?? TEST_CONTEXTS.SUPPORT_USER);
    const database = context.firestore();
    const seeded = doc(database, "supportTickets", "ticket-seed-01");
    let request;
    if (!item.operation) {
      let payload = validSupportTicket(item.patch);
      if (item.omit) payload = withoutKey(payload, item.omit);
      request = setDoc(doc(database, "supportTickets", item.id.toLowerCase()), payload);
    }
    if (item.operation === "read") request = getDoc(seeded);
    if (item.operation === "update") request = updateDoc(seeded, { status: "resolved" });
    if (item.operation === "delete") request = deleteDoc(seeded);
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
