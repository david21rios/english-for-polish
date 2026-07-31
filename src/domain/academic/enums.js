/**
 * @typedef {"A1" | "A2" | "B1" | "B2" | "C1" | "C2"} CEFRLevel
 * @typedef {"draft" | "active" | "archived"} CourseStatus
 * @typedef {"pending" | "active" | "completed" | "cancelled"} EnrollmentStatus
 */

export const CEFR_LEVELS = Object.freeze({
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
});

export const COURSE_STATUSES = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
});

export const ENROLLMENT_STATUSES = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

/**
 * Declarative lifecycle contract. It does not execute transitions or grant
 * access.
 */
export const ENROLLMENT_STATUS_TRANSITIONS = Object.freeze({
  [ENROLLMENT_STATUSES.PENDING]: Object.freeze([
    ENROLLMENT_STATUSES.ACTIVE,
    ENROLLMENT_STATUSES.CANCELLED,
  ]),
  [ENROLLMENT_STATUSES.ACTIVE]: Object.freeze([
    ENROLLMENT_STATUSES.COMPLETED,
    ENROLLMENT_STATUSES.CANCELLED,
  ]),
  [ENROLLMENT_STATUSES.COMPLETED]: Object.freeze([]),
  [ENROLLMENT_STATUSES.CANCELLED]: Object.freeze([]),
});
