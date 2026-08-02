import { Timestamp, doc, setDoc } from "firebase/firestore";
import { TENANTS, USERS } from "./runtimeHarness.mjs";

const at = (minute) => Timestamp.fromDate(new Date(`2026-08-02T12:${String(minute).padStart(2, "0")}:00.000Z`));
const base = ({ tenantId, requestId, uid = USERS.studentA, status = "pending", minute }) => ({
  requestId, tenantId, uid, requestedRole: "student", status, requestedAt: at(minute),
  reviewedAt: null, reviewedBy: null, approvedMembershipId: null,
  cancelledAt: null, expiredAt: null
});
const lifecycle = (value) => {
  if (value.status === "approved") return { ...value, reviewedAt: at(40), reviewedBy: USERS.adminA, approvedMembershipId: `membership-${value.requestId}` };
  if (value.status === "rejected") return { ...value, reviewedAt: at(41), reviewedBy: USERS.adminA };
  if (value.status === "cancelled") return { ...value, cancelledAt: at(42) };
  if (value.status === "expired") return { ...value, expiredAt: at(43) };
  return value;
};

export const REQUEST_FIXTURES = Object.freeze([
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a05", status: "pending", minute: 15 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a04", uid: USERS.studentB, status: "pending", minute: 14 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a03", status: "approved", minute: 13 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a02", status: "cancelled", minute: 12 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a01", status: "rejected", minute: 11 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-a00", status: "expired", minute: 10 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-tie-z", status: "pending", minute: 9 })),
  lifecycle(base({ tenantId: TENANTS.a, requestId: "request-tie-a", status: "pending", minute: 9 })),
  lifecycle(base({ tenantId: TENANTS.b, requestId: "request-b03", status: "pending", minute: 9 })),
  lifecycle(base({ tenantId: TENANTS.b, requestId: "request-b02", status: "approved", minute: 7 })),
  lifecycle(base({ tenantId: TENANTS.b, requestId: "request-b01", uid: USERS.studentB, status: "rejected", minute: 6 })),
  lifecycle(base({ tenantId: TENANTS.c, requestId: "request-c01", status: "cancelled", minute: 5 }))
]);

export const seedRegistrationRequests = async (environment) => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await Promise.all(REQUEST_FIXTURES.map((fixture) => setDoc(
      doc(database, `tenants/${fixture.tenantId}/registrationRequests/${fixture.requestId}`),
      fixture
    )));
  });
};
