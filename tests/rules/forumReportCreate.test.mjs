import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { arbitraryTimestamp, repeated, withoutKey } from "./helpers/testPayloads.mjs";
import { clearRulesTestData, legacyUserSeed, seedDocuments, stableTimestamp } from "./helpers/seedData.mjs";
import { FORUM_REPORT_REASONS, validForumReport } from "./fixtures/forumReports.mjs";

let environment;
before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => {
  await clearRulesTestData(environment);
  await seedDocuments(environment, [
    legacyUserSeed(TEST_CONTEXTS.FORUM_USER.uid),
    legacyUserSeed(TEST_CONTEXTS.FORUM_BLOCKED.uid, { forumBlocked: true }),
    legacyUserSeed(TEST_CONTEXTS.FORUM_OTHER.uid),
    legacyUserSeed(TEST_CONTEXTS.LEGACY_ADMIN.uid, { role: "admin" }),
    ["forumReports/report-seed-01", { ...validForumReport(), createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  ]);
});
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-RPT-001", expected: "ALLOW", title: "valid report" },
  { id: "RT-RPT-002", expected: "DENY", title: "anonymous create", actor: TEST_CONTEXTS.ANON },
  { id: "RT-RPT-003", expected: "DENY", title: "blocked reporter", actor: TEST_CONTEXTS.FORUM_BLOCKED, patch: { reportedBy: TEST_CONTEXTS.FORUM_BLOCKED.uid } },
  { id: "RT-RPT-004", expected: "ALLOW", title: "own reportedBy" },
  { id: "RT-RPT-005", expected: "DENY", title: "foreign reportedBy", patch: { reportedBy: TEST_CONTEXTS.FORUM_OTHER.uid } },
  { id: "RT-RPT-006", expected: "ALLOW", title: "reason inappropriate", patch: { reason: FORUM_REPORT_REASONS[0] } },
  { id: "RT-RPT-007", expected: "ALLOW", title: "reason spam", patch: { reason: FORUM_REPORT_REASONS[1] } },
  { id: "RT-RPT-008", expected: "ALLOW", title: "reason harassment", patch: { reason: FORUM_REPORT_REASONS[2] } },
  { id: "RT-RPT-009", expected: "ALLOW", title: "reason wrong level", patch: { reason: FORUM_REPORT_REASONS[3] } },
  { id: "RT-RPT-010", expected: "ALLOW", title: "reason other", patch: { reason: FORUM_REPORT_REASONS[4] } },
  { id: "RT-RPT-011", expected: "DENY", title: "unknown reason", patch: { reason: "Unknown" } },
  { id: "RT-RPT-012", expected: "DENY", title: "empty reason", patch: { reason: "" } },
  { id: "RT-RPT-013", expected: "DENY", title: "reason wrong type", patch: { reason: 1 } },
  { id: "RT-RPT-014", expected: "ALLOW", title: "empty details", patch: { details: "" } },
  { id: "RT-RPT-015", expected: "ALLOW", title: "details length 500", patch: { details: repeated(500) } },
  { id: "RT-RPT-016", expected: "DENY", title: "details length 501", patch: { details: repeated(501) } },
  { id: "RT-RPT-017", expected: "DENY", title: "details wrong type", patch: { details: [] } },
  { id: "RT-RPT-018", expected: "ALLOW", title: "pending status", patch: { status: "pending" } },
  { id: "RT-RPT-019", expected: "DENY", title: "status changed", patch: { status: "resolved" } },
  { id: "RT-RPT-020", expected: "DENY", title: "required field absent", omit: "postId" },
  { id: "RT-RPT-021", expected: "DENY", title: "unknown field", patch: { unknown: true } },
  { id: "RT-RPT-022", expected: "DENY", title: "admin field injected", patch: { reviewedBy: "admin" } },
  { id: "RT-RPT-023", expected: "DENY", title: "postId wrong type", patch: { postId: 1 } },
  { id: "RT-RPT-024", expected: "DENY", title: "level wrong type", patch: { level: [] } },
  { id: "RT-RPT-025", expected: "DENY", title: "postUserId wrong type", patch: { postUserId: null } },
  { id: "RT-RPT-026", expected: "DENY", title: "postText wrong type", patch: { postText: {} } },
  { id: "RT-RPT-027", expected: "DENY", title: "reporterEmail wrong type", patch: { reporterEmail: 7 } },
  { id: "RT-RPT-028", expected: "ALLOW", title: "server timestamps" },
  { id: "RT-RPT-029", expected: "DENY", title: "createdAt arbitrary", patch: { createdAt: arbitraryTimestamp() } },
  { id: "RT-RPT-030", expected: "DENY", title: "updatedAt arbitrary", patch: { updatedAt: arbitraryTimestamp() } },
  { id: "RT-RPT-031", expected: "ALLOW", title: "admin read", operation: "read", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-RPT-032", expected: "ALLOW", title: "admin update", operation: "update", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-RPT-033", expected: "ALLOW", title: "admin delete", operation: "delete", actor: TEST_CONTEXTS.LEGACY_ADMIN },
  { id: "RT-RPT-034", expected: "DENY", title: "non-admin read", operation: "read", actor: TEST_CONTEXTS.FORUM_USER },
  { id: "RT-RPT-035", expected: "DENY", title: "non-admin update", operation: "update", actor: TEST_CONTEXTS.FORUM_USER },
  { id: "RT-RPT-036", expected: "DENY", title: "non-admin delete", operation: "delete", actor: TEST_CONTEXTS.FORUM_USER },
];

assert.equal(cases.length, 36);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const context = testContext(environment, item.actor ?? TEST_CONTEXTS.FORUM_USER);
    const database = context.firestore();
    const seeded = doc(database, "forumReports", "report-seed-01");
    let request;
    if (!item.operation) {
      let payload = validForumReport(item.patch);
      if (item.omit) payload = withoutKey(payload, item.omit);
      request = setDoc(doc(database, "forumReports", item.id.toLowerCase()), payload);
    }
    if (item.operation === "read") request = getDoc(seeded);
    if (item.operation === "update") request = updateDoc(seeded, { status: "reviewed" });
    if (item.operation === "delete") request = deleteDoc(seeded);
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
