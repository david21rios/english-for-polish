// src/services/authService.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";

import { auth } from "../../firebase";
import { createUserDocument } from "./firestoreService";

/**
 * Normalizes an email address before authentication or persistence.
 *
 * @param {string} email
 * @returns {string}
 */
const normalizeEmail = (email = "") => {
  return String(email).trim().toLowerCase();
};

/**
 * Normalizes a text value.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeText = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

/**
 * Creates the Firebase Authentication account and its corresponding
 * Firestore user document.
 *
 * @param {string} email
 * @param {string} password
 * @param {object} userData
 * @returns {Promise<import("firebase/auth").User>}
 */
export const registerUser = async (
  email,
  password,
  userData = {}
) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeText(userData.name);
    const normalizedLastName = normalizeText(userData.lastName);

    const displayName = [normalizedName, normalizedLastName]
      .filter(Boolean)
      .join(" ");

    const { user } = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    /*
     * Firebase Authentication only stores basic identity information.
     * The rest of the application profile is stored in Firestore.
     */
    if (displayName) {
      await updateProfile(user, {
        displayName
      });
    }

    const userDocumentData = {
      name: normalizedName,
      lastName: normalizedLastName,
      email: normalizedEmail,

      age: Number(userData.age),
      ageGroup: normalizeText(userData.ageGroup),

      /*
       * Country must be stored as an ISO 3166-1 alpha-2 code,
       * for example: PL, CO, ES or DE.
       */
      country: normalizeText(userData.country).toUpperCase(),

      /*
       * Initial SaaS and multi-tenant preparation.
       */
      accountType:
        normalizeText(userData.accountType) || "independent",

      organizationId:
        userData.organizationId ?? null,

      organizationMembershipStatus:
        normalizeText(
          userData.organizationMembershipStatus
        ) || "not_applicable"
    };

    await createUserDocument(user, userDocumentData);

    return user;
  } catch (error) {
    console.error("Register user error:", error);

    /*
     * Preserve the original Firebase error so the presentation layer
     * can translate its code into a friendly user-facing message.
     */
    throw error;
  }
};

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").User>}
 */
export const loginUser = async (email, password) => {
  try {
    const normalizedEmail = normalizeEmail(email);

    const { user } = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    return user;
  } catch (error) {
    console.error("Login error:", error);

    throw error;
  }
};

/**
 * Signs out the currently authenticated user.
 *
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);

    throw error;
  }
};