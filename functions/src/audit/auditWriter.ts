import {
  AUDIT_BEFORE_AFTER_MAX_BYTES, AUDIT_EVENT_FIELDS, AUDIT_METADATA_MAX_BYTES,
  AUDIT_SCHEMA_VERSION, AUDIT_RESULTS,
} from "@mipymetic/saas-contracts/audit";
import { platformAuditEventDocumentPath, tenantAuditEventDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { canonicalJsonUtf8 } from "@mipymetic/saas-contracts/validation";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { serverOwnedTimestamp, type TransactionPort } from "../persistence/ports.js";

type AuditResult = (typeof AUDIT_RESULTS)[keyof typeof AUDIT_RESULTS];
type AuditLevel = "basic" | "privileged" | "critical";

const sensitiveKey = /credential|password|secret|stack|token|email|displayName|payload/i;

const auditMap = (value: Readonly<Record<string, JsonValue>>, maximum: number, label: string): Readonly<Record<string, JsonValue>> => {
  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKey.test(key) || (item !== null && typeof item === "object")) {
      throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, `${label} contains a forbidden field.`);
    }
  }
  bounded(value, maximum, label);
  return Object.freeze({ ...value });
};

const bounded = (value: JsonValue, maximum: number, label: string): JsonValue => {
  if (canonicalJsonUtf8(value).byteLength > maximum) throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, `${label} exceeds its byte limit.`);
  return value;
};

export const writeAuditEvent = (transaction: TransactionPort, input: {
  auditId: string; commandId: string; correlationId: string; authority: AuthorityResolution;
  level: AuditLevel; operation: string; resourceType: string; resourceId: string;
  result: AuditResult; errorCode: string | null;
  beforeSummary: Readonly<Record<string, JsonValue>>; afterSummary: Readonly<Record<string, JsonValue>>;
  metadata: Readonly<Record<string, JsonValue>>;
}): string => {
  if (!Object.values(AUDIT_RESULTS).includes(input.result)) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The audit result is unknown.");
  const event = {
    auditId: input.auditId, commandId: input.commandId, correlationId: input.correlationId,
    actorUid: input.authority.actorUid, actorType: input.authority.actorType,
    authority: input.authority.authority, tenantId: input.authority.tenantId,
    level: input.level, operation: input.operation, resourceType: input.resourceType,
    resourceId: input.resourceId, result: input.result, errorCode: input.errorCode,
    requestedAt: serverOwnedTimestamp(), executedAt: serverOwnedTimestamp(),
    beforeSummary: auditMap(input.beforeSummary, AUDIT_BEFORE_AFTER_MAX_BYTES, "beforeSummary"),
    afterSummary: auditMap(input.afterSummary, AUDIT_BEFORE_AFTER_MAX_BYTES, "afterSummary"),
    metadata: auditMap(input.metadata, AUDIT_METADATA_MAX_BYTES, "metadata"),
    schemaVersion: AUDIT_SCHEMA_VERSION,
  };
  if (Object.keys(event).some((key) => !AUDIT_EVENT_FIELDS.includes(key))) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The audit event does not match the shared contract.");
  const path = input.authority.tenantId === null
    ? platformAuditEventDocumentPath(input.auditId)
    : tenantAuditEventDocumentPath(input.authority.tenantId, input.auditId);
  transaction.create(path, event);
  return path;
};
