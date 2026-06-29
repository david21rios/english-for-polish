// src/utils/completionEngine.js

const DEFAULT_MINIMUM_SCORE = 70;

export const COMPLETION_TYPES = {
  CONTINUE: "continue",
  VIEW: "view",
  QUIZ: "quiz",
  ALL_EXERCISES: "allExercises",
  SUBMISSION: "submission",
  RECORDING: "recording",
  MINIMUM_SCORE: "minimumScore",
  MANUAL: "manual"
};

export const DEFAULT_SECTION_COMPLETION_RULES = {
  intro: {
    completionType: COMPLETION_TYPES.CONTINUE,
    required: false
  },
  vocabulary: {
    completionType: COMPLETION_TYPES.CONTINUE,
    required: false
  },
  grammar: {
    completionType: COMPLETION_TYPES.CONTINUE,
    required: false
  },
  reading: {
    completionType: COMPLETION_TYPES.QUIZ,
    required: true,
    minimumScore: 70
  },
  practice: {
    completionType: COMPLETION_TYPES.ALL_EXERCISES,
    required: true
  },
  writing: {
    completionType: COMPLETION_TYPES.SUBMISSION,
    required: true
  },
  speaking: {
    completionType: COMPLETION_TYPES.RECORDING,
    required: true
  },
  evaluation: {
    completionType: COMPLETION_TYPES.MINIMUM_SCORE,
    required: true,
    minimumScore: DEFAULT_MINIMUM_SCORE
  },
  resources: {
    completionType: COMPLETION_TYPES.CONTINUE,
    required: false
  },
  reflection: {
    completionType: COMPLETION_TYPES.CONTINUE,
    required: false
  }
};

export const getSectionCompletionRule = (
  sectionId,
  customRules = {}
) => {
  return {
    ...(DEFAULT_SECTION_COMPLETION_RULES[sectionId] || {
      completionType: COMPLETION_TYPES.CONTINUE,
      required: false
    }),
    ...(customRules[sectionId] || {})
  };
};

export const sectionHasRequiredWork = ({
  sectionId,
  lessonDetails,
  customRules = {}
}) => {
  const rule = getSectionCompletionRule(sectionId, customRules);

  if (!rule.required) return false;
  if (!lessonDetails) return false;

  if (sectionId === "reading") {
    return Array.isArray(lessonDetails.lectura?.preguntas)
      && lessonDetails.lectura.preguntas.length > 0;
  }

  if (sectionId === "practice") {
    return Array.isArray(lessonDetails.practica_interactiva?.ejercicios)
      && lessonDetails.practica_interactiva.ejercicios.length > 0;
  }

  if (sectionId === "writing") {
    return Array.isArray(lessonDetails.produccion_escrita?.ejercicios)
      && lessonDetails.produccion_escrita.ejercicios.length > 0;
  }

  if (sectionId === "speaking") {
    return Array.isArray(lessonDetails.produccion_oral?.ejercicios)
      && lessonDetails.produccion_oral.ejercicios.length > 0;
  }

  if (sectionId === "evaluation") {
    return Array.isArray(lessonDetails.evaluacion?.cuestionario)
      && lessonDetails.evaluacion.cuestionario.length > 0;
  }

  return rule.required;
};

export const isSectionCompleted = ({
  sectionId,
  completedSections = [],
  activityResults = {},
  lessonDetails = null,
  customRules = {}
}) => {
  const rule = getSectionCompletionRule(sectionId, customRules);

  if (completedSections.includes(sectionId)) {
    return true;
  }

  if (!rule.required) {
    return true;
  }

  const result = activityResults[sectionId] || {};

  switch (rule.completionType) {
    case COMPLETION_TYPES.CONTINUE:
    case COMPLETION_TYPES.VIEW:
      return Boolean(result.visited || result.completed);

    case COMPLETION_TYPES.QUIZ:
    case COMPLETION_TYPES.MINIMUM_SCORE: {
      const score = Number(result.score);

      if (Number.isNaN(score)) return false;

      return score >= Number(rule.minimumScore || DEFAULT_MINIMUM_SCORE);
    }

    case COMPLETION_TYPES.ALL_EXERCISES: {
      const totalExercises =
        Number(result.totalExercises) ||
        lessonDetails?.practica_interactiva?.ejercicios?.length ||
        0;

      const completedExercises = Number(result.completedExercises) || 0;

      return totalExercises > 0 && completedExercises >= totalExercises;
    }

    case COMPLETION_TYPES.SUBMISSION:
      return Boolean(result.submitted || result.completed);

    case COMPLETION_TYPES.RECORDING:
      return Boolean(result.recorded || result.submitted || result.completed);

    case COMPLETION_TYPES.MANUAL:
      return Boolean(result.completed);

    default:
      return false;
  }
};

export const canAccessSection = ({
  sectionIndex,
  currentSectionIndex = 0,
  lessonSections = [],
  completedSections = [],
  activityResults = {},
  lessonDetails = null,
  customRules = {}
}) => {
  if (sectionIndex === 0) return true;
  if (sectionIndex <= currentSectionIndex) return true;

  const previousSection = lessonSections[sectionIndex - 1];

  if (!previousSection) return false;

  const previousHasWork = sectionHasRequiredWork({
    sectionId: previousSection.id,
    lessonDetails,
    customRules
  });

  if (!previousHasWork) {
    return sectionIndex <= currentSectionIndex + 1;
  }

  return isSectionCompleted({
    sectionId: previousSection.id,
    completedSections,
    activityResults,
    lessonDetails,
    customRules
  });
};

export const canAdvanceFromSection = ({
  sectionId,
  completedSections = [],
  activityResults = {},
  lessonDetails = null,
  customRules = {}
}) => {
  const hasWork = sectionHasRequiredWork({
    sectionId,
    lessonDetails,
    customRules
  });

  if (!hasWork) return true;

  return isSectionCompleted({
    sectionId,
    completedSections,
    activityResults,
    lessonDetails,
    customRules
  });
};

export const getRequiredSections = ({
  lessonSections = [],
  lessonDetails = null,
  customRules = {}
}) => {
  return lessonSections.filter((section) =>
    sectionHasRequiredWork({
      sectionId: section.id,
      lessonDetails,
      customRules
    })
  );
};

export const isLessonCompleted = ({
  lessonSections = [],
  completedSections = [],
  activityResults = {},
  lessonDetails = null,
  customRules = {}
}) => {
  const requiredSections = getRequiredSections({
    lessonSections,
    lessonDetails,
    customRules
  });

  if (!requiredSections.length) {
    return completedSections.length >= lessonSections.length;
  }

  return requiredSections.every((section) =>
    isSectionCompleted({
      sectionId: section.id,
      completedSections,
      activityResults,
      lessonDetails,
      customRules
    })
  );
};

export const getLessonCompletionPercent = ({
  lessonSections = [],
  completedSections = [],
  activityResults = {},
  lessonDetails = null,
  customRules = {}
}) => {
  if (!lessonSections.length) return 0;

  const completedCount = lessonSections.filter((section) =>
    isSectionCompleted({
      sectionId: section.id,
      completedSections,
      activityResults,
      lessonDetails,
      customRules
    })
  ).length;

  return Math.round((completedCount / lessonSections.length) * 100);
};

export const isModuleCompleted = ({
  moduleLessons = [],
  completedLessonIds = []
}) => {
  if (!moduleLessons.length) return false;

  return moduleLessons.every((lesson) =>
    completedLessonIds.includes(lesson.id || lesson.lessonId)
  );
};

export const getModuleCompletionPercent = ({
  moduleLessons = [],
  completedLessonIds = []
}) => {
  if (!moduleLessons.length) return 0;

  const completedCount = moduleLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id || lesson.lessonId)
  ).length;

  return Math.round((completedCount / moduleLessons.length) * 100);
};

export const canAccessModule = ({
  moduleIndex = 0,
  modules = [],
  completedModuleIds = []
}) => {
  if (moduleIndex === 0) return true;

  const previousModule = modules[moduleIndex - 1];

  if (!previousModule) return false;

  return completedModuleIds.includes(
    previousModule.moduleId || previousModule.id
  );
};

export default {
  COMPLETION_TYPES,
  DEFAULT_SECTION_COMPLETION_RULES,
  getSectionCompletionRule,
  sectionHasRequiredWork,
  isSectionCompleted,
  canAccessSection,
  canAdvanceFromSection,
  getRequiredSections,
  isLessonCompleted,
  getLessonCompletionPercent,
  isModuleCompleted,
  getModuleCompletionPercent,
  canAccessModule
};