import { ACCESS_STATES, BACKEND_ERROR_CODES, tenantDocumentPath } from "@mipymetic/saas-contracts";
import { CEFR_LEVELS } from "@mipymetic/saas-contracts/domain";
import { tenantAuditEventDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { canonicalJsonStringify } from "@mipymetic/saas-contracts/validation";
import { COMMAND_STATUSES } from "@mipymetic/saas-contracts/commands";
import { PLATFORM_AUTHORITY_STATUSES } from "@mipymetic/saas-contracts/authority";
import { AUDIT_LEVELS } from "@mipymetic/saas-contracts/audit";
import { COMMON_ERROR_CODES } from "@mipymetic/saas-contracts/errors";

const access: typeof ACCESS_STATES.ACTIVE = "active";
const cefr: typeof CEFR_LEVELS.C2 = "C2";
const command: typeof COMMAND_STATUSES.SUCCEEDED = "succeeded";
const authority: typeof PLATFORM_AUTHORITY_STATUSES.ACTIVE = "active";
const audit: typeof AUDIT_LEVELS.CRITICAL = "critical";
const error: typeof COMMON_ERROR_CODES.CONFLICT = BACKEND_ERROR_CODES.CONFLICT;
const paths: readonly string[] = [tenantDocumentPath("tenant-a"), tenantAuditEventDocumentPath("tenant-a", "audit-a")];
const canonical: string = canonicalJsonStringify({ access, cefr, command, authority, audit, error, paths });

// @ts-expect-error closed literal contract must reject unknown status
const invalidStatus: typeof COMMAND_STATUSES.SUCCEEDED = "done";
// @ts-expect-error internal modules must remain outside the package export map
await import("@mipymetic/saas-contracts/src/internal/json.js");

void canonical;
void invalidStatus;
