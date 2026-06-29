// src/services/lessonManager.js
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch
} from "firebase/firestore";

import {
  cleanLessonData,
  validateLessonData
} from "../utils/lessonStructure";

const normalizeLessonForFirestore = (lessonData, isUpdate = false) => {
  const cleanedData = cleanLessonData(lessonData);
  const nivel = cleanedData.nivel || cleanedData.id?.split("_")[0];

  const now = new Date().toISOString();

  return {
    ...cleanedData,

    id: cleanedData.id,
    lessonId: cleanedData.id,
    nivel,
    level: nivel,

    ageGroup: cleanedData.ageGroup || "all",
    status: cleanedData.status || "draft",

    contenidos: cleanedData.contenidos || cleanedData.content || {
      vocabulario: {},
      gramatica: {
        temas: []
      }
    },

    actividades: cleanedData.actividades || cleanedData.activities || [],

    lectura: cleanedData.lectura || {
      titulo: "",
      autor: "",
      contenido: "",
      preguntas: []
    },

    practica_interactiva: cleanedData.practica_interactiva || {
      titulo: "",
      descripcion: "",
      ejercicios: []
    },

    produccion_escrita: cleanedData.produccion_escrita || {
      titulo: "",
      descripcion: "",
      ejercicios: []
    },

    produccion_oral: cleanedData.produccion_oral || {
      titulo: "",
      descripcion: "",
      ejercicios: []
    },

    evaluacion: cleanedData.evaluacion || {
      autoevaluacion: "",
      cuestionario: [],
      criterios_evaluacion: []
    },

    recursos_adicionales: cleanedData.recursos_adicionales || [],
    reflexion_final: cleanedData.reflexion_final || "",

    // Compatibilidad con código anterior
    content: cleanedData.contenidos || cleanedData.content || {},
    activities: cleanedData.actividades || cleanedData.activities || [],

    ...(isUpdate
      ? { updatedAt: now }
      : {
          createdAt: now,
          updatedAt: now
        })
  };
};

export const getLessonsByLevel = async (nivel) => {
  try {
    const levelRef = doc(db, "levels", nivel);
    const lessonsRef = collection(levelRef, "lessons");
    const snapshot = await getDocs(lessonsRef);

    const lessons = snapshot.docs.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id
    }));

    return lessons.sort((a, b) => {
      const numA = parseInt((a.id || "").split("_")[1]) || 0;
      const numB = parseInt((b.id || "").split("_")[1]) || 0;
      return numA - numB;
    });
  } catch (error) {
    console.error("Error getting lessons:", error);
    throw error;
  }
};

export const getLessonContent = async (nivel, lessonId) => {
  try {
    const levelRef = doc(db, "levels", nivel);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonId);
    const lessonDoc = await getDoc(lessonRef);

    if (!lessonDoc.exists()) {
      throw new Error(`Lesson ${lessonId} not found in level ${nivel}`);
    }

    return {
      ...lessonDoc.data(),
      id: lessonDoc.id
    };
  } catch (error) {
    console.error("Error getting lesson content:", error);
    throw error;
  }
};

export const createLesson = async (lessonData) => {
  try {
    validateLessonData(lessonData);

    const lessonToSave = normalizeLessonForFirestore(lessonData, false);
    const nivel = lessonToSave.nivel;

    const levelRef = doc(db, "levels", nivel);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonToSave.id);

    await setDoc(lessonRef, lessonToSave);

    return lessonToSave;
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
};

export const updateLesson = async (lessonData) => {
  try {
    validateLessonData(lessonData);

    const lessonToUpdate = normalizeLessonForFirestore(lessonData, true);
    const nivel = lessonToUpdate.nivel;

    const levelRef = doc(db, "levels", nivel);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonToUpdate.id);

    await setDoc(lessonRef, lessonToUpdate, { merge: true });

    return lessonToUpdate;
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

export const deleteLesson = async (nivel, lessonId) => {
  try {
    const levelRef = doc(db, "levels", nivel);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonId);
    const lessonDoc = await getDoc(lessonRef);

    if (!lessonDoc.exists()) {
      throw new Error(`Lesson ${lessonId} not found in level ${nivel}`);
    }

    await deleteDoc(lessonRef);
    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

export const checkLessonExists = async (nivel, lessonId) => {
  try {
    const levelRef = doc(db, "levels", nivel);
    const lessonRef = doc(collection(levelRef, "lessons"), lessonId);
    const lessonDoc = await getDoc(lessonRef);

    return lessonDoc.exists();
  } catch (error) {
    console.error("Error checking lesson existence:", error);
    return false;
  }
};

export const duplicateLesson = async (nivel, lessonId, newLessonId) => {
  try {
    const originalLesson = await getLessonContent(nivel, lessonId);

    if (!originalLesson) {
      throw new Error("Original lesson not found");
    }

    const newLesson = {
      ...originalLesson,
      id: newLessonId,
      lessonId: newLessonId,
      titulo: `Copia de ${originalLesson.titulo || "lección"}`,
      nivel: newLessonId.split("_")[0],
      level: newLessonId.split("_")[0],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createLesson(newLesson);

    return newLesson;
  } catch (error) {
    console.error("Error duplicating lesson:", error);
    throw error;
  }
};

export const bulkUpdateLessons = async (nivel, updates) => {
  try {
    const batch = writeBatch(db);
    const levelRef = doc(db, "levels", nivel);

    updates.forEach((update) => {
      const { id, ...updateData } = update;

      const lessonRef = doc(collection(levelRef, "lessons"), id);

      const normalizedData = normalizeLessonForFirestore(
        {
          ...updateData,
          id,
          nivel,
          updatedAt: new Date().toISOString()
        },
        true
      );

      batch.set(lessonRef, normalizedData, { merge: true });
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error in bulk update:", error);
    throw error;
  }
};

export const getNextLessonNumber = async (nivel) => {
  try {
    const lessons = await getLessonsByLevel(nivel);

    const numbers = lessons
      .map((lesson) => parseInt((lesson.id || "").split("_")[1]))
      .filter((number) => !Number.isNaN(number));

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch (error) {
    console.error("Error getting next lesson number:", error);
    throw error;
  }
};

export default {
  getLessonContent,
  getLessonsByLevel,
  createLesson,
  updateLesson,
  deleteLesson,
  checkLessonExists,
  duplicateLesson,
  bulkUpdateLessons,
  getNextLessonNumber
};