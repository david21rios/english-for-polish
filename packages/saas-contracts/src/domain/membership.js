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
