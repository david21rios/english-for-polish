/**
 * Enrollment of one tenant Membership in one tenant Course.
 *
 * Within a tenant, `membershipId` references the Membership identified by the
 * organizational contract's membership-local identifier. It is not a user
 * profile, course participant object or progress record.
 *
 * @typedef {object} Enrollment
 * @property {string} enrollmentId Stable, opaque enrollment identifier.
 * @property {string} tenantId
 * @property {string} membershipId Membership identifier within the same tenant.
 * @property {string} courseId Course identifier within the same tenant.
 * @property {import("./enums.js").EnrollmentStatus} status
 * @property {string} enrolledAt UTC ISO 8601 timestamp.
 * @property {string} updatedAt UTC ISO 8601 timestamp.
 */

export {};
