/**
 * @typedef {"university" | "academy" | "school" | "company"} TenantType
 * @typedef {"active" | "suspended" | "archived"} TenantStatus
 * @typedef {"student" | "teacher" | "tenant_admin"} MembershipRole
 * @typedef {"approved" | "suspended" | "removed"} MembershipStatus
 */

import { MEMBERSHIP_STATUSES } from "@mipymetic/saas-contracts/domain";

export {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  TENANT_STATUSES,
  TENANT_TYPES,
} from "@mipymetic/saas-contracts/domain";

/**
 * Declarative lifecycle contract. It is not an authorization or persistence
 * implementation.
 */
export const MEMBERSHIP_STATUS_TRANSITIONS = Object.freeze({
  [MEMBERSHIP_STATUSES.APPROVED]: Object.freeze([
    MEMBERSHIP_STATUSES.SUSPENDED,
    MEMBERSHIP_STATUSES.REMOVED,
  ]),
  [MEMBERSHIP_STATUSES.SUSPENDED]: Object.freeze([
    MEMBERSHIP_STATUSES.APPROVED,
    MEMBERSHIP_STATUSES.REMOVED,
  ]),
  [MEMBERSHIP_STATUSES.REMOVED]: Object.freeze([]),
});
