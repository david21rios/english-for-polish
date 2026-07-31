/**
 * @typedef {object} TenantBrandColors
 * @property {string} primary CSS color value.
 * @property {string} secondary CSS color value.
 * @property {string} accent CSS color value.
 */

/**
 * Tenant-owned visual identity references.
 *
 * Asset upload, storage and URL validation are intentionally out of scope.
 * `displayName` is an optional branded presentation of the canonical
 * `Tenant.displayName`.
 *
 * @typedef {object} TenantBranding
 * @property {string} tenantId
 * @property {string|null} displayName
 * @property {string|null} logoUrl
 * @property {string|null} faviconUrl
 * @property {TenantBrandColors} colors
 */

export {};
