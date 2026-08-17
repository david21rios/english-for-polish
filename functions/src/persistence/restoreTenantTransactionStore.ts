import {
  COMMAND_SCHEMA_VERSION,
  COMMAND_STATUSES,
  COMMAND_TYPES,
  PRIVILEGED_COMMAND_STAGES,
  RESTORE_TENANT_AUDIT_AFTER_FIELDS,
  RESTORE_TENANT_AUDIT_BEFORE_FIELDS,
  RESTORE_TENANT_AUDIT_LEVEL,
  RESTORE_TENANT_AUDIT_METADATA_FIELDS,
  RESTORE_TENANT_AUDIT_OPERATION,
  RESTORE_TENANT_AUDIT_RESULT,
  RESTORE_TENANT_OPERATION,
  RESTORE_TENANT_RESOURCE_TYPE,
  validateRestoreTenantResult,
} from "@mipymetic/saas-contracts/commands";

import {
  CAPABILITY_IDS,
  PLATFORM_ROLES,
  TENANT_STATUSES,
} from "@mipymetic/saas-contracts/domain";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  privilegedCommandDocumentPath,
  tenantDocumentPath,
  validatePersistedTenant,
} from "@mipymetic/saas-contracts/persistence";

import {
  validateAuthorityResolution,
} from "@mipymetic/saas-contracts/authority";

import type {
  AuthorityResolution,
  JsonValue,
} from "../contracts/types.js";

import {
  writeAuditEvent,
} from "../audit/auditWriter.js";

import {
  validatePersistedCommandRecord,
} from "../commands/commandRecord.js";

import {
  BackendError,
} from "../errors/backendError.js";

import {
  serverOwnedTimestamp,
  type TransactionRunnerPort,
} from "./ports.js";

import {
  runAuthoritativeTransaction,
} from "./transactionBoundary.js";

export interface RestoreTenantTransactionInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly payloadHash: string;
  readonly tenantId: string;
  readonly actor: AuthorityResolution;
  readonly result: Readonly<Record<string, JsonValue>>;
}

export interface RestoreTenantTransactionStore {
  execute(
    input: RestoreTenantTransactionInput,
  ): Promise<Readonly<{
    replayed: boolean;
  }>>;
}

const conflict = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.CONFLICT,
    message,
  );
};

const contract = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    message,
  );
};

const failedPrecondition = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.FAILED_PRECONDITION,
    message,
  );
};

const exactAuditMap = (
  value: Readonly<Record<string, JsonValue>>,
  fields: readonly string[],
  label: string,
): Readonly<Record<string, JsonValue>> => {
  const keys =
    Object.keys(value);

  if (
    keys.length !== fields.length
    || keys.some(
      (key) =>
        !fields.includes(key),
    )
  ) {
    return contract(
      `RestoreTenant ${label} violates its shared allowlist.`,
    );
  }

  return Object.freeze({
    ...value,
  });
};

const validateActor = (
  actor: AuthorityResolution,
): void => {
  const validation =
    validateAuthorityResolution(
      actor,
    );

  if (!validation.ok) {
    return contract(
      "RestoreTenant actor authority is malformed.",
    );
  }

  const value =
    validation.value;

  if (
    value.actorType !== "platform_admin"
    || value.authority
      !== PLATFORM_ROLES.PLATFORM_ADMIN
    || value.tenantId !== null
    || value.roles.length !== 1
    || value.roles[0]
      !== PLATFORM_ROLES.PLATFORM_ADMIN
    || !value.capabilities.includes(
      CAPABILITY_IDS.PLATFORM_TENANT_RESTORE,
    )
  ) {
    return contract(
      "RestoreTenant actor authority is incoherent.",
    );
  }
};

const validatePersistedResult = (
  value: unknown,
  expected: Readonly<{
    commandId: string;
    correlationId: string;
    tenantId: string;
  }>,
): void => {
  const validation =
    validateRestoreTenantResult(
      value,
    );

  if (!validation.ok) {
    return contract(
      "RestoreTenant persisted result is malformed.",
    );
  }

  const persisted =
    value as Readonly<
      Record<string, unknown>
    >;

  if (
    persisted.commandId
      !== expected.commandId
    || persisted.correlationId
      !== expected.correlationId
    || persisted.operation
      !== RESTORE_TENANT_OPERATION
    || persisted.resourceType
      !== RESTORE_TENANT_RESOURCE_TYPE
    || persisted.resourceId
      !== expected.tenantId
    || persisted.status
      !== COMMAND_STATUSES.SUCCEEDED
    || persisted.replayed
      !== false
  ) {
    return contract(
      "RestoreTenant persisted result binding is incoherent.",
    );
  }
};

export const createRestoreTenantTransactionStore = (
  runner: TransactionRunnerPort,
): RestoreTenantTransactionStore =>
  Object.freeze({
    execute: async (
      input: RestoreTenantTransactionInput,
    ) =>
      runAuthoritativeTransaction(
        runner,
        async ({
          transaction,
        }) => {
          validateActor(
            input.actor,
          );

          const commandPath =
            privilegedCommandDocumentPath(
              input.commandId,
            );

          const commandSnapshot =
            await transaction.get(
              commandPath,
              "privileged_command",
            );

          if (
            commandSnapshot.exists
          ) {
            const command =
              validatePersistedCommandRecord(
                commandSnapshot.data,
              );

            if (
              command.commandType
                !== COMMAND_TYPES.RESTORE_TENANT
              || command.payloadHash
                !== input.payloadHash
              || command.correlationId
                !== input.correlationId
            ) {
              return conflict(
                "RestoreTenant command binding conflicts.",
              );
            }

            if (
              command.status
                !== COMMAND_STATUSES.SUCCEEDED
              || command.stage
                !== PRIVILEGED_COMMAND_STAGES.COMPLETED
            ) {
              return contract(
                "RestoreTenant replay command state is malformed.",
              );
            }

            if (
              command.tenantId
                !== input.tenantId
              || command.actorUid
                !== input.actor.actorUid
              || command.actorType
                !== input.actor.actorType
              || command.authority
                !== input.actor.authority
            ) {
              return contract(
                "RestoreTenant command authority binding is incoherent.",
              );
            }

            validatePersistedResult(
              command.result,
              {
                commandId:
                  command.commandId,

                correlationId:
                  command.correlationId,

                tenantId:
                  input.tenantId,
              },
            );

            return Object.freeze({
              replayed:
                true,
            });
          }

          const tenantPath =
            tenantDocumentPath(
              input.tenantId,
            );

          const tenantSnapshot =
            await transaction.get(
              tenantPath,
              "tenant",
            );

          if (!tenantSnapshot.exists) {
            throw new BackendError(
              BACKEND_ERROR_CODES.NOT_FOUND,
              "Tenant does not exist.",
            );
          }

          const tenantValidation =
            validatePersistedTenant(
              tenantSnapshot.data,
            );

          if (!tenantValidation.ok) {
            return contract(
              "Persisted Tenant is malformed.",
            );
          }

          const tenant =
            tenantValidation.value as Readonly<
              Record<string, unknown>
            >;

          if (
            tenant.tenantId
              !== input.tenantId
          ) {
            return contract(
              "Persisted Tenant binding is incoherent.",
            );
          }

          if (
            tenant.status
              === TENANT_STATUSES.ARCHIVED
          ) {
            return failedPrecondition(
              "Archived Tenant cannot be restored.",
            );
          }

          if (
            tenant.status
              === TENANT_STATUSES.ACTIVE
          ) {
            return failedPrecondition(
              "Tenant is already active.",
            );
          }

          if (
            tenant.status
              !== TENANT_STATUSES.SUSPENDED
          ) {
            return failedPrecondition(
              "Tenant is not suspended.",
            );
          }

          if (
            tenant.suspendedAt === null
            || tenant.archivedAt !== null
          ) {
            return contract(
              "Suspended Tenant lifecycle timestamps are incoherent.",
            );
          }

          if (
            typeof tenant.updatedAt
              !== "string"
          ) {
            return contract(
              "Persisted Tenant updatedAt is malformed.",
            );
          }

          const logicalTenant = {
            ...tenant,

            status:
              TENANT_STATUSES.ACTIVE,

            updatedAt:
              tenant.updatedAt,

            suspendedAt:
              null,

            archivedAt:
              null,
          };

          const logicalValidation =
            validatePersistedTenant(
              logicalTenant,
            );

          if (!logicalValidation.ok) {
            return contract(
              "RestoreTenant transition violates the persisted Tenant contract.",
            );
          }

          const tenantWrite = {
            status:
              TENANT_STATUSES.ACTIVE,

            updatedAt:
              serverOwnedTimestamp(),

            suspendedAt:
              null,

            archivedAt:
              null,
          };

          validatePersistedResult(
            input.result,
            {
              commandId:
                input.commandId,

              correlationId:
                input.correlationId,

              tenantId:
                input.tenantId,
            },
          );

          const command = {
            commandId:
              input.commandId,

            commandType:
              COMMAND_TYPES.RESTORE_TENANT,

            payloadHash:
              input.payloadHash,

            actorUid:
              input.actor.actorUid,

            actorType:
              input.actor.actorType,

            authority:
              input.actor.authority,

            tenantId:
              input.tenantId,

            status:
              COMMAND_STATUSES.SUCCEEDED,

            stage:
              PRIVILEGED_COMMAND_STAGES.COMPLETED,

            startedAt:
              serverOwnedTimestamp(),

            completedAt:
              serverOwnedTimestamp(),

            failedAt:
              null,

            result:
              input.result,

            errorCode:
              null,

            attemptCount:
              1,

            correlationId:
              input.correlationId,

            expiresAt:
              null,

            leaseExpiresAt:
              null,

            schemaVersion:
              COMMAND_SCHEMA_VERSION,
          };

          validatePersistedCommandRecord({
            ...command,

            startedAt:
              tenant.updatedAt,

            completedAt:
              tenant.updatedAt,
          });

          transaction.update(
            tenantPath,
            tenantWrite,
          );

          transaction.create(
            commandPath,
            command,
          );

          writeAuditEvent(
            transaction,
            {
              auditId:
                `${input.commandId}-tenant-restore`,

              commandId:
                input.commandId,

              correlationId:
                input.correlationId,

              authority:
                input.actor,

              destination: {
                kind:
                  "tenant",

                tenantId:
                  input.tenantId,
              },

              level:
                RESTORE_TENANT_AUDIT_LEVEL,

              operation:
                RESTORE_TENANT_AUDIT_OPERATION,

              resourceType:
                RESTORE_TENANT_RESOURCE_TYPE,

              resourceId:
                input.tenantId,

              result:
                RESTORE_TENANT_AUDIT_RESULT,

              errorCode:
                null,

              beforeSummary:
                exactAuditMap(
                  {
                    tenantStatus:
                      TENANT_STATUSES.SUSPENDED,
                  },
                  RESTORE_TENANT_AUDIT_BEFORE_FIELDS,
                  "before summary",
                ),

              afterSummary:
                exactAuditMap(
                  {
                    tenantStatus:
                      TENANT_STATUSES.ACTIVE,
                  },
                  RESTORE_TENANT_AUDIT_AFTER_FIELDS,
                  "after summary",
                ),

              metadata:
                exactAuditMap(
                  {
                    stage:
                      "completed",
                  },
                  RESTORE_TENANT_AUDIT_METADATA_FIELDS,
                  "metadata",
                ),
            },
          );

          return Object.freeze({
            replayed:
              false,
          });
        },
      ),
  });