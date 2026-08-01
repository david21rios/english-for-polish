import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { arbitraryTimestamp, repeated, withoutKey } from "./helpers/testPayloads.mjs";
import { canonicalPostSeed, clearRulesTestData, legacyUserSeed, seedDocuments } from "./helpers/seedData.mjs";
import { validForumPost } from "./fixtures/forum.mjs";

let environment;
const missingUser = { uid: "missing-user-01", email: "missing@example.test" };
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    legacyUserSeed(TEST_CONTEXTS.FORUM_USER.uid),
    legacyUserSeed(TEST_CONTEXTS.FORUM_BLOCKED.uid, { forumBlocked: true }),
    legacyUserSeed(TEST_CONTEXTS.FORUM_OTHER.uid),
    legacyUserSeed(TEST_CONTEXTS.LEGACY_ADMIN.uid, { role: "admin" }),
    canonicalPostSeed(),
  ]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-PST-001", expected: "ALLOW", title: "valid forum post" },
  { id: "RT-PST-002", expected: "ALLOW", title: "text minimum 10", patch: { text: repeated(10) } },
  { id: "RT-PST-003", expected: "ALLOW", title: "payload level equals path" },
  { id: "RT-PST-004", expected: "DENY", title: "anonymous create", actor: TEST_CONTEXTS.ANON },
  { id: "RT-PST-005", expected: "DENY", title: "blocked user create", actor: TEST_CONTEXTS.FORUM_BLOCKED, patch: { userId: TEST_CONTEXTS.FORUM_BLOCKED.uid } },
  { id: "RT-PST-006", expected: "DENY", title: "missing users document", actor: missingUser, patch: { userId: missingUser.uid } },
  { id: "RT-PST-007", expected: "ALLOW", title: "own userId" },
  { id: "RT-PST-008", expected: "DENY", title: "foreign userId", patch: { userId: TEST_CONTEXTS.FORUM_OTHER.uid } },
  { id: "RT-PST-009", expected: "DENY", title: "missing userId", omit: "userId" },
  { id: "RT-PST-010", expected: "DENY", title: "invalid userId type", patch: { userId: 1 } },
  { id: "RT-PST-011", expected: "DENY", title: "level mismatches path", patch: { level: "B1" } },
  { id: "RT-PST-012", expected: "DENY", title: "level absent", omit: "level" },
  { id: "RT-PST-013", expected: "DENY", title: "level wrong type", patch: { level: 1 } },
  { id: "RT-PST-014", expected: "ALLOW", title: "likes starts at zero", patch: { likes: 0 } },
  { id: "RT-PST-015", expected: "DENY", title: "likes nonzero", patch: { likes: 1 } },
  { id: "RT-PST-016", expected: "ALLOW", title: "likedBy starts empty", patch: { likedBy: [] } },
  { id: "RT-PST-017", expected: "DENY", title: "likedBy prepopulated", patch: { likedBy: [TEST_CONTEXTS.FORUM_USER.uid] } },
  { id: "RT-PST-018", expected: "DENY", title: "likedBy wrong type", patch: { likedBy: "none" } },
  { id: "RT-PST-019", expected: "ALLOW", title: "repliesCount starts at zero", patch: { repliesCount: 0 } },
  { id: "RT-PST-020", expected: "DENY", title: "repliesCount nonzero", patch: { repliesCount: 1 } },
  { id: "RT-PST-021", expected: "DENY", title: "required field absent", omit: "userName" },
  { id: "RT-PST-022", expected: "DENY", title: "unknown field", patch: { unknown: true } },
  { id: "RT-PST-023", expected: "DENY", title: "moderation field injected", patch: { moderated: false } },
  { id: "RT-PST-024", expected: "DENY", title: "userName wrong type", patch: { userName: [] } },
  { id: "RT-PST-025", expected: "DENY", title: "userEmail wrong type", patch: { userEmail: null } },
  { id: "RT-PST-026", expected: "DENY", title: "text wrong type", patch: { text: {} } },
  { id: "RT-PST-027", expected: "DENY", title: "text below minimum", patch: { text: repeated(9) } },
  { id: "RT-PST-028", expected: "ALLOW", title: "createdAt server timestamp" },
  { id: "RT-PST-029", expected: "ALLOW", title: "updatedAt server timestamp" },
  { id: "RT-PST-030", expected: "DENY", title: "createdAt arbitrary", patch: { createdAt: arbitraryTimestamp() } },
  { id: "RT-PST-031", expected: "DENY", title: "updatedAt arbitrary", patch: { updatedAt: arbitraryTimestamp() } },
  { id: "RT-PST-032", expected: "ALLOW", title: "authenticated read", operation: "read" },
  { id: "RT-PST-033", expected: "ALLOW", title: "owner update", operation: "ownerUpdate" },
  { id: "RT-PST-034", expected: "ALLOW", title: "social fields update", operation: "socialUpdate", actor: TEST_CONTEXTS.FORUM_OTHER },
  { id: "RT-PST-035", expected: "ALLOW", title: "owner delete", operation: "delete" },
  { id: "RT-PST-036", expected: "ALLOW", title: "admin delete", operation: "delete", actor: TEST_CONTEXTS.LEGACY_ADMIN },
];

assert.equal(cases.length, 36);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const context = testContext(environment, item.actor ?? TEST_CONTEXTS.FORUM_USER);
    const database = context.firestore();
    const seeded = doc(database, "forums", "A1", "posts", "post-seed-01");
    let request;
    if (!item.operation) {
      let payload = validForumPost(item.patch);
      if (item.omit) payload = withoutKey(payload, item.omit);
      request = setDoc(doc(database, "forums", "A1", "posts", item.id.toLowerCase()), payload);
    }
    if (item.operation === "read") request = getDoc(seeded);
    if (item.operation === "ownerUpdate") request = updateDoc(seeded, { text: "Updated synthetic forum post", updatedAt: serverTimestamp() });
    if (item.operation === "socialUpdate") request = updateDoc(seeded, { likes: 1, likedBy: [TEST_CONTEXTS.FORUM_OTHER.uid], updatedAt: serverTimestamp() });
    if (item.operation === "delete") request = deleteDoc(seeded);
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
