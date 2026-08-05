export const IDENTIFIER_NAMES = Object.freeze([
  "uid", "tenantId", "requestId", "membershipId", "courseId", "enrollmentId",
  "commandId", "auditId"
]);

export const isDocumentIdentifier = (value) => typeof value === "string" &&
  value.trim().length > 0 && !value.includes("/") && value.trim() !== "." &&
  value.trim() !== "..";

export const validateDocumentIdentifier = (value, name = "identifier") =>
  isDocumentIdentifier(value)
    ? Object.freeze({ ok: true, value })
    : Object.freeze({
      ok: false,
      issue: Object.freeze({ code: "INVALID_ARGUMENT", field: name, reason: "invalid_document_identifier" })
    });
