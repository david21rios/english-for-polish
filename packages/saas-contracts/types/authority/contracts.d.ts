export const PLATFORM_AUTHORITY_SCHEMA_VERSION: 1;
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
export type PlatformAuthority = Readonly<{
    schemaVersion: 1;
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
