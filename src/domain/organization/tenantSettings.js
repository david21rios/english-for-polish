/**
 * Institutional settings controlled by a tenant.
 *
 * RegistrationPolicy is a composed value object owned through TenantSettings.
 * Its presence and feature flags do not enable behavior by themselves.
 *
 * @typedef {object} TenantSettings
 * @property {string} tenantId
 * @property {string} defaultLocale BCP 47 interface locale fallback.
 * @property {import("../identity/registrationPolicy.js").RegistrationPolicy} registrationPolicy
 * @property {Readonly<Record<string, boolean>>} featureFlags
 * @property {string|null} supportEmail
 * @property {string|null} supportUrl Absolute HTTPS URL.
 */

export {};
