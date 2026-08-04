import {
  REPOSITORY_ERROR_CODES, RepositoryError, validateEnrollmentId,
  validateMembershipId, validateTenantId
} from "../shared/index.js";
import { isPlainObject, validateEnrollmentStatus } from "./enrollmentValidation.js";

export const ENROLLMENT_CURSOR_VERSION = 1;
export const ENROLLMENT_CURSOR_POLICY = "enrollment_standard_v1";
export const ENROLLMENT_CURSOR_MAX_LENGTH = 2048;
export const ENROLLMENT_SELF_ORDER = "enrolledAt_desc_documentId_desc";
export const ENROLLMENT_ADMIN_ORDER = "updatedAt_desc_documentId_desc";
export const ENROLLMENT_QUERY_KINDS = Object.freeze({
  SELF: "enrollment_self_membership",
  ADMIN: "enrollment_tenant_admin"
});

const issue = (code, message) => new RepositoryError({
  code, message, operation: "decode_enrollment_cursor", resource: "enrollment_cursor"
});
const invalid = (message) => issue(REPOSITORY_ERROR_CODES.INVALID_ARGUMENT, message);
const incompatible = (message) => issue(REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION, message);
const exact = (value, keys) => isPlainObject(value) && Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const bytesToBinary = (bytes) => {
  let result = "";
  for (let index = 0; index < bytes.length; index += 0x8000) result += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return result;
};
const binaryToBytes = (value) => Uint8Array.from(value, (character) => character.charCodeAt(0));
const encodeText = (value) => globalThis.btoa(bytesToBinary(new TextEncoder().encode(value)))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const decodeText = (value) => {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  return new TextDecoder("utf-8", { fatal: true }).decode(binaryToBytes(globalThis.atob(
    value.replaceAll("-", "+").replaceAll("_", "/") + padding
  )));
};
const canonicalIso = (value) => {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime()) || date.toISOString() !== value) throw invalid("Enrollment cursor timestamp is invalid.");
  return value;
};

export const enrollmentPathContext = (path) => {
  if (typeof path !== "string" || path.startsWith("/") || path.endsWith("/")) throw invalid("Enrollment cursor path is invalid.");
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "tenants" || parts[2] !== "enrollments") {
    throw invalid("Enrollment cursor path is not canonical.");
  }
  return Object.freeze({ tenantId: validateTenantId(parts[1]), enrollmentId: validateEnrollmentId(parts[3]) });
};

export const createEnrollmentBinding = ({ queryKind, tenantId, membershipId, status = null }) => {
  validateTenantId(tenantId);
  if (status !== null) validateEnrollmentStatus(status, { input: true });
  if (queryKind === ENROLLMENT_QUERY_KINDS.SELF) {
    validateMembershipId(membershipId);
    return Object.freeze({ tenantId, membershipId, status, order: ENROLLMENT_SELF_ORDER, policy: ENROLLMENT_CURSOR_POLICY });
  }
  if (queryKind !== ENROLLMENT_QUERY_KINDS.ADMIN || membershipId !== undefined) {
    throw invalid("Enrollment query kind or binding is invalid.");
  }
  return Object.freeze({ tenantId, status, order: ENROLLMENT_ADMIN_ORDER, policy: ENROLLMENT_CURSOR_POLICY });
};

const validatePosition = (queryKind, position, tenantId) => {
  const self = queryKind === ENROLLMENT_QUERY_KINDS.SELF;
  if (!exact(position, self ? ["enrolledAt", "documentPath"] : ["updatedAt", "documentPath"])) {
    throw invalid("Enrollment cursor position schema is invalid.");
  }
  canonicalIso(self ? position.enrolledAt : position.updatedAt);
  const context = enrollmentPathContext(position.documentPath);
  if (context.tenantId !== tenantId) throw incompatible("Enrollment cursor position is outside its Tenant binding.");
  return context;
};

export const encodeEnrollmentCursor = ({ queryKind, binding, position }) => {
  const canonical = createEnrollmentBinding({ queryKind, ...binding });
  if (!exact(binding, Object.keys(canonical)) || Object.keys(canonical).some((key) => canonical[key] !== binding[key])) {
    throw invalid("Enrollment cursor binding schema is invalid.");
  }
  validatePosition(queryKind, position, canonical.tenantId);
  const token = encodeText(JSON.stringify({ version: ENROLLMENT_CURSOR_VERSION, queryKind, binding: { ...canonical }, position: { ...position } }));
  if (token.length > ENROLLMENT_CURSOR_MAX_LENGTH) throw invalid("Enrollment cursor exceeds maximum size.");
  return token;
};

export const decodeEnrollmentCursor = (token, expected) => {
  if (typeof token !== "string" || token.length === 0 || token.length > ENROLLMENT_CURSOR_MAX_LENGTH ||
      !/^[A-Za-z0-9_-]+$/u.test(token)) throw invalid("Enrollment cursor is malformed.");
  let json; let value;
  try { json = decodeText(token); value = JSON.parse(json); } catch { throw invalid("Enrollment cursor cannot be decoded."); }
  if (encodeText(json) !== token || !exact(value, ["version", "queryKind", "binding", "position"])) {
    throw invalid("Enrollment cursor schema is invalid.");
  }
  if (!Number.isInteger(value.version) || !Object.values(ENROLLMENT_QUERY_KINDS).includes(value.queryKind)) {
    throw invalid("Enrollment cursor metadata is invalid.");
  }
  let canonical;
  try { canonical = createEnrollmentBinding({ queryKind: value.queryKind, ...value.binding }); }
  catch { throw invalid("Enrollment cursor binding values are invalid."); }
  if (!exact(value.binding, Object.keys(canonical))) throw invalid("Enrollment cursor binding schema is invalid.");
  validatePosition(value.queryKind, value.position, canonical.tenantId);
  const self = value.queryKind === ENROLLMENT_QUERY_KINDS.SELF;
  const canonicalJson = JSON.stringify({
    version: value.version,
    queryKind: value.queryKind,
    binding: Object.fromEntries(Object.keys(canonical).map((key) => [key, value.binding[key]])),
    position: self
      ? { enrolledAt: value.position.enrolledAt, documentPath: value.position.documentPath }
      : { updatedAt: value.position.updatedAt, documentPath: value.position.documentPath }
  });
  if (json !== canonicalJson) throw invalid("Enrollment cursor JSON is not canonical.");
  if (value.version !== ENROLLMENT_CURSOR_VERSION || value.queryKind !== expected.queryKind ||
      Object.keys(expected.binding).some((key) => value.binding[key] !== expected.binding[key])) {
    throw incompatible("Enrollment cursor is incompatible with this query.");
  }
  return Object.freeze({ ...value.position });
};
