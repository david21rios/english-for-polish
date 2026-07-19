// src/services/initializeData.js

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "../../firebase";

import {
  levelStructure
} from "../../utils/lessonStructure";

/**
 * Checks whether the authenticated user
 * has administrator privileges.
 *
 * @returns {Promise<boolean>}
 */
const isCurrentUserAdmin = async () => {
  const user = auth.currentUser;

  if (!user?.emailVerified) {
    return false;
  }

  const userReference = doc(
    db,
    "users",
    user.uid
  );

  const userDocument =
    await getDoc(userReference);

  return (
    userDocument.exists() &&
    userDocument.data().role ===
      "admin"
  );
};

/**
 * Initializes the CEFR levels collection.
 *
 * Existing documents are merged instead
 * of overwritten.
 *
 * @returns {Promise<boolean>}
 */
export const initializeDatabase =
  async () => {
    try {
      const isAdmin =
        await isCurrentUserAdmin();

      if (!isAdmin) {
        throw new Error(
          "Insufficient permissions."
        );
      }

      for (const [
        levelId,
        levelData
      ] of Object.entries(
        levelStructure
      )) {
        const levelReference =
          doc(
            db,
            "levels",
            levelId
          );

        await setDoc(
          levelReference,
          {
            ...levelData,
            id: levelId,
            updatedAt:
              serverTimestamp()
          },
          {
            merge: true
          }
        );
      }

      console.info(
        "Database initialized successfully."
      );

      return true;

    } catch (error) {

      console.error(
        "Database initialization failed:",
        error
      );

      throw error;

    }
  };

/**
 * Checks whether the database
 * has already been initialized.
 *
 * @returns {Promise<boolean>}
 */
export const isDatabaseInitialized =
  async () => {
    try {
      const levelReference =
        doc(
          db,
          "levels",
          "A1"
        );

      const levelDocument =
        await getDoc(
          levelReference
        );

      return levelDocument.exists();

    } catch (error) {

      console.error(
        "Database initialization check failed:",
        error
      );

      return false;

    }
  };