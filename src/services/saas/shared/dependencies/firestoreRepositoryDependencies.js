import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "../errors/repositoryError.js";

const isObject = (value) => value !== null && typeof value === "object";

export const createFirestoreRepositoryDependencies = ({ db, sdk }) => {
  if (!isObject(db)) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: "Firestore repository dependencies require an explicit db instance.",
      operation: "create_dependencies",
      resource: "firestore"
    });
  }

  if (!isObject(sdk) || Array.isArray(sdk)) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: "Firestore repository dependencies require an explicit sdk object.",
      operation: "create_dependencies",
      resource: "firestore"
    });
  }

  for (const [name, dependency] of Object.entries(sdk)) {
    if (typeof dependency !== "function") {
      throw new RepositoryError({
        code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
        message: `Firestore SDK dependency ${name} must be a function.`,
        operation: "create_dependencies",
        resource: "firestore"
      });
    }
  }

  return Object.freeze({
    db,
    sdk: Object.freeze({ ...sdk })
  });
};

export const requireFirestoreSdkFunction = (dependencies, functionName) => {
  const dependency = dependencies?.sdk?.[functionName];

  if (typeof dependency !== "function") {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.FAILED_PRECONDITION,
      message: `Firestore SDK dependency ${functionName} is required.`,
      operation: "resolve_dependency",
      resource: "firestore"
    });
  }

  return dependency;
};
