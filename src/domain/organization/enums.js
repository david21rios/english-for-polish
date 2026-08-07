/**
 * @typedef {"university" | "academy" | "school" | "company"} TenantType
 * @typedef {"active" | "suspended" | "archived"} TenantStatus
 * @typedef {"student" | "teacher" | "tenant_admin"} MembershipRole
 * @typedef {"approved" | "suspended" | "removed"} MembershipStatus
 */

export {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  MEMBERSHIP_STATUS_TRANSITIONS,
  TENANT_STATUSES,
  TENANT_TYPES,
} from "@mipymetic/saas-contracts/domain";
