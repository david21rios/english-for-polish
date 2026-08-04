import { createRulesTestEnvironment, RULES_TEST_PROJECT_ID } from "../../../rules/helpers/rulesTestEnvironment.mjs";
import { createMembershipRepository } from "../../../../src/services/saas/membership/index.js";
import {
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, setDoc, startAfter, updateDoc, where
} from "firebase/firestore";

export const PROJECT_ID = RULES_TEST_PROJECT_ID;
export const USERS = Object.freeze({
  studentA: "uid-student-a",
  studentB: "uid-student-b",
  teacherA: "uid-teacher-a",
  adminA: "uid-admin-a",
  foreign: "uid-foreign",
  incompatible: "uid-incompatible"
});
export const TENANTS = Object.freeze({ a: "tenant-a", b: "tenant-b", c: "tenant-c" });

export const createMembershipRuntimeEnvironment = createRulesTestEnvironment;
export const authenticatedFirestore = (environment, uid) =>
  environment.authenticatedContext(uid).firestore();
export const unauthenticatedFirestore = (environment) =>
  environment.unauthenticatedContext().firestore();
export const withSecurityRulesDisabled = (environment, operation) =>
  environment.withSecurityRulesDisabled(operation);
export const clearFirestore = (environment) => environment.clearFirestore();
export const cleanup = (environment) => environment.cleanup();

export const createMembershipRepositoryForContext = (database) => createMembershipRepository({
  db: database,
  sdk: {
    doc, getDoc, collection, collectionGroup, query, where, orderBy,
    documentId, limit, startAfter, getDocs
  }
});

export const sdk = Object.freeze({
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, setDoc, updateDoc, where
});
