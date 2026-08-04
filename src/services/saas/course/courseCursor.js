import {
  REPOSITORY_ERROR_CODES, RepositoryError, validateCourseId, validateTenantId
} from "../shared/index.js";
import { isPlainObject, validateBcp47, validateCourseStatus, validateNonBlankString } from "./courseValidation.js";

export const COURSE_CURSOR_VERSION = 1;
export const COURSE_CURSOR_POLICY = "course_standard_v1";
export const COURSE_CURSOR_MAX_LENGTH = 2048;
export const COURSE_CATALOG_ORDER = "displayName_asc_documentId_asc";
export const COURSE_ADMIN_ORDER = "updatedAt_desc_documentId_desc";
export const COURSE_QUERY_KINDS = Object.freeze({
  ACTIVE: "course_active_catalog",
  TEACHER: "course_teacher_catalog",
  ADMIN: "course_tenant_admin"
});
const issue = (code, message) => new RepositoryError({ code, message, operation: "decode_course_cursor", resource: "course_cursor" });
const invalid = (message) => issue(REPOSITORY_ERROR_CODES.INVALID_ARGUMENT, message);
const incompatible = (message) => issue(REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION, message);
const exact = (value, keys) => isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
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
const pathParts = (path) => {
  if (typeof path !== "string" || path.startsWith("/") || path.endsWith("/")) throw invalid("Course cursor path is invalid.");
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "tenants" || parts[2] !== "courses") throw invalid("Course cursor path is not canonical.");
  validateTenantId(parts[1]); validateCourseId(parts[3]);
  return parts;
};
const canonicalIso = (value) => {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime()) || date.toISOString() !== value) throw invalid("Course cursor timestamp is invalid.");
  return value;
};
const nullableLanguage = (value, name) => value === null ? null : validateBcp47(value, name, { input: true });

export const createCourseBinding = ({ queryKind, tenantId, status = null, learningLanguageCode = null, supportLanguageCode = null }) => {
  validateTenantId(tenantId);
  if (queryKind === COURSE_QUERY_KINDS.ACTIVE || queryKind === COURSE_QUERY_KINDS.TEACHER) {
    if (status !== null) throw invalid("Catalog binding cannot contain status.");
    return Object.freeze({
      tenantId,
      statusContract: queryKind === COURSE_QUERY_KINDS.ACTIVE ? "active" : "draft_active",
      learningLanguageCode: nullableLanguage(learningLanguageCode, "learningLanguageCode"),
      supportLanguageCode: nullableLanguage(supportLanguageCode, "supportLanguageCode"),
      order: COURSE_CATALOG_ORDER,
      policy: COURSE_CURSOR_POLICY
    });
  }
  if (queryKind !== COURSE_QUERY_KINDS.ADMIN) throw invalid("Course query kind is invalid.");
  if (learningLanguageCode !== null || supportLanguageCode !== null) throw invalid("Admin binding cannot contain language filters.");
  if (status !== null) validateCourseStatus(status, { input: true });
  return Object.freeze({ tenantId, status, order: COURSE_ADMIN_ORDER, policy: COURSE_CURSOR_POLICY });
};

const validatePosition = (queryKind, position, tenantId) => {
  const catalog = queryKind !== COURSE_QUERY_KINDS.ADMIN;
  if (!exact(position, catalog ? ["displayName", "documentPath"] : ["updatedAt", "documentPath"])) throw invalid("Course cursor position schema is invalid.");
  if (catalog) validateNonBlankString(position.displayName, "displayName", { input: true });
  else canonicalIso(position.updatedAt);
  const [, pathTenantId] = pathParts(position.documentPath);
  if (pathTenantId !== tenantId) throw invalid("Course cursor position is outside its Tenant binding.");
};

export const encodeCourseCursor = ({ queryKind, binding, position }) => {
  const canonical = createCourseBinding({ queryKind, ...binding });
  if (!exact(binding, Object.keys(canonical)) || Object.keys(canonical).some((key) => canonical[key] !== binding[key])) throw invalid("Course cursor binding schema is invalid.");
  validatePosition(queryKind, position, canonical.tenantId);
  const token = encodeText(JSON.stringify({ version: COURSE_CURSOR_VERSION, queryKind, binding: { ...canonical }, position: { ...position } }));
  if (token.length > COURSE_CURSOR_MAX_LENGTH) throw invalid("Course cursor exceeds maximum size.");
  return token;
};

export const decodeCourseCursor = (token, expected) => {
  if (typeof token !== "string" || token.length === 0 || token.length > COURSE_CURSOR_MAX_LENGTH || !/^[A-Za-z0-9_-]+$/u.test(token)) throw invalid("Course cursor is malformed.");
  let json; let value;
  try { json = decodeText(token); value = JSON.parse(json); } catch { throw invalid("Course cursor cannot be decoded."); }
  if (encodeText(json) !== token || !exact(value, ["version", "queryKind", "binding", "position"])) throw invalid("Course cursor schema is invalid.");
  if (!Number.isInteger(value.version) || !Object.values(COURSE_QUERY_KINDS).includes(value.queryKind)) throw invalid("Course cursor metadata is invalid.");
  let canonical;
  try { canonical = createCourseBinding({ queryKind: value.queryKind, ...value.binding }); } catch { throw invalid("Course cursor binding values are invalid."); }
  if (!exact(value.binding, Object.keys(canonical))) throw invalid("Course cursor binding schema is invalid.");
  validatePosition(value.queryKind, value.position, canonical.tenantId);
  const canonicalPosition = value.queryKind === COURSE_QUERY_KINDS.ADMIN
    ? { updatedAt: value.position.updatedAt, documentPath: value.position.documentPath }
    : { displayName: value.position.displayName, documentPath: value.position.documentPath };
  const canonicalJson = JSON.stringify({
    version: value.version,
    queryKind: value.queryKind,
    binding: Object.fromEntries(Object.keys(canonical).map((key) => [key, value.binding[key]])),
    position: canonicalPosition
  });
  if (json !== canonicalJson) throw invalid("Course cursor JSON is not canonical.");
  if (value.version !== COURSE_CURSOR_VERSION || value.queryKind !== expected.queryKind ||
      Object.keys(expected.binding).some((key) => value.binding[key] !== expected.binding[key])) {
    throw incompatible("Course cursor is incompatible with this query.");
  }
  return Object.freeze({ ...value.position });
};

export const coursePathContext = (path) => {
  const [, tenantId, , courseId] = pathParts(path);
  return Object.freeze({ tenantId, courseId });
};
