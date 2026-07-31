import { ACCESS_STATES } from "./enums.js";

export const ACCESS_STATE_CONTEXT = Object.freeze({
  scope: "tenant",
  key: "uid + tenantId",
  requiresTenantId: true,
  outsideTenantResult: null,
});

/**
 * Declarative precedence for deriving tenant-scoped AccessState.
 *
 * This table documents inputs and results only. It is not an executable
 * evaluator and none of its results is an independent source of truth.
 */
export const ACCESS_STATE_PRECEDENCE = Object.freeze([
  Object.freeze({
    priority: 1,
    key: "email_unverified",
    result: ACCESS_STATES.PENDING_EMAIL_VERIFICATION,
    condition:
      "A tenant context exists and Identity.emailVerified is false for an operation requiring verified email.",
  }),
  Object.freeze({
    priority: 2,
    key: "institutional_suspension",
    result: ACCESS_STATES.SUSPENDED,
    condition:
      "A tenant context exists and TenantStatus or MembershipStatus is suspended.",
  }),
  Object.freeze({
    priority: 3,
    key: "approved_membership",
    result: ACCESS_STATES.ACTIVE,
    condition:
      "Email is verified, TenantStatus is active and MembershipStatus is approved.",
  }),
  Object.freeze({
    priority: 4,
    key: "pending_request",
    result: ACCESS_STATES.PENDING_TENANT_APPROVAL,
    condition:
      "No applicable Membership exists and RegistrationRequestStatus is pending.",
  }),
  Object.freeze({
    priority: 5,
    key: "rejected_request",
    result: ACCESS_STATES.REJECTED,
    condition:
      "No applicable Membership exists and the current RegistrationRequestStatus is rejected.",
  }),
]);

export const NULL_ACCESS_STATE_CASES = Object.freeze([
  "any_identity_without_tenant_context",
  "verified_identity_without_registration_request",
  "cancelled_registration_request",
  "expired_registration_request",
  "removed_membership",
  "archived_tenant",
]);
