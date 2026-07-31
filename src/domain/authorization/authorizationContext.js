/**
 * Conceptual input for a future authorization decision.
 *
 * Institutional properties are null outside tenant context. This contract is
 * not a session, token, provider object or executable authorization result.
 *
 * @typedef {object} AuthorizationContext
 * @property {string} uid Global Identity identifier.
 * @property {string|null} tenantId Active institutional boundary.
 * @property {import("../organization/enums.js").MembershipRole|null} membershipRole
 * @property {import("../organization/enums.js").MembershipStatus|null} membershipStatus
 * @property {import("../organization/enums.js").TenantStatus|null} tenantStatus
 * @property {import("../identity/enums.js").AccessState|null} accessState
 * Derived tenant-scoped access state, or null when no institutional state is
 * representable. It is not an independent source of truth.
 * @property {ReadonlyArray<import("./enums.js").PlatformRole>} platformRoles
 */

export {};
