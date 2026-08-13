import { ACCESS_STATES, BACKEND_ERROR_CODES, tenantDocumentPath } from "@mipymetic/saas-contracts";
import { CAPABILITY_IDS, CEFR_LEVELS } from "@mipymetic/saas-contracts/domain";
import { tenantAuditEventDocumentPath, validatePersistedMembership } from "@mipymetic/saas-contracts/persistence";
import { canonicalJsonStringify, validatePersistedTimestamp } from "@mipymetic/saas-contracts/validation";
import { COMMAND_STATUSES } from "@mipymetic/saas-contracts/commands";
import {
  AUTHORITY_ACTOR_TYPES, SYSTEM_OPERATOR_AUTHORITIES,
  AUTHORITY_SCHEMA_VERSION, PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, PLATFORM_AUTHORITY_SCHEMA_VERSION,
  PLATFORM_AUTHORITY_REGISTRY_STATES, PLATFORM_AUTHORITY_STATUSES,
  validateAuthorityResolution, validatePlatformAuthority, validatePlatformAuthorityRegistry,
} from "@mipymetic/saas-contracts/authority";
import type { AuthorityResolution, HumanAuthorityResolution, SystemOperatorResolution } from "@mipymetic/saas-contracts/authority";
import { AUDIT_LEVELS } from "@mipymetic/saas-contracts/audit";
import { COMMON_ERROR_CODES } from "@mipymetic/saas-contracts/errors";

const access: typeof ACCESS_STATES.ACTIVE = "active";
const cefr: typeof CEFR_LEVELS.C2 = "C2";
const command: typeof COMMAND_STATUSES.SUCCEEDED = "succeeded";
const authority: typeof PLATFORM_AUTHORITY_STATUSES.ACTIVE = "active";
const audit: typeof AUDIT_LEVELS.CRITICAL = "critical";
const error: typeof COMMON_ERROR_CODES.CONFLICT = BACKEND_ERROR_CODES.CONFLICT;
const revokeCapability: "platform.authority_revoke" = CAPABILITY_IDS.PLATFORM_AUTHORITY_REVOKE;
const authoritySchema: 2 = PLATFORM_AUTHORITY_SCHEMA_VERSION;
const registrySchema: 1 = PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION;
const registryState: "uninitialized" = PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED;
const legacyRegistrySchema: typeof registrySchema = AUTHORITY_SCHEMA_VERSION;
const timestampResult = validatePersistedTimestamp("2026-08-12T12:34:56.123Z");
const authorityResult = validatePlatformAuthority({ schemaVersion: authoritySchema, transitionCommandId: null });
const registryResult = validatePlatformAuthorityRegistry({ schemaVersion: registrySchema });
const membershipResult = validatePersistedMembership({});
const humanResolution: HumanAuthorityResolution = {actorUid:"admin-1",actorType:AUTHORITY_ACTOR_TYPES.PLATFORM_ADMIN,authority:"platform_admin",tenantId:null,roles:["platform_admin"],capabilities:[]};
const systemResolution: SystemOperatorResolution = {actorUid:"operator-1",actorType:"system",authority:SYSTEM_OPERATOR_AUTHORITIES.PLATFORM_RECOVERY,tenantId:null,roles:[],capabilities:[]};
const resolutionResult = validateAuthorityResolution(humanResolution as AuthorityResolution);
const paths: readonly string[] = [tenantDocumentPath("tenant-a"), tenantAuditEventDocumentPath("tenant-a", "audit-a")];
const canonical: string = canonicalJsonStringify({ access, cefr, command, authority, audit, error, paths });

// @ts-expect-error closed literal contract must reject unknown status
const invalidStatus: typeof COMMAND_STATUSES.SUCCEEDED = "done";
// @ts-expect-error internal modules must remain outside the package export map
await import("@mipymetic/saas-contracts/src/internal/json.js");

void canonical;
void revokeCapability;
void legacyRegistrySchema;
void timestampResult;
void authorityResult;
void registryState;
void registryResult;
void membershipResult;
void systemResolution;
void resolutionResult;
void invalidStatus;
