/**
 * Canonical global platform identity.
 *
 * Authentication-provider data conversion belongs to a future adapter.
 * Identity contains no tenant access, role or academic state.
 *
 * @typedef {object} Identity
 * @property {string} uid Stable, opaque platform identity identifier.
 * @property {string} email Normalized contact email.
 * @property {string} displayName
 * @property {string|null} photoURL
 * @property {boolean} emailVerified
 * @property {string} interfaceLocale Personal BCP 47 interface locale preference.
 * @property {string} createdAt UTC ISO 8601 timestamp.
 * @property {string} updatedAt UTC ISO 8601 timestamp.
 */

export {};
