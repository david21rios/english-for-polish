import {
  COMMAND_TYPES,
  updateTenantBrandingBehavioralPayload,
  validateUpdateTenantBrandingInput,
} from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  requireAuthenticatedActor,
  type VerifiedAuthenticationContext,
} from "../authorization/authenticatedActor.js";
import { resolveUpdateTenantBrandingAuthority } from "../authorization/updateTenantBrandingAuthority.js";
import type { JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type { AuthoritativeReaderPort } from "../persistence/ports.js";

export interface UpdateTenantBrandingInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly branding: Readonly<Record<string, JsonValue>>;
}

export interface UpdateTenantBrandingResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "UpdateTenantBranding";
  readonly resourceType: "tenantBranding";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface UpdateTenantBrandingTransactionInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly payloadHash: string;
  readonly tenantId: string;
  readonly expectedVersion: number;
  readonly branding: Readonly<Record<string, JsonValue>>;
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

export interface UpdateTenantBrandingTransactionStore {
  execute(
    input: UpdateTenantBrandingTransactionInput,
  ): Promise<Readonly<{ replayed: boolean }>>;
}

export interface UpdateTenantBrandingDependencies {
  readonly authContext: VerifiedAuthenticationContext | null;
  readonly reader: AuthoritativeReaderPort;
  readonly store: UpdateTenantBrandingTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "UpdateTenantBranding input is invalid.",
  );
};

export const parseUpdateTenantBrandingInput = (
  value: unknown,
): UpdateTenantBrandingInput => {
  const validation =
    validateUpdateTenantBrandingInput(value);

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as UpdateTenantBrandingInput;
};

const stableResult = (
  input: UpdateTenantBrandingInput,
  replayed: boolean,
): UpdateTenantBrandingResult => Object.freeze({
  commandId: input.commandId,
  correlationId: input.correlationId,
  operation: "UpdateTenantBranding",
  resourceType: "tenantBranding",
  resourceId: input.tenantId,
  status: "succeeded",
  replayed,
});

export const executeUpdateTenantBranding = async (
  value: unknown,
  dependencies: UpdateTenantBrandingDependencies,
): Promise<UpdateTenantBrandingResult> => {
  const input =
    parseUpdateTenantBrandingInput(value);

  const authenticatedActor =
    requireAuthenticatedActor(
      dependencies.authContext,
    );

  const authority =
    await resolveUpdateTenantBrandingAuthority(
      dependencies.reader,
      authenticatedActor,
      input.tenantId,
    );

  const behavioralPayload =
    updateTenantBrandingBehavioralPayload(
      input as unknown as Readonly<Record<string, unknown>>,
    ) as Readonly<Record<string, JsonValue>>;

  const payloadHash = canonicalPayloadHash(
    COMMAND_TYPES.UPDATE_TENANT_BRANDING,
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
      branding: input.branding,
      actor: authority,
      result:
        persistedResult as unknown as Readonly<Record<string, JsonValue>>,
    });

  return stableResult(
    input,
    outcome.replayed,
  );
};
