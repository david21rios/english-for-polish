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

const normalizeText = (value = "") => String(value || "").trim();

const normalizeLessonForFirestore = (lessonData, isUpdate = false) => {
  const cleanedData = cleanLessonData(lessonData);
  const nivel = cleanedData.nivel || cleanedData.level || cleanedData.id?.split("_")[0];
  const moduleId = cleanedData.moduleId || "";

  const now = new Date().toISOString();

  return {
    ...cleanedData,

    id: cleanedData.id,
    lessonId: cleanedData.id,
    nivel,
    level: nivel,
    moduleId,

    orderInModule: Number(cleanedData.orderInModule) || 0,
    ageGroup: cleanedData.ageGroup || "all",
    status: cleanedData.status || "draft",

    contenidos: cleanedData.contenidos || cleanedData.content || {
      vocabulario: {},
      gramatica: { temas: [] }
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

    content: cleanedData.contenidos || cleanedData.content || {},
    activities: cleanedData.actividades || cleanedData.activities || [],

    ...(isUpdate
      ? { updatedAt: now }
      : { createdAt: now, updatedAt: now })
  };
};

const sortLessons = (lessons = []) => {
  return [...lessons].sort((a, b) => {
    const moduleA = String(a.moduleId || "");
    const moduleB = String(b.moduleId || "");

    if (moduleA !== moduleB) return moduleA.localeCompare(moduleB);

    const orderA = Number(a.orderInModule) || 999;
    const orderB = Number(b.orderInModule) || 999;

    if (orderA !== orderB) return orderA - orderB;

    const numA = parseInt((a.id || "").split("_").pop()) || 0;
    const numB = parseInt((b.id || "").split("_").pop()) || 0;

    return numA - numB;
  });
};

const getLevelLessonsRef = (nivel) => {
  return collection(db, "levels", nivel, "lessons");
};

const getLevelLessonRef = (nivel, lessonId) => {
  return doc(db, "levels", nivel, "lessons", lessonId);
};

const getModuleLessonsRef = (nivel, moduleId) => {
  return collection(db, "levels", nivel, "modules", moduleId, "lessons");
};

const getModuleLessonRef = (nivel, moduleId, lessonId) => {
  return doc(db, "levels", nivel, "modules", moduleId, "lessons", lessonId);
};

export const getLessonsByLevel = async (nivel) => {
  try {
    if (!nivel) return [];

    const levelLessonsSnapshot = await getDocs(getLevelLessonsRef(nivel));

    const legacyLessons = levelLessonsSnapshot.docs.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id
    }));

    const modulesSnapshot = await getDocs(collection(db, "levels", nivel, "modules"));

    const moduleLessonsGroups = await Promise.all(
      modulesSnapshot.docs.map(async (moduleSnapshot) => {
        const moduleId = moduleSnapshot.id;
        const lessonsSnapshot = await getDocs(getModuleLessonsRef(nivel, moduleId));

        return lessonsSnapshot.docs.map((lessonSnapshot) => ({
          ...lessonSnapshot.data(),
          id: lessonSnapshot.id,
          moduleId: lessonSnapshot.data().moduleId || moduleId,
          moduleTitle: moduleSnapshot.data().title || ""
        }));
      })
    );

    const moduleLessons = moduleLessonsGroups.flat();

    const lessonsMap = new Map();

    legacyLessons.forEach((lesson) => {
      lessonsMap.set(lesson.id, lesson);
    });

    moduleLessons.forEach((lesson) => {
      lessonsMap.set(lesson.id, {
        ...lessonsMap.get(lesson.id),
        ...lesson
      });
    });

    return sortLessons(Array.from(lessonsMap.values()));
  } catch (error) {
    console.error("Error getting lessons:", error);
    throw error;
  }
};

export const getLessonsByModule = async (nivel, moduleId) => {
  try {
    if (!nivel || !moduleId) return [];

    const snapshot = await getDocs(getModuleLessonsRef(nivel, moduleId));

    return sortLessons(
      snapshot.docs.map((documentSnapshot) => ({
        ...documentSnapshot.data(),
        id: documentSnapshot.id,
        moduleId
      }))
    );
  } catch (error) {
    console.error("Error getting lessons by module:", error);
    throw error;
  }
};

export const getLessonContent = async (nivel, lessonId, moduleId = "") => {
  try {
    if (!nivel || !lessonId) return null;

    if (moduleId) {
      const moduleLessonDoc = await getDoc(getModuleLessonRef(nivel, moduleId, lessonId));

      if (moduleLessonDoc.exists()) {
        return {
          ...moduleLessonDoc.data(),
          id: moduleLessonDoc.id,
          moduleId
        };
      }
    }

    const legacyLessonDoc = await getDoc(getLevelLessonRef(nivel, lessonId));

    if (legacyLessonDoc.exists()) {
      return {
        ...legacyLessonDoc.data(),
        id: legacyLessonDoc.id
      };
    }

    const modulesSnapshot = await getDocs(collection(db, "levels", nivel, "modules"));

    for (const moduleSnapshot of modulesSnapshot.docs) {
      const moduleLessonDoc = await getDoc(
        getModuleLessonRef(nivel, moduleSnapshot.id, lessonId)
      );

      if (moduleLessonDoc.exists()) {
        return {
          ...moduleLessonDoc.data(),
          id: moduleLessonDoc.id,
          moduleId: moduleSnapshot.id,
          moduleTitle: moduleSnapshot.data().title || ""
        };
      }
    }

    throw new Error(`Lesson ${lessonId} not found in level ${nivel}`);
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
    const moduleId = normalizeText(lessonToSave.moduleId);

    if (!nivel) throw new Error("La lección debe tener nivel.");
    if (!moduleId) throw new Error("La lección debe estar asignada a un módulo.");

    const batch = writeBatch(db);

    batch.set(getModuleLessonRef(nivel, moduleId, lessonToSave.id), lessonToSave);

    batch.set(getLevelLessonRef(nivel, lessonToSave.id), lessonToSave, {
      merge: true
    });

    await batch.commit();

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
    const moduleId = normalizeText(lessonToUpdate.moduleId);

    if (!nivel) throw new Error("La lección debe tener nivel.");
    if (!moduleId) throw new Error("La lección debe estar asignada a un módulo.");

    const batch = writeBatch(db);

    batch.set(getModuleLessonRef(nivel, moduleId, lessonToUpdate.id), lessonToUpdate, {
      merge: true
    });

    batch.set(getLevelLessonRef(nivel, lessonToUpdate.id), lessonToUpdate, {
      merge: true
    });

    await batch.commit();

    return lessonToUpdate;
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

export const deleteLesson = async (nivel, lessonId, moduleId = "") => {
  try {
    const lesson = await getLessonContent(nivel, lessonId, moduleId);
    const finalModuleId = moduleId || lesson?.moduleId || "";

    const batch = writeBatch(db);

    batch.delete(getLevelLessonRef(nivel, lessonId));

    if (finalModuleId) {
      batch.delete(getModuleLessonRef(nivel, finalModuleId, lessonId));
    }

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

export const checkLessonExists = async (nivel, lessonId, moduleId = "") => {
  try {
    if (moduleId) {
      const moduleLessonDoc = await getDoc(getModuleLessonRef(nivel, moduleId, lessonId));
      if (moduleLessonDoc.exists()) return true;
    }

    const legacyLessonDoc = await getDoc(getLevelLessonRef(nivel, lessonId));

    return legacyLessonDoc.exists();
  } catch (error) {
    console.error("Error checking lesson existence:", error);
    return false;
  }
};

export const duplicateLesson = async (nivel, lessonId, newLessonId, moduleId = "") => {
  try {
    const originalLesson = await getLessonContent(nivel, lessonId, moduleId);

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
      moduleId: originalLesson.moduleId || moduleId,
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

    updates.forEach((update) => {
      const { id, ...updateData } = update;
      const moduleId = updateData.moduleId || "";

      const normalizedData = normalizeLessonForFirestore(
        {
          ...updateData,
          id,
          nivel,
          updatedAt: new Date().toISOString()
        },
        true
      );

      batch.set(getLevelLessonRef(nivel, id), normalizedData, { merge: true });

      if (moduleId) {
        batch.set(getModuleLessonRef(nivel, moduleId, id), normalizedData, {
          merge: true
        });
      }
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
      .map((lesson) => parseInt((lesson.id || "").split("_").pop()))
      .filter((number) => !Number.isNaN(number));

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch (error) {
    console.error("Error getting next lesson number:", error);
    throw error;
  }
};

export const getNextLessonOrderInModule = async (nivel, moduleId) => {
  try {
    const lessons = await getLessonsByModule(nivel, moduleId);

    const orders = lessons
      .map((lesson) => Number(lesson.orderInModule) || 0)
      .filter((number) => number > 0);

    return orders.length > 0 ? Math.max(...orders) + 1 : 1;
  } catch (error) {
    console.error("Error getting next lesson order in module:", error);
    return 1;
  }
};

export default {
  getLessonContent,
  getLessonsByLevel,
  getLessonsByModule,
  createLesson,
  updateLesson,
  deleteLesson,
  checkLessonExists,
  duplicateLesson,
  bulkUpdateLessons,
  getNextLessonNumber,
  getNextLessonOrderInModule
};