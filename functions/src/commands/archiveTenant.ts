import {
  COMMAND_TYPES,
  ARCHIVE_TENANT_OPERATION,
  ARCHIVE_TENANT_RESOURCE_TYPE,
  archiveTenantBehavioralPayload,
  validateArchiveTenantInput,
} from "@mipymetic/saas-contracts/commands";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  requireAuthenticatedActor,
  type VerifiedAuthenticationContext,
} from "../authorization/authenticatedActor.js";

import {
  resolveArchiveTenantAuthority,
} from "../authorization/archiveTenantAuthority.js";

import type {
  JsonValue,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import {
  canonicalPayloadHash,
} from "../idempotency/payloadHash.js";

import type {
  AuthoritativeReaderPort,
} from "../persistence/ports.js";

import type {
  ArchiveTenantTransactionStore,
} from "../persistence/archiveTenantTransactionStore.js";

export interface ArchiveTenantInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
}

export interface ArchiveTenantResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "ArchiveTenant";
  readonly resourceType: "tenant";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface ArchiveTenantDependencies {
  readonly authContext:
    VerifiedAuthenticationContext | null;

  readonly reader:
    AuthoritativeReaderPort;

  readonly store:
    ArchiveTenantTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "ArchiveTenant input is invalid.",
  );
};

export const parseArchiveTenantInput = (
  value: unknown,
): ArchiveTenantInput => {
  const validation =
    validateArchiveTenantInput(
      value,
    );

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as ArchiveTenantInput;
};

const stableResult = (
  input: ArchiveTenantInput,
  replayed: boolean,
): ArchiveTenantResult =>
  Object.freeze({
    commandId:
      input.commandId,

    correlationId:
      input.correlationId,

    operation:
      ARCHIVE_TENANT_OPERATION,

    resourceType:
      ARCHIVE_TENANT_RESOURCE_TYPE,

    resourceId:
      input.tenantId,

    status:
      "succeeded",

    replayed,
  });

export const executeArchiveTenant = async (
  value: unknown,
  dependencies: ArchiveTenantDependencies,
): Promise<ArchiveTenantResult> => {
  const input =
    parseArchiveTenantInput(
      value,
    );

  const authenticatedActor =
    requireAuthenticatedActor(
      dependencies.authContext,
    );

  const authority =
    await resolveArchiveTenantAuthority(
      dependencies.reader,
      authenticatedActor,
    );

  const behavioralPayload =
    archiveTenantBehavioralPayload(
      input as unknown as
        Readonly<Record<string, unknown>>,
    ) as Readonly<
      Record<string, JsonValue>
    >;

  const payloadHash =
    canonicalPayloadHash(
      COMMAND_TYPES.ARCHIVE_TENANT,
      behavioralPayload,
    );

  const persistedResult =
    stableResult(
      input,
      false,
    );

  const outcome =
    await dependencies.store.execute({
      commandId:
        input.commandId,

      correlationId:
        input.correlationId,

      payloadHash,

      tenantId:
        input.tenantId,

      actor:
        authority,

      result:
        persistedResult as unknown as
          Readonly<Record<string, JsonValue>>,
    });

  return stableResult(
    input,
    outcome.replayed,
  );
};
