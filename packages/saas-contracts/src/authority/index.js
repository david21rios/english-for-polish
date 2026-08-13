/** @typedef {import("./contracts.js").HumanAuthorityResolution} HumanAuthorityResolution */
/** @typedef {import("./contracts.js").SystemOperatorResolution} SystemOperatorResolution */
/** @typedef {import("./contracts.js").AuthorityResolution} AuthorityResolution */

export {
  AUTHORITY_ACTOR_TYPES,
  AUTHORITY_RESOLUTION_FIELDS,
  AUTHORITY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY,
  PLATFORM_AUTHORITY_FIELDS,
  PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY_REGISTRY_FIELDS,
  PLATFORM_AUTHORITY_REQUIRED_FIELDS,
  PLATFORM_AUTHORITY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY_STATUSES,
  PLATFORM_AUTHORITY_REGISTRY_STATES,
  TENANT_ADMIN_AUTHORITY_STATE_FIELDS,
  SYSTEM_OPERATOR_AUTHORITIES,
  validateAuthorityResolution,
  validatePlatformAuthority,
  validatePlatformAuthorityRegistry,
} from "./contracts.js";
