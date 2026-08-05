/**
 * @typedef {"pending_email_verification" | "pending_tenant_approval" | "active" | "suspended" | "rejected"} AccessState
 * @typedef {"pending" | "approved" | "rejected" | "cancelled" | "expired"} RegistrationRequestStatus
 */

export {
  ACCESS_STATES,
  REGISTRATION_REQUEST_STATUSES,
} from "@mipymetic/saas-contracts/domain";
