import {
  RepositoryError,
  createFirestoreRepositoryDependencies,
  identityPath,
  mapFirebaseError,
  requireFirestoreSdkFunction,
  validateUid
} from "../shared/index.js";
import { serializeIdentitySnapshot } from "./identitySerializer.js";
import {
  validateIdentityProfilePatch,
  validateInterfaceLocale
} from "./identityValidation.js";

const rethrowRepositoryError = (error, operation) => {
  if (error instanceof RepositoryError) {
    throw error;
  }

  throw mapFirebaseError(error, {
    operation,
    resource: "identity"
  });
};

const updateResult = (uid, updatedFields) => Object.freeze({
  uid,
  updatedFields: Object.freeze([...updatedFields])
});

export const createIdentityRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const doc = requireFirestoreSdkFunction({ sdk }, "doc");
  const getDoc = requireFirestoreSdkFunction({ sdk }, "getDoc");
  const updateDoc = requireFirestoreSdkFunction({ sdk }, "updateDoc");
  const serverTimestamp = requireFirestoreSdkFunction({ sdk }, "serverTimestamp");

  const getIdentity = async (uid) => {
    const validatedUid = validateUid(uid);

    try {
      const reference = doc(db, identityPath(validatedUid));
      const snapshot = await getDoc(reference);
      return serializeIdentitySnapshot(snapshot);
    } catch (error) {
      return rethrowRepositoryError(error, "get_identity");
    }
  };

  const updateIdentityProfile = async (uid, patch) => {
    const validatedUid = validateUid(uid);
    const validatedPatch = validateIdentityProfilePatch(patch);
    const updatedFields = Object.keys(validatedPatch);

    try {
      const reference = doc(db, identityPath(validatedUid));
      await updateDoc(reference, {
        ...validatedPatch,
        updatedAt: serverTimestamp()
      });
      return updateResult(validatedUid, updatedFields);
    } catch (error) {
      return rethrowRepositoryError(error, "update_identity_profile");
    }
  };

  const updateInterfaceLocale = async (uid, interfaceLocale) => {
    const validatedUid = validateUid(uid);
    const validatedLocale = validateInterfaceLocale(interfaceLocale);

    try {
      const reference = doc(db, identityPath(validatedUid));
      await updateDoc(reference, {
        interfaceLocale: validatedLocale,
        updatedAt: serverTimestamp()
      });
      return updateResult(validatedUid, ["interfaceLocale"]);
    } catch (error) {
      return rethrowRepositoryError(error, "update_interface_locale");
    }
  };

  return Object.freeze({
    getIdentity,
    updateIdentityProfile,
    updateInterfaceLocale
  });
};
