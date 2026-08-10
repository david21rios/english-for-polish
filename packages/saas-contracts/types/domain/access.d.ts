export const ACCESS_STATES: Readonly<{
    PENDING_EMAIL_VERIFICATION: "pending_email_verification";
    PENDING_TENANT_APPROVAL: "pending_tenant_approval";
    ACTIVE: "active";
    SUSPENDED: "suspended";
    REJECTED: "rejected";
}>;
export const ACCESS_STATE_CONTEXT: Readonly<{
    scope: "tenant";
    key: "uid + tenantId";
    requiresTenantId: true;
    outsideTenantResult: null;
}>;
export const ACCESS_STATE_PRECEDENCE: readonly (Readonly<{
    priority: 1;
    key: "email_unverified";
    result: "pending_email_verification";
    condition: "A tenant context exists and Identity.emailVerified is false for an operation requiring verified email.";
}> | Readonly<{
    priority: 2;
    key: "institutional_suspension";
    result: "suspended";
    condition: "A tenant context exists and TenantStatus or MembershipStatus is suspended.";
}> | Readonly<{
    priority: 3;
    key: "approved_membership";
    result: "active";
    condition: "Email is verified, TenantStatus is active and MembershipStatus is approved.";
}> | Readonly<{
    priority: 4;
    key: "pending_request";
    result: "pending_tenant_approval";
    condition: "No applicable Membership exists and RegistrationRequestStatus is pending.";
}> | Readonly<{
    priority: 5;
    key: "rejected_request";
    result: "rejected";
    condition: "No applicable Membership exists and the current RegistrationRequestStatus is rejected.";
}>)[];
export const NULL_ACCESS_STATE_CASES: readonly string[];
