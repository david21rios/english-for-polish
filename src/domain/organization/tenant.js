/**
 * Canonical organizational tenant.
 *
 * Timestamps are UTC ISO 8601 strings at the domain boundary. Firebase
 * Timestamp conversion belongs to a future persistence adapter.
 *
 * @typedef {object} Tenant
 * @property {string} tenantId Stable, opaque tenant identifier.
 * @property {import("./enums.js").TenantType} tenantType
 * @property {string} displayName Canonical organizational name.
 * @property {string} shortName Concise organizational name.
 * @property {string} country ISO 3166-1 alpha-2 country code.
 * @property {string} locale BCP 47 administrative locale.
 * @property {string} timezone IANA time-zone identifier.
 * @property {import("./enums.js").TenantStatus} status
 * @property {string} createdAt UTC ISO 8601 timestamp.
 * @property {string} updatedAt UTC ISO 8601 timestamp.
 */

export {};
