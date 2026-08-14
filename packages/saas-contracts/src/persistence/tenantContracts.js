import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from "../domain/membership.js";
import { MEMBERSHIP_FIELDS } from "./fields.js";
import { TENANT_STATUSES, TENANT_TYPES } from "../domain/tenant.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isCanonicalBcp47, isPlainObject } from "../validation/objects.js";
import { validatePersistedTimestamp } from "../validation/timestamps.js";

/** @template {readonly string[]} T @param {T} values */
const frozen = (values) => Object.freeze(values);
/** @template T @param {T} value */
const ok = (value) => Object.freeze({ ok: true, value });
/** @param {string} field @param {string} reason */
const invalid = (field, reason) => Object.freeze({ ok: false, issue: Object.freeze({ code: "INVALID_ARGUMENT", field, reason }) });
/** @param {unknown} value */ const id = (value) => validateDocumentIdentifier(value).ok;
/** @param {unknown} value */ const timestamp = (value) => validatePersistedTimestamp(value).ok;
/** @param {unknown} value */ const nullableTimestamp = (value) => value === null || timestamp(value);
/** @param {unknown} value */ const nullableId = (value) => value === null || id(value);
/** @param {unknown} value */ const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();
/** @param {unknown} value */ const httpsUrl = (value) => {
  if (typeof value !== "string" || value !== value.trim()) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

export const TENANT_PERSISTED_FIELDS = frozen(["tenantId", "tenantType", "displayName", "shortName", "country", "locale", "timezone", "status", "createdAt", "updatedAt", "suspendedAt", "archivedAt"]);
export const TENANT_SETTINGS_FIELDS = frozen(["tenantId", "defaultLocale", "registrationPolicy", "featureFlags", "supportEmail", "supportUrl", "version", "updatedAt"]);
export const REGISTRATION_POLICY_FIELDS = frozen(["openRegistration", "invitationOnly", "institutionalEmailOnly", "manualApprovalRequired"]);
export const TENANT_BRANDING_FIELDS = frozen(["tenantId", "displayName", "logoUrl", "faviconUrl", "colors", "updatedAt"]);
export const TENANT_BRAND_COLORS_FIELDS = frozen(["primary", "secondary", "accent"]);
export const MEMBERSHIP_KEY_FIELDS = frozen(["tenantId", "uid", "membershipId", "status", "originRequestId", "updatedAt"]);
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS = frozen(["tenantId", "activeCount", "revision", "lastCommandId", "updatedAt"]);

/** @param {unknown} value */
export const validatePersistedTenant = (value) => {
  if (!hasExactKeys(value, TENANT_PERSISTED_FIELDS)) return invalid("tenant", "invalid_tenant");
  const v = /** @type {Record<string, unknown>} */ (value);
  const status = v.status;
  const lifecycle = status === TENANT_STATUSES.ACTIVE
    ? nullableTimestamp(v.suspendedAt) && v.archivedAt === null
    : status === TENANT_STATUSES.SUSPENDED
      ? timestamp(v.suspendedAt) && v.archivedAt === null
      : status === TENANT_STATUSES.ARCHIVED && nullableTimestamp(v.suspendedAt) && timestamp(v.archivedAt);
  return id(v.tenantId) && Object.values(TENANT_TYPES).includes(/** @type {never} */ (v.tenantType))
    && text(v.displayName) && text(v.shortName) && typeof v.country === "string" && /^[A-Z]{2}$/u.test(v.country)
    && isCanonicalBcp47(v.locale) && text(v.timezone)
    && Object.values(TENANT_STATUSES).includes(/** @type {never} */ (status))
    && timestamp(v.createdAt) && timestamp(v.updatedAt) && lifecycle ? ok(value) : invalid("tenant", "invalid_tenant");
};

/** @param {unknown} value */
export const validateTenantSettings = (value) => {
  if (!hasExactKeys(value, TENANT_SETTINGS_FIELDS)) return invalid("tenantSettings", "invalid_tenant_settings");
  const v = /** @type {Record<string, unknown>} */ (value), policy = /** @type {Record<string, unknown>} */ (v.registrationPolicy), flags = v.featureFlags;
  const validPolicy = hasExactKeys(policy, REGISTRATION_POLICY_FIELDS)
    && REGISTRATION_POLICY_FIELDS.every((field) => typeof policy[field] === "boolean");
  const validFlags = isPlainObject(flags) && Object.values(flags).every((flag) => typeof flag === "boolean");
  return id(v.tenantId) && isCanonicalBcp47(v.defaultLocale) && validPolicy && validFlags
    && (v.supportEmail === null || text(v.supportEmail)) && (v.supportUrl === null || httpsUrl(v.supportUrl))
    && typeof v.version === "number" && Number.isInteger(v.version) && v.version >= 1
    && timestamp(v.updatedAt) ? ok(value) : invalid("tenantSettings", "invalid_tenant_settings");
};

/** @param {unknown} value */
export const validateTenantBranding = (value) => {
  if (!hasExactKeys(value, TENANT_BRANDING_FIELDS)) return invalid("tenantBranding", "invalid_tenant_branding");
  const v = /** @type {Record<string, unknown>} */ (value), colors = /** @type {Record<string, unknown>} */ (v.colors);
  /** @param {unknown} candidate */ const nullableText = (candidate) => candidate === null || text(candidate);
  return id(v.tenantId) && nullableText(v.displayName) && nullableText(v.logoUrl) && nullableText(v.faviconUrl)
    && hasExactKeys(colors, TENANT_BRAND_COLORS_FIELDS) && TENANT_BRAND_COLORS_FIELDS.every((field) => text(colors[field]))
    && timestamp(v.updatedAt) ? ok(value) : invalid("tenantBranding", "invalid_tenant_branding");
};

/** @param {unknown} value */
export const validateMembershipKey = (value) => {
  if (!hasExactKeys(value, MEMBERSHIP_KEY_FIELDS)) return invalid("membershipKey", "invalid_membership_key");
  const v = /** @type {Record<string, unknown>} */ (value);
  return id(v.tenantId) && id(v.uid) && id(v.membershipId) && nullableId(v.originRequestId)
    && (v.status === MEMBERSHIP_STATUSES.APPROVED || v.status === MEMBERSHIP_STATUSES.SUSPENDED)
    && timestamp(v.updatedAt) ? ok(value) : invalid("membershipKey", "invalid_membership_key");
};

/** @param {unknown} value */
export const validatePersistedMembership = (value) => {
  if (!hasExactKeys(value, MEMBERSHIP_FIELDS)) return invalid("membership", "invalid_membership");
  const v = /** @type {Record<string, unknown>} */ (value);
  const validRole = Object.values(MEMBERSHIP_ROLES).includes(/** @type {never} */ (v.role));
  const validStatus = Object.values(MEMBERSHIP_STATUSES).includes(/** @type {never} */ (v.status));
  const validLifecycle = v.status === MEMBERSHIP_STATUSES.APPROVED
    ? nullableTimestamp(v.suspendedAt) && v.removedAt === null
    : v.status === MEMBERSHIP_STATUSES.SUSPENDED
      ? timestamp(v.suspendedAt) && v.removedAt === null
      : v.status === MEMBERSHIP_STATUSES.REMOVED
        && nullableTimestamp(v.suspendedAt) && timestamp(v.removedAt);
  return id(v.membershipId) && id(v.tenantId) && id(v.uid) && validRole && validStatus
    && nullableId(v.originRequestId) && timestamp(v.createdAt) && timestamp(v.approvedAt)
    && id(v.approvedBy) && timestamp(v.updatedAt) && validLifecycle
    ? ok(value) : invalid("membership", "invalid_membership");
};

/** @param {unknown} uid */
export const encodeMembershipUidKey = (uid) => {
  if (!id(uid)) throw new TypeError("uid is not a valid document identifier.");
  const bytes = new TextEncoder().encode(/** @type {string} */ (uid));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `u1_${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")}`;
};

/** @param {unknown} value */
export const validateTenantAdminAuthorityState = (value) => {
  if (!hasExactKeys(value, TENANT_ADMIN_AUTHORITY_STATE_FIELDS)) return invalid("tenantAdminAuthorityState", "invalid_tenant_admin_authority_state");
  const v = /** @type {Record<string, unknown>} */ (value);
  return id(v.tenantId) && Number.isInteger(v.activeCount) && Number(v.activeCount) >= 0
    && Number.isInteger(v.revision) && Number(v.revision) >= 0 && id(v.lastCommandId) && timestamp(v.updatedAt)
    ? ok(value) : invalid("tenantAdminAuthorityState", "invalid_tenant_admin_authority_state");
};

export const FIRST_ADMIN_ROLE = MEMBERSHIP_ROLES.TENANT_ADMIN;
export const FIRST_ADMIN_STATUS = MEMBERSHIP_STATUSES.APPROVED;
