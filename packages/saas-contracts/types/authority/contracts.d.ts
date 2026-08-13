export const AUTHORITY_ACTOR_TYPES: Readonly<{
    IDENTITY: "identity";
    PLATFORM_ADMIN: "platform_admin";
    SYSTEM: "system";
}>;
export const SYSTEM_OPERATOR_AUTHORITIES: Readonly<{
    PLATFORM_SYSTEM: "platform_system";
    PLATFORM_RECOVERY: "platform_recovery";
}>;
export const AUTHORITY_RESOLUTION_FIELDS: readonly string[];
export function validateAuthorityResolution(value: unknown): Readonly<{
    ok: true;
    value: AuthorityResolution;
}> | Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "authorityResolution";
        reason: "invalid_authority_resolution";
    }>;
}>;
export const PLATFORM_AUTHORITY_SCHEMA_VERSION: 2;
export const PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION: 1;
/** @deprecated Use PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION. */
export const AUTHORITY_SCHEMA_VERSION: 1;
export const PLATFORM_AUTHORITY: "platform_admin";
export const PLATFORM_AUTHORITY_STATUSES: Readonly<{
    PROVISIONING: "provisioning";
    ACTIVE: "active";
    REVOKING: "revoking";
    REVOKED: "revoked";
    RECOVERY_REQUIRED: "recovery_required";
}>;
export const PLATFORM_AUTHORITY_REGISTRY_STATES: Readonly<{
    UNINITIALIZED: "uninitialized";
    IN_PROGRESS: "in_progress";
    COMPLETED: "completed";
    RECOVERY_REQUIRED: "recovery_required";
}>;
export const PLATFORM_AUTHORITY_FIELDS: readonly string[];
export const PLATFORM_AUTHORITY_REQUIRED_FIELDS: readonly string[];
export const PLATFORM_AUTHORITY_REGISTRY_FIELDS: readonly string[];
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS: readonly string[];
export function validatePlatformAuthority(value: unknown): Readonly<{
    ok: true;
    value: PlatformAuthority;
}> | Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "platformAuthority";
        reason: "invalid_platform_authority";
    }>;
}>;
export function validatePlatformAuthorityRegistry(value: unknown): Readonly<{
    ok: true;
    value: PlatformAuthorityRegistry;
}> | Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "platformAuthorityRegistry";
        reason: "invalid_platform_authority_registry";
    }>;
}>;
export type HumanAuthorityResolution = Readonly<{
    actorUid: string;
    actorType: "platform_admin";
    authority: "platform_admin";
    tenantId: null;
    roles: readonly ["platform_admin"];
    capabilities: readonly string[];
}> | Readonly<{
    actorUid: string;
    actorType: "identity";
    authority: "student" | "teacher" | "tenant_admin";
    tenantId: string;
    roles: readonly ["student" | "teacher" | "tenant_admin"];
    capabilities: readonly string[];
}>;
export type SystemOperatorResolution = Readonly<{
    actorUid: string;
    actorType: "system";
    authority: "platform_system" | "platform_recovery";
    tenantId: null;
    roles: readonly [];
    capabilities: readonly [];
}>;
export type AuthorityResolution = HumanAuthorityResolution | SystemOperatorResolution;
export type PlatformAuthority = Readonly<{
    schemaVersion: 2;
    transitionCommandId: string | null;
    uid: string;
    authority: "platform_admin";
    status: "provisioning" | "active" | "revoking" | "revoked" | "recovery_required";
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    activatedAt: string | null;
    revokedAt: string | null;
    revokedBy: string | null;
    bootstrapCommandId: string | null;
    lastClaimSyncAt: string | null;
}>;
export type PlatformAuthorityRegistry = Readonly<{
    schemaVersion: 1;
    bootstrapState: "uninitialized" | "in_progress" | "completed" | "recovery_required";
    activeCount: number;
    revision: number;
    lastCommandId: string | null;
    updatedAt: string;
}>;
