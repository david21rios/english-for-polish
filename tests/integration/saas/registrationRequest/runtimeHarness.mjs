import { createRulesTestEnvironment, RULES_TEST_PROJECT_ID } from "../../../rules/helpers/rulesTestEnvironment.mjs";
import { createRegistrationRequestRepository } from "../../../../src/services/saas/registrationRequest/index.js";
import {
  collection, collectionGroup, deleteDoc, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, setDoc, startAfter, updateDoc, where
} from "firebase/firestore";

export const PROJECT_ID = RULES_TEST_PROJECT_ID;
export const USERS = Object.freeze({
  studentA: "uid-student-a",
  studentB: "uid-student-b",
  teacherA: "uid-teacher-a",
  adminA: "uid-admin-a"
});
export const TENANTS = Object.freeze({ a: "tenant-a", b: "tenant-b", c: "tenant-c" });

export const createRuntimeEnvironment = createRulesTestEnvironment;
export const databaseFor = (environment, uid) => environment.authenticatedContext(uid).firestore();
export const anonymousDatabase = (environment) => environment.unauthenticatedContext().firestore();

export const createRuntimeRepository = (database) => createRegistrationRequestRepository({
  db: database,
  sdk: { doc, getDoc, collection, collectionGroup, query, where, orderBy, documentId, limit, startAfter, getDocs }
});

export const sdk = Object.freeze({
  collection, collectionGroup, deleteDoc, doc, documentId, getDocs, limit,
  orderBy, query, setDoc, updateDoc, where
});
