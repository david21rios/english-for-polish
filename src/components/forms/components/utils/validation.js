// src/components/forms/components/utils/validation.js

import { ERROR_MESSAGES } from "./constants";

const getTitle = (data = {}) => data.title || data.titulo || "";
const getExerciseType = (exercise = {}) => exercise.type || exercise.tipo || "";
const getInstructions = (exercise = {}) =>
  exercise.instructions || exercise.instrucciones || "";

// Basic lesson information validation.
export const validateBasicInfo = (data = {}) => {
  const errors = {};

  if (!data.id?.trim()) {
    errors.id = ERROR_MESSAGES.REQUIRED;
  }

  if (!getTitle(data).trim()) {
    errors.title = ERROR_MESSAGES.REQUIRED;

    // Legacy compatibility during migration.
    errors.titulo = ERROR_MESSAGES.REQUIRED;
  }

  return errors;
};

// Exercise validation.
export const validateExercise = (exercise = {}) => {
  const errors = {};
  const type = getExerciseType(exercise);

  if (!type) {
    errors.type = ERROR_MESSAGES.REQUIRED;
    errors.tipo = ERROR_MESSAGES.REQUIRED;
  }

  if (!getInstructions(exercise).trim()) {
    errors.instructions = ERROR_MESSAGES.REQUIRED;
    errors.instrucciones = ERROR_MESSAGES.REQUIRED;
  }

  switch (type) {
    case "multiple_choice":
      if (!(exercise.question || exercise.pregunta || "").trim()) {
        errors.question = ERROR_MESSAGES.REQUIRED;
        errors.pregunta = ERROR_MESSAGES.REQUIRED;
      }
      break;

    case "fill_blank":
      if (!(exercise.text || exercise.texto || "").trim()) {
        errors.text = ERROR_MESSAGES.REQUIRED;
        errors.texto = ERROR_MESSAGES.REQUIRED;
      }
      break;

    case "matching":
    case "ordering":
    default:
      break;
  }

  return errors;
};

export const validateForm = (formData = {}) => {
  const basicInfoErrors = validateBasicInfo(formData);

  return {
    errors: basicInfoErrors,
    isValid: Object.keys(basicInfoErrors).length === 0
  };
};

export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case "id":
      return value?.trim() ? "" : ERROR_MESSAGES.REQUIRED;

    case "title":
    case "titulo":
      return value?.trim() ? "" : ERROR_MESSAGES.REQUIRED;

    default:
      return "";
  }
};

export const isBasicInfoComplete = (formData = {}) => {
  const errors = validateBasicInfo(formData);

  return Object.keys(errors).length === 0;
};