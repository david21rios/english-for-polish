import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateRequestId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import { validateRegistrationRequestStatus } from "./registrationRequestValidation.js";

export const REGISTRATION_REQUEST_CURSOR_VERSION = 1;
export const REGISTRATION_REQUEST_CURSOR_POLICY = "registration_request_standard_v1";
export const REGISTRATION_REQUEST_CURSOR_ORDER = "requestedAt_desc_documentId_desc";
export const REGISTRATION_REQUEST_CURSOR_MAX_LENGTH = 2048;
export const REGISTRATION_REQUEST_QUERY_KINDS = Object.freeze({
  TENANT: "registration_requests_self_tenant",
  COLLECTION_GROUP: "registration_requests_self_collection_group"
});

const invalid = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation: "decode_registration_request_cursor",
  resource: "registration_request_collection"
});
const incompatible = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "decode_registration_request_cursor",
  resource: "registration_request_collection"
});
const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value, keys) => isPlainObject(value) &&
  Object.keys(value).length === keys.length && keys.every((key) =>
    Object.prototype.hasOwnProperty.call(value, key));

const bytesToBinary = (bytes) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return binary;
};
const binaryToBytes = (binary) => Uint8Array.from(binary, (character) =>
  character.charCodeAt(0));
const toBase64Url = (text) => globalThis.btoa(bytesToBinary(new TextEncoder().encode(text)))
  .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const fromBase64Url = (token) => {
  const padding = "=".repeat((4 - token.length % 4) % 4);
  const binary = globalThis.atob(token.replaceAll("-", "+").replaceAll("_", "/") + padding);
  return new TextDecoder("utf-8", { fatal: true }).decode(binaryToBytes(binary));
};

const canonicalPathParts = (path) => {
  if (typeof path !== "string") throw invalid("Cursor documentPath must be a string.");
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "tenants" ||
      parts[2] !== "registrationRequests") {
    throw invalid("Cursor documentPath is not canonical.");
  }
  validateTenantId(parts[1]);
  validateRequestId(parts[3]);
  return parts;
};

const canonicalIso = (value) => {
  if (typeof value !== "string") throw invalid("Cursor requestedAt must be an ISO string.");
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw invalid("Cursor requestedAt must be canonical UTC ISO-8601.");
  }
  return value;
};

export const createRegistrationRequestBinding = ({ queryKind, tenantId, uid, status }) => {
  if (!Object.values(REGISTRATION_REQUEST_QUERY_KINDS).includes(queryKind)) {
    throw invalid("RegistrationRequest query kind is invalid.");
  }
  validateUid(uid);
  if (status !== null) validateRegistrationRequestStatus(status, { input: true });
  if (queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT) validateTenantId(tenantId);
  if (queryKind === REGISTRATION_REQUEST_QUERY_KINDS.COLLECTION_GROUP && tenantId !== null) {
    throw invalid("Collection-group cursor binding requires a null tenantId.");
  }
  return Object.freeze({
    tenantId,
    uid,
    status,
    order: REGISTRATION_REQUEST_CURSOR_ORDER,
    policy: REGISTRATION_REQUEST_CURSOR_POLICY
  });
};

export const encodeRegistrationRequestCursor = ({ queryKind, binding, position }) => {
  const canonicalBinding = createRegistrationRequestBinding({
    queryKind,
    tenantId: binding?.tenantId,
    uid: binding?.uid,
    status: binding?.status
  });
  if (binding?.order !== canonicalBinding.order || binding?.policy !== canonicalBinding.policy ||
      !exactKeys(binding, ["tenantId", "uid", "status", "order", "policy"])) {
    throw invalid("RegistrationRequest cursor binding is invalid.");
  }
  canonicalIso(position?.requestedAt);
  const [, pathTenantId] = canonicalPathParts(position?.documentPath);
  if (queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT &&
      pathTenantId !== canonicalBinding.tenantId) {
    throw invalid("RegistrationRequest cursor position is outside its Tenant binding.");
  }
  const envelope = {
    version: REGISTRATION_REQUEST_CURSOR_VERSION,
    queryKind,
    binding: { ...canonicalBinding },
    position: {
      requestedAt: position.requestedAt,
      documentPath: position.documentPath
    }
  };
  const token = toBase64Url(JSON.stringify(envelope));
  if (token.length > REGISTRATION_REQUEST_CURSOR_MAX_LENGTH) {
    throw invalid("Encoded RegistrationRequest cursor exceeds the maximum size.");
  }
  return token;
};

export const decodeRegistrationRequestCursor = (token, expected) => {
  if (typeof token !== "string" || token.length === 0 ||
      token.length > REGISTRATION_REQUEST_CURSOR_MAX_LENGTH ||
      !/^[A-Za-z0-9_-]+$/u.test(token)) {
    throw invalid("RegistrationRequest cursor is malformed.");
  }
  let envelope;
  try {
    envelope = JSON.parse(fromBase64Url(token));
  } catch {
    throw invalid("RegistrationRequest cursor cannot be decoded.");
  }
  if (!exactKeys(envelope, ["version", "queryKind", "binding", "position"]) ||
      !exactKeys(envelope.binding, ["tenantId", "uid", "status", "order", "policy"]) ||
      !exactKeys(envelope.position, ["requestedAt", "documentPath"])) {
    throw invalid("RegistrationRequest cursor schema is invalid.");
  }
  if (!Number.isInteger(envelope.version)) throw invalid("Cursor version must be an integer.");
  canonicalIso(envelope.position.requestedAt);
  const [, pathTenantId] = canonicalPathParts(envelope.position.documentPath);
  if (typeof envelope.queryKind !== "string" || typeof envelope.binding.uid !== "string" ||
      (envelope.binding.tenantId !== null && typeof envelope.binding.tenantId !== "string") ||
      (envelope.binding.status !== null && typeof envelope.binding.status !== "string") ||
      typeof envelope.binding.order !== "string" || typeof envelope.binding.policy !== "string") {
    throw invalid("RegistrationRequest cursor field types are invalid.");
  }
  try {
    validateUid(envelope.binding.uid);
    if (envelope.binding.tenantId !== null) validateTenantId(envelope.binding.tenantId);
    if (envelope.binding.status !== null) {
      validateRegistrationRequestStatus(envelope.binding.status, { input: true });
    }
  } catch {
    throw invalid("RegistrationRequest cursor binding values are invalid.");
  }
  if (envelope.queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT &&
      pathTenantId !== envelope.binding.tenantId) {
    throw invalid("RegistrationRequest cursor position is outside its Tenant binding.");
  }
  if (envelope.version !== REGISTRATION_REQUEST_CURSOR_VERSION ||
      envelope.queryKind !== expected.queryKind ||
      Object.keys(expected.binding).some((key) => envelope.binding[key] !== expected.binding[key])) {
    throw incompatible("RegistrationRequest cursor is incompatible with this query.");
  }
  return Object.freeze({ ...envelope.position });
};

export const registrationRequestPathContext = (path) => {
  const [, tenantId, , requestId] = canonicalPathParts(path);
  return Object.freeze({ tenantId, requestId });
};
