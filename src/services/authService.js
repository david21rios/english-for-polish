// src/services/authService.js

import { auth } from "../firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";

import { createUserDocument } from "./firestoreService";

/**
 * Normaliza email
 */
const normalizeEmail = (email = "") => {
  return email.trim().toLowerCase();
};

/**
 * Registro de usuario
 */
export const registerUser = async (email, password, userData) => {
  try {
    const normalizedEmail = normalizeEmail(email);

    const { user } = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    // Actualizar displayName Firebase Auth
    await updateProfile(user, {
      displayName: `${userData.name} ${userData.lastName}`
    });

    // Crear documento Firestore
    await createUserDocument(user, {
     name: userData.name?.trim(),
     lastName: userData.lastName?.trim(),
     email: normalizedEmail,
     age: Number(userData.age),
     ageGroup: userData.ageGroup,
     country: userData.country
   });

    return user;
  } catch (error) {
    console.error("Register user error:", error);

    // IMPORTANTE:
    // Lanzar el error ORIGINAL
    throw error;
  }
};

/**
 * Login
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
 * Logout
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);

    throw error;
  }
};