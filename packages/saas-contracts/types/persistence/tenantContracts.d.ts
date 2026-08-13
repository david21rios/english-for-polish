export const TENANT_PERSISTED_FIELDS: readonly string[];
export const TENANT_SETTINGS_FIELDS: readonly string[];
export const REGISTRATION_POLICY_FIELDS: readonly string[];
export const TENANT_BRANDING_FIELDS: readonly string[];
export const TENANT_BRAND_COLORS_FIELDS: readonly string[];
export const MEMBERSHIP_KEY_FIELDS: readonly string[];
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS: readonly string[];
export function validatePersistedTenant(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function validateTenantSettings(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function validateTenantBranding(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function validateMembershipKey(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function validatePersistedMembership(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function encodeMembershipUidKey(uid: unknown): string;
export function validateTenantAdminAuthorityState(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: string;
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export const FIRST_ADMIN_ROLE: "tenant_admin";
export const FIRST_ADMIN_STATUS: "approved";
