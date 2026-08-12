import { COMMAND_RECORD_FIELDS, COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES, isCommandStatusStageAllowed, isPrivilegedCommandStageAllowed } from "@mipymetic/saas-contracts/commands";
import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { AuthorityResolution, CommandEnvelope, CommandRecord, JsonValue } from "../contracts/types.js";
import { serverOwnedTimestamp, type ServerOwnedTimestamp } from "../persistence/ports.js";
import { BackendError } from "../errors/backendError.js";

const commandTypes = new Set<string>(Object.values(COMMAND_TYPES));
const commandStatuses = new Set<string>(Object.values(COMMAND_STATUSES));
const backendErrorCodes = new Set<string>(Object.values(BACKEND_ERROR_CODES));
const envelopeFields = Object.freeze(["commandId", "commandType", "correlationId", "tenantId", "payload"]);
const actorTypes = new Set(["identity", "platform_admin", "system"]);

const isTimestamp = (value: unknown): value is string => typeof value === "string"
  && !Number.isNaN(Date.parse(value))
  && new Date(value).toISOString() === value;

const isNullableTimestamp = (value: unknown): value is string | null => value === null || isTimestamp(value);

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Object.values(value).every(isJsonValue);
};

const validIdentifier = (value: unknown, name: string): value is string => validateDocumentIdentifier(value, name).ok;

export const validatePersistedCommandRecord = (value: unknown): CommandRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The persisted command record is invalid.");
  }
  const record = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(record);
  const exactShape = keys.length === COMMAND_RECORD_FIELDS.length
    && keys.every((key) => COMMAND_RECORD_FIELDS.includes(key));
  const valid = exactShape
    && record.schemaVersion === COMMAND_SCHEMA_VERSION
    && validIdentifier(record.commandId, "commandId")
    && typeof record.commandType === "string" && commandTypes.has(record.commandType)
    && isPrivilegedCommandStageAllowed(record.commandType, record.stage)
    && typeof record.payloadHash === "string" && /^[a-f0-9]{64}$/.test(record.payloadHash)
    && validIdentifier(record.actorUid, "actorUid")
    && typeof record.actorType === "string" && actorTypes.has(record.actorType)
    && typeof record.authority === "string" && record.authority.trim().length > 0
    && (record.tenantId === null || validIdentifier(record.tenantId, "tenantId"))
    && typeof record.status === "string" && commandStatuses.has(record.status)
    && isCommandStatusStageAllowed(record.status, record.stage)
    && isTimestamp(record.startedAt)
    && isNullableTimestamp(record.completedAt)
    && isNullableTimestamp(record.failedAt)
    && isJsonValue(record.result)
    && (record.errorCode === null || (typeof record.errorCode === "string" && backendErrorCodes.has(record.errorCode)))
    && typeof record.attemptCount === "number" && Number.isInteger(record.attemptCount) && record.attemptCount >= 0
    && validIdentifier(record.correlationId, "correlationId")
    && isNullableTimestamp(record.expiresAt)
    && isNullableTimestamp(record.leaseExpiresAt)
    && (record.status === COMMAND_STATUSES.RUNNING || record.leaseExpiresAt === null);
  if (!valid) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The persisted command record is invalid.");
  }
  return record as unknown as CommandRecord;
};

export const validateCommandEnvelope = (envelope: CommandEnvelope): void => {
  if (typeof envelope !== "object" || envelope === null || Array.isArray(envelope)
    || Object.keys(envelope).length !== envelopeFields.length
    || Object.keys(envelope).some((key) => !envelopeFields.includes(key))) {
    throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "The command envelope has an invalid shape.");
  }
  if (typeof envelope.payload !== "object" || envelope.payload === null || Array.isArray(envelope.payload)) {
    throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "The command payload must be a plain object.");
  }
  const identifiers = [
    validateDocumentIdentifier(envelope.commandId, "commandId"),
    validateDocumentIdentifier(envelope.correlationId, "correlationId"),
    ...(envelope.tenantId === null ? [] : [validateDocumentIdentifier(envelope.tenantId, "tenantId")]),
  ];
  if (identifiers.some((validation) => !validation.ok)) {
    throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "The command envelope contains an invalid identifier.");
  }
  if (!commandTypes.has(envelope.commandType as (typeof COMMAND_TYPES)[keyof typeof COMMAND_TYPES])) {
    throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "The command type is unknown.");
  }
};

export const createPendingCommandRecord = (input: {
  envelope: CommandEnvelope;
  payloadHash: string;
  authority: AuthorityResolution;
}): PendingCommandWrite => {
  if (!isPrivilegedCommandStageAllowed(input.envelope.commandType, PRIVILEGED_COMMAND_STAGES.NOT_STARTED)) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Command type has no approved privileged stage contract");
  }
  const record = Object.freeze({
    commandId: input.envelope.commandId,
    commandType: input.envelope.commandType,
    payloadHash: input.payloadHash,
    actorUid: input.authority.actorUid,
    actorType: input.authority.actorType,
    authority: input.authority.authority,
    tenantId: input.envelope.tenantId,
    status: COMMAND_STATUSES.PENDING,
    stage: PRIVILEGED_COMMAND_STAGES.NOT_STARTED,
    startedAt: serverOwnedTimestamp(),
    completedAt: null,
    failedAt: null,
    result: null,
    errorCode: null,
    attemptCount: 0,
    correlationId: input.envelope.correlationId,
    expiresAt: null,
    leaseExpiresAt: null,
    schemaVersion: COMMAND_SCHEMA_VERSION,
  });
  if (Object.keys(record).some((key) => !COMMAND_RECORD_FIELDS.includes(key))) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The command record does not match the shared contract.");
  }
  return record;
};

export type PendingCommandWrite = Readonly<Omit<CommandRecord, "startedAt"> & { readonly startedAt: ServerOwnedTimestamp }>;

export const sanitizeCommandResult = (result: JsonValue): JsonValue => result;
