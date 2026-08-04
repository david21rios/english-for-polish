import { createRulesTestEnvironment, RULES_TEST_PROJECT_ID } from "../../../rules/helpers/rulesTestEnvironment.mjs";
import { createCourseRepository } from "../../../../src/services/saas/course/index.js";
import {
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, setDoc, startAfter, updateDoc, where
} from "firebase/firestore";

export const PROJECT_ID = RULES_TEST_PROJECT_ID;
export const USERS = Object.freeze({
  student: "uid-course-student", teacher: "uid-course-teacher", admin: "uid-course-admin",
  suspended: "uid-course-suspended", removed: "uid-course-removed", foreign: "uid-course-foreign",
  teacherSuspended: "uid-course-teacher-suspended", teacherRemoved: "uid-course-teacher-removed",
  adminSuspended: "uid-course-admin-suspended", adminRemoved: "uid-course-admin-removed",
  suspendedTenantTeacher: "uid-course-suspended-tenant-teacher",
  archivedTenantAdmin: "uid-course-archived-tenant-admin",
  tenantBStudent: "uid-course-b-student", tenantBAdmin: "uid-course-b-admin",
  incompatible: "uid-course-incompatible", platform: "uid-platform-admin"
});
export const TENANTS = Object.freeze({
  a: "tenant-a", b: "tenant-b", suspended: "tenant-c", archived: "tenant-d", incompatible: "tenant-incompatible"
});
export const createCourseRuntimeEnvironment = createRulesTestEnvironment;
export const authenticatedFirestore = (environment, uid) => environment.authenticatedContext(uid).firestore();
export const unauthenticatedFirestore = (environment) => environment.unauthenticatedContext().firestore();
export const withSecurityRulesDisabled = (environment, operation) => environment.withSecurityRulesDisabled(operation);
export const clearFirestore = (environment) => environment.clearFirestore();
export const cleanup = (environment) => environment.cleanup();
export const createCourseRepositoryForContext = (db) => createCourseRepository({ db, sdk: {
  doc, getDoc, collection, query, where, orderBy, documentId, limit, startAfter, getDocs
} });
export const sdk = Object.freeze({
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  orderBy, query, setDoc, updateDoc, where
});
