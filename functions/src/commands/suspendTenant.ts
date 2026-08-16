import {
  COMMAND_TYPES,
  SUSPEND_TENANT_OPERATION,
  SUSPEND_TENANT_RESOURCE_TYPE,
  suspendTenantBehavioralPayload,
  validateSuspendTenantInput,
} from "@mipymetic/saas-contracts/commands";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  requireAuthenticatedActor,
  type VerifiedAuthenticationContext,
} from "../authorization/authenticatedActor.js";

import {
  resolveSuspendTenantAuthority,
} from "../authorization/suspendTenantAuthority.js";

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
  SuspendTenantTransactionStore,
} from "../persistence/suspendTenantTransactionStore.js";

export interface SuspendTenantInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
}

export interface SuspendTenantResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "SuspendTenant";
  readonly resourceType: "tenant";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface SuspendTenantDependencies {
  readonly authContext:
    VerifiedAuthenticationContext | null;

  readonly reader:
    AuthoritativeReaderPort;

  readonly store:
    SuspendTenantTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "SuspendTenant input is invalid.",
  );
};

export const parseSuspendTenantInput = (
  value: unknown,
): SuspendTenantInput => {
  const validation =
    validateSuspendTenantInput(
      value,
    );

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as SuspendTenantInput;
};

const stableResult = (
  input: SuspendTenantInput,
  replayed: boolean,
): SuspendTenantResult =>
  Object.freeze({
    commandId:
      input.commandId,

    correlationId:
      input.correlationId,

    operation:
      SUSPEND_TENANT_OPERATION,

    resourceType:
      SUSPEND_TENANT_RESOURCE_TYPE,

    resourceId:
      input.tenantId,

    status:
      "succeeded",

    replayed,
  });

export const executeSuspendTenant = async (
  value: unknown,
  dependencies: SuspendTenantDependencies,
): Promise<SuspendTenantResult> => {
  const input =
    parseSuspendTenantInput(
      value,
    );

  const authenticatedActor =
    requireAuthenticatedActor(
      dependencies.authContext,
    );

  const authority =
    await resolveSuspendTenantAuthority(
      dependencies.reader,
      authenticatedActor,
    );

  const behavioralPayload =
    suspendTenantBehavioralPayload(
      input as unknown as
        Readonly<Record<string, unknown>>,
    ) as Readonly<
      Record<string, JsonValue>
    >;

  const payloadHash =
    canonicalPayloadHash(
      COMMAND_TYPES.SUSPEND_TENANT,
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