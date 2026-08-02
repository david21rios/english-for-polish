import {
  TENANT_STATUSES,
  TENANT_TYPES
} from "../../../domain/organization/enums.js";
import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateTenantId
} from "../shared/index.js";

export const TENANT_FIELDS = Object.freeze([
  "tenantId",
  "tenantType",
  "displayName",
  "shortName",
  "country",
  "locale",
  "timezone",
  "status",
  "createdAt",
  "updatedAt",
  "suspendedAt",
  "archivedAt"
]);

export const TENANT_REQUIRED_FIELDS = Object.freeze([
  "tenantId",
  "tenantType",
  "displayName",
  "shortName",
  "country",
  "locale",
  "timezone",
  "status",
  "createdAt",
  "updatedAt"
]);

const TENANT_TYPE_VALUES = Object.freeze(Object.values(TENANT_TYPES));
const TENANT_STATUS_VALUES = Object.freeze(Object.values(TENANT_STATUSES));

const contractViolation = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_tenant",
  resource: "tenant"
});

const requireString = (value, fieldName) => {
  if (typeof value !== "string") {
    throw contractViolation(`Tenant ${fieldName} must be a string.`);
  }
};

export const validateTenantShape = (tenant) => {
  validateTenantId(tenant.tenantId);

  for (const fieldName of [
    "displayName",
    "shortName",
    "country",
    "locale",
    "timezone"
  ]) {
    requireString(tenant[fieldName], fieldName);
  }

  if (!TENANT_TYPE_VALUES.includes(tenant.tenantType)) {
    throw contractViolation("Tenant tenantType is not supported by Domain 1.2.0.");
  }

  if (!TENANT_STATUS_VALUES.includes(tenant.status)) {
    throw contractViolation("Tenant status is not supported by Domain 1.2.0.");
  }

  if (tenant.status === TENANT_STATUSES.ACTIVE &&
      tenant.archivedAt !== undefined &&
      tenant.archivedAt !== null) {
    throw contractViolation("An active Tenant cannot have archivedAt.");
  }

  if (tenant.status === TENANT_STATUSES.SUSPENDED) {
    if (tenant.suspendedAt === undefined || tenant.suspendedAt === null) {
      throw contractViolation("A suspended Tenant requires suspendedAt.");
    }

    if (tenant.archivedAt !== undefined && tenant.archivedAt !== null) {
      throw contractViolation("A suspended Tenant cannot have archivedAt.");
    }
  }

  if (tenant.status === TENANT_STATUSES.ARCHIVED &&
      (tenant.archivedAt === undefined || tenant.archivedAt === null)) {
    throw contractViolation("An archived Tenant requires archivedAt.");
  }

  return tenant;
};
