export const ENROLLMENT_STATUSES: Readonly<{
    PENDING: "pending";
    ACTIVE: "active";
    COMPLETED: "completed";
    CANCELLED: "cancelled";
}>;
export const ENROLLMENT_STATUS_TRANSITIONS: Readonly<{
    pending: readonly ("active" | "cancelled")[];
    active: readonly ("completed" | "cancelled")[];
    completed: readonly never[];
    cancelled: readonly never[];
}>;
