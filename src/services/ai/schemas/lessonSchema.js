// src/services/ai/schemas/lessonSchema.js

export const LESSON_SCHEMA_VERSION = "1.0.0";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const AGE_GROUPS = [
  "kids_early",
  "kids",
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

export const PROJECT_LANGUAGES = {
  TARGET_LANGUAGE: "English",
  SUPPORT_LANGUAGE: "Polish",
  BASE_LANGUAGE: "Polish"
};

export const createEmptyLessonSchema = ({
  levelId = "A1",
  moduleId = "",
  moduleTitle = "",
  orderInModule = 1,
  lessonId = "",
  lessonNumber = 1,
  targetLanguage = PROJECT_LANGUAGES.TARGET_LANGUAGE,
  baseLanguage = PROJECT_LANGUAGES.BASE_LANGUAGE,
  supportLanguage = PROJECT_LANGUAGES.SUPPORT_LANGUAGE,
  ageGroup = "all"
} = {}) => {
  return {
    schemaVersion: LESSON_SCHEMA_VERSION,

    metadata: {
      lessonId,
      lessonNumber,
      levelId,
      moduleId,
      moduleTitle,
      orderInModule,
      targetLanguage,
      baseLanguage,
      supportLanguage,
      product: "Polish-learning",
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
      moduleId,
      moduleTitle,
      orderInModule,
      ageGroup,
      status: LESSON_STATUS.PENDING_REVIEW,

      objetivos: [],

      contenidos: {
        vocabulario: {
          titulo: "",
          palabras: []
        },
        gramatica: {
          temas: [],
          reglas: []
        }
      },

      lectura: {
        titulo: "",
        autor: "Polish Learning AI",
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

export const REQUIRED_METADATA_FIELDS = [
  "lessonId",
  "levelId",
  "moduleId",
  "moduleTitle",
  "orderInModule",
  "targetLanguage",
  "baseLanguage",
  "supportLanguage",
  "status",
  "generatedByAI",
  "approvedByTeacher"
];

export const REQUIRED_LESSON_DATA_FIELDS = [
  "id",
  "lessonId",
  "titulo",
  "descripcion",
  "nivel",
  "level",
  "moduleId",
  "moduleTitle",
  "orderInModule",
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

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasNestedArrays = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => Array.isArray(item) || hasNestedArrays(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some(hasNestedArrays);
  }

  return false;
};

const validateRequiredFields = ({ source, fields, label, errors }) => {
  fields.forEach((field) => {
    if (!(field in source)) {
      errors.push(`Missing ${label} field: ${field}`);
    }
  });
};

const validateLevel = (levelId, errors) => {
  if (!CEFR_LEVELS.includes(levelId)) {
    errors.push(`Invalid CEFR level: ${levelId}`);
  }
};

const validateAgeGroup = (ageGroup, errors) => {
  if (!AGE_GROUPS.includes(ageGroup)) {
    errors.push(`Invalid age group: ${ageGroup}`);
  }
};

const validateLanguages = (metadata = {}, errors) => {
  if (metadata.targetLanguage !== PROJECT_LANGUAGES.TARGET_LANGUAGE) {
    errors.push("metadata.targetLanguage must be English.");
  }

  if (metadata.baseLanguage !== PROJECT_LANGUAGES.BASE_LANGUAGE) {
    errors.push("metadata.baseLanguage must be Polish.");
  }

  if (metadata.supportLanguage !== PROJECT_LANGUAGES.SUPPORT_LANGUAGE) {
    errors.push("metadata.supportLanguage must be Polish.");
  }
};

const validateInteractivePractice = (lessonData = {}, errors) => {
  const exercises = lessonData.practica_interactiva?.ejercicios;

  if (!Array.isArray(exercises)) {
    errors.push("practica_interactiva.ejercicios must be an array.");
    return;
  }

  const expectedTypes = [
    "seleccion_multiple",
    "completar",
    "relacionar",
    "ordenar"
  ];

  expectedTypes.forEach((type) => {
    if (!exercises.some((exercise) => exercise?.tipo === type)) {
      errors.push(`Missing interactive exercise type: ${type}`);
    }
  });
};

export const validateGeneratedLessonSchema = (lesson = {}) => {
  const errors = [];

  validateRequiredFields({
    source: lesson,
    fields: REQUIRED_LESSON_FIELDS,
    label: "root",
    errors
  });

  if (!isPlainObject(lesson.metadata)) {
    errors.push("metadata must be an object.");
  } else {
    validateRequiredFields({
      source: lesson.metadata,
      fields: REQUIRED_METADATA_FIELDS,
      label: "metadata",
      errors
    });

    validateLevel(lesson.metadata.levelId, errors);
    validateAgeGroup(lesson.metadata.ageGroup || "all", errors);
    validateLanguages(lesson.metadata, errors);
  }

  if (!isPlainObject(lesson.lessonData)) {
    errors.push("lessonData must be an object.");
  } else {
    validateRequiredFields({
      source: lesson.lessonData,
      fields: REQUIRED_LESSON_DATA_FIELDS,
      label: "lessonData",
      errors
    });

    validateLevel(lesson.lessonData.level, errors);
    validateAgeGroup(lesson.lessonData.ageGroup, errors);
    validateInteractivePractice(lesson.lessonData, errors);

    if (lesson.metadata?.levelId && lesson.lessonData.level) {
      if (lesson.metadata.levelId !== lesson.lessonData.level) {
        errors.push("metadata.levelId and lessonData.level must match.");
      }
    }

    if (lesson.metadata?.moduleId && lesson.lessonData.moduleId) {
      if (lesson.metadata.moduleId !== lesson.lessonData.moduleId) {
        errors.push("metadata.moduleId and lessonData.moduleId must match.");
      }
    }
  }

  if (hasNestedArrays(lesson)) {
    errors.push("Nested arrays are not allowed because Firestore does not support them.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeLessonForFirestore = (generatedLesson = {}) => {
  const lessonData = generatedLesson.lessonData || {};
  const metadata = generatedLesson.metadata || {};

  return {
    ...lessonData,
    id: lessonData.id || metadata.lessonId,
    lessonId: lessonData.lessonId || metadata.lessonId,
    nivel: lessonData.nivel || metadata.levelId,
    level: lessonData.level || metadata.levelId,
    moduleId: lessonData.moduleId || metadata.moduleId,
    moduleTitle: lessonData.moduleTitle || metadata.moduleTitle || "",
    orderInModule: Number(
      lessonData.orderInModule || metadata.orderInModule || 1
    ),
    status: LESSON_STATUS.PENDING_REVIEW,
    generatedByAI: true,
    approvedByTeacher: false,
    schemaVersion: generatedLesson.schemaVersion || LESSON_SCHEMA_VERSION,
    aiMetadata: metadata,
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
  PROJECT_LANGUAGES,
  createEmptyLessonSchema,
  validateGeneratedLessonSchema,
  sanitizeLessonForFirestore
};