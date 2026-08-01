import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { clearRulesTestData, legacyUserSeed, seedDocuments } from "./helpers/seedData.mjs";
import { validWelcomeMessage } from "./fixtures/messages.mjs";
import { validForumPost, validForumReply } from "./fixtures/forum.mjs";
import { validForumReport } from "./fixtures/forumReports.mjs";
import { validSupportTicket } from "./fixtures/supportTickets.mjs";

let environment;
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [legacyUserSeed(TEST_CONTEXTS.FORUM_USER.uid)]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-REG-001", expected: "DENY", title: "messages payload at supportTickets", path: "supportTickets/reg-001", payload: validWelcomeMessage },
  { id: "RT-REG-002", expected: "DENY", title: "support payload at messages", path: "messages/reg-002", payload: validSupportTicket },
  { id: "RT-REG-003", expected: "DENY", title: "post payload at reply path", path: "forums/A1/posts/post-x/replies/reg-003", payload: validForumPost },
  { id: "RT-REG-004", expected: "DENY", title: "reply payload at post path", path: "forums/A1/posts/reg-004", payload: validForumReply },
  { id: "RT-REG-005", expected: "DENY", title: "report payload at post path", path: "forums/A1/posts/reg-005", payload: validForumReport },
  { id: "RT-REG-006", expected: "DENY", title: "combined cross-resource payload", path: "messages/reg-006", payload: () => ({ ...validWelcomeMessage(), ...validSupportTicket() }) },
  { id: "RT-SEC-001", expected: "DENY", title: "parent post match does not authorize reply", path: "forums/A1/posts/post-x/replies/sec-001", payload: validForumPost },
  { id: "RT-SEC-002", expected: "DENY", title: "child reply match does not authorize post", path: "forums/A1/posts/sec-002", payload: validForumReply },
  { id: "RT-SEC-003", expected: "DENY", title: "recursive memberships match does not authorize legacy target", path: "legacy/root/memberships/sec-003", payload: () => ({ uid: TEST_CONTEXTS.FORUM_USER.uid }) },
  { id: "RT-SEC-004", expected: "DENY", title: "registrationRequests collection-group match does not authorize create", path: "tenants/t1/registrationRequests/sec-004", payload: () => ({ uid: TEST_CONTEXTS.FORUM_USER.uid, tenantId: "t1", requestId: "sec-004" }) },
  { id: "RT-SEC-005", expected: "DENY", title: "unknown nested forum path catch-all", path: "forums/A1/unknown/sec-005", payload: () => ({ synthetic: true }) },
  { id: "RT-SEC-006", expected: "DENY", title: "unknown root catch-all and no allow true", path: "unknown/sec-006", payload: () => ({ synthetic: true }) },
];

assert.equal(cases.length, 12);
for (const item of cases) {
  test(`${item.id} [DENY] — ${item.title}`, async () => {
    const database = testContext(environment, TEST_CONTEXTS.FORUM_USER).firestore();
    await assertFails(setDoc(doc(database, ...item.path.split("/")), item.payload()));
  });
}
