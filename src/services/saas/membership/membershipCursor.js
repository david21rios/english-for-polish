import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateMembershipId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import { validateMembershipRole, validateMembershipStatus } from "./membershipValidation.js";

export const MEMBERSHIP_CURSOR_VERSION = 1;
export const MEMBERSHIP_CURSOR_POLICY = "membership_standard_v1";
export const MEMBERSHIP_CURSOR_ORDER = "createdAt_desc_documentId_desc";
export const MEMBERSHIP_CURSOR_MAX_LENGTH = 2048;
export const MEMBERSHIP_QUERY_KINDS = Object.freeze({
  TENANT: "membership_self_tenant",
  COLLECTION_GROUP: "membership_self_collection_group"
});
const issue = (code, message) => new RepositoryError({
  code, message, operation: "decode_membership_cursor", resource: "membership_collection"
});
const invalid = (message) => issue(REPOSITORY_ERROR_CODES.INVALID_ARGUMENT, message);
const incompatible = (message) => issue(REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION, message);
const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length &&
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const bytesToBinary = (bytes) => {
  let result = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    result += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return result;
};
const binaryToBytes = (value) => Uint8Array.from(value, (character) => character.charCodeAt(0));
const encode = (value) => globalThis.btoa(bytesToBinary(new TextEncoder().encode(value)))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const decode = (value) => {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const binary = globalThis.atob(value.replaceAll("-", "+").replaceAll("_", "/") + padding);
  return new TextDecoder("utf-8", { fatal: true }).decode(binaryToBytes(binary));
};
const pathParts = (path) => {
  if (typeof path !== "string") throw invalid("Cursor documentPath must be a string.");
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "tenants" || parts[2] !== "memberships") {
    throw invalid("Cursor documentPath is not canonical.");
  }
  validateTenantId(parts[1]);
  validateMembershipId(parts[3]);
  return parts;
};
const canonicalIso = (value) => {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw invalid("Cursor createdAt must be canonical UTC ISO-8601.");
  }
  return value;
};

export const createMembershipBinding = ({ queryKind, tenantId, uid, status, role }) => {
  if (!Object.values(MEMBERSHIP_QUERY_KINDS).includes(queryKind)) throw invalid("Membership query kind is invalid.");
  validateUid(uid);
  if (status !== null) validateMembershipStatus(status, { input: true });
  if (role !== null) validateMembershipRole(role, { input: true });
  if (queryKind === MEMBERSHIP_QUERY_KINDS.TENANT) validateTenantId(tenantId);
  if (queryKind === MEMBERSHIP_QUERY_KINDS.COLLECTION_GROUP && tenantId !== null) {
    throw invalid("Collection-group cursor binding requires null tenantId.");
  }
  return Object.freeze({ tenantId, uid, status, role, order: MEMBERSHIP_CURSOR_ORDER, policy: MEMBERSHIP_CURSOR_POLICY });
};

export const encodeMembershipCursor = ({ queryKind, binding, position }) => {
  const canonical = createMembershipBinding({ queryKind, ...binding });
  if (!exact(binding, ["tenantId", "uid", "status", "role", "order", "policy"]) ||
      binding.order !== canonical.order || binding.policy !== canonical.policy ||
      !exact(position, ["createdAt", "documentPath"])) throw invalid("Membership cursor schema is invalid.");
  canonicalIso(position.createdAt);
  const [, pathTenantId] = pathParts(position.documentPath);
  if (queryKind === MEMBERSHIP_QUERY_KINDS.TENANT && pathTenantId !== canonical.tenantId) {
    throw invalid("Membership cursor position is outside its Tenant binding.");
  }
  const token = encode(JSON.stringify({ version: MEMBERSHIP_CURSOR_VERSION, queryKind, binding: { ...canonical }, position: { ...position } }));
  if (token.length > MEMBERSHIP_CURSOR_MAX_LENGTH) throw invalid("Membership cursor exceeds the maximum size.");
  return token;
};

export const decodeMembershipCursor = (token, expected) => {
  if (typeof token !== "string" || token.length === 0 || token.length > MEMBERSHIP_CURSOR_MAX_LENGTH ||
      !/^[A-Za-z0-9_-]+$/u.test(token)) throw invalid("Membership cursor is malformed.");
  let value;
  try { value = JSON.parse(decode(token)); } catch { throw invalid("Membership cursor cannot be decoded."); }
  if (!exact(value, ["version", "queryKind", "binding", "position"]) ||
      !exact(value.binding, ["tenantId", "uid", "status", "role", "order", "policy"]) ||
      !exact(value.position, ["createdAt", "documentPath"])) throw invalid("Membership cursor schema is invalid.");
  if (!Number.isInteger(value.version)) throw invalid("Membership cursor version must be an integer.");
  canonicalIso(value.position.createdAt);
  const [, pathTenantId] = pathParts(value.position.documentPath);
  try {
    validateUid(value.binding.uid);
    if (value.binding.tenantId !== null) validateTenantId(value.binding.tenantId);
    if (value.binding.status !== null) validateMembershipStatus(value.binding.status, { input: true });
    if (value.binding.role !== null) validateMembershipRole(value.binding.role, { input: true });
  } catch { throw invalid("Membership cursor binding values are invalid."); }
  if (value.queryKind === MEMBERSHIP_QUERY_KINDS.TENANT && pathTenantId !== value.binding.tenantId) {
    throw invalid("Membership cursor position is outside its Tenant binding.");
  }
  if (value.version !== MEMBERSHIP_CURSOR_VERSION || value.queryKind !== expected.queryKind ||
      Object.keys(expected.binding).some((key) => value.binding[key] !== expected.binding[key])) {
    throw incompatible("Membership cursor is incompatible with this query.");
  }
  return Object.freeze({ ...value.position });
};

export const membershipPathContext = (path) => {
  const [, tenantId, , membershipId] = pathParts(path);
  return Object.freeze({ tenantId, membershipId });
};
