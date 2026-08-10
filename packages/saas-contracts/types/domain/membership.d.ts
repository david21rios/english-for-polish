export const MEMBERSHIP_ROLES: Readonly<{
    STUDENT: "student";
    TEACHER: "teacher";
    TENANT_ADMIN: "tenant_admin";
}>;
export const MEMBERSHIP_STATUSES: Readonly<{
    APPROVED: "approved";
    SUSPENDED: "suspended";
    REMOVED: "removed";
}>;
export const MEMBERSHIP_STATUS_TRANSITIONS: Readonly<{
    approved: readonly ("suspended" | "removed")[];
    suspended: readonly ("approved" | "removed")[];
    removed: readonly never[];
}>;
