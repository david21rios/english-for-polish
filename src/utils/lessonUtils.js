// src/utils/lessonUtils.js

export const normalizeLessonAgeGroup = (lesson) => {
  return lesson?.ageGroup || "all";
};

export const lessonMatchesAgeGroup = (lesson, userAgeGroup) => {
  const lessonAgeGroup = normalizeLessonAgeGroup(lesson);

  if (!userAgeGroup) {
    return lessonAgeGroup === "all";
  }

  return lessonAgeGroup === userAgeGroup || lessonAgeGroup === "all";
};

export const sortLessonsByNumber = (lessons = []) => {
  return [...lessons].sort((a, b) => {
    const numA = parseInt((a.id || "").split("_")[1]) || 0;
    const numB = parseInt((b.id || "").split("_")[1]) || 0;
    return numA - numB;
  });
};

export const validateLessonModule = (module) => {
  if (!module || typeof module !== "object") {
    return false;
  }

  if (!module.lessons || typeof module.lessons !== "object") {
    return false;
  }

  return true;
};

export default {
  normalizeLessonAgeGroup,
  lessonMatchesAgeGroup,
  sortLessonsByNumber,
  validateLessonModule
};