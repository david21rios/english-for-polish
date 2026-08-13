import {
  AUDIT_BEFORE_AFTER_MAX_BYTES, AUDIT_EVENT_FIELDS, AUDIT_METADATA_MAX_BYTES,
  AUDIT_SCHEMA_VERSION, AUDIT_RESULTS,
} from "@mipymetic/saas-contracts/audit";
import { validateAuthorityResolution } from "@mipymetic/saas-contracts/authority";
import { platformAuditEventDocumentPath, tenantAuditEventDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { canonicalJsonUtf8, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { serverOwnedTimestamp, type TransactionPort } from "../persistence/ports.js";

type AuditResult = (typeof AUDIT_RESULTS)[keyof typeof AUDIT_RESULTS];
type AuditLevel = "basic" | "privileged" | "critical";
export type AuditDestination =
  | Readonly<{ kind: "platform" }>
  | Readonly<{ kind: "tenant"; tenantId: string }>;

export type AuditDestinationValidation =
  | Readonly<{ ok: true; value: AuditDestination }>
  | Readonly<{ ok: false }>;

const exactKeys = (value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean => {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
};

export const validateAuditDestination = (value: unknown): AuditDestinationValidation => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return Object.freeze({ ok: false });
  const candidate = value as Readonly<Record<string, unknown>>;
  if (candidate.kind === "platform" && exactKeys(candidate, ["kind"])) {
    return Object.freeze({ ok: true, value: Object.freeze({ kind: "platform" }) });
  }
  if (candidate.kind === "tenant" && exactKeys(candidate, ["kind", "tenantId"])) {
    const tenantId = validateDocumentIdentifier(candidate.tenantId, "tenantId");
    if (tenantId.ok) return Object.freeze({ ok: true, value: Object.freeze({ kind: "tenant", tenantId: tenantId.value }) });
  }
  return Object.freeze({ ok: false });
};

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
  auditId: string; commandId: string; correlationId: string; authority: AuthorityResolution; destination: AuditDestination;
  level: AuditLevel; operation: string; resourceType: string; resourceId: string;
  result: AuditResult; errorCode: string | null;
  beforeSummary: Readonly<Record<string, JsonValue>>; afterSummary: Readonly<Record<string, JsonValue>>;
  metadata: Readonly<Record<string, JsonValue>>;
}): string => {
  const authorityValidation = validateAuthorityResolution(input.authority);
  if (!authorityValidation.ok) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Authority resolution is invalid.");
  const destinationValidation = validateAuditDestination(input.destination);
  if (!destinationValidation.ok) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Audit destination is invalid.");
  const authority = authorityValidation.value as AuthorityResolution;
  const destination = destinationValidation.value;
  const platformActor = authority.actorType === "platform_admin" && authority.authority === "platform_admin";
  const tenantActor = authority.actorType === "identity";
  const systemActor = authority.actorType === "system";
  const coherent = platformActor
    ? true
    : tenantActor
      ? destination.kind === "tenant" && authority.tenantId === destination.tenantId
      : systemActor && destination.kind === "platform";
  if (!coherent) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Authority and audit destination are incoherent.");
  if (!Object.values(AUDIT_RESULTS).includes(input.result)) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The audit result is unknown.");
  const event = {
    auditId: input.auditId, commandId: input.commandId, correlationId: input.correlationId,
    actorUid: authority.actorUid, actorType: authority.actorType,
    authority: authority.authority, tenantId: destination.kind === "platform" ? null : destination.tenantId,
    level: input.level, operation: input.operation, resourceType: input.resourceType,
    resourceId: input.resourceId, result: input.result, errorCode: input.errorCode,
    requestedAt: serverOwnedTimestamp(), executedAt: serverOwnedTimestamp(),
    beforeSummary: auditMap(input.beforeSummary, AUDIT_BEFORE_AFTER_MAX_BYTES, "beforeSummary"),
    afterSummary: auditMap(input.afterSummary, AUDIT_BEFORE_AFTER_MAX_BYTES, "afterSummary"),
    metadata: auditMap(input.metadata, AUDIT_METADATA_MAX_BYTES, "metadata"),
    schemaVersion: AUDIT_SCHEMA_VERSION,
  };
  if (Object.keys(event).some((key) => !AUDIT_EVENT_FIELDS.includes(key))) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The audit event does not match the shared contract.");
  const path = destination.kind === "platform"
    ? platformAuditEventDocumentPath(input.auditId)
    : tenantAuditEventDocumentPath(destination.tenantId, input.auditId);
  transaction.create(path, event);
  return path;
};
