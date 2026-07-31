/**
 * @typedef {"university" | "academy" | "school" | "company"} TenantType
 * @typedef {"active" | "suspended" | "archived"} TenantStatus
 * @typedef {"student" | "teacher" | "tenant_admin"} MembershipRole
 * @typedef {"approved" | "suspended" | "removed"} MembershipStatus
 */

export const TENANT_TYPES = Object.freeze({
  UNIVERSITY: "university",
  ACADEMY: "academy",
  SCHOOL: "school",
  COMPANY: "company",
});

export const TENANT_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
});

export const MEMBERSHIP_ROLES = Object.freeze({
  STUDENT: "student",
  TEACHER: "teacher",
  TENANT_ADMIN: "tenant_admin",
});

export const MEMBERSHIP_STATUSES = Object.freeze({
  APPROVED: "approved",
  SUSPENDED: "suspended",
  REMOVED: "removed",
});

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
