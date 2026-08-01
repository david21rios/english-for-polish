import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { createRulesTestEnvironment } from "./helpers/rulesTestEnvironment.mjs";
import { TEST_CONTEXTS, testContext } from "./helpers/testContexts.mjs";
import { clearRulesTestData, seedDocuments, stableTimestamp } from "./helpers/seedData.mjs";

let environment;
const uid = TEST_CONTEXTS.FORUM_USER.uid;
const uidKey = `u1_${Buffer.from(uid, "utf8").toString("base64").replaceAll("=", "")}`;
const tenantId = "tenant-synthetic-01";
const membershipId = "membership-synthetic-01";

const saasSeed = () => [
  [`identities/${uid}`, { uid, displayName: "Synthetic User", photoURL: null, interfaceLocale: "en", email: "forum-user-01@example.test", emailVerified: true, createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  [`identities/${TEST_CONTEXTS.FORUM_OTHER.uid}`, { uid: TEST_CONTEXTS.FORUM_OTHER.uid, displayName: "Other", photoURL: null, interfaceLocale: "en", createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  [`tenants/${tenantId}`, { tenantId, status: "active", name: "Synthetic Tenant" }],
  [`tenants/${tenantId}/membershipKeys/${uidKey}`, { uid, tenantId, membershipId, status: "approved" }],
  [`tenants/${tenantId}/memberships/${membershipId}`, { membershipId, tenantId, uid, role: "student", status: "approved", createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  [`tenants/${tenantId}/registrationRequests/request-synthetic-01`, { requestId: "request-synthetic-01", tenantId, uid, status: "pending", requestedRole: "student", createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  [`tenants/${tenantId}/courses/course-synthetic-01`, { courseId: "course-synthetic-01", tenantId, status: "active", title: "Synthetic Course", createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
  [`tenants/${tenantId}/enrollments/enrollment-synthetic-01`, { enrollmentId: "enrollment-synthetic-01", tenantId, membershipId, courseId: "course-synthetic-01", status: "active", createdAt: stableTimestamp(), updatedAt: stableTimestamp() }],
];

before(async () => { environment = await createRulesTestEnvironment(); });
beforeEach(async () => { await clearRulesTestData(environment); await seedDocuments(environment, saasSeed()); });
after(async () => { await environment?.cleanup(); });

const cases = [
  { id: "RT-SAS-001", expected: "ALLOW", title: "Identity owner get", operation: "identityGet" },
  { id: "RT-SAS-002", expected: "ALLOW", title: "Identity owner permitted update", operation: "identityUpdate" },
  { id: "RT-SAS-003", expected: "DENY", title: "foreign Identity get", operation: "foreignIdentity" },
  { id: "RT-SAS-004", expected: "ALLOW", title: "approved member gets active Tenant", operation: "tenantGet" },
  { id: "RT-SAS-005", expected: "DENY", title: "general Tenant list", operation: "tenantList" },
  { id: "RT-SAS-006", expected: "ALLOW", title: "own canonical Membership get", operation: "membershipGet" },
  { id: "RT-SAS-007", expected: "ALLOW", title: "own canonical RegistrationRequest get", operation: "requestGet" },
  { id: "RT-SAS-008", expected: "ALLOW", title: "student reads active Course", operation: "courseGet" },
  { id: "RT-SAS-009", expected: "ALLOW", title: "owner reads active Enrollment", operation: "enrollmentGet" },
  { id: "RT-SAS-010", expected: "DENY", title: "client reads lookup document", operation: "lookupGet" },
];

assert.equal(cases.length, 10);
for (const item of cases) {
  test(`${item.id} [${item.expected}] — ${item.title}`, async () => {
    const database = testContext(environment, TEST_CONTEXTS.FORUM_USER).firestore();
    let request;
    if (item.operation === "identityGet") request = getDoc(doc(database, "identities", uid));
    if (item.operation === "identityUpdate") request = updateDoc(doc(database, "identities", uid), { displayName: "Updated Synthetic User", updatedAt: serverTimestamp() });
    if (item.operation === "foreignIdentity") request = getDoc(doc(database, "identities", TEST_CONTEXTS.FORUM_OTHER.uid));
    if (item.operation === "tenantGet") request = getDoc(doc(database, "tenants", tenantId));
    if (item.operation === "tenantList") request = getDocs(collection(database, "tenants"));
    if (item.operation === "membershipGet") request = getDoc(doc(database, "tenants", tenantId, "memberships", membershipId));
    if (item.operation === "requestGet") request = getDoc(doc(database, "tenants", tenantId, "registrationRequests", "request-synthetic-01"));
    if (item.operation === "courseGet") request = getDoc(doc(database, "tenants", tenantId, "courses", "course-synthetic-01"));
    if (item.operation === "enrollmentGet") request = getDoc(doc(database, "tenants", tenantId, "enrollments", "enrollment-synthetic-01"));
    if (item.operation === "lookupGet") request = getDoc(doc(database, "tenants", tenantId, "membershipKeys", uidKey));
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
