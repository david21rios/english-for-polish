import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { arbitraryTimestamp, repeated, withoutKey } from "./helpers/testPayloads.mjs";
import { clearRulesTestData, legacyUserSeed, seedDocuments, stableTimestamp } from "./helpers/seedData.mjs";
import { validOrphanMessage, validWelcomeMessage } from "./fixtures/messages.mjs";

let environment;
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    legacyUserSeed(TEST_CONTEXTS.LEGACY_ADMIN.uid, { role: "admin" }),
    legacyUserSeed(TEST_CONTEXTS.NON_ADMIN.uid),
    ["messages/message-seed-01", { ...validWelcomeMessage(), createdAt: stableTimestamp() }],
  ]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-MSG-001", expected: "ALLOW", title: "anonymous valid Welcome payload", payload: validWelcomeMessage },
  { id: "RT-MSG-002", expected: "ALLOW", title: "anonymous valid orphan payload", payload: validOrphanMessage },
  { id: "RT-MSG-003", expected: "ALLOW", title: "name length 2", payload: () => validWelcomeMessage({ name: repeated(2) }) },
  { id: "RT-MSG-004", expected: "ALLOW", title: "name length 100", payload: () => validWelcomeMessage({ name: repeated(100) }) },
  { id: "RT-MSG-005", expected: "DENY", title: "name length 1", payload: () => validWelcomeMessage({ name: repeated(1) }) },
  { id: "RT-MSG-006", expected: "DENY", title: "name length 101", payload: () => validWelcomeMessage({ name: repeated(101) }) },
  { id: "RT-MSG-007", expected: "DENY", title: "name non-string", payload: () => validWelcomeMessage({ name: 7 }) },
  { id: "RT-MSG-008", expected: "ALLOW", title: "email length 5", payload: () => validWelcomeMessage({ email: repeated(5) }) },
  { id: "RT-MSG-009", expected: "ALLOW", title: "email length 254", payload: () => validWelcomeMessage({ email: repeated(254) }) },
  { id: "RT-MSG-010", expected: "DENY", title: "email length 4", payload: () => validWelcomeMessage({ email: repeated(4) }) },
  { id: "RT-MSG-011", expected: "DENY", title: "email length 255", payload: () => validWelcomeMessage({ email: repeated(255) }) },
  { id: "RT-MSG-012", expected: "DENY", title: "email non-string", payload: () => validWelcomeMessage({ email: [] }) },
  { id: "RT-MSG-013", expected: "ALLOW", title: "message length 10", payload: () => validWelcomeMessage({ message: repeated(10) }) },
  { id: "RT-MSG-014", expected: "ALLOW", title: "message length 2000", payload: () => validWelcomeMessage({ message: repeated(2000) }) },
  { id: "RT-MSG-015", expected: "DENY", title: "message length 9", payload: () => validWelcomeMessage({ message: repeated(9) }) },
  { id: "RT-MSG-016", expected: "DENY", title: "message length 2001", payload: () => validWelcomeMessage({ message: repeated(2001) }) },
  { id: "RT-MSG-017", expected: "DENY", title: "message non-string", payload: () => validWelcomeMessage({ message: {} }) },
  { id: "RT-MSG-018", expected: "DENY", title: "source constant changed", payload: () => validWelcomeMessage({ source: "other" }) },
  { id: "RT-MSG-019", expected: "DENY", title: "userId constant changed", payload: () => validWelcomeMessage({ userId: "foreign" }) },
  { id: "RT-MSG-020", expected: "DENY", title: "status constant changed", payload: () => validWelcomeMessage({ status: "closed" }) },
  { id: "RT-MSG-021", expected: "ALLOW", title: "createdAt server timestamp", payload: validWelcomeMessage },
  { id: "RT-MSG-022", expected: "ALLOW", title: "updatedAt server timestamp", payload: validOrphanMessage },
  { id: "RT-MSG-023", expected: "DENY", title: "createdAt arbitrary", payload: () => validWelcomeMessage({ createdAt: arbitraryTimestamp() }) },
  { id: "RT-MSG-024", expected: "DENY", title: "updatedAt arbitrary", payload: () => validOrphanMessage({ updatedAt: arbitraryTimestamp() }) },
  { id: "RT-MSG-025", expected: "DENY", title: "required key absent", payload: () => withoutKey(validWelcomeMessage(), "email") },
  { id: "RT-MSG-026", expected: "ALLOW", title: "updatedAt absent", payload: validWelcomeMessage },
  { id: "RT-MSG-027", expected: "DENY", title: "unknown key", payload: () => validWelcomeMessage({ unknown: true }) },
  { id: "RT-MSG-028", expected: "DENY", title: "administrative key injected", payload: () => validWelcomeMessage({ resolvedBy: "admin" }) },
  { id: "RT-MSG-029", expected: "DENY", title: "anonymous read", operation: "read", actor: TEST_CONTEXTS.ANON },
  { id: "RT-MSG-030", expected: "DENY", title: "non-admin update", operation: "update", actor: TEST_CONTEXTS.NON_ADMIN },
  { id: "RT-MSG-031", expected: "DENY", title: "non-admin delete", operation: "delete", actor: TEST_CONTEXTS.NON_ADMIN },
  { id: "RT-MSG-032", expected: "ALLOW", title: "legacy admin read", operation: "read", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-MSG-033", expected: "ALLOW", title: "legacy admin update", operation: "update", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-MSG-034", expected: "ALLOW", title: "legacy admin delete", operation: "delete", actor: TEST_CONTEXTS.LEGACY_ADMIN },
];

assert.equal(cases.length, 34);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const context = testContext(environment, item.actor ?? TEST_CONTEXTS.ANON);
    const database = context.firestore();
    const seeded = doc(database, "messages", "message-seed-01");
    let request;
    if (!item.operation) request = addDoc(collection(database, "messages"), item.payload());
    if (item.operation === "read") request = getDoc(seeded);
    if (item.operation === "update") request = updateDoc(seeded, { status: "reviewed" });
    if (item.operation === "delete") request = deleteDoc(seeded);
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
