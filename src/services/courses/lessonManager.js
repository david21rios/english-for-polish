// src/services/lessonManager.js

import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
} from "firebase/firestore";

import {
  cleanLessonData,
  validateLessonData
} from "../../utils/lessonStructure";

import { getCanonicalLessonData } from "../../utils/lessonNormalizer";

const normalizeText = (value = "") => String(value || "").trim();

const toArray = (value) => (Array.isArray(value) ? value : []);

const adaptWritingActivityForAdmin = (activity = {}) => ({
  ...activity,
  instrucciones:
    activity.instrucciones ||
    activity.instructions ||
    activity.instruction ||
    activity.prompt ||
    "",
  consigna:
    activity.consigna ||
    activity.prompt ||
    activity.instruction ||
    "",
  guia:
    activity.guia ||
    activity.guide ||
    "",
  extension_minima:
    activity.extension_minima ??
    activity.minimumWords ??
    activity.minWords ??
    1,
  extension_maxima:
    activity.extension_maxima ??
    activity.maximumWords ??
    activity.maxWords ??
    "",
  tiempo_sugerido:
    activity.tiempo_sugerido ??
    activity.suggestedTimeMinutes ??
    activity.suggestedMinutes ??
    "",
  criterios:
    activity.criterios ||
    activity.criteria ||
    []
});

const adaptSpeakingActivityForAdmin = (activity = {}) => ({
  ...activity,
  consigna:
    activity.consigna ||
    activity.prompt ||
    activity.instruction ||
    "",
  guia:
    activity.guia ||
    activity.guide ||
    "",
  duracion_recomendada:
    activity.duracion_recomendada ||
    activity.recommendedDuration ||
    "",
  tiempo_sugerido:
    activity.tiempo_sugerido ??
    activity.suggestedTimeMinutes ??
    activity.suggestedMinutes ??
    "",
  criterios:
    activity.criterios ||
    activity.criteria ||
    []
});

const adaptLessonForAdmin = (lesson = {}) => {
  const canonical = getCanonicalLessonData(lesson);

  return {
    ...lesson,

    title: lesson.title || canonical.title || "",
    description: lesson.description || canonical.description || "",

    titulo: lesson.titulo || lesson.title || canonical.title || "",
    descripcion:
      lesson.descripcion ||
      lesson.description ||
      canonical.description ||
      "",

    objetivos:
      lesson.objetivos ||
      lesson.objectives ||
      canonical.objectives ||
      [],

    contenidos: lesson.contenidos || {
      vocabulario: {
        titulo: canonical.vocabulary?.title || "Vocabulary",
        palabras: canonical.vocabulary?.items || []
      },
      gramatica: {
        temas: canonical.grammar?.topics || [],
        reglas: canonical.grammar?.rules || []
      }
    },

    lectura: lesson.lectura || {
      titulo: canonical.reading?.title || "",
      autor: canonical.reading?.author || "AI Tutor",
      contenido: canonical.reading?.text || "",
      preguntas: canonical.reading?.questions || []
    },

    practica_interactiva: lesson.practica_interactiva || {
      titulo: canonical.practice?.title || "",
      descripcion: canonical.practice?.description || "",
      ejercicios: canonical.practice?.exercises || []
    },

    produccion_escrita: lesson.produccion_escrita || {
      titulo: canonical.writing?.title || "",
      descripcion: canonical.writing?.description || "",
      ejercicios: toArray(canonical.writing?.activities).map(
        adaptWritingActivityForAdmin
      )
    },

    produccion_oral: lesson.produccion_oral || {
      titulo: canonical.speaking?.title || "",
      descripcion: canonical.speaking?.description || "",
      ejercicios: toArray(canonical.speaking?.activities).map(
        adaptSpeakingActivityForAdmin
      )
    },

    evaluacion: lesson.evaluacion || {
      autoevaluacion: canonical.evaluation?.selfAssessment || "",
      cuestionario: canonical.evaluation?.questions || [],
      criterios_evaluacion: []
    },

    recursos_adicionales:
      lesson.recursos_adicionales ||
      canonical.resources ||
      [],

    reflexion_final:
      lesson.reflexion_final ||
      canonical.reflection ||
      ""
  };
};

const normalizeLessonForFirestore = (lessonData, isUpdate = false) => {
  const cleanedData = cleanLessonData(lessonData);

  const nivel =
    cleanedData.nivel ||
    cleanedData.level ||
    cleanedData.id?.split("_")[0];

  const moduleId = normalizeText(cleanedData.moduleId);
  const now = new Date().toISOString();

  return {
    ...cleanedData,

    id: cleanedData.id,
    lessonId: cleanedData.lessonId || cleanedData.id,
    nivel,
    level: nivel,
    moduleId,

    orderInModule: Number(cleanedData.orderInModule) || 0,
    ageGroup: cleanedData.ageGroup || "all",
    status: cleanedData.status || "draft",

    title: cleanedData.title || cleanedData.titulo || "",
    description: cleanedData.description || cleanedData.descripcion || "",

    titulo: cleanedData.titulo || cleanedData.title || "",
    descripcion: cleanedData.descripcion || cleanedData.description || "",

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

    const numA = parseInt((a.id || "").split("_").pop(), 10) || 0;
    const numB = parseInt((b.id || "").split("_").pop(), 10) || 0;

    return numA - numB;
  });
};

const getLevelLessonsRef = (nivel) =>
  collection(db, "levels", nivel, "lessons");

const getLevelLessonRef = (nivel, lessonId) =>
  doc(db, "levels", nivel, "lessons", lessonId);

const getModulesRef = (nivel) =>
  collection(db, "levels", nivel, "modules");

const getModuleLessonsRef = (nivel, moduleId) =>
  collection(db, "levels", nivel, "modules", moduleId, "lessons");

const getModuleLessonRef = (nivel, moduleId, lessonId) =>
  doc(db, "levels", nivel, "modules", moduleId, "lessons", lessonId);

const getAllModuleLessons = async (nivel) => {
  const modulesSnapshot = await getDocs(getModulesRef(nivel));

  const moduleLessonsGroups = await Promise.all(
    modulesSnapshot.docs.map(async (moduleSnapshot) => {
      const moduleId = moduleSnapshot.id;
      const moduleData = moduleSnapshot.data();
      const lessonsSnapshot = await getDocs(getModuleLessonsRef(nivel, moduleId));

      return lessonsSnapshot.docs.map((lessonSnapshot) => ({
        ...lessonSnapshot.data(),
        id: lessonSnapshot.id,
        lessonId: lessonSnapshot.data().lessonId || lessonSnapshot.id,
        moduleId: lessonSnapshot.data().moduleId || moduleId,
        moduleTitle: moduleData.title || ""
      }));
    })
  );

  return moduleLessonsGroups.flat();
};

export const getLessonsByLevel = async (nivel) => {
  try {
    if (!nivel) return [];

    const moduleLessons = await getAllModuleLessons(nivel);

    return sortLessons(moduleLessons);
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
        lessonId: documentSnapshot.data().lessonId || documentSnapshot.id,
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
      const moduleLessonDoc = await getDoc(
        getModuleLessonRef(nivel, moduleId, lessonId)
      );

      if (moduleLessonDoc.exists()) {
        return adaptLessonForAdmin({
          ...moduleLessonDoc.data(),
          id: moduleLessonDoc.id,
          lessonId: moduleLessonDoc.data().lessonId || moduleLessonDoc.id,
          moduleId
        });
      }
    }

    const modulesSnapshot = await getDocs(getModulesRef(nivel));

    for (const moduleSnapshot of modulesSnapshot.docs) {
      const moduleLessonDoc = await getDoc(
        getModuleLessonRef(nivel, moduleSnapshot.id, lessonId)
      );

      if (moduleLessonDoc.exists()) {
        return adaptLessonForAdmin({
          ...moduleLessonDoc.data(),
          id: moduleLessonDoc.id,
          lessonId: moduleLessonDoc.data().lessonId || moduleLessonDoc.id,
          moduleId: moduleSnapshot.id,
          moduleTitle: moduleSnapshot.data().title || ""
        });
      }
    }

    const legacyLessonDoc = await getDoc(getLevelLessonRef(nivel, lessonId));

    if (legacyLessonDoc.exists()) {
      return adaptLessonForAdmin({
        ...legacyLessonDoc.data(),
        id: legacyLessonDoc.id,
        lessonId: legacyLessonDoc.data().lessonId || legacyLessonDoc.id
      });
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

    await setDoc(
      getModuleLessonRef(nivel, moduleId, lessonToSave.id),
      lessonToSave
    );

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

    await setDoc(
      getModuleLessonRef(nivel, moduleId, lessonToUpdate.id),
      lessonToUpdate,
      { merge: true }
    );

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

    if (finalModuleId) {
      batch.delete(getModuleLessonRef(nivel, finalModuleId, lessonId));
    }

    batch.delete(getLevelLessonRef(nivel, lessonId));

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

export const checkLessonExists = async (nivel, lessonId, moduleId = "") => {
  try {
    if (!nivel || !lessonId) return false;

    if (moduleId) {
      const moduleLessonDoc = await getDoc(
        getModuleLessonRef(nivel, moduleId, lessonId)
      );

      return moduleLessonDoc.exists();
    }

    const moduleLessons = await getAllModuleLessons(nivel);

    return moduleLessons.some(
      (lesson) => lesson.id === lessonId || lesson.lessonId === lessonId
    );
  } catch (error) {
    console.error("Error checking lesson existence:", error);
    return false;
  }
};

export const duplicateLesson = async (
  nivel,
  lessonId,
  newLessonId,
  moduleId = ""
) => {
  try {
    const originalLesson = await getLessonContent(nivel, lessonId, moduleId);

    if (!originalLesson) {
      throw new Error("Original lesson not found");
    }

    const newLesson = {
      ...originalLesson,
      id: newLessonId,
      lessonId: newLessonId,
      titulo: `Copia de ${
        originalLesson.titulo ||
        originalLesson.title ||
        "lección"
      }`,
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
      const moduleId = normalizeText(updateData.moduleId);

      if (!moduleId) return;

      const normalizedData = normalizeLessonForFirestore(
        {
          ...updateData,
          id,
          nivel,
          updatedAt: new Date().toISOString()
        },
        true
      );

      batch.set(
        getModuleLessonRef(nivel, moduleId, id),
        normalizedData,
        { merge: true }
      );
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
      .map((lesson) => parseInt((lesson.id || "").split("_").pop(), 10))
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