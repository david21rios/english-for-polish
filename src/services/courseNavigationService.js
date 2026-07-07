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
  getLastLessonProgress,
  saveLessonProgress,
  markLessonAsCompleted
} from "./progressService";

import { getCanonicalLessonData } from "../utils/lessonNormalizer";

const LESSON_SECTIONS = [
  { id: "intro", title: "Wprowadzenie" },
  { id: "vocabulary", title: "Słownictwo" },
  { id: "grammar", title: "Gramatyka" },
  { id: "reading", title: "Czytanie" },
  { id: "practice", title: "Ćwiczenia interaktywne" },
  { id: "writing", title: "Pisanie" },
  { id: "speaking", title: "Mówienie" },
  { id: "evaluation", title: "Ocena" },
  { id: "resources", title: "Materiały" },
  { id: "reflection", title: "Podsumowanie" }
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
    throw new Error(`Nie znaleziono poziomu ${levelId}.`);
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
  userId = null,
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

  if (userId) {
    const lastProgress = await getLastLessonProgress(userId);

    if (lastProgress?.levelId === levelId && lastProgress?.lessonId) {
      const lastLesson = await getLessonByIdFromLevel({
        levelId,
        lessonId: lastProgress.lessonId,
        userAgeGroup,
        includeDrafts
      });

      if (lastLesson) return lastLesson;
    }
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

const buildLegacyCompatibilityLayer = (canonicalLesson = {}) => {
  return {
    titulo: canonicalLesson.title || "",
    descripcion: canonicalLesson.description || "",
    objetivos: canonicalLesson.objectives || [],

    contenidos: {
      vocabulario: {
        titulo: canonicalLesson.vocabulary?.title || "",
        palabras: canonicalLesson.vocabulary?.items || [],
        items: canonicalLesson.vocabulary?.items || []
      },
      gramatica: {
        titulo: canonicalLesson.grammar?.title || "",
        explicacion: canonicalLesson.grammar?.explanation || "",
        reglas: canonicalLesson.grammar?.rules || [],
        examples: canonicalLesson.grammar?.examples || [],
        temas: canonicalLesson.grammar?.rules || []
      }
    },

    lectura: {
      titulo: canonicalLesson.reading?.title || "",
      autor: canonicalLesson.reading?.author || "",
      contenido: canonicalLesson.reading?.text || "",
      preguntas: canonicalLesson.reading?.questions || []
    },

    practica_interactiva: {
      titulo: canonicalLesson.practice?.title || "",
      descripcion: canonicalLesson.practice?.description || "",
      ejercicios: canonicalLesson.practice?.exercises || []
    },

    produccion_escrita: {
      titulo: canonicalLesson.writing?.title || "",
      descripcion: canonicalLesson.writing?.description || "",
      ejercicios: canonicalLesson.writing?.activities || []
    },

    produccion_oral: {
      titulo: canonicalLesson.speaking?.title || "",
      descripcion: canonicalLesson.speaking?.description || "",
      ejercicios: canonicalLesson.speaking?.activities || []
    },

    evaluacion: {
      titulo: canonicalLesson.evaluation?.title || "",
      autoevaluacion: canonicalLesson.evaluation?.selfAssessment || "",
      cuestionario: canonicalLesson.evaluation?.questions || []
    },

    recursos_adicionales: canonicalLesson.resources || [],
    reflexion_final: canonicalLesson.reflection || ""
  };
};

export const buildLessonDetails = (baseLesson, lessonContent) => {
  const mergedLesson = {
    ...(baseLesson || {}),
    ...(lessonContent || {})
  };

  const canonicalLesson = getCanonicalLessonData(mergedLesson);
  const legacyCompatibility = buildLegacyCompatibilityLayer(canonicalLesson);

  return {
    ...mergedLesson,
    ...legacyCompatibility,
    ...canonicalLesson,

    id: canonicalLesson.id || mergedLesson.id || mergedLesson.lessonId || "",
    lessonId:
      canonicalLesson.lessonId || mergedLesson.lessonId || mergedLesson.id || "",
    level: canonicalLesson.level || mergedLesson.level || mergedLesson.nivel || "",
    nivel: canonicalLesson.level || mergedLesson.level || mergedLesson.nivel || "",
    moduleId: canonicalLesson.moduleId || mergedLesson.moduleId || "",
    moduleTitle: canonicalLesson.moduleTitle || mergedLesson.moduleTitle || "",
    orderInModule:
      canonicalLesson.orderInModule || mergedLesson.orderInModule || 1,
    status: canonicalLesson.status || mergedLesson.status || "draft",
    ageGroup: canonicalLesson.ageGroup || mergedLesson.ageGroup || "all"
  };
};

export const loadLessonDetails = async ({ levelId, lesson }) => {
  if (!levelId || !lesson) return null;

  const moduleId = lesson.moduleId;

  if (!moduleId) {
    throw new Error("Lekcja nie ma przypisanego modułu.");
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

  const safeActivityResults =
    progress?.activityResults && typeof progress.activityResults === "object"
      ? progress.activityResults
      : {};

  return {
    currentSectionIndex: requestedSectionIndex ?? safeSectionIndex,
    completedSections: safeCompletedSections,
    activityResults: safeActivityResults
  };
};

export const saveLessonProgressState = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  currentSectionIndex,
  completedSections = [],
  activityResults = {},
  completed = false
}) => {
  if (!userId || !levelId || !lessonId) return false;

  await saveLessonProgress({
    userId,
    levelId,
    lessonId,
    moduleId,
    currentSectionIndex,
    completedSections,
    activityResults,
    totalSections: LESSON_SECTIONS.length,
    completed
  });

  return true;
};

export const completeLessonForUser = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  completedSections = LESSON_SECTIONS.map((section) => section.id),
  activityResults = {}
}) => {
  if (!userId || !levelId || !lessonId) return false;

  await markLessonAsCompleted({
    userId,
    levelId,
    lessonId,
    moduleId,
    completedSections,
    activityResults,
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