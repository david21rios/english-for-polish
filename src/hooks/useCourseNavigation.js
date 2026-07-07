// src/hooks/useCourseNavigation.js

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import {
  getLessonSections,
  getUserCourseProfile,
  getLevelNavigationData,
  getInitialLessonForLevel,
  loadLessonDetails,
  getNextLesson,
  getPreviousLesson,
  getNextLevel
} from "../services/courseNavigationService";

import {
  getLessonProgress,
  saveLessonProgress,
  saveActivityResult,
  markLessonAsCompleted
} from "../services/progressService";

import {
  sectionHasRequiredWork as engineSectionHasRequiredWork,
  canAccessSection,
  canAdvanceFromSection,
  getLessonCompletionPercent,
  isLessonCompleted,
  isSectionCompleted
} from "../utils/completionEngine";

const normalizeCompletedSections = (completedSections = []) => {
  if (!Array.isArray(completedSections)) return [];

  return [...new Set(completedSections.filter(Boolean))];
};

const normalizeActivityResults = (activityResults = {}) => {
  if (
    !activityResults ||
    typeof activityResults !== "object" ||
    Array.isArray(activityResults)
  ) {
    return {};
  }

  return activityResults;
};

const normalizeActivityResult = (result = {}) => {
  return {
    completed: Boolean(result.completed),
    score:
      result.score === null || result.score === undefined
        ? null
        : Number(result.score),
    attempts: Number(result.attempts) || 0,
    ...result,
    updatedAt: result.updatedAt || new Date().toISOString()
  };
};

const getLessonId = (lesson) => {
  return lesson?.id || lesson?.lessonId || "";
};

const getLessonModuleId = (lesson) => {
  return lesson?.moduleId || lesson?.module || null;
};

const getSectionByIndex = (lessonSections = [], sectionIndex = 0) => {
  return lessonSections[sectionIndex] || null;
};

const getSectionIdByIndex = (lessonSections = [], sectionIndex = 0) => {
  return getSectionByIndex(lessonSections, sectionIndex)?.id || "";
};

const useCourseNavigation = ({ levelId, locationState = null }) => {
  const lessonSections = useMemo(() => getLessonSections(), []);

  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);

  const [userId, setUserId] = useState(null);
  const [ageGroup, setAgeGroup] = useState(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState([]);
  const [activityResults, setActivityResults] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentSection = lessonSections[currentSectionIndex] || null;
  const nextLevel = getNextLevel(levelId);

  const currentLessonId = getLessonId(currentLesson);
  const currentModuleId = getLessonModuleId(currentLesson);

  const sectionProgress = useMemo(() => {
    return getLessonCompletionPercent({
      lessonSections,
      completedSections,
      activityResults,
      lessonDetails
    });
  }, [lessonSections, completedSections, activityResults, lessonDetails]);

  const lessonCompleted = useMemo(() => {
    return isLessonCompleted({
      lessonSections,
      completedSections,
      activityResults,
      lessonDetails
    });
  }, [lessonSections, completedSections, activityResults, lessonDetails]);

  const sectionHasRequiredWork = useCallback(
    (sectionId) => {
      return engineSectionHasRequiredWork({
        sectionId,
        lessonDetails
      });
    },
    [lessonDetails]
  );

  const isSectionAccessible = useCallback(
    (sectionIndex) => {
      return canAccessSection({
        sectionIndex,
        currentSectionIndex,
        lessonSections,
        completedSections,
        activityResults,
        lessonDetails
      });
    },
    [
      currentSectionIndex,
      lessonSections,
      completedSections,
      activityResults,
      lessonDetails
    ]
  );

  const checkSectionCompleted = useCallback(
    (sectionId) => {
      return isSectionCompleted({
        sectionId,
        completedSections,
        activityResults,
        lessonDetails
      });
    },
    [completedSections, activityResults, lessonDetails]
  );

  const canAdvanceCurrentSection = useCallback(() => {
    if (!currentSection) return false;

    return canAdvanceFromSection({
      sectionId: currentSection.id,
      completedSections,
      activityResults,
      lessonDetails
    });
  }, [currentSection, completedSections, activityResults, lessonDetails]);

  const persistProgress = useCallback(
    async ({
      nextCurrentSectionIndex = currentSectionIndex,
      nextCompletedSections = completedSections,
      nextActivityResults = activityResults,
      completed = null
    } = {}) => {
      if (!userId || !levelId || !currentLessonId) return null;

      const safeCompletedSections = normalizeCompletedSections(
        nextCompletedSections
      );

      const safeActivityResults = normalizeActivityResults(
        nextActivityResults
      );

      const resolvedCompleted =
        completed !== null
          ? completed
          : isLessonCompleted({
              lessonSections,
              completedSections: safeCompletedSections,
              activityResults: safeActivityResults,
              lessonDetails
            });

      return saveLessonProgress({
        userId,
        levelId,
        moduleId: currentModuleId,
        lessonId: currentLessonId,
        currentSectionIndex: nextCurrentSectionIndex,
        completedSections: safeCompletedSections,
        activityResults: safeActivityResults,
        totalSections: lessonSections.length,
        completed: resolvedCompleted
      });
    },
    [
      userId,
      levelId,
      currentLessonId,
      currentModuleId,
      currentSectionIndex,
      completedSections,
      activityResults,
      lessonSections,
      lessonDetails
    ]
  );
    const loadProgressForLesson = useCallback(
    async ({ lesson, requestedSectionIndex = null }) => {
      if (!lesson) {
        return {
          currentSectionIndex: 0,
          completedSections: [],
          activityResults: {}
        };
      }

      const progress = await getLessonProgress(
        auth.currentUser?.uid || userId,
        levelId,
        getLessonId(lesson)
      );

      if (!progress) {
        return {
          currentSectionIndex: requestedSectionIndex ?? 0,
          completedSections: [],
          activityResults: {}
        };
      }

      return {
        currentSectionIndex:
          requestedSectionIndex ??
          progress.currentSectionIndex ??
          0,

        completedSections: normalizeCompletedSections(
          progress.completedSections
        ),

        activityResults: normalizeActivityResults(
          progress.activityResults
        )
      };
    },
    [levelId, userId]
  );

  const openLesson = useCallback(
    async (lesson, requestedSectionIndex = null) => {
      if (!lesson) return;

      const details = await loadLessonDetails({
        levelId,
        lesson
      });

      const progressState =
        await loadProgressForLesson({
          lesson,
          requestedSectionIndex
        });

      setCurrentLesson(lesson);
      setLessonDetails(details);

      setCurrentSectionIndex(
        progressState.currentSectionIndex
      );

      setCompletedSections(
        progressState.completedSections
      );

      setActivityResults(
        progressState.activityResults
      );
    },
    [levelId, loadProgressForLesson]
  );

  const changeLesson = useCallback(
    async (lessonId) => {
      const lesson = lessons.find(
        (item) => getLessonId(item) === lessonId
      );

      if (!lesson) {
        throw new Error("Lesson not found.");
      }

      await openLesson(lesson);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    [lessons, openLesson]
  );

  const loadNavigation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated.");
      }

      const profile =
        await getUserCourseProfile(currentUser.uid);

      setUserId(currentUser.uid);
      setAgeGroup(profile.ageGroup);

      const navigationData =
        await getLevelNavigationData({
          levelId,
          userAgeGroup: profile.ageGroup,
          includeDrafts: false
        });

      if (!navigationData.hasLessons) {
        throw new Error(
          "No published lessons available."
        );
      }

      setModules(navigationData.modules);
      setLessons(navigationData.lessons);

      const requestedLessonId =
        locationState?.lessonId || null;

      const initialLesson =
        await getInitialLessonForLevel({
          userId: currentUser.uid,
          levelId,
          requestedLessonId,
          userAgeGroup: profile.ageGroup,
          includeDrafts: false
        });

      if (!initialLesson) {
        throw new Error(
          "No initial lesson available."
        );
      }

      await openLesson(
        initialLesson,
        locationState?.sectionIndex ?? null
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Error loading course navigation."
      );
    } finally {
      setLoading(false);
    }
  }, [
    levelId,
    locationState,
    openLesson
  ]);

  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);

  const registerActivityResult = useCallback(
    async (
      sectionId,
      result = {}
    ) => {
      if (!currentLesson) return;

      const normalizedResult =
        normalizeActivityResult(result);

      const updatedActivityResults = {
        ...activityResults,
        [sectionId]: normalizedResult
      };

      let updatedCompletedSections = [
        ...completedSections
      ];

      const completedNow =
        isSectionCompleted({
          sectionId,
          completedSections:
            updatedCompletedSections,
          activityResults:
            updatedActivityResults,
          lessonDetails
        });

      if (
        completedNow &&
        !updatedCompletedSections.includes(
          sectionId
        )
      ) {
        updatedCompletedSections.push(sectionId);
      }

      updatedCompletedSections =
        normalizeCompletedSections(
          updatedCompletedSections
        );

      setActivityResults(
        updatedActivityResults
      );

      setCompletedSections(
        updatedCompletedSections
      );

      await saveActivityResult({
        userId,
        levelId,
        moduleId: currentModuleId,
        lessonId: currentLessonId,
        sectionId,
        result: normalizedResult
      });

      await persistProgress({
        nextCurrentSectionIndex:
          currentSectionIndex,
        nextCompletedSections:
          updatedCompletedSections,
        nextActivityResults:
          updatedActivityResults
      });

      return completedNow;
    },
    [
      currentLesson,
      activityResults,
      completedSections,
      lessonDetails,
      currentLessonId,
      currentModuleId,
      currentSectionIndex,
      userId,
      levelId,
      persistProgress
    ]
  );

  const markSectionCompleted =
    useCallback(
      async (
        sectionId,
        result = {}
      ) => {
        return registerActivityResult(
          sectionId,
          {
            ...result,
            completed: true
          }
        );
      },
      [registerActivityResult]
    );
      const goToSection = useCallback(
    async (sectionIndex) => {
      if (!currentLesson) return false;

      if (!isSectionAccessible(sectionIndex)) {
        return false;
      }

      setCurrentSectionIndex(sectionIndex);

      await persistProgress({
        nextCurrentSectionIndex: sectionIndex,
        nextCompletedSections: completedSections,
        nextActivityResults: activityResults
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return true;
    },
    [
      currentLesson,
      isSectionAccessible,
      completedSections,
      activityResults,
      persistProgress
    ]
  );

  const goToNextSection = useCallback(async () => {
    if (!currentLesson || !currentSection) {
      return false;
    }

    const canAdvance = canAdvanceCurrentSection();

    if (!canAdvance) {
      return false;
    }

    const currentSectionId = currentSection.id;

    const updatedCompletedSections = normalizeCompletedSections([
      ...completedSections,
      currentSectionId
    ]);

    const updatedActivityResults = {
      ...activityResults,
      [currentSectionId]: normalizeActivityResult({
        ...(activityResults[currentSectionId] || {}),
        completed: true
      })
    };

    const nextIndex =
      currentSectionIndex < lessonSections.length - 1
        ? currentSectionIndex + 1
        : currentSectionIndex;

    setCompletedSections(updatedCompletedSections);
    setActivityResults(updatedActivityResults);
    setCurrentSectionIndex(nextIndex);

    await persistProgress({
      nextCurrentSectionIndex: nextIndex,
      nextCompletedSections: updatedCompletedSections,
      nextActivityResults: updatedActivityResults
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return true;
  }, [
    currentLesson,
    currentSection,
    canAdvanceCurrentSection,
    completedSections,
    activityResults,
    currentSectionIndex,
    lessonSections,
    persistProgress
  ]);

  const goToPreviousSection = useCallback(async () => {
    if (!currentLesson) return false;

    const previousIndex = Math.max(currentSectionIndex - 1, 0);

    setCurrentSectionIndex(previousIndex);

    await persistProgress({
      nextCurrentSectionIndex: previousIndex,
      nextCompletedSections: completedSections,
      nextActivityResults: activityResults
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return true;
  }, [
    currentLesson,
    currentSectionIndex,
    completedSections,
    activityResults,
    persistProgress
  ]);

  const goToNextLesson = useCallback(async () => {
    if (!currentLesson) return null;

    await markLessonAsCompleted({
      userId,
      levelId,
      moduleId: currentModuleId,
      lessonId: currentLessonId,
      completedSections,
      activityResults,
      totalSections: lessonSections.length
    });

    const nextLesson = getNextLesson(
      lessons,
      currentLessonId
    );

    if (nextLesson) {
      await openLesson(nextLesson);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return {
        type: "lesson",
        lesson: nextLesson
      };
    }

    return {
      type: "level",
      levelId: nextLevel
    };
  }, [
    currentLesson,
    userId,
    levelId,
    currentModuleId,
    currentLessonId,
    completedSections,
    activityResults,
    lessonSections,
    lessons,
    openLesson,
    nextLevel
  ]);

  const goToPreviousLesson = useCallback(async () => {
    if (!currentLesson) return false;

    const previousLesson = getPreviousLesson(
      lessons,
      currentLessonId
    );

    if (!previousLesson) return false;

    await openLesson(previousLesson);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return true;
  }, [
    currentLesson,
    lessons,
    currentLessonId,
    openLesson
  ]);

  const currentLessonIndex = lessons.findIndex(
    (lesson) => getLessonId(lesson) === currentLessonId
  );

  return {
    modules,
    lessons,
    currentLesson,
    lessonDetails,

    userId,
    ageGroup,

    lessonSections,
    currentSection,
    currentSectionIndex,
    completedSections,
    activityResults,
    currentLessonIndex,
    sectionProgress,
    lessonCompleted,
    nextLevel,

    loading,
    error,

    sectionHasRequiredWork,
    isSectionAccessible,
    isSectionCompleted: checkSectionCompleted,
    canAdvanceCurrentSection,

    changeLesson,
    goToSection,
    goToNextSection,
    goToPreviousSection,
    goToNextLesson,
    goToPreviousLesson,
    markSectionCompleted,
    registerActivityResult,

    reload: loadNavigation
  };
};

export default useCourseNavigation;