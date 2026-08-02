import {
  RepositoryError,
  createFirestoreRepositoryDependencies,
  mapFirebaseError,
  requireFirestoreSdkFunction,
  tenantPath,
  validateTenantId
} from "../shared/index.js";
import { serializeTenantSnapshot } from "./tenantSerializer.js";

export const createTenantRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const doc = requireFirestoreSdkFunction({ sdk }, "doc");
  const getDoc = requireFirestoreSdkFunction({ sdk }, "getDoc");

  const getTenant = async (tenantId) => {
    const validatedTenantId = validateTenantId(tenantId);

    try {
      const reference = doc(db, tenantPath(validatedTenantId));
      const snapshot = await getDoc(reference);
      return serializeTenantSnapshot(snapshot);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw mapFirebaseError(error, {
        operation: "get_tenant",
        resource: "tenant"
      });
    }
  };

  return Object.freeze({ getTenant });
};
