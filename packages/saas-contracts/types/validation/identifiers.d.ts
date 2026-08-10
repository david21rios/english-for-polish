export const IDENTIFIER_NAMES: readonly string[];
export function isDocumentIdentifier(value: unknown): value is string;
export function validateDocumentIdentifier(value: unknown, name?: string): Readonly<{
    ok: true;
    value: string;
}> | Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: string;
        reason: "invalid_document_identifier";
    }>;
}>;
