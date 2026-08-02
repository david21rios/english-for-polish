import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  serializeSnapshot,
  timestampToIsoString,
  validateTenantId
} from "../shared/index.js";
import {
  TENANT_FIELDS,
  TENANT_REQUIRED_FIELDS,
  validateTenantShape
} from "./tenantValidation.js";

export const serializeTenantSnapshot = (snapshot) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: TENANT_FIELDS,
    requiredFields: TENANT_REQUIRED_FIELDS,
    resource: "tenant"
  });

  const documentTenantId = validateTenantId(serialized.id);

  if (serialized.data.tenantId !== documentTenantId) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: "Tenant tenantId does not match its document ID.",
      operation: "serialize_tenant",
      resource: "tenant"
    });
  }

  const hasSuspendedAt = Object.prototype.hasOwnProperty.call(
    serialized.data,
    "suspendedAt"
  );
  const hasArchivedAt = Object.prototype.hasOwnProperty.call(
    serialized.data,
    "archivedAt"
  );

  const tenant = validateTenantShape({
    ...serialized.data,
    createdAt: timestampToIsoString(serialized.data.createdAt, {
      fieldName: "tenant.createdAt"
    }),
    updatedAt: timestampToIsoString(serialized.data.updatedAt, {
      fieldName: "tenant.updatedAt"
    }),
    ...(hasSuspendedAt ? {
      suspendedAt: timestampToIsoString(serialized.data.suspendedAt, {
        allowNull: true,
        fieldName: "tenant.suspendedAt"
      })
    } : {}),
    ...(hasArchivedAt ? {
      archivedAt: timestampToIsoString(serialized.data.archivedAt, {
        allowNull: true,
        fieldName: "tenant.archivedAt"
      })
    } : {})
  });

  return Object.freeze(tenant);
};
