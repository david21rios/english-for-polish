/**
 * @typedef {"platform_admin"} PlatformRole
 * @typedef {"self" | "tenant" | "platform"} CapabilityScope
 */

export const PLATFORM_ROLES = Object.freeze({
  PLATFORM_ADMIN: "platform_admin",
});

export const CAPABILITY_SCOPES = Object.freeze({
  SELF: "self",
  TENANT: "tenant",
  PLATFORM: "platform",
});
