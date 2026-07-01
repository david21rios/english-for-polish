// src/services/progressService.js

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import { getFlatLessonsByLevel } from "./courseService";

const getProgressDocId = (levelId, lessonId) => {
  return `${levelId}_${lessonId}`;
};

export const getLessonProgress = async (userId, levelId, lessonId) => {
  if (!userId || !levelId || !lessonId) return null;

  try {
    const progressRef = doc(
      db,
      "users",
      userId,
      "progress",
      getProgressDocId(levelId, lessonId)
    );

    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) return null;

    return {
      id: progressSnap.id,
      activityResults: {},
      completedSections: [],
      ...progressSnap.data()
    };
  } catch (error) {
    console.error("Error getting lesson progress:", error);
    return null;
  }
};

export const saveLessonProgress = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  currentSectionIndex = 0,
  completedSections = [],
  activityResults = {},
  totalSections = 1,
  completed = false
}) => {
  if (!userId || !levelId || !lessonId) return null;

  try {
    const safeTotalSections = Math.max(Number(totalSections) || 1, 1);
    const safeCurrentSectionIndex = Math.max(
      Number(currentSectionIndex) || 0,
      0
    );

    const safeCompletedSections = Array.isArray(completedSections)
      ? completedSections
      : [];

    const safeActivityResults =
      activityResults && typeof activityResults === "object"
        ? activityResults
        : {};

    const progressPercentage = completed
      ? 100
      : Math.min(
          100,
          Math.round(
            ((safeCurrentSectionIndex + 1) / safeTotalSections) * 100
          )
        );

    const progressRef = doc(
      db,
      "users",
      userId,
      "progress",
      getProgressDocId(levelId, lessonId)
    );

    const existingSnap = await getDoc(progressRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const shouldSetCompletedAt =
      completed === true && !existingData?.completedAt;

    const progressData = {
      userId,
      levelId,
      lessonId,
      ...(moduleId ? { moduleId } : {}),
      currentSectionIndex: safeCurrentSectionIndex,
      completedSections: safeCompletedSections,
      activityResults: safeActivityResults,
      totalSections: safeTotalSections,
      progressPercentage,
      completed,
      updatedAt: serverTimestamp(),
      ...(shouldSetCompletedAt ? { completedAt: serverTimestamp() } : {})
    };

    await setDoc(progressRef, progressData, { merge: true });

    return progressData;
  } catch (error) {
    console.error("Error saving lesson progress:", error);
    throw error;
  }
};

export const markLessonAsCompleted = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  completedSections = [],
  activityResults = {},
  totalSections = 1
}) => {
  return saveLessonProgress({
    userId,
    levelId,
    lessonId,
    moduleId,
    currentSectionIndex: totalSections - 1,
    completedSections,
    activityResults,
    totalSections,
    completed: true
  });
};

export const getUserLevelProgressSummary = async ({
  userId,
  levelId,
  userAgeGroup = null
}) => {
  if (!userId || !levelId) {
    return {
      levelId,
      totalLessons: 0,
      completedLessons: 0,
      pendingLessons: 0,
      progressPercent: 0
    };
  }

  const publishedLessons = await getFlatLessonsByLevel({
    levelId,
    userAgeGroup,
    includeDrafts: false
  });

  const progressRef = collection(db, "users", userId, "progress");
  const progressSnap = await getDocs(progressRef);

  const completedLessonIds = progressSnap.docs
    .map((docSnap) => docSnap.data())
    .filter((progress) => progress.levelId === levelId && progress.completed)
    .map((progress) => progress.lessonId);

  const totalLessons = publishedLessons.length;

  const completedLessons = publishedLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id || lesson.lessonId)
  ).length;

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  return {
    levelId,
    totalLessons,
    completedLessons,
    pendingLessons: totalLessons - completedLessons,
    progressPercent
  };
};

export const getUserLearningActivitySummary = async (userId) => {
  if (!userId) {
    return {
      completedThisMonth: 0,
      updatedThisMonth: 0,
      lastActivity: null
    };
  }

  const progressRef = collection(db, "users", userId, "progress");
  const progressSnap = await getDocs(progressRef);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let completedThisMonth = 0;
  let updatedThisMonth = 0;
  let lastActivity = null;

  progressSnap.docs.forEach((docSnap) => {
    const progress = docSnap.data();

    const completedAt = progress.completedAt?.toDate?.() || null;
    const updatedAt = progress.updatedAt?.toDate?.() || null;

    if (
      completedAt &&
      completedAt.getMonth() === currentMonth &&
      completedAt.getFullYear() === currentYear
    ) {
      completedThisMonth += 1;
    }

    if (
      updatedAt &&
      updatedAt.getMonth() === currentMonth &&
      updatedAt.getFullYear() === currentYear
    ) {
      updatedThisMonth += 1;
    }

    const candidateDate = completedAt || updatedAt;

    if (candidateDate && (!lastActivity || candidateDate > lastActivity)) {
      lastActivity = candidateDate;
    }
  });

  return {
    completedThisMonth,
    updatedThisMonth,
    lastActivity
  };
};

export const getLastLessonProgress = async (userId) => {
  if (!userId) return null;

  try {
    const progressRef = collection(db, "users", userId, "progress");

    const progressQuery = query(
      progressRef,
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const progressSnap = await getDocs(progressQuery);

    if (progressSnap.empty) return null;

    const docSnap = progressSnap.docs[0];

    return {
      id: docSnap.id,
      activityResults: {},
      completedSections: [],
      ...docSnap.data()
    };
  } catch (error) {
    console.error("Error getting last lesson progress:", error);
    return null;
  }
};

export default {
  getLessonProgress,
  saveLessonProgress,
  markLessonAsCompleted,
  getUserLevelProgressSummary,
  getUserLearningActivitySummary,
  getLastLessonProgress
};