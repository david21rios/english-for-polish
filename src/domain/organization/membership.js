/**
 * Membership of one global identity in one tenant.
 *
 * A Membership is created only after institutional approval, so approval
 * metadata is present from creation and remains as audit information.
 *
 * @typedef {object} Membership
 * @property {string} membershipId Stable, immutable Membership identifier.
 * @property {string} tenantId
 * @property {string} uid Firebase Authentication global identity identifier.
 * @property {import("./enums.js").MembershipRole} role
 * @property {import("./enums.js").MembershipStatus} status
 * @property {string} createdAt UTC ISO 8601 timestamp.
 * @property {string} approvedAt UTC ISO 8601 timestamp.
 * @property {string} approvedBy UID of the approving actor.
 * @property {string} updatedAt UTC ISO 8601 timestamp.
 */

export {};
