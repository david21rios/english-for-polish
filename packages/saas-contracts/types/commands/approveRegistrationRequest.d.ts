export const APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS: readonly string[];
export const APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS: readonly string[];
export const APPROVE_REGISTRATION_REQUEST_OPERATION: "ApproveRegistrationRequest";
export const APPROVE_REGISTRATION_REQUEST_RESOURCE_TYPE: "registrationRequest";
export const APPROVE_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS: "approved";
export const APPROVE_REGISTRATION_REQUEST_TARGET_MEMBERSHIP_STATUS: "approved";
export const APPROVE_REGISTRATION_REQUEST_REQUIRED_CAPABILITY: "registration_request.review";
export const APPROVE_REGISTRATION_REQUEST_AUDIT_OPERATION: "ApproveRegistrationRequest.update";
export const APPROVE_REGISTRATION_REQUEST_AUDIT_LEVEL: "critical";
export const APPROVE_REGISTRATION_REQUEST_AUDIT_RESULT: "succeeded";
export const APPROVE_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS: readonly string[];
export const APPROVE_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS: readonly string[];
export const APPROVE_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS: readonly string[];
export function validateApproveRegistrationRequestInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "approveRegistrationRequest";
        reason: "invalid_approve_registration_request";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function approveRegistrationRequestBehavioralPayload(input: unknown): Readonly<{
    tenantId: unknown;
    requestId: unknown;
    targetRequestStatus: "approved";
    targetMembershipStatus: "approved";
}>;
export function validateApproveRegistrationRequestResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "approveRegistrationRequest";
        reason: "invalid_approve_registration_request";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
