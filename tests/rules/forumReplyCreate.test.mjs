import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { arbitraryTimestamp, repeated } from "./helpers/testPayloads.mjs";
import { canonicalPostSeed, canonicalReplySeed, clearRulesTestData, legacyUserSeed, seedDocuments } from "./helpers/seedData.mjs";
import { validForumReply } from "./fixtures/forum.mjs";

let environment;
const missingUser = { uid: "missing-reply-user-01", email: "missing-reply@example.test" };
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    legacyUserSeed(TEST_CONTEXTS.FORUM_USER.uid),
    legacyUserSeed(TEST_CONTEXTS.FORUM_BLOCKED.uid, { forumBlocked: true }),
    legacyUserSeed(TEST_CONTEXTS.FORUM_OTHER.uid),
    legacyUserSeed(TEST_CONTEXTS.LEGACY_ADMIN.uid, { role: "admin" }),
    canonicalPostSeed(), canonicalReplySeed(),
  ]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-RPL-001", expected: "ALLOW", title: "valid reply" },
  { id: "RT-RPL-002", expected: "ALLOW", title: "text minimum 5", patch: { text: repeated(5) } },
  { id: "RT-RPL-003", expected: "DENY", title: "anonymous create", actor: TEST_CONTEXTS.ANON },
  { id: "RT-RPL-004", expected: "DENY", title: "blocked user create", actor: TEST_CONTEXTS.FORUM_BLOCKED, patch: { userId: TEST_CONTEXTS.FORUM_BLOCKED.uid } },
  { id: "RT-RPL-005", expected: "DENY", title: "missing users document", actor: missingUser, patch: { userId: missingUser.uid } },
  { id: "RT-RPL-006", expected: "ALLOW", title: "own userId" },
  { id: "RT-RPL-007", expected: "DENY", title: "foreign userId", patch: { userId: TEST_CONTEXTS.FORUM_OTHER.uid } },
  { id: "RT-RPL-008", expected: "ALLOW", title: "exact six-field shape" },
  { id: "RT-RPL-009", expected: "DENY", title: "level injected", patch: { level: "A1" } },
  { id: "RT-RPL-010", expected: "DENY", title: "postId injected", patch: { postId: "post-seed-01" } },
  { id: "RT-RPL-011", expected: "DENY", title: "likes injected", patch: { likes: 0 } },
  { id: "RT-RPL-012", expected: "DENY", title: "likedBy injected", patch: { likedBy: [] } },
  { id: "RT-RPL-013", expected: "DENY", title: "repliesCount injected", patch: { repliesCount: 0 } },
  { id: "RT-RPL-014", expected: "DENY", title: "moderation field injected", patch: { moderated: false } },
  { id: "RT-RPL-015", expected: "DENY", title: "unknown field", patch: { unknown: true } },
  { id: "RT-RPL-016", expected: "DENY", title: "text below minimum", patch: { text: repeated(4) } },
  { id: "RT-RPL-017", expected: "DENY", title: "text wrong type", patch: { text: [] } },
  { id: "RT-RPL-018", expected: "ALLOW", title: "createdAt server timestamp" },
  { id: "RT-RPL-019", expected: "ALLOW", title: "updatedAt server timestamp" },
  { id: "RT-RPL-020", expected: "DENY", title: "createdAt arbitrary", patch: { createdAt: arbitraryTimestamp() } },
  { id: "RT-RPL-021", expected: "DENY", title: "updatedAt arbitrary", patch: { updatedAt: arbitraryTimestamp() } },
  { id: "RT-RPL-022", expected: "ALLOW", title: "authenticated read", operation: "read" },
  { id: "RT-RPL-023", expected: "ALLOW", title: "owner update", operation: "update" },
  { id: "RT-RPL-024", expected: "ALLOW", title: "owner delete", operation: "delete" },
  { id: "RT-RPL-025", expected: "ALLOW", title: "admin delete", operation: "delete", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-RPL-026", expected: "ALLOW", title: "separate parent repliesCount update", operation: "parentCounter" },
  { id: "RT-RPL-027", expected: "DENY", title: "foreign arbitrary reply update", operation: "update", actor: TEST_CONTEXTS.FORUM_OTHER },
];

assert.equal(cases.length, 27);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const context = testContext(environment, item.actor ?? TEST_CONTEXTS.FORUM_USER);
    const database = context.firestore();
    const reply = doc(database, "forums", "A1", "posts", "post-seed-01", "replies", "reply-seed-01");
    let request;
    if (!item.operation) request = setDoc(doc(database, "forums", "A1", "posts", "post-seed-01", "replies", item.id.toLowerCase()), validForumReply(item.patch));
    if (item.operation === "read") request = getDoc(reply);
    if (item.operation === "update") request = updateDoc(reply, { text: "Updated synthetic reply", updatedAt: serverTimestamp() });
    if (item.operation === "delete") request = deleteDoc(reply);
    if (item.operation === "parentCounter") request = updateDoc(doc(database, "forums", "A1", "posts", "post-seed-01"), { repliesCount: 1, updatedAt: serverTimestamp() });
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
