/**
 * Request by one global Identity to join one Tenant.
 *
 * An approved request may originate a Membership, but this contract is not a
 * Membership and grants no tenant access by itself.
 *
 * @typedef {object} RegistrationRequest
 * @property {string} requestId Stable, opaque request identifier.
 * @property {string} tenantId Requested tenant identifier.
 * @property {string} uid Requesting global identity identifier.
 * @property {import("../organization/enums.js").MembershipRole} requestedRole
 * @property {string} requestedAt UTC ISO 8601 timestamp.
 * @property {string|null} reviewedAt UTC ISO 8601 timestamp.
 * @property {string|null} reviewedBy UID of the reviewing actor.
 * @property {import("./enums.js").RegistrationRequestStatus} status
 */

export {};
