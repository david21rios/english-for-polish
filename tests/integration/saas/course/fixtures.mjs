import { Timestamp, doc, setDoc } from "firebase/firestore";
import { TENANTS, USERS, withSecurityRulesDisabled } from "./runtimeHarness.mjs";

const at = (minute) => Timestamp.fromDate(new Date(`2026-08-04T12:${String(minute).padStart(2, "0")}:00.000Z`));
const tenant = (tenantId, status) => ({
  tenantId, tenantType: "university", displayName: `Tenant ${tenantId}`, shortName: tenantId,
  country: "PL", locale: "pl-PL", timezone: "Europe/Warsaw", status,
  createdAt: at(0), updatedAt: at(1), suspendedAt: status === "suspended" ? at(2) : null,
  archivedAt: status === "archived" ? at(3) : null
});
export const TENANT_FIXTURES = Object.freeze([
  tenant(TENANTS.a, "active"), tenant(TENANTS.b, "active"),
  tenant(TENANTS.suspended, "suspended"), tenant(TENANTS.archived, "archived"), tenant(TENANTS.incompatible, "active")
]);
const membership = (tenantId, uid, role, status = "approved") => ({
  membershipId: `membership-${tenantId}-${uid}`, tenantId, uid, role, status,
  originRequestId: null, createdAt: at(4), approvedAt: at(5), approvedBy: USERS.admin,
  updatedAt: at(6), suspendedAt: status === "suspended" ? at(7) : null,
  removedAt: status === "removed" ? at(8) : null
});
export const MEMBERSHIP_FIXTURES = Object.freeze([
  membership(TENANTS.a, USERS.student, "student"), membership(TENANTS.a, USERS.teacher, "teacher"),
  membership(TENANTS.a, USERS.admin, "tenant_admin"), membership(TENANTS.a, USERS.suspended, "student", "suspended"),
  membership(TENANTS.a, USERS.removed, "student", "removed"), membership(TENANTS.b, USERS.tenantBStudent, "student"),
  membership(TENANTS.b, USERS.tenantBAdmin, "tenant_admin"),
  membership(TENANTS.a, USERS.teacherSuspended, "teacher", "suspended"),
  membership(TENANTS.a, USERS.teacherRemoved, "teacher", "removed"),
  membership(TENANTS.a, USERS.adminSuspended, "tenant_admin", "suspended"),
  membership(TENANTS.a, USERS.adminRemoved, "tenant_admin", "removed"),
  membership(TENANTS.suspended, USERS.student, "student"), membership(TENANTS.archived, USERS.student, "student"),
  membership(TENANTS.suspended, USERS.suspendedTenantTeacher, "teacher"),
  membership(TENANTS.archived, USERS.archivedTenantAdmin, "tenant_admin"),
  membership(TENANTS.incompatible, USERS.incompatible, "student")
]);
const uidKey = (uid) => `u1_${btoa(String.fromCharCode(...new TextEncoder().encode(uid))).replace(/=+$/u, "")}`;
const course = ({ tenantId = TENANTS.a, courseId, status = "active", displayName, learning = "en",
  support = "pl", cefrLevel = "A1", minute = 10 }) => ({
  courseId, tenantId, displayName, description: `Course ${courseId}`,
  learningLanguage: { languageCode: learning, displayName: learning.toUpperCase() },
  supportLanguageCode: support, interfaceLanguages: [{ locale: "pl-PL", displayName: "Polski" }],
  cefrLevel, status, createdAt: at(minute), updatedAt: at(minute), archivedAt: status === "archived" ? at(minute + 1) : null
});
export const COURSE_FIXTURES = Object.freeze([
  course({ courseId: "course-active-a1", displayName: "Alpha", cefrLevel: "A1", minute: 10 }),
  course({ courseId: "course-active-a2", displayName: "Bravo", learning: "pl", support: "es", cefrLevel: "A2", minute: 11 }),
  course({ courseId: "course-active-b1", displayName: "Charlie", learning: "es", support: "en", cefrLevel: "B1", minute: 12 }),
  course({ courseId: "course-tie-z", displayName: "Delta", cefrLevel: "B2", minute: 13 }),
  course({ courseId: "course-tie-a", displayName: "Delta", cefrLevel: "C1", minute: 13 }),
  course({ courseId: "course-active-c2", displayName: "Echo", learning: "en", support: "es", cefrLevel: "C2", minute: 14 }),
  course({ courseId: "course-draft-a", status: "draft", displayName: "Draft Alpha", learning: "en", minute: 15 }),
  course({ courseId: "course-draft-b", status: "draft", displayName: "Draft Bravo", learning: "pl", support: "es", minute: 16 }),
  course({ courseId: "course-archived-a", status: "archived", displayName: "Archived", minute: 17 }),
  course({ tenantId: TENANTS.b, courseId: "course-b-active", displayName: "Tenant B", minute: 18 }),
  course({ tenantId: TENANTS.suspended, courseId: "course-c-active", displayName: "Suspended Tenant", minute: 19 }),
  course({ tenantId: TENANTS.archived, courseId: "course-d-active", displayName: "Archived Tenant", minute: 20 })
]);
export const INCOMPATIBLE_COURSE = Object.freeze({
  ...course({ tenantId: TENANTS.incompatible, courseId: "course-incompatible", displayName: "Isolated Invalid", learning: "en", minute: 21 }),
  supportLanguageCode: "INVALID_tag"
});
export const seedCourseFixtures = async (environment) => withSecurityRulesDisabled(environment, async (context) => {
  const db = context.firestore();
  await Promise.all([
    ...TENANT_FIXTURES.map((x) => setDoc(doc(db, `tenants/${x.tenantId}`), x)),
    ...MEMBERSHIP_FIXTURES.flatMap((x) => [
      setDoc(doc(db, `tenants/${x.tenantId}/memberships/${x.membershipId}`), x),
      setDoc(doc(db, `tenants/${x.tenantId}/membershipKeys/${uidKey(x.uid)}`), {
        uid: x.uid, tenantId: x.tenantId, membershipId: x.membershipId, status: x.status
      })
    ]),
    ...COURSE_FIXTURES.map((x) => setDoc(doc(db, `tenants/${x.tenantId}/courses/${x.courseId}`), x)),
    setDoc(doc(db, `tenants/${TENANTS.incompatible}/courses/${INCOMPATIBLE_COURSE.courseId}`), INCOMPATIBLE_COURSE)
  ]);
});
