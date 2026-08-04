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
  tenant(TENANTS.a, "active"), tenant(TENANTS.b, "active"), tenant(TENANTS.suspended, "suspended"),
  tenant(TENANTS.archived, "archived"), tenant(TENANTS.incompatible, "active")
]);

const membership = (tenantId, uid, role, status = "approved") => ({
  membershipId: `membership-${tenantId}-${uid}`, tenantId, uid, role, status,
  originRequestId: null, createdAt: at(4), approvedAt: at(5), approvedBy: USERS.admin,
  updatedAt: at(6), suspendedAt: status === "suspended" ? at(7) : null,
  removedAt: status === "removed" ? at(8) : null
});
export const MEMBERSHIP_FIXTURES = Object.freeze([
  membership(TENANTS.a, USERS.student, "student"),
  membership(TENANTS.a, USERS.suspended, "student", "suspended"),
  membership(TENANTS.a, USERS.removed, "student", "removed"),
  membership(TENANTS.a, USERS.teacher, "teacher"),
  membership(TENANTS.a, USERS.admin, "tenant_admin"),
  membership(TENANTS.a, USERS.adminSuspended, "tenant_admin", "suspended"),
  membership(TENANTS.a, USERS.adminRemoved, "tenant_admin", "removed"),
  membership(TENANTS.b, USERS.tenantBStudent, "student"),
  membership(TENANTS.b, USERS.tenantBAdmin, "tenant_admin"),
  membership(TENANTS.suspended, USERS.suspendedTenantStudent, "student"),
  membership(TENANTS.suspended, USERS.suspendedTenantAdmin, "tenant_admin"),
  membership(TENANTS.archived, USERS.archivedTenantStudent, "student"),
  membership(TENANTS.archived, USERS.archivedTenantAdmin, "tenant_admin"),
  membership(TENANTS.incompatible, USERS.incompatible, "student")
]);
export const membershipFor = (tenantId, uid) => MEMBERSHIP_FIXTURES.find((item) => item.tenantId === tenantId && item.uid === uid);
const uidKey = (uid) => `u1_${btoa(String.fromCharCode(...new TextEncoder().encode(uid))).replace(/=+$/u, "")}`;

const course = (tenantId, courseId, status = "active") => ({
  courseId, tenantId, displayName: `Course ${courseId}`, description: `Course ${courseId}`,
  learningLanguage: { languageCode: "pl", displayName: "Polish" }, supportLanguageCode: "en",
  interfaceLanguages: [{ locale: "en-US", displayName: "English" }], cefrLevel: "A1", status,
  createdAt: at(9), updatedAt: at(10), archivedAt: status === "archived" ? at(11) : null
});
export const COURSE_FIXTURES = Object.freeze([
  course(TENANTS.a, "course-a"), course(TENANTS.a, "course-b"), course(TENANTS.a, "course-archived", "archived"),
  course(TENANTS.b, "course-b-tenant"), course(TENANTS.suspended, "course-suspended"),
  course(TENANTS.archived, "course-archived-tenant"), course(TENANTS.incompatible, "course-incompatible")
]);

const enrollment = ({ tenantId = TENANTS.a, enrollmentId, membershipId, courseId = "course-a", status,
  enrolledMinute, updatedMinute = enrolledMinute }) => ({
  enrollmentId, tenantId, membershipId, courseId, status,
  enrolledAt: at(enrolledMinute), updatedAt: at(updatedMinute),
  completedAt: status === "completed" ? at(updatedMinute + 1) : null,
  cancelledAt: status === "cancelled" ? at(updatedMinute + 1) : null
});
const own = membershipFor(TENANTS.a, USERS.student).membershipId;
const suspended = membershipFor(TENANTS.a, USERS.suspended).membershipId;
const removed = membershipFor(TENANTS.a, USERS.removed).membershipId;
export const ENROLLMENT_FIXTURES = Object.freeze([
  enrollment({ enrollmentId: "enr-pending-z", membershipId: own, status: "pending", enrolledMinute: 40, updatedMinute: 41 }),
  enrollment({ enrollmentId: "enr-pending-a", membershipId: own, status: "pending", enrolledMinute: 40, updatedMinute: 40 }),
  enrollment({ enrollmentId: "enr-active-z", membershipId: own, courseId: "course-b", status: "active", enrolledMinute: 35, updatedMinute: 45 }),
  enrollment({ enrollmentId: "enr-active-a", membershipId: own, status: "active", enrolledMinute: 35, updatedMinute: 44 }),
  enrollment({ enrollmentId: "enr-completed", membershipId: own, status: "completed", enrolledMinute: 30, updatedMinute: 50 }),
  enrollment({ enrollmentId: "enr-cancelled", membershipId: own, courseId: "course-archived", status: "cancelled", enrolledMinute: 25, updatedMinute: 49 }),
  enrollment({ enrollmentId: "enr-suspended-history", membershipId: suspended, status: "completed", enrolledMinute: 24, updatedMinute: 24 }),
  enrollment({ enrollmentId: "enr-removed-history", membershipId: removed, status: "cancelled", enrolledMinute: 23, updatedMinute: 23 }),
  enrollment({ tenantId: TENANTS.b, enrollmentId: "enr-tenant-b", membershipId: membershipFor(TENANTS.b, USERS.tenantBStudent).membershipId, courseId: "course-b-tenant", status: "active", enrolledMinute: 22 }),
  enrollment({ tenantId: TENANTS.suspended, enrollmentId: "enr-suspended-tenant", membershipId: membershipFor(TENANTS.suspended, USERS.suspendedTenantStudent).membershipId, courseId: "course-suspended", status: "active", enrolledMinute: 21 }),
  enrollment({ tenantId: TENANTS.archived, enrollmentId: "enr-archived-tenant", membershipId: membershipFor(TENANTS.archived, USERS.archivedTenantStudent).membershipId, courseId: "course-archived-tenant", status: "completed", enrolledMinute: 20 })
]);
export const INCOMPATIBLE_ENROLLMENT = Object.freeze({
  ...enrollment({ tenantId: TENANTS.incompatible, enrollmentId: "enr-incompatible", membershipId: membershipFor(TENANTS.incompatible, USERS.incompatible).membershipId, courseId: "course-incompatible", status: "active", enrolledMinute: 19 }),
  completedAt: at(20)
});

export const seedEnrollmentFixtures = async (environment) => withSecurityRulesDisabled(environment, async (context) => {
  const db = context.firestore();
  await Promise.all([
    ...TENANT_FIXTURES.map((item) => setDoc(doc(db, `tenants/${item.tenantId}`), item)),
    ...MEMBERSHIP_FIXTURES.flatMap((item) => [
      setDoc(doc(db, `tenants/${item.tenantId}/memberships/${item.membershipId}`), item),
      setDoc(doc(db, `tenants/${item.tenantId}/membershipKeys/${uidKey(item.uid)}`), {
        uid: item.uid, tenantId: item.tenantId, membershipId: item.membershipId, status: item.status
      })
    ]),
    ...COURSE_FIXTURES.map((item) => setDoc(doc(db, `tenants/${item.tenantId}/courses/${item.courseId}`), item)),
    ...ENROLLMENT_FIXTURES.map((item) => setDoc(doc(db, `tenants/${item.tenantId}/enrollments/${item.enrollmentId}`), item)),
    setDoc(doc(db, `tenants/${TENANTS.incompatible}/enrollments/${INCOMPATIBLE_ENROLLMENT.enrollmentId}`), INCOMPATIBLE_ENROLLMENT)
  ]);
});
