// src/services/initializeData.js

import { db, auth } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { levelStructure } from "../utils/lessonStructure";

const isCurrentUserAdmin = async () => {
  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  if (!user.emailVerified) {
    return false;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  return userSnap.exists() && userSnap.data().role === "admin";
};

export const initializeDatabase = async () => {
  try {
    const isAdmin = await isCurrentUserAdmin();

    if (!isAdmin) {
      throw new Error("Permisos insuficientes");
    }

    for (const [levelId, data] of Object.entries(levelStructure)) {
      const levelRef = doc(db, "levels", levelId);

      await setDoc(
        levelRef,
        {
          ...data,
          id: levelId,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }

    console.log("Niveles inicializados correctamente");
    return true;
  } catch (error) {
    console.error("Error inicializando la base de datos:", error);
    throw error;
  }
};

export const isDatabaseInitialized = async () => {
  try {
    const levelRef = doc(db, "levels", "A1");
    const levelSnap = await getDoc(levelRef);

    return levelSnap.exists();
  } catch (error) {
    console.error("Error verificando la inicialización de la base de datos:", error);
    return false;
  }
};