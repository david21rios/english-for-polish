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

export {
  COURSE_STATUSES,
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_TRANSITIONS,
} from "@mipymetic/saas-contracts/domain";
