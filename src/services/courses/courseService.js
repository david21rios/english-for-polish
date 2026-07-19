// src/services/courseService.js

import { db } from "../../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getUserLevelProgressSummary } from "../progress/progressService";

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const normalizeCurrentLevel = (level = "") => {
  return level?.split("-")?.[0] || level || "A1";
};

const getLevelIndex = (levelId = "") => {
  const cleanLevel = normalizeCurrentLevel(levelId);
  const index = LEVEL_ORDER.indexOf(cleanLevel);

  return index === -1 ? 0 : index;
};

const sortByLevelOrder = (levels = []) => {
  return [...levels].sort((a, b) => {
    const indexA = LEVEL_ORDER.indexOf(a.id);
    const indexB = LEVEL_ORDER.indexOf(b.id);

    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
};

const sortModules = (modules = []) => {
  return [...modules].sort((a, b) => {
    const orderA = Number(a.order) || 999;
    const orderB = Number(b.order) || 999;

    if (orderA !== orderB) return orderA - orderB;

    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

const sortLessons = (lessons = []) => {
  return [...lessons].sort((a, b) => {
    const orderA = Number(a.orderInModule) || 999;
    const orderB = Number(b.orderInModule) || 999;

    if (orderA !== orderB) return orderA - orderB;

    const numA = parseInt((a.id || "").split("_").pop()) || 0;
    const numB = parseInt((b.id || "").split("_").pop()) || 0;

    return numA - numB;
  });
};

const normalizeLevel = (snapshot) => {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    levelId: data.levelId || snapshot.id,
    title: data.title || snapshot.id,
    name: data.name || "",
    description: data.description || "",
    order: data.order || LEVEL_ORDER.indexOf(snapshot.id) + 1,
    status: data.status || "published",
    ...data
  };
};

const normalizeModule = (snapshot, levelId) => {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    moduleId: data.moduleId || snapshot.id,
    levelId,
    title: data.title || "Untitled module",
    description: data.description || "",
    order: Number(data.order) || 999,
    status: data.status || "published",
    icon: data.icon || "📚",
    color: data.color || "primary",
    lessonCount: Number(data.lessonCount) || 0,
    publishedLessonCount: Number(data.publishedLessonCount) || 0,
    ...data
  };
};

const normalizeLesson = (snapshot, levelId, moduleId, moduleTitle = "") => {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    lessonId: data.lessonId || snapshot.id,
    nivel: data.nivel || levelId,
    level: data.level || levelId,
    moduleId: data.moduleId || moduleId,
    moduleTitle,
    titulo: data.titulo || "Untitled lesson",
    descripcion: data.descripcion || "",
    orderInModule: Number(data.orderInModule) || 999,
    ageGroup: data.ageGroup || "all",
    status: data.status || "published",
    ...data
  };
};

const filterLessonForStudent = (lesson, userAgeGroup = null) => {
  const lessonStatus = lesson.status || "published";
  const lessonAgeGroup = lesson.ageGroup || "all";

  return (
    lessonStatus === "published" &&
    (!userAgeGroup ||
      lessonAgeGroup === "all" ||
      lessonAgeGroup === userAgeGroup)
  );
};

const filterModuleForStudent = (module, includeDrafts = false) => {
  if (includeDrafts) return true;

  return (module.status || "published") === "published";
};

const enrichLevelWithUserState = async ({
  level,
  userId,
  userAgeGroup = null,
  currentLevel = "A1"
}) => {
  const normalizedCurrentLevel = normalizeCurrentLevel(currentLevel);
  const currentLevelIndex = getLevelIndex(normalizedCurrentLevel);
  const levelIndex = getLevelIndex(level.id);

  const progressSummary = userId
    ? await getUserLevelProgressSummary({
        userId,
        levelId: level.id,
        userAgeGroup
      })
    : {
        totalLessons: level.totalLessons || 0,
        completedLessons: 0,
        progressPercent: 0
      };

  const totalLessons =
    Number(progressSummary.totalLessons) || Number(level.totalLessons) || 0;

  const completedLessons = Number(progressSummary.completedLessons) || 0;

  const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;
  const isCurrentLevel = normalizedCurrentLevel === level.id;
  const isLocked = levelIndex > currentLevelIndex;

  return {
    ...level,
    progressSummary: {
      ...progressSummary,
      totalLessons,
      completedLessons,
      progressPercent: Number(progressSummary.progressPercent) || 0
    },
    isCurrentLevel,
    isCompleted,
    isLocked,
    hasLessons: Number(level.totalLessons) > 0
  };
};

export const getCourseLevel = async ({
  levelId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  if (!levelId) return null;

  const levelRef = doc(db, "levels", levelId);
  const levelSnap = await getDoc(levelRef);

  if (!levelSnap.exists()) return null;

  const level = normalizeLevel(levelSnap);

  const modulesSnapshot = await getDocs(
    collection(db, "levels", levelId, "modules")
  );

  const modules = await Promise.all(
    modulesSnapshot.docs.map(async (moduleSnapshot) => {
      const module = normalizeModule(moduleSnapshot, levelId);

      if (!filterModuleForStudent(module, includeDrafts)) {
        return null;
      }

      const lessonsSnapshot = await getDocs(
        collection(db, "levels", levelId, "modules", module.moduleId, "lessons")
      );

      let lessons = lessonsSnapshot.docs.map((lessonSnapshot) =>
        normalizeLesson(
          lessonSnapshot,
          levelId,
          module.moduleId,
          module.title
        )
      );

      if (!includeDrafts) {
        lessons = lessons.filter((lesson) =>
          filterLessonForStudent(lesson, userAgeGroup)
        );
      }

      lessons = sortLessons(lessons);

      return {
        ...module,
        lessons,
        lessonCount: lessons.length,
        publishedLessonCount: lessons.filter(
          (lesson) => lesson.status === "published"
        ).length
      };
    })
  );

  const sortedModules = sortModules(modules.filter(Boolean));

  const totalLessons = sortedModules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  return {
    ...level,
    modules: sortedModules,
    totalModules: sortedModules.length,
    totalLessons,
    hasModules: sortedModules.length > 0,
    hasLessons: totalLessons > 0
  };
};

export const getCourseLevels = async ({
  userAgeGroup = null,
  includeDrafts = false
} = {}) => {
  const levelsSnapshot = await getDocs(collection(db, "levels"));

  const levelsData = sortByLevelOrder(levelsSnapshot.docs.map(normalizeLevel));

  const levels = await Promise.all(
    levelsData.map((level) =>
      getCourseLevel({
        levelId: level.id,
        userAgeGroup,
        includeDrafts
      })
    )
  );

  return levels.filter(Boolean);
};

export const getCourseLevelsForUser = async ({
  userId,
  currentLevel = "A1",
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const levels = await getCourseLevels({
    userAgeGroup,
    includeDrafts
  });

  const enrichedLevels = await Promise.all(
    levels.map((level) =>
      enrichLevelWithUserState({
        level,
        userId,
        userAgeGroup,
        currentLevel
      })
    )
  );

  return enrichedLevels;
};

export const getCourseLevelForUser = async ({
  userId,
  levelId,
  currentLevel = "A1",
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const level = await getCourseLevel({
    levelId,
    userAgeGroup,
    includeDrafts
  });

  if (!level) return null;

  return enrichLevelWithUserState({
    level,
    userId,
    userAgeGroup,
    currentLevel
  });
};

export const getLevelModules = async ({
  levelId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const level = await getCourseLevel({
    levelId,
    userAgeGroup,
    includeDrafts
  });

  return level?.modules || [];
};

export const getModuleLessons = async ({
  levelId,
  moduleId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  if (!levelId || !moduleId) return [];

  const lessonsSnapshot = await getDocs(
    collection(db, "levels", levelId, "modules", moduleId, "lessons")
  );

  let lessons = lessonsSnapshot.docs.map((lessonSnapshot) =>
    normalizeLesson(lessonSnapshot, levelId, moduleId)
  );

  if (!includeDrafts) {
    lessons = lessons.filter((lesson) =>
      filterLessonForStudent(lesson, userAgeGroup)
    );
  }

  return sortLessons(lessons);
};

export const getFlatLessonsByLevel = async ({
  levelId,
  userAgeGroup = null,
  includeDrafts = false
}) => {
  const level = await getCourseLevel({
    levelId,
    userAgeGroup,
    includeDrafts
  });

  if (!level) return [];

  return level.modules.flatMap((module) => module.lessons);
};

export const getFirstAvailableLesson = async ({
  levelId,
  userAgeGroup = null
}) => {
  const lessons = await getFlatLessonsByLevel({
    levelId,
    userAgeGroup,
    includeDrafts: false
  });

  return lessons[0] || null;
};

export default {
  getCourseLevel,
  getCourseLevels,
  getCourseLevelsForUser,
  getCourseLevelForUser,
  getLevelModules,
  getModuleLessons,
  getFlatLessonsByLevel,
  getFirstAvailableLesson
};