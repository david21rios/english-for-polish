import { COMMAND_RECORD_FIELDS, COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES } from "@mipymetic/saas-contracts/commands";
import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { AuthorityResolution, CommandEnvelope, CommandRecord, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";

const commandTypes = new Set(Object.values(COMMAND_TYPES));
const envelopeFields = Object.freeze(["commandId", "commandType", "correlationId", "tenantId", "payload"]);

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
  now: string;
}): CommandRecord => {
  const record: CommandRecord = Object.freeze({
    commandId: input.envelope.commandId,
    commandType: input.envelope.commandType,
    payloadHash: input.payloadHash,
    actorUid: input.authority.actorUid,
    actorType: input.authority.actorType,
    authority: input.authority.authority,
    tenantId: input.envelope.tenantId,
    status: COMMAND_STATUSES.PENDING,
    startedAt: input.now,
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

export const sanitizeCommandResult = (result: JsonValue): JsonValue => result;
