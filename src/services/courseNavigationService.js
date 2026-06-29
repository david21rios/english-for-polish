// src/services/courseNavigationService.js

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import {
  getCourseLevel,
  getFlatLessonsByLevel,
  getFirstAvailableLesson
} from "./courseService";

import {
  getLessonProgress,
  saveLessonProgress,
  markLessonAsCompleted
} from "./progressService";

const LESSON_SECTIONS = [
  { id: "intro", title: "Introducción" },
  { id: "vocabulary", title: "Vocabulario" },
  { id: "grammar", title: "Gramática" },
  { id: "reading", title: "Lectura" },
  { id: "practice", title: "Práctica Interactiva" },
  { id: "writing", title: "Producción Escrita" },
  { id: "speaking", title: "Producción Oral" },
  { id: "evaluation", title: "Evaluación" },
  { id: "resources", title: "Recursos" },
  { id: "reflection", title: "Cierre" }
];

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const getLessonSections = () => LESSON_SECTIONS;

export const getNextLevel = (currentLevel) => {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  return currentIndex < LEVEL_ORDER.length - 1
    ? LEVEL_ORDER[currentIndex + 1]
    : null;
};

export const getPreviousLevel = (currentLevel) => {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  return currentIndex > 0 ? LEVEL_ORDER[currentIndex - 1] : null;
};

export const getUserCourseProfile = async (userId) => {
  if (!userId) {
    return {
      userId: null,
      ageGroup: null,
      currentLevel: "A1"
    };
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return {
      userId,
      ageGroup: null,
      currentLevel: "A1"
    };
  }

  const userData = userSnap.data();

  const currentLevel =
    userData.currentLevel ||
    userData.level ||
    userData.finalLevel ||
    "A1";

  return {
    userId,
    ageGroup: userData.ageGroup || null,
    currentLevel: currentLevel?.split("-")?.[0] || currentLevel || "A1"
  };
};

export const getLevelNavigationData = async ({
  levelId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const level = await getCourseLevel({
    levelId,
    userAgeGroup,
    includeDrafts
  });

  if (!level) {
    throw new Error(`Level ${levelId} not found.`);
  }

  const flatLessons = level.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleId: lesson.moduleId || module.moduleId,
      moduleTitle: lesson.moduleTitle || module.title,
      moduleOrder: module.order
    }))
  );

  return {
    level,
    modules: level.modules,
    lessons: flatLessons,
    totalModules: level.totalModules,
    totalLessons: level.totalLessons,
    hasLessons: level.hasLessons
  };
};

export const getLessonByIdFromLevel = async ({
  levelId,
  lessonId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const lessons = await getFlatLessonsByLevel({
    levelId,
    userAgeGroup,
    includeDrafts
  });

  return lessons.find((lesson) => lesson.id === lessonId) || null;
};

export const getInitialLessonForLevel = async ({
  levelId,
  requestedLessonId = null,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  if (requestedLessonId) {
    const requestedLesson = await getLessonByIdFromLevel({
      levelId,
      lessonId: requestedLessonId,
      userAgeGroup,
      includeDrafts
    });

    if (requestedLesson) return requestedLesson;
  }

  return getFirstAvailableLesson({
    levelId,
    userAgeGroup
  });
};

export const getLessonContentFromModule = async ({
  levelId,
  moduleId,
  lessonId
}) => {
  if (!levelId || !moduleId || !lessonId) return null;

  const lessonRef = doc(
    db,
    "levels",
    levelId,
    "modules",
    moduleId,
    "lessons",
    lessonId
  );

  const lessonSnap = await getDoc(lessonRef);

  if (!lessonSnap.exists()) return null;

  return {
    id: lessonSnap.id,
    lessonId: lessonSnap.id,
    ...lessonSnap.data()
  };
};

const processExercises = (ejercicios) => {
  if (!Array.isArray(ejercicios)) return [];

  return ejercicios.filter(Boolean).map((ejercicio) => {
    const tipo =
      ejercicio.tipo?.toLowerCase() ||
      ejercicio.type?.toLowerCase() ||
      "seleccion_multiple";

    return {
      ...ejercicio,
      tipo,
      pregunta: ejercicio.pregunta || ejercicio.question || "",
      instrucciones: ejercicio.instrucciones || "",
      opciones: ejercicio.opciones || ejercicio.options || [],
      respuesta_correcta:
        ejercicio.respuesta_correcta ||
        ejercicio.answer ||
        ejercicio.correctAnswer ||
        "",
      respuestas: ejercicio.respuestas || ejercicio.respuestas_correctas || {},
      respuestas_correctas:
        ejercicio.respuestas_correctas || ejercicio.respuestas || {},
      respuestas_aceptadas: ejercicio.respuestas_aceptadas || {},
      elementos: ejercicio.elementos || ejercicio.items || [],
      orden_correcto: ejercicio.orden_correcto || ejercicio.correctOrder || [],
      pares_izquierda:
        ejercicio.pares_izquierda ||
        ejercicio.elementos_izquierda ||
        ejercicio.leftItems ||
        [],
      pares_derecha:
        ejercicio.pares_derecha ||
        ejercicio.elementos_derecha ||
        ejercicio.rightItems ||
        [],
      pares_correctos: ejercicio.pares_correctos || {}
    };
  });
};

export const buildLessonDetails = (baseLesson, lessonContent) => {
  if (!lessonContent) return baseLesson;

  const practiceExercises = processExercises(
    lessonContent.practica_interactiva?.ejercicios
  );

  return {
    ...baseLesson,
    ...lessonContent,

    contenidos: {
      vocabulario: lessonContent.contenidos?.vocabulario || {},
      gramatica: lessonContent.contenidos?.gramatica || {
        temas: [],
        reglas: []
      }
    },

    lectura: lessonContent.lectura || {
      titulo: "",
      autor: "",
      contenido: "",
      preguntas: []
    },

    practica_interactiva: {
      titulo:
        lessonContent.practica_interactiva?.titulo || "Práctica Interactiva",
      descripcion: lessonContent.practica_interactiva?.descripcion || "",
      ejercicios: practiceExercises
    },

    produccion_escrita: {
      titulo: lessonContent.produccion_escrita?.titulo || "",
      descripcion: lessonContent.produccion_escrita?.descripcion || "",
      ejercicios: lessonContent.produccion_escrita?.ejercicios || []
    },

    produccion_oral: {
      titulo: lessonContent.produccion_oral?.titulo || "",
      descripcion: lessonContent.produccion_oral?.descripcion || "",
      ejercicios: lessonContent.produccion_oral?.ejercicios || []
    },

    evaluacion: {
      autoevaluacion: lessonContent.evaluacion?.autoevaluacion || "",
      cuestionario: lessonContent.evaluacion?.cuestionario || []
    },

    recursos_adicionales: lessonContent.recursos_adicionales || [],
    reflexion_final: lessonContent.reflexion_final || ""
  };
};

export const loadLessonDetails = async ({ levelId, lesson }) => {
  if (!levelId || !lesson) return null;

  const moduleId = lesson.moduleId;

  if (!moduleId) {
    throw new Error("Lesson does not have moduleId.");
  }

  const lessonContent = await getLessonContentFromModule({
    levelId,
    moduleId,
    lessonId: lesson.id
  });

  return buildLessonDetails(lesson, lessonContent);
};

export const getLessonIndex = (lessons = [], lessonId) => {
  return lessons.findIndex((lesson) => lesson.id === lessonId);
};

export const getPreviousLesson = (lessons = [], currentLessonId) => {
  const currentIndex = getLessonIndex(lessons, currentLessonId);

  if (currentIndex <= 0) return null;

  return lessons[currentIndex - 1];
};

export const getNextLesson = (lessons = [], currentLessonId) => {
  const currentIndex = getLessonIndex(lessons, currentLessonId);

  if (currentIndex === -1 || currentIndex >= lessons.length - 1) return null;

  return lessons[currentIndex + 1];
};

export const loadLessonProgressState = async ({
  userId,
  levelId,
  lessonId,
  requestedSectionIndex = null
}) => {
  const progress = await getLessonProgress(userId, levelId, lessonId);

  const safeSectionIndex = Number.isInteger(progress?.currentSectionIndex)
    ? progress.currentSectionIndex
    : 0;

  const safeCompletedSections = Array.isArray(progress?.completedSections)
    ? progress.completedSections
    : [];

  return {
    currentSectionIndex: requestedSectionIndex ?? safeSectionIndex,
    completedSections: safeCompletedSections
  };
};

export const saveLessonProgressState = async ({
  userId,
  levelId,
  lessonId,
  currentSectionIndex,
  completedSections = [],
  completed = false
}) => {
  if (!userId || !levelId || !lessonId) return false;

  await saveLessonProgress({
    userId,
    levelId,
    lessonId,
    currentSectionIndex,
    completedSections,
    totalSections: LESSON_SECTIONS.length,
    completed
  });

  return true;
};

export const completeLessonForUser = async ({
  userId,
  levelId,
  lessonId,
  completedSections = LESSON_SECTIONS.map((section) => section.id)
}) => {
  if (!userId || !levelId || !lessonId) return false;

  await markLessonAsCompleted({
    userId,
    levelId,
    lessonId,
    completedSections,
    totalSections: LESSON_SECTIONS.length
  });

  return true;
};

export default {
  getLessonSections,
  getNextLevel,
  getPreviousLevel,
  getUserCourseProfile,
  getLevelNavigationData,
  getLessonByIdFromLevel,
  getInitialLessonForLevel,
  getLessonContentFromModule,
  buildLessonDetails,
  loadLessonDetails,
  getLessonIndex,
  getPreviousLesson,
  getNextLesson,
  loadLessonProgressState,
  saveLessonProgressState,
  completeLessonForUser
};