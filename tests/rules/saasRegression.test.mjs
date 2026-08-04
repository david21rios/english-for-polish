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

const courseTenantId = "tenant-course-auth-01";
const foreignCourseTenantId = "tenant-course-auth-02";
const courseActorUid = "course-rules-actor-01";
const courseMembershipId = "membership-course-rules-01";
const courseUidKey = `u1_${Buffer.from(courseActorUid, "utf8").toString("base64").replaceAll("=", "")}`;

const courseAuthorizationCases = [
  { id: "RT-SAS-011", expected: "ALLOW", title: "student gets active Course", role: "student", courseStatus: "active" },
  { id: "RT-SAS-012", expected: "DENY", title: "student cannot get draft Course", role: "student", courseStatus: "draft" },
  { id: "RT-SAS-013", expected: "DENY", title: "student cannot get archived Course", role: "student", courseStatus: "archived" },
  { id: "RT-SAS-014", expected: "ALLOW", title: "teacher gets draft Course", role: "teacher", courseStatus: "draft" },
  { id: "RT-SAS-015", expected: "ALLOW", title: "teacher gets active Course", role: "teacher", courseStatus: "active" },
  { id: "RT-SAS-016", expected: "DENY", title: "teacher cannot get archived Course", role: "teacher", courseStatus: "archived" },
  { id: "RT-SAS-017", expected: "ALLOW", title: "tenant admin gets draft Course", role: "tenant_admin", courseStatus: "draft" },
  { id: "RT-SAS-018", expected: "ALLOW", title: "tenant admin gets active Course", role: "tenant_admin", courseStatus: "active" },
  { id: "RT-SAS-019", expected: "ALLOW", title: "tenant admin gets archived Course", role: "tenant_admin", courseStatus: "archived" },
  { id: "RT-SAS-020", expected: "DENY", title: "suspended Membership cannot get Course", role: "student", membershipStatus: "suspended" },
  { id: "RT-SAS-021", expected: "DENY", title: "removed Membership cannot get Course", role: "student", membershipStatus: "removed" },
  { id: "RT-SAS-022", expected: "DENY", title: "suspended Tenant denies Course", role: "student", tenantStatus: "suspended" },
  { id: "RT-SAS-023", expected: "DENY", title: "archived Tenant denies Course", role: "student", tenantStatus: "archived" },
  { id: "RT-SAS-024", expected: "DENY", title: "foreign Tenant Membership denies Course", role: "student", membershipTenantId: foreignCourseTenantId },
  { id: "RT-SAS-025", expected: "DENY", title: "anonymous cannot get Course", anonymous: true, omitMembership: true },
  { id: "RT-SAS-026", expected: "DENY", title: "platform client has no Course bypass", omitMembership: true, platform: true },
  { id: "RT-SAS-027", expected: "DENY", title: "invalid tenant role denies Course", role: "platform_admin" },
  { id: "RT-SAS-028", expected: "DENY", title: "missing membershipKey denies Course", role: "student", omitKey: true },
  { id: "RT-SAS-029", expected: "DENY", title: "broken membershipKey denies Course", role: "student", keyMembershipId: "membership-missing" },
  { id: "RT-SAS-030", expected: "DENY", title: "Membership UID mismatch denies Course", role: "student", membershipUid: "different-course-user" },
  { id: "RT-SAS-031", expected: "DENY", title: "Membership tenant mismatch denies Course", role: "student", membershipDataTenantId: foreignCourseTenantId },
];

assert.equal(courseAuthorizationCases.length, 21);
for (const item of courseAuthorizationCases) {
  test(`${item.id} [${item.expected}] - ${item.title}`, async () => {
    await clearRulesTestData(environment);
    const tenantStatus = item.tenantStatus ?? "active";
    const membershipStatus = item.membershipStatus ?? "approved";
    const membershipTenantId = item.membershipTenantId ?? courseTenantId;
    const entries = [
      [`tenants/${courseTenantId}`, { tenantId: courseTenantId, status: tenantStatus }],
      [`tenants/${foreignCourseTenantId}`, { tenantId: foreignCourseTenantId, status: "active" }],
      [`tenants/${courseTenantId}/courses/course-course-rules-01`, {
        courseId: "course-course-rules-01", tenantId: courseTenantId,
        status: item.courseStatus ?? "active", createdAt: stableTimestamp(), updatedAt: stableTimestamp(),
      }],
    ];
    if (!item.omitMembership) {
      entries.push([`tenants/${membershipTenantId}/memberships/${courseMembershipId}`, {
        membershipId: courseMembershipId,
        tenantId: item.membershipDataTenantId ?? membershipTenantId,
        uid: item.membershipUid ?? courseActorUid,
        role: item.role,
        status: membershipStatus,
        createdAt: stableTimestamp(), updatedAt: stableTimestamp(),
      }]);
      if (!item.omitKey) entries.push([`tenants/${membershipTenantId}/membershipKeys/${courseUidKey}`, {
        uid: courseActorUid, tenantId: membershipTenantId,
        membershipId: item.keyMembershipId ?? courseMembershipId, status: membershipStatus,
      }]);
    }
    await seedDocuments(environment, entries);
    const definition = item.anonymous
      ? TEST_CONTEXTS.ANON
      : { uid: courseActorUid, email: "course-rules-actor-01@example.test" };
    const context = item.platform
      ? environment.authenticatedContext(courseActorUid, { email: definition.email, role: "platform_admin" })
      : testContext(environment, definition);
    const database = context.firestore();
    const request = getDoc(doc(database, "tenants", courseTenantId, "courses", "course-course-rules-01"));
    await (item.expected === "ALLOW" ? assertSucceeds(request) : assertFails(request));
  });
}
