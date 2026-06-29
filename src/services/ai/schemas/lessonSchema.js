// src/services/ai/schemas/lessonSchema.js

export const LESSON_SCHEMA_VERSION = "1.0.0";

export const CEFR_LEVELS = [
  "A1-A2",
  "A2-B1",
  "B1-B2",
  "B2-C1",
  "C1-C2"
];

export const AGE_GROUPS = [
  "children",
  "teens",
  "adults",
  "all"
];

export const LESSON_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected"
};

export const createEmptyLessonSchema = ({
  levelId = "A1-A2",
  lessonId = "",
  targetLanguage = "Spanish",
  baseLanguage = "English",
  ageGroup = "adults"
} = {}) => {
  return {
    schemaVersion: LESSON_SCHEMA_VERSION,

    metadata: {
      lessonId,
      levelId,
      targetLanguage,
      baseLanguage,
      ageGroup,
      status: LESSON_STATUS.PENDING_REVIEW,
      generatedByAI: true,
      approvedByTeacher: false
    },

    lessonData: {
      id: lessonId,
      lessonId,
      titulo: "",
      descripcion: "",
      nivel: levelId,
      level: levelId,
      ageGroup,
      status: LESSON_STATUS.PENDING_REVIEW,

      objetivos: [],

      contenidos: {
        vocabulario: {
          title: "",
          items: []
        },
        gramatica: {
          title: "",
          explanation: "",
          examples: []
        }
      },

      lectura: {
        titulo: "",
        autor: "AI Tutor",
        contenido: "",
        preguntas: []
      },

      practica_interactiva: {
        titulo: "",
        descripcion: "",
        ejercicios: []
      },

      produccion_escrita: {
        titulo: "",
        descripcion: "",
        ejercicios: []
      },

      produccion_oral: {
        titulo: "",
        descripcion: "",
        ejercicios: []
      },

      evaluacion: {
        autoevaluacion: "",
        cuestionario: []
      },

      recursos_adicionales: [],

      reflexion_final: ""
    },

    auditReport: {
      cefrAlignment: "pending",
      languageAccuracy: "pending",
      culturalLocalization: "pending",
      jsonValidation: "pending",
      warnings: [],
      errors: []
    }
  };
};

export const REQUIRED_LESSON_FIELDS = [
  "schemaVersion",
  "metadata",
  "lessonData",
  "auditReport"
];

export const REQUIRED_LESSON_DATA_FIELDS = [
  "id",
  "lessonId",
  "titulo",
  "descripcion",
  "nivel",
  "level",
  "ageGroup",
  "status",
  "objetivos",
  "contenidos",
  "lectura",
  "practica_interactiva",
  "produccion_escrita",
  "produccion_oral",
  "evaluacion",
  "recursos_adicionales",
  "reflexion_final"
];

export const validateGeneratedLessonSchema = (lesson = {}) => {
  const errors = [];

  REQUIRED_LESSON_FIELDS.forEach((field) => {
    if (!(field in lesson)) {
      errors.push(`Missing root field: ${field}`);
    }
  });

  if (!lesson.lessonData) {
    errors.push("Missing lessonData object.");
  } else {
    REQUIRED_LESSON_DATA_FIELDS.forEach((field) => {
      if (!(field in lesson.lessonData)) {
        errors.push(`Missing lessonData field: ${field}`);
      }
    });
  }

  if (!lesson.metadata?.levelId) {
    errors.push("Missing metadata.levelId.");
  }

  if (!lesson.metadata?.targetLanguage) {
    errors.push("Missing metadata.targetLanguage.");
  }

  if (!lesson.metadata?.baseLanguage) {
    errors.push("Missing metadata.baseLanguage.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeLessonForFirestore = (generatedLesson = {}) => {
  const lessonData = generatedLesson.lessonData || {};

  return {
    ...lessonData,
    status: LESSON_STATUS.PENDING_REVIEW,
    generatedByAI: true,
    approvedByTeacher: false,
    schemaVersion: generatedLesson.schemaVersion || LESSON_SCHEMA_VERSION,
    aiMetadata: generatedLesson.metadata || {},
    auditReport: generatedLesson.auditReport || {
      cefrAlignment: "pending",
      languageAccuracy: "pending",
      culturalLocalization: "pending",
      jsonValidation: "pending",
      warnings: [],
      errors: []
    }
  };
};

export default {
  LESSON_SCHEMA_VERSION,
  CEFR_LEVELS,
  AGE_GROUPS,
  LESSON_STATUS,
  createEmptyLessonSchema,
  validateGeneratedLessonSchema,
  sanitizeLessonForFirestore
};