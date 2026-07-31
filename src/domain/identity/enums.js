/**
 * @typedef {"pending_email_verification" | "pending_tenant_approval" | "active" | "suspended" | "rejected"} AccessState
 * @typedef {"pending" | "approved" | "rejected" | "cancelled" | "expired"} RegistrationRequestStatus
 */

export const ACCESS_STATES = Object.freeze({
  PENDING_EMAIL_VERIFICATION: "pending_email_verification",
  PENDING_TENANT_APPROVAL: "pending_tenant_approval",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REJECTED: "rejected",
});

export const REGISTRATION_REQUEST_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
});
