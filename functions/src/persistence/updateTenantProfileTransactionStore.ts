import { validateAuthorityResolution } from "@mipymetic/saas-contracts/authority";
import {
  UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_LEVEL,
  UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_OPERATION,
  UPDATE_TENANT_PROFILE_AUDIT_RESULT,
  UPDATE_TENANT_PROFILE_RESOURCE_TYPE,
  COMMAND_SCHEMA_VERSION,
  COMMAND_STATUSES,
  COMMAND_TYPES,
  PRIVILEGED_COMMAND_STAGES,
  validateUpdateTenantProfileInput,
  validateUpdateTenantProfileResult,
} from "@mipymetic/saas-contracts/commands";
import { CAPABILITY_IDS, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, TENANT_STATUSES } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  privilegedCommandDocumentPath,
  tenantDocumentPath,
  validateMembershipKey,
  validatePersistedMembership,
  validatePersistedTenant,
} from "@mipymetic/saas-contracts/persistence";
import { isPlainObject, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { writeAuditEvent } from "../audit/auditWriter.js";
import { validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { BackendError } from "../errors/backendError.js";
import {
  isServerOwnedTimestamp,
  serverOwnedTimestamp,
  type TransactionRunnerPort,
} from "./ports.js";
import { runAuthoritativeTransaction } from "./transactionBoundary.js";

export interface UpdateTenantProfileTransactionInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly payloadHash: string;
  readonly tenantId: string;
  readonly patch: Readonly<Record<string, JsonValue>>;
  readonly actor: AuthorityResolution;
  readonly result: Readonly<Record<string, JsonValue>>;
}

export interface UpdateTenantProfileTransactionStore {
  execute(
    input: UpdateTenantProfileTransactionInput,
  ): Promise<Readonly<{ replayed: boolean }>>;
}

const conflict = (message: string): never => {
  throw new BackendError(BACKEND_ERROR_CODES.CONFLICT, message);
};

const contract = (message: string): never => {
  throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, message);
};

const forbidden = (message: string): never => {
  throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, message);
};

const failedPrecondition = (message: string): never => {
  throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, message);
};

const exactAuditMap = (
  value: Readonly<Record<string, JsonValue>>,
  fields: readonly string[],
  label: string,
): Readonly<Record<string, JsonValue>> => {
  const keys = Object.keys(value);
  if (keys.length !== fields.length || keys.some((key) => !fields.includes(key))) {
    return contract(`UpdateTenantProfile ${label} violates its shared allowlist.`);
  }
  return Object.freeze({ ...value });
};

const validateActor = (actor: AuthorityResolution, tenantId: string): void => {
  const validation = validateAuthorityResolution(actor);
  if (!validation.ok) {
    return contract("UpdateTenantProfile actor authority is malformed.");
  }

  const value = validation.value;

  if (
    value.actorType !== "identity"
    || value.authority !== MEMBERSHIP_ROLES.TENANT_ADMIN
    || value.tenantId !== tenantId
    || value.roles.length !== 1
    || value.roles[0] !== MEMBERSHIP_ROLES.TENANT_ADMIN
    || !value.capabilities.includes(CAPABILITY_IDS.TENANT_UPDATE)
  ) {
    return contract("UpdateTenantProfile actor authority is not authorized.");
  }
};

export const validateUpdateTenantProfilePersistedResult = (
  value: unknown,
  expected: Readonly<{
    commandId: string;
    correlationId: string;
    tenantId: string;
  }>,
): void => {
  const validation = validateUpdateTenantProfileResult(value);

  if (!validation.ok) {
    return contract("UpdateTenantProfile persisted result is malformed.");
  }

  const persisted = value as Readonly<Record<string, unknown>>;

  if (
    persisted.commandId !== expected.commandId
    || persisted.correlationId !== expected.correlationId
    || persisted.operation !== COMMAND_TYPES.UPDATE_TENANT_PROFILE
    || persisted.resourceType !== UPDATE_TENANT_PROFILE_RESOURCE_TYPE
    || persisted.resourceId !== expected.tenantId
    || persisted.status !== COMMAND_STATUSES.SUCCEEDED
    || persisted.replayed !== false
  ) {
    return contract("UpdateTenantProfile persisted result binding is incoherent.");
  }
};

export const createUpdateTenantProfileTransactionStore = (
  runner: TransactionRunnerPort,
): UpdateTenantProfileTransactionStore => Object.freeze({
  execute: async (input: UpdateTenantProfileTransactionInput) =>
    runAuthoritativeTransaction(runner, async ({ transaction }) => {
      validateActor(input.actor, input.tenantId);

      const commandPath = privilegedCommandDocumentPath(input.commandId);
      const commandSnapshot = await transaction.get(commandPath, "privileged_command");

      if (commandSnapshot.exists) {
        const command = validatePersistedCommandRecord(commandSnapshot.data);

        if (
          command.commandType !== COMMAND_TYPES.UPDATE_TENANT_PROFILE
          || command.payloadHash !== input.payloadHash
          || command.correlationId !== input.correlationId
        ) {
          return conflict("UpdateTenantProfile command binding conflicts.");
        }

        if (
          command.status !== COMMAND_STATUSES.SUCCEEDED
          || command.stage !== PRIVILEGED_COMMAND_STAGES.COMPLETED
        ) {
          return contract("UpdateTenantProfile replay command state is malformed.");
        }

        if (
          command.tenantId !== input.tenantId
          || command.actorUid !== input.actor.actorUid
          || command.actorType !== input.actor.actorType
          || command.authority !== input.actor.authority
        ) {
          return contract("UpdateTenantProfile command authority binding is incoherent.");
        }

        validateUpdateTenantProfilePersistedResult(command.result, {
          commandId: command.commandId,
          correlationId: command.correlationId,
          tenantId: input.tenantId,
        });

        return Object.freeze({ replayed: true });
      }

      const uidKey = encodeMembershipUidKey(input.actor.actorUid);
      const paths = {
        identity: identityDocumentPath(input.actor.actorUid),
        tenant: tenantDocumentPath(input.tenantId),
        membershipKey: membershipKeyDocumentPath(input.tenantId, uidKey),
      };

      const identitySnapshot = await transaction.get(
        paths.identity,
        "identity",
      );

      if (!identitySnapshot.exists || identitySnapshot.data === null) {
        return failedPrecondition("The actor Identity is missing.");
      }

      if (
        !isPlainObject(identitySnapshot.data)
        || typeof identitySnapshot.data.uid !== "string"
      ) {
        return contract("The actor Identity is invalid.");
      }

      const identityUid = validateDocumentIdentifier(
        identitySnapshot.data.uid,
        "identity.uid",
      );

      if (!identityUid.ok) {
        return contract("The actor Identity is invalid.");
      }

      if (identitySnapshot.data.uid !== input.actor.actorUid) {
        return forbidden(
          "The actor Identity is not coherent with command authority.",
        );
      }

      const tenantSnapshot = await transaction.get(paths.tenant, "tenant");

      if (!tenantSnapshot.exists) {
        throw new BackendError(BACKEND_ERROR_CODES.NOT_FOUND, "Tenant does not exist.");
      }

      const tenantValidation = validatePersistedTenant(tenantSnapshot.data);

      if (!tenantValidation.ok) {
        return contract("Persisted Tenant is malformed.");
      }

      const tenant = tenantValidation.value as Readonly<Record<string, unknown>>;

      if (tenant.tenantId !== input.tenantId) {
        return contract("Persisted Tenant binding is incoherent.");
      }

      if (tenant.status !== TENANT_STATUSES.ACTIVE) {
        return failedPrecondition("Tenant is not active.");
      }

      const keySnapshot = await transaction.get(paths.membershipKey, "membership_key");

      if (!keySnapshot.exists) {
        return forbidden("Approved same-Tenant Membership authority is required.");
      }

      const keyValidation = validateMembershipKey(keySnapshot.data);

      if (!keyValidation.ok) {
        return contract("Persisted MembershipKey is malformed.");
      }

      const membershipKey = keyValidation.value as Readonly<Record<string, unknown>>;

      if (
        membershipKey.tenantId !== input.tenantId
        || membershipKey.uid !== input.actor.actorUid
        || membershipKey.status !== MEMBERSHIP_STATUSES.APPROVED
      ) {
        return forbidden("MembershipKey authority is not approved for the actor.");
      }

      if (typeof membershipKey.membershipId !== "string") {
        return contract("MembershipKey membershipId is malformed.");
      }

      const membershipPath = membershipDocumentPath(
        input.tenantId,
        membershipKey.membershipId,
      );
      const membershipSnapshot = await transaction.get(membershipPath, "membership");

      if (!membershipSnapshot.exists) {
        return forbidden("Authoritative Membership is required.");
      }

      const membershipValidation = validatePersistedMembership(membershipSnapshot.data);

      if (!membershipValidation.ok) {
        return contract("Persisted Membership is malformed.");
      }

      const membership = membershipValidation.value as Readonly<Record<string, unknown>>;

      if (
        membership.membershipId !== membershipKey.membershipId
        || membership.tenantId !== input.tenantId
        || membership.uid !== input.actor.actorUid
        || membership.status !== MEMBERSHIP_STATUSES.APPROVED
        || membership.role !== MEMBERSHIP_ROLES.TENANT_ADMIN
        || membershipKey.status !== membership.status
        || membershipKey.originRequestId !== membership.originRequestId
      ) {
        return forbidden("Membership authority is not coherent with MembershipKey.");
      }

      const sharedInputValidation = validateUpdateTenantProfileInput({
        commandId: input.commandId,
        correlationId: input.correlationId,
        tenantId: input.tenantId,
        patch: input.patch,
      });

      if (!sharedInputValidation.ok) {
        return contract("UpdateTenantProfile patch violates the shared input contract.");
      }

      const patchEntries = Object.entries(input.patch);

      const tenantWrite: Record<string, unknown> = {
        ...input.patch,
        updatedAt: serverOwnedTimestamp(),
      };

      if (Object.values(tenantWrite).some((value) =>
        value !== tenantWrite.updatedAt && isServerOwnedTimestamp(value)
      )) {
        return contract("UpdateTenantProfile patch contains a server timestamp token.");
      }

      validateUpdateTenantProfilePersistedResult(input.result, {
        commandId: input.commandId,
        correlationId: input.correlationId,
        tenantId: input.tenantId,
      });

      const command = {
        commandId: input.commandId,
        commandType: COMMAND_TYPES.UPDATE_TENANT_PROFILE,
        payloadHash: input.payloadHash,
        actorUid: input.actor.actorUid,
        actorType: input.actor.actorType,
        authority: input.actor.authority,
        tenantId: input.tenantId,
        status: COMMAND_STATUSES.SUCCEEDED,
        stage: PRIVILEGED_COMMAND_STAGES.COMPLETED,
        startedAt: serverOwnedTimestamp(),
        completedAt: serverOwnedTimestamp(),
        failedAt: null,
        result: input.result,
        errorCode: null,
        attemptCount: 1,
        correlationId: input.correlationId,
        expiresAt: null,
        leaseExpiresAt: null,
        schemaVersion: COMMAND_SCHEMA_VERSION,
      };

      const logicalTimestamp = tenant.updatedAt;

      if (typeof logicalTimestamp !== "string") {
        return contract("Persisted Tenant updatedAt is malformed.");
      }

      validatePersistedCommandRecord({
        ...command,
        startedAt: logicalTimestamp,
        completedAt: logicalTimestamp,
      });

      transaction.update(paths.tenant, tenantWrite);
      transaction.create(commandPath, command);

      writeAuditEvent(transaction, {
        auditId: `${input.commandId}-tenant-update`,
        commandId: input.commandId,
        correlationId: input.correlationId,
        authority: input.actor,
        destination: { kind: "tenant", tenantId: input.tenantId },
        level: UPDATE_TENANT_PROFILE_AUDIT_LEVEL,
        operation: UPDATE_TENANT_PROFILE_AUDIT_OPERATION,
        resourceType: UPDATE_TENANT_PROFILE_RESOURCE_TYPE,
        resourceId: input.tenantId,
        result: UPDATE_TENANT_PROFILE_AUDIT_RESULT,
        errorCode: null,
        beforeSummary: exactAuditMap(
          { tenantStatus: "active" },
          UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS,
          "before summary",
        ),
        afterSummary: exactAuditMap(
          { tenantStatus: "active" },
          UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS,
          "after summary",
        ),
        metadata: exactAuditMap(
          {
            stage: "completed",
            changedFieldCount: patchEntries.length,
          },
          UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS,
          "metadata",
        ),
      });

      return Object.freeze({ replayed: false });
    }),
});
