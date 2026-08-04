import { Timestamp, doc, setDoc } from "firebase/firestore";
import { TENANTS, USERS, withSecurityRulesDisabled } from "./runtimeHarness.mjs";

const at = (minute) => Timestamp.fromDate(
  new Date(`2026-08-03T12:${String(minute).padStart(2, "0")}:00.000Z`)
);

const membership = ({
  tenantId,
  membershipId,
  uid = USERS.studentA,
  role = "student",
  status = "approved",
  minute,
  originRequestId = `request-${membershipId}`,
  historicalSuspension = false
}) => ({
  membershipId,
  tenantId,
  uid,
  role,
  status,
  originRequestId,
  createdAt: at(minute),
  approvedAt: at(30),
  approvedBy: USERS.adminA,
  updatedAt: at(45),
  suspendedAt: status === "suspended" || historicalSuspension ? at(40) : null,
  removedAt: status === "removed" ? at(44) : null
});

export const MEMBERSHIP_FIXTURES = Object.freeze([
  membership({ tenantId: TENANTS.a, membershipId: "membership-a09", minute: 19 }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a08", status: "suspended", minute: 18, originRequestId: null }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a07", role: "teacher", status: "removed", minute: 17, historicalSuspension: true }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a06", role: "tenant_admin", minute: 16, historicalSuspension: true }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-tie-z", role: "teacher", minute: 15 }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-tie-a", minute: 15 }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a05", uid: USERS.studentB, minute: 14 }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a04", uid: USERS.teacherA, role: "teacher", minute: 13 }),
  membership({ tenantId: TENANTS.a, membershipId: "membership-a03", uid: USERS.adminA, role: "tenant_admin", minute: 12 }),
  membership({ tenantId: TENANTS.b, membershipId: "membership-b05", minute: 15 }),
  membership({ tenantId: TENANTS.b, membershipId: "membership-b04", role: "teacher", status: "suspended", minute: 13 }),
  membership({ tenantId: TENANTS.b, membershipId: "membership-b03", role: "tenant_admin", status: "removed", minute: 12, historicalSuspension: true }),
  membership({ tenantId: TENANTS.b, membershipId: "membership-b02", uid: USERS.studentB, status: "suspended", minute: 11 }),
  membership({ tenantId: TENANTS.c, membershipId: "membership-c03", role: "teacher", minute: 11 }),
  membership({ tenantId: TENANTS.c, membershipId: "membership-c02", role: "tenant_admin", status: "suspended", minute: 10 }),
  membership({ tenantId: TENANTS.c, membershipId: "membership-c01", status: "removed", minute: 9, historicalSuspension: true }),
  membership({ tenantId: TENANTS.c, membershipId: "membership-c00", uid: USERS.foreign, minute: 8 })
]);

export const INCOMPATIBLE_MEMBERSHIP = Object.freeze({
  ...membership({ tenantId: TENANTS.a, membershipId: "membership-invalid", minute: 7 }),
  role: "platform_admin"
});

export const MEMBERSHIP_KEY_FIXTURES = Object.freeze([
  Object.freeze({ tenantId: TENANTS.a, keyId: "uid-student-a", uid: USERS.studentA, membershipId: "membership-a09", status: "approved" })
]);

export const seedMembershipFixtures = async (environment) => {
  await withSecurityRulesDisabled(environment, async (context) => {
    const database = context.firestore();
    await Promise.all([
      ...MEMBERSHIP_FIXTURES.map((fixture) => setDoc(
        doc(database, `tenants/${fixture.tenantId}/memberships/${fixture.membershipId}`),
        fixture
      )),
      setDoc(
        doc(database, `tenants/${INCOMPATIBLE_MEMBERSHIP.tenantId}/memberships/${INCOMPATIBLE_MEMBERSHIP.membershipId}`),
        INCOMPATIBLE_MEMBERSHIP
      ),
      ...MEMBERSHIP_KEY_FIXTURES.map((fixture) => setDoc(
        doc(database, `tenants/${fixture.tenantId}/membershipKeys/${fixture.keyId}`),
        fixture
      ))
    ]);
  });
};
