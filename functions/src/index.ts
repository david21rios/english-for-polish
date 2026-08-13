export { requireAuthenticatedActor, rejectActorAuthorityPayload } from "./authorization/authenticatedActor.js";
export { resolvePlatformAuthority, resolveTenantAuthority } from "./authorization/authorityResolver.js";
export { capabilitiesForMembershipRole, capabilitiesForPlatformRole, requireCapability } from "./authorization/capabilities.js";
export { requireValidAuthorityResolution } from "./authorization/resolvedAuthority.js";
export { prepareCommandExecution, safeCommandFailure } from "./commands/executor.js";
export { executeRecoverPlatformAdmin, validateRecoverPlatformAdminInput } from "./commands/recoverPlatformAdmin.js";
export { executeRevokePlatformAdmin, validateRevokePlatformAdminInput } from "./commands/revokePlatformAdmin.js";
export { executeBootstrapTenant, parseBootstrapTenantInput } from "./commands/bootstrapTenant.js";
export { createPendingCommandRecord, validateCommandEnvelope } from "./commands/commandRecord.js";
export { loadBackendConfig, readBackendConfig } from "./config/config.js";
export { BackendError, mapFirebaseAdminError, sanitizeBackendError } from "./errors/backendError.js";
export { decideIdempotency } from "./idempotency/idempotency.js";
export { canonicalPayloadHash } from "./idempotency/payloadHash.js";
export { runAuthoritativeTransaction } from "./persistence/transactionBoundary.js";
export { writeAuditEvent } from "./audit/auditWriter.js";
export { createPlatformCommandTransactionStore } from "./persistence/platformCommandTransactionStore.js";
export { createTenantBootstrapTransactionStore } from "./persistence/tenantBootstrapTransactionStore.js";
export type { PlatformCommandStoreMutation, PlatformCommandTransactionStore, RecoveryOwnershipInput, RecoveryOwnershipHandoffInput } from "./persistence/platformCommandTransactionStore.js";

// No Firebase Function handler is exported in 03B-B. Business transports begin in later phases.
