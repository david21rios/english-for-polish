// src/utils/useCourseNavigation.js

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import {
  getLessonSections,
  getUserCourseProfile,
  getLevelNavigationData,
  getInitialLessonForLevel,
  loadLessonDetails,
  loadLessonProgressState,
  saveLessonProgressState,
  completeLessonForUser,
  getNextLesson,
  getPreviousLesson,
  getNextLevel
} from "../services/courseNavigationService";

import {
  sectionHasRequiredWork as engineSectionHasRequiredWork,
  canAccessSection,
  canAdvanceFromSection,
  getLessonCompletionPercent,
  isLessonCompleted
} from "./completionEngine";

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

  const currentSection = lessonSections[currentSectionIndex];
  const nextLevel = getNextLevel(levelId);

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
    (index) => {
      return canAccessSection({
        sectionIndex: index,
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

  const canAdvanceCurrentSection = useCallback(() => {
    if (!currentSection) return false;

    return canAdvanceFromSection({
      sectionId: currentSection.id,
      completedSections,
      activityResults,
      lessonDetails
    });
  }, [currentSection, completedSections, activityResults, lessonDetails]);

  const loadProgressForLesson = useCallback(
    async ({ lesson, requestedSectionIndex = null }) => {
      const progressState = await loadLessonProgressState({
        userId: auth.currentUser?.uid || userId,
        levelId,
        lessonId: lesson.id,
        requestedSectionIndex
      });

      return {
        currentSectionIndex: progressState.currentSectionIndex || 0,
        completedSections: progressState.completedSections || [],
        activityResults: progressState.activityResults || {}
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

      const progressState = await loadProgressForLesson({
        lesson,
        requestedSectionIndex
      });

      setCurrentLesson(lesson);
      setLessonDetails(details);
      setCurrentSectionIndex(progressState.currentSectionIndex);
      setCompletedSections(progressState.completedSections);
      setActivityResults(progressState.activityResults);
    },
    [levelId, loadProgressForLesson]
  );

  const changeLesson = useCallback(
    async (lessonId) => {
      const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);

      if (!selectedLesson) {
        throw new Error("Lección no encontrada.");
      }

      await openLesson(selectedLesson);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [lessons, openLesson]
  );

  const loadNavigation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Usuario no autenticado.");
      }

      const profile = await getUserCourseProfile(currentUser.uid);

      setUserId(currentUser.uid);
      setAgeGroup(profile.ageGroup);

      const navigationData = await getLevelNavigationData({
        levelId,
        userAgeGroup: profile.ageGroup,
        includeDrafts: false
      });

      if (!navigationData.hasLessons) {
        throw new Error(
          "No hay lecciones publicadas disponibles para este nivel y perfil."
        );
      }

      setModules(navigationData.modules);
      setLessons(navigationData.lessons);

      const requestedLessonId = locationState?.lessonId || null;

      const initialLesson = await getInitialLessonForLevel({
        levelId,
        requestedLessonId,
        userAgeGroup: profile.ageGroup,
        includeDrafts: false
      });

      if (!initialLesson) {
        throw new Error("No se encontró una lección inicial disponible.");
      }

      await openLesson(
        initialLesson,
        locationState?.sectionIndex ?? null
      );
    } catch (error) {
      console.error("Error loading course navigation:", error);
      setError(
        error.message ||
          "No hay lecciones publicadas disponibles para este nivel."
      );
    } finally {
      setLoading(false);
    }
  }, [levelId, locationState, openLesson]);

  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);
    const markSectionCompleted = useCallback(
    async (sectionId, result = {}) => {
      if (!currentLesson || !sectionId) return;

      const updatedCompletedSections = Array.from(
        new Set([...completedSections, sectionId])
      );

      const updatedActivityResults = {
        ...activityResults,
        [sectionId]: {
          ...(activityResults[sectionId] || {}),
          ...result,
          completed: true
        }
      };

      setCompletedSections(updatedCompletedSections);
      setActivityResults(updatedActivityResults);

      await saveLessonProgressState({
        userId,
        levelId,
        lessonId: currentLesson.id,
        currentSectionIndex,
        completedSections: updatedCompletedSections,
        activityResults: updatedActivityResults,
        completed: isLessonCompleted({
          lessonSections,
          completedSections: updatedCompletedSections,
          activityResults: updatedActivityResults,
          lessonDetails
        })
      });
    },
    [
      currentLesson,
      completedSections,
      activityResults,
      userId,
      levelId,
      currentSectionIndex,
      lessonSections,
      lessonDetails
    ]
  );

  const goToSection = useCallback(
    async (index) => {
      if (!currentLesson || !isSectionAccessible(index)) return;

      setCurrentSectionIndex(index);

      await saveLessonProgressState({
        userId,
        levelId,
        lessonId: currentLesson.id,
        currentSectionIndex: index,
        completedSections,
        activityResults,
        completed: isLessonCompleted({
          lessonSections,
          completedSections,
          activityResults,
          lessonDetails
        })
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [
      currentLesson,
      isSectionAccessible,
      userId,
      levelId,
      completedSections,
      activityResults,
      lessonSections,
      lessonDetails
    ]
  );

  const goToNextSection = useCallback(async () => {
    if (!currentLesson || !canAdvanceCurrentSection()) return;

    const currentSectionId = lessonSections[currentSectionIndex]?.id;

    const updatedCompletedSections = Array.from(
      new Set([...completedSections, currentSectionId])
    );

    const updatedActivityResults = {
      ...activityResults,
      [currentSectionId]: {
        ...(activityResults[currentSectionId] || {}),
        completed: true
      }
    };

    const nextIndex =
      currentSectionIndex < lessonSections.length - 1
        ? currentSectionIndex + 1
        : currentSectionIndex;

    setCompletedSections(updatedCompletedSections);
    setActivityResults(updatedActivityResults);
    setCurrentSectionIndex(nextIndex);

    await saveLessonProgressState({
      userId,
      levelId,
      lessonId: currentLesson.id,
      currentSectionIndex: nextIndex,
      completedSections: updatedCompletedSections,
      activityResults: updatedActivityResults,
      completed: isLessonCompleted({
        lessonSections,
        completedSections: updatedCompletedSections,
        activityResults: updatedActivityResults,
        lessonDetails
      })
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    currentLesson,
    canAdvanceCurrentSection,
    lessonSections,
    currentSectionIndex,
    completedSections,
    activityResults,
    userId,
    levelId,
    lessonDetails
  ]);

  const goToPreviousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionIndex]);

  const goToNextLesson = useCallback(async () => {
    if (!currentLesson) return null;

    await completeLessonForUser({
      userId,
      levelId,
      lessonId: currentLesson.id
    });

    const nextLesson = getNextLesson(lessons, currentLesson.id);

    if (nextLesson) {
      await openLesson(nextLesson);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return { type: "lesson", lesson: nextLesson };
    }

    return { type: "level", levelId: nextLevel };
  }, [currentLesson, userId, levelId, lessons, openLesson, nextLevel]);

  const goToPreviousLesson = useCallback(async () => {
    if (!currentLesson) return;

    const previousLesson = getPreviousLesson(lessons, currentLesson.id);

    if (previousLesson) {
      await openLesson(previousLesson);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentLesson, lessons, openLesson]);

  const currentLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === currentLesson?.id
  );

  const sectionProgress = getLessonCompletionPercent({
    lessonSections,
    completedSections,
    activityResults,
    lessonDetails
  });

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
    nextLevel,

    loading,
    error,

    sectionHasRequiredWork,
    isSectionAccessible,
    canAdvanceCurrentSection,

    changeLesson,
    goToSection,
    goToNextSection,
    goToPreviousSection,
    goToNextLesson,
    goToPreviousLesson,
    markSectionCompleted,

    reload: loadNavigation
  };
};

export default useCourseNavigation;