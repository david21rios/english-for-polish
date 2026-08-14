import {
  COMMAND_TYPES,
  updateTenantSettingsBehavioralPayload,
  validateUpdateTenantSettingsInput,
} from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  requireAuthenticatedActor,
  type VerifiedAuthenticationContext,
} from "../authorization/authenticatedActor.js";
import { resolveUpdateTenantSettingsAuthority } from "../authorization/updateTenantSettingsAuthority.js";
import type { JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type { AuthoritativeReaderPort } from "../persistence/ports.js";

export interface UpdateTenantSettingsInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly settings: Readonly<Record<string, JsonValue>>;
}

export interface UpdateTenantSettingsResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "UpdateTenantSettings";
  readonly resourceType: "tenant";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface UpdateTenantSettingsTransactionInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly payloadHash: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly settings: Readonly<Record<string, JsonValue>>;
  readonly actor: Readonly<{
    actorUid: string;
    actorType: "identity" | "platform_admin" | "system";
    authority: string;
    tenantId: string | null;
    roles: readonly string[];
    capabilities: readonly string[];
  }>;
  readonly result: Readonly<Record<string, JsonValue>>;
}

export interface UpdateTenantSettingsTransactionStore {
  execute(
    input: UpdateTenantSettingsTransactionInput,
  ): Promise<Readonly<{ replayed: boolean }>>;
}

export interface UpdateTenantSettingsDependencies {
  readonly authContext: VerifiedAuthenticationContext | null;
  readonly reader: AuthoritativeReaderPort;
  readonly store: UpdateTenantSettingsTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "UpdateTenantSettings input is invalid.",
  );
};

export const parseUpdateTenantSettingsInput = (
  value: unknown,
): UpdateTenantSettingsInput => {
  const validation =
    validateUpdateTenantSettingsInput(value);

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as UpdateTenantSettingsInput;
};

const stableResult = (
  input: UpdateTenantSettingsInput,
  replayed: boolean,
): UpdateTenantSettingsResult => Object.freeze({
  commandId: input.commandId,
  correlationId: input.correlationId,
  operation: "UpdateTenantSettings",
  resourceType: "tenant",
  resourceId: input.tenantId,
  status: "succeeded",
  replayed,
});

export const executeUpdateTenantSettings = async (
  value: unknown,
  dependencies: UpdateTenantSettingsDependencies,
): Promise<UpdateTenantSettingsResult> => {
  const input =
    parseUpdateTenantSettingsInput(value);

  const authenticatedActor =
    requireAuthenticatedActor(
      dependencies.authContext,
    );

  const authority =
    await resolveUpdateTenantSettingsAuthority(
      dependencies.reader,
      authenticatedActor,
      input.tenantId,
    );

  const behavioralPayload =
    updateTenantSettingsBehavioralPayload(
      input as unknown as Readonly<Record<string, unknown>>,
    ) as Readonly<Record<string, JsonValue>>;

  const payloadHash = canonicalPayloadHash(
    COMMAND_TYPES.UPDATE_TENANT_SETTINGS,
    behavioralPayload,
  );

  const persistedResult =
    stableResult(input, false);

  const outcome =
    await dependencies.store.execute({
      commandId: input.commandId,
      correlationId: input.correlationId,
      payloadHash,
      tenantId: input.tenantId,
      expectedVersion: input.expectedVersion,
      settings: input.settings,
      actor: authority,
      result:
        persistedResult as unknown as Readonly<Record<string, JsonValue>>,
    });

  return stableResult(
    input,
    outcome.replayed,
  );
};
