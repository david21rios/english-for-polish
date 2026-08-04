import { createRulesTestEnvironment, RULES_TEST_PROJECT_ID } from "../../../rules/helpers/rulesTestEnvironment.mjs";
import { createEnrollmentRepository } from "../../../../src/services/saas/enrollment/index.js";
import {
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, setDoc, startAfter, updateDoc, where
} from "firebase/firestore";

export const PROJECT_ID = RULES_TEST_PROJECT_ID;
export const USERS = Object.freeze({
  student: "uid-enrollment-student", suspended: "uid-enrollment-suspended",
  removed: "uid-enrollment-removed", teacher: "uid-enrollment-teacher",
  admin: "uid-enrollment-admin", adminSuspended: "uid-enrollment-admin-suspended",
  adminRemoved: "uid-enrollment-admin-removed", foreign: "uid-enrollment-foreign",
  tenantBStudent: "uid-enrollment-b-student", tenantBAdmin: "uid-enrollment-b-admin",
  suspendedTenantStudent: "uid-enrollment-c-student",
  suspendedTenantAdmin: "uid-enrollment-c-admin", archivedTenantStudent: "uid-enrollment-d-student",
  archivedTenantAdmin: "uid-enrollment-d-admin", incompatible: "uid-enrollment-incompatible",
  platform: "uid-platform-admin"
});
export const TENANTS = Object.freeze({
  a: "tenant-a", b: "tenant-b", suspended: "tenant-suspended",
  archived: "tenant-archived", incompatible: "tenant-incompatible"
});

export const createEnrollmentRuntimeEnvironment = createRulesTestEnvironment;
export const authenticatedFirestore = (environment, uid) => environment.authenticatedContext(uid).firestore();
export const unauthenticatedFirestore = (environment) => environment.unauthenticatedContext().firestore();
export const withSecurityRulesDisabled = (environment, operation) => environment.withSecurityRulesDisabled(operation);
export const clearFirestore = (environment) => environment.clearFirestore();
export const cleanup = (environment) => environment.cleanup();
export const createEnrollmentRepositoryForContext = (db) => createEnrollmentRepository({ db, sdk: {
  doc, getDoc, collection, query, where, orderBy, documentId, limit, startAfter, getDocs
} });
export const sdk = Object.freeze({
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  orderBy, query, setDoc, updateDoc, where
});
