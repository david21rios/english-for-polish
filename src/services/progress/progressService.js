// src/services/progressService.js

import { db } from "../../firebase";
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

import { getCourseLevel, getFlatLessonsByLevel } from "../courses/courseService";

const SKILL_KEYS = [
  "vocabulary",
  "grammar",
  "reading",
  "practice",
  "writing",
  "speaking",
  "listening",
  "evaluation"
];

const SCORE_RELEVANT_SKILLS = [
  "reading",
  "practice",
  "writing",
  "speaking",
  "evaluation"
];

const NON_SCORABLE_SECTIONS = [
  "intro",
  "resources",
  "reflection",
  "vocabulary",
  "grammar",
  "portada",
  "objetivos",
  "vocabulario",
  "gramatica",
  "recursos_adicionales",
  "reflexion_final"
];

const SECTION_TO_SKILL_MAP = {
  intro: "vocabulary",
  vocabulary: "vocabulary",
  grammar: "grammar",
  reading: "reading",
  practice: "practice",
  writing: "writing",
  speaking: "speaking",
  evaluation: "evaluation",
  resources: "practice",
  reflection: "evaluation",

  portada: "vocabulary",
  objetivos: "vocabulary",
  vocabulario: "vocabulary",
  gramatica: "grammar",
  lectura: "reading",
  practica_interactiva: "practice",
  produccion_escrita: "writing",
  produccion_oral: "speaking",
  listening: "listening",
  evaluacion: "evaluation",
  recursos_adicionales: "practice",
  reflexion_final: "evaluation"
};

const DEFAULT_SKILL_SUMMARY = SKILL_KEYS.reduce((acc, skill) => {
  acc[skill] = {
    completed: false,
    score: null,
    attempts: 0,
    completedActivities: 0,
    totalActivities: 0
  };

  return acc;
}, {});

const getProgressDocId = (levelId, lessonId) => {
  return `${levelId}_${lessonId}`;
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const clampScore = (score) => {
  const number = toNumberOrNull(score);

  if (number === null) return null;

  return Math.max(0, Math.min(100, Math.round(number)));
};

const normalizeCompletedSections = (completedSections = []) => {
  if (!Array.isArray(completedSections)) return [];

  return [...new Set(completedSections.filter(Boolean))];
};

const getSkillFromSectionId = (sectionId = "") => {
  const normalizedSectionId = String(sectionId).trim();

  return (
    SECTION_TO_SKILL_MAP[normalizedSectionId] ||
    SKILL_KEYS.find((skill) => normalizedSectionId.includes(skill)) ||
    "practice"
  );
};

const normalizeActivityResult = (result = {}) => {
  if (!isPlainObject(result)) {
    return {
      completed: false,
      score: null,
      attempts: 0
    };
  }

  return {
    ...result,
    completed: Boolean(result.completed),
    score: clampScore(result.score),
    attempts: Number(result.attempts) || 0,
    updatedAt: result.updatedAt || new Date().toISOString()
  };
};

const normalizeActivityResults = (activityResults = {}) => {
  if (!isPlainObject(activityResults)) return {};

  return Object.entries(activityResults).reduce((acc, [sectionId, result]) => {
    acc[sectionId] = normalizeActivityResult(result);
    return acc;
  }, {});
};

const isScorableSection = (sectionId = "", result = {}) => {
  if (NON_SCORABLE_SECTIONS.includes(sectionId)) return false;

  const skill = result.skill || getSkillFromSectionId(sectionId);

  return SCORE_RELEVANT_SKILLS.includes(skill);
};

const calculateSkillScores = ({
  completedSections = [],
  activityResults = {}
}) => {
  const normalizedCompletedSections =
    normalizeCompletedSections(completedSections);

  const normalizedActivityResults =
    normalizeActivityResults(activityResults);

  const skillBuckets = SKILL_KEYS.reduce((acc, skill) => {
    acc[skill] = {
      scores: [],
      completedActivities: 0,
      totalActivities: 0,
      attempts: 0
    };

    return acc;
  }, {});

  normalizedCompletedSections.forEach((sectionId) => {
    const skill = getSkillFromSectionId(sectionId);

    if (!skillBuckets[skill]) return;

    skillBuckets[skill].completedActivities += 1;

    if (!NON_SCORABLE_SECTIONS.includes(sectionId)) {
      skillBuckets[skill].totalActivities += 1;
    }
  });

  Object.entries(normalizedActivityResults).forEach(([sectionId, result]) => {
    const skill = result.skill || getSkillFromSectionId(sectionId);

    if (!skillBuckets[skill]) {
      skillBuckets[skill] = {
        scores: [],
        completedActivities: 0,
        totalActivities: 0,
        attempts: 0
      };
    }

    if (!isScorableSection(sectionId, result)) {
      return;
    }
    
    skillBuckets[skill].totalActivities += 1;
    skillBuckets[skill].attempts += Number(result.attempts) || 0;
    
    if (result.completed) {
      skillBuckets[skill].completedActivities += 1;
    }
    
    if (result.score !== null && result.score !== undefined) {
      const safeScore = clampScore(result.score);

      if (safeScore !== null) {
        skillBuckets[skill].scores.push(safeScore);
      }
    }
  });

  return SKILL_KEYS.reduce((acc, skill) => {
    const bucket = skillBuckets[skill];

    const score =
      bucket.scores.length > 0
        ? Math.round(
            bucket.scores.reduce((total, item) => total + item, 0) /
              bucket.scores.length
          )
        : null;

    acc[skill] = {
      completed:
        bucket.totalActivities > 0 &&
        bucket.completedActivities >= bucket.totalActivities,
      score,
      attempts: bucket.attempts,
      completedActivities: bucket.completedActivities,
      totalActivities: bucket.totalActivities
    };

    return acc;
  }, {});
};

const calculateOverallScore = (skillScores = {}) => {
  const scores = SCORE_RELEVANT_SKILLS
    .map((skill) => skillScores?.[skill]?.score)
    .filter((score) => score !== null && score !== undefined);

  if (scores.length === 0) return null;

  return Math.round(
    scores.reduce((total, score) => total + Number(score), 0) / scores.length
  );
};

const calculateProgressPercentage = ({
  completed,
  completedSections = [],
  totalSections = 1,
  currentSectionIndex = 0
}) => {
  const safeTotalSections = Math.max(Number(totalSections) || 1, 1);

  if (completed) return 100;

  const completedBySections = Math.round(
    (normalizeCompletedSections(completedSections).length / safeTotalSections) *
      100
  );

  const completedByCurrentIndex = Math.round(
    ((Math.max(Number(currentSectionIndex) || 0, 0) + 1) / safeTotalSections) *
      100
  );

  return Math.min(100, Math.max(completedBySections, completedByCurrentIndex));
};

const normalizeProgressData = (progress = {}) => {
  const activityResults = normalizeActivityResults(progress.activityResults);
  const completedSections = normalizeCompletedSections(
    progress.completedSections
  );

  const skillScores =
    isPlainObject(progress.skillScores) && Object.keys(progress.skillScores).length
      ? progress.skillScores
      : calculateSkillScores({
          completedSections,
          activityResults
        });

  const overallScore =
    progress.overallScore !== undefined && progress.overallScore !== null
      ? clampScore(progress.overallScore)
      : calculateOverallScore(skillScores);

  return {
    activityResults,
    completedSections,
    skillScores: {
      ...DEFAULT_SKILL_SUMMARY,
      ...skillScores
    },
    overallScore,
    ...progress
  };
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
      ...normalizeProgressData(progressSnap.data())
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

    const safeCompletedSections =
      normalizeCompletedSections(completedSections);

    const safeActivityResults =
      normalizeActivityResults(activityResults);

    const skillScores = calculateSkillScores({
      completedSections: safeCompletedSections,
      activityResults: safeActivityResults
    });

    const overallScore = calculateOverallScore(skillScores);

    const progressPercentage = calculateProgressPercentage({
      completed,
      completedSections: safeCompletedSections,
      totalSections: safeTotalSections,
      currentSectionIndex: safeCurrentSectionIndex
    });

    const progressRef = doc(
      db,
      "users",
      userId,
      "progress",
      getProgressDocId(levelId, lessonId)
    );

    const existingSnap = await getDoc(progressRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const shouldSetStartedAt = !existingData?.startedAt;
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
      skillScores,
      overallScore,
      totalSections: safeTotalSections,
      progressPercentage,
      completed,
      updatedAt: serverTimestamp(),
      ...(shouldSetStartedAt ? { startedAt: serverTimestamp() } : {}),
      ...(shouldSetCompletedAt ? { completedAt: serverTimestamp() } : {})
    };

    await setDoc(progressRef, progressData, { merge: true });

    return progressData;
  } catch (error) {
    console.error("Error saving lesson progress:", error);
    throw error;
  }
};

export const saveActivityResult = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  sectionId,
  skill = null,
  result = {},
  currentSectionIndex = 0,
  completedSections = [],
  totalSections = 1
}) => {
  if (!userId || !levelId || !lessonId || !sectionId) return null;

  const existingProgress = await getLessonProgress(userId, levelId, lessonId);

  const existingActivityResults =
    existingProgress?.activityResults || {};

  const normalizedResult = normalizeActivityResult({
    ...result,
    skill: skill || getSkillFromSectionId(sectionId)
  });

  const nextActivityResults = {
    ...existingActivityResults,
    [sectionId]: normalizedResult
  };

  const nextCompletedSections = normalizedResult.completed
    ? normalizeCompletedSections([
        ...(existingProgress?.completedSections || completedSections || []),
        sectionId
      ])
    : normalizeCompletedSections(
        existingProgress?.completedSections || completedSections || []
      );

  const safeTotalSections =
    totalSections || existingProgress?.totalSections || 1;

  const completed =
    nextCompletedSections.length >= Math.max(Number(safeTotalSections) || 1, 1);

  return saveLessonProgress({
    userId,
    levelId,
    lessonId,
    moduleId: moduleId || existingProgress?.moduleId || null,
    currentSectionIndex:
      currentSectionIndex ?? existingProgress?.currentSectionIndex ?? 0,
    completedSections: nextCompletedSections,
    activityResults: nextActivityResults,
    totalSections: safeTotalSections,
    completed
  });
};

export const markSectionAsCompleted = async ({
  userId,
  levelId,
  lessonId,
  moduleId = null,
  sectionId,
  skill = null,
  score = null,
  currentSectionIndex = 0,
  completedSections = [],
  activityResults = {},
  totalSections = 1
}) => {
  return saveActivityResult({
    userId,
    levelId,
    lessonId,
    moduleId,
    sectionId,
    skill,
    currentSectionIndex,
    completedSections,
    totalSections,
    result: {
      ...(activityResults?.[sectionId] || {}),
      completed: true,
      score,
      attempts: Number(activityResults?.[sectionId]?.attempts || 0) + 1
    }
  });
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

const getUserProgressDocs = async (userId) => {
  if (!userId) return [];

  const progressRef = collection(db, "users", userId, "progress");
  const progressSnap = await getDocs(progressRef);

  return progressSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...normalizeProgressData(docSnap.data())
  }));
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
      progressPercent: 0,
      averageScore: null,
      skillScores: DEFAULT_SKILL_SUMMARY
    };
  }

  const publishedLessons = await getFlatLessonsByLevel({
    levelId,
    userAgeGroup,
    includeDrafts: false
  });

  const progressDocs = await getUserProgressDocs(userId);

  const levelProgressDocs = progressDocs.filter(
    (progress) => progress.levelId === levelId
  );

  const completedLessonIds = levelProgressDocs
    .filter((progress) => progress.completed)
    .map((progress) => progress.lessonId);

  const totalLessons = publishedLessons.length;

  const completedLessons = publishedLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id || lesson.lessonId)
  ).length;

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const averageScore = calculateAverageScoreFromProgress(levelProgressDocs);
  const skillScores = calculateAggregatedSkillScores(levelProgressDocs);

  return {
    levelId,
    totalLessons,
    completedLessons,
    pendingLessons: totalLessons - completedLessons,
    progressPercent,
    averageScore,
    skillScores
  };
};

export const getUserModuleProgressSummary = async ({
  userId,
  levelId,
  moduleId,
  userAgeGroup = null
}) => {
  if (!userId || !levelId || !moduleId) {
    return {
      levelId,
      moduleId,
      totalLessons: 0,
      completedLessons: 0,
      pendingLessons: 0,
      progressPercent: 0,
      averageScore: null,
      skillScores: DEFAULT_SKILL_SUMMARY
    };
  }

  const level = await getCourseLevel({
    levelId,
    userAgeGroup,
    includeDrafts: false
  });

  const module = level?.modules?.find(
    (item) => (item.moduleId || item.id) === moduleId
  );

  const lessons = module?.lessons || [];
  const progressDocs = await getUserProgressDocs(userId);

  const moduleProgressDocs = progressDocs.filter(
    (progress) =>
      progress.levelId === levelId &&
      (progress.moduleId === moduleId ||
        lessons.some(
          (lesson) => (lesson.id || lesson.lessonId) === progress.lessonId
        ))
  );

  const completedLessonIds = moduleProgressDocs
    .filter((progress) => progress.completed)
    .map((progress) => progress.lessonId);

  const totalLessons = lessons.length;

  const completedLessons = lessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id || lesson.lessonId)
  ).length;

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  return {
    levelId,
    moduleId,
    moduleTitle: module?.title || "",
    totalLessons,
    completedLessons,
    pendingLessons: totalLessons - completedLessons,
    progressPercent,
    averageScore: calculateAverageScoreFromProgress(moduleProgressDocs),
    skillScores: calculateAggregatedSkillScores(moduleProgressDocs)
  };
};
const calculateAverageScoreFromProgress = (progressDocs = []) => {
  const scores = progressDocs
    .map((progress) => progress.overallScore)
    .filter((score) => score !== null && score !== undefined);

  if (scores.length === 0) return null;

  return Math.round(
    scores.reduce((total, score) => total + Number(score), 0) / scores.length
  );
};

const calculateAggregatedSkillScores = (progressDocs = []) => {
  const buckets = SKILL_KEYS.reduce((acc, skill) => {
    acc[skill] = {
      scores: [],
      completedActivities: 0,
      totalActivities: 0,
      attempts: 0
    };

    return acc;
  }, {});

  progressDocs.forEach((progress) => {
    const skillScores = progress.skillScores || {};

    SKILL_KEYS.forEach((skill) => {
      const skillData = skillScores[skill];

      if (!skillData) return;

      if (skillData.score !== null && skillData.score !== undefined) {
        buckets[skill].scores.push(Number(skillData.score));
      }

      buckets[skill].completedActivities +=
        Number(skillData.completedActivities) || 0;

      buckets[skill].totalActivities +=
        Number(skillData.totalActivities) || 0;

      buckets[skill].attempts += Number(skillData.attempts) || 0;
    });
  });

  return SKILL_KEYS.reduce((acc, skill) => {
    const bucket = buckets[skill];

    const score =
      bucket.scores.length > 0
        ? Math.round(
            bucket.scores.reduce((total, item) => total + item, 0) /
              bucket.scores.length
          )
        : null;

    acc[skill] = {
      completed:
        bucket.totalActivities > 0 &&
        bucket.completedActivities >= bucket.totalActivities,
      score,
      attempts: bucket.attempts,
      completedActivities: bucket.completedActivities,
      totalActivities: bucket.totalActivities
    };

    return acc;
  }, {});
};

export const getUserSkillsSummary = async (userId) => {
  if (!userId) {
    return {
      averageScore: null,
      skillScores: DEFAULT_SKILL_SUMMARY
    };
  }

  const progressDocs = await getUserProgressDocs(userId);

  return {
    averageScore: calculateAverageScoreFromProgress(progressDocs),
    skillScores: calculateAggregatedSkillScores(progressDocs)
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

  const progressDocs = await getUserProgressDocs(userId);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let completedThisMonth = 0;
  let updatedThisMonth = 0;
  let lastActivity = null;

  progressDocs.forEach((progress) => {
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
      ...normalizeProgressData(docSnap.data())
    };
  } catch (error) {
    console.error("Error getting last lesson progress:", error);
    return null;
  }
};

export const getUserCourseProgressSummary = async ({
  userId,
  userAgeGroup = null,
  levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
}) => {
  if (!userId) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      pendingLessons: 0,
      progressPercent: 0,
      averageScore: null,
      levels: [],
      skillScores: DEFAULT_SKILL_SUMMARY
    };
  }

  const levelSummaries = await Promise.all(
    levels.map((levelId) =>
      getUserLevelProgressSummary({
        userId,
        levelId,
        userAgeGroup
      })
    )
  );

  const totalLessons = levelSummaries.reduce(
    (total, level) => total + level.totalLessons,
    0
  );

  const completedLessons = levelSummaries.reduce(
    (total, level) => total + level.completedLessons,
    0
  );

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const progressDocs = await getUserProgressDocs(userId);

  return {
    totalLessons,
    completedLessons,
    pendingLessons: totalLessons - completedLessons,
    progressPercent,
    averageScore: calculateAverageScoreFromProgress(progressDocs),
    levels: levelSummaries,
    skillScores: calculateAggregatedSkillScores(progressDocs)
  };
};

export const getWeakestSkills = async (userId, limitCount = 3) => {
  const summary = await getUserSkillsSummary(userId);

  return Object.entries(summary.skillScores)
    .filter(([, data]) => data.score !== null && data.score !== undefined)
    .sort(([, a], [, b]) => Number(a.score) - Number(b.score))
    .slice(0, limitCount)
    .map(([skill, data]) => ({
      skill,
      ...data
    }));
};

export const getStrongestSkills = async (userId, limitCount = 3) => {
  const summary = await getUserSkillsSummary(userId);

  return Object.entries(summary.skillScores)
    .filter(([, data]) => data.score !== null && data.score !== undefined)
    .sort(([, a], [, b]) => Number(b.score) - Number(a.score))
    .slice(0, limitCount)
    .map(([skill, data]) => ({
      skill,
      ...data
    }));
};

export default {
  getLessonProgress,
  saveLessonProgress,
  saveActivityResult,
  markSectionAsCompleted,
  markLessonAsCompleted,
  getUserLevelProgressSummary,
  getUserModuleProgressSummary,
  getUserCourseProgressSummary,
  getUserSkillsSummary,
  getWeakestSkills,
  getStrongestSkills,
  getUserLearningActivitySummary,
  getLastLessonProgress
};