/**
 * @typedef {"A1" | "A2" | "B1" | "B2" | "C1" | "C2"} CEFRLevel
 * @typedef {"draft" | "active" | "archived"} CourseStatus
 * @typedef {"pending" | "active" | "completed" | "cancelled"} EnrollmentStatus
 */

export {
  CEFR_LEVELS,
  COURSE_STATUSES,
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_TRANSITIONS,
} from "@mipymetic/saas-contracts/domain";
