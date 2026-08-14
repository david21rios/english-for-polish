import {
  COMMAND_TYPES,
  updateTenantProfileBehavioralPayload,
  validateUpdateTenantProfileInput,
} from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { requireAuthenticatedActor, type VerifiedAuthenticationContext } from "../authorization/authenticatedActor.js";
import { resolveUpdateTenantProfileAuthority } from "../authorization/updateTenantProfileAuthority.js";
import type { JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type { AuthoritativeReaderPort } from "../persistence/ports.js";
import type { UpdateTenantProfileTransactionStore } from "../persistence/updateTenantProfileTransactionStore.js";

export interface UpdateTenantProfileInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly patch: Readonly<Record<string, JsonValue>>;
}

export interface UpdateTenantProfileResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "UpdateTenantProfile";
  readonly resourceType: "tenant";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface UpdateTenantProfileDependencies {
  readonly authContext: VerifiedAuthenticationContext | null;
  readonly reader: AuthoritativeReaderPort;
  readonly store: UpdateTenantProfileTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "UpdateTenantProfile input is invalid.",
  );
};

export const parseUpdateTenantProfileInput = (
  value: unknown,
): UpdateTenantProfileInput => {
  const validation = validateUpdateTenantProfileInput(value);

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as UpdateTenantProfileInput;
};

const stableResult = (
  input: UpdateTenantProfileInput,
  replayed: boolean,
): UpdateTenantProfileResult => Object.freeze({
  commandId: input.commandId,
  correlationId: input.correlationId,
  operation: "UpdateTenantProfile",
  resourceType: "tenant",
  resourceId: input.tenantId,
  status: "succeeded",
  replayed,
});

export const executeUpdateTenantProfile = async (
  value: unknown,
  dependencies: UpdateTenantProfileDependencies,
): Promise<UpdateTenantProfileResult> => {
  const input = parseUpdateTenantProfileInput(value);
  const authenticatedActor = requireAuthenticatedActor(dependencies.authContext);

  const authority = await resolveUpdateTenantProfileAuthority(
    dependencies.reader,
    authenticatedActor,
    input.tenantId,
  );

  const behavioralPayload = updateTenantProfileBehavioralPayload(
    input as unknown as Readonly<Record<string, unknown>>,
  ) as Readonly<Record<string, JsonValue>>;

  const payloadHash = canonicalPayloadHash(
    COMMAND_TYPES.UPDATE_TENANT_PROFILE,
    behavioralPayload,
  );

  const persistedResult = stableResult(input, false);

  const outcome = await dependencies.store.execute({
    commandId: input.commandId,
    correlationId: input.correlationId,
    payloadHash,
    tenantId: input.tenantId,
    patch: input.patch,
    actor: authority,
    result: persistedResult as unknown as Readonly<Record<string, JsonValue>>,
  });

  return stableResult(input, outcome.replayed);
};
