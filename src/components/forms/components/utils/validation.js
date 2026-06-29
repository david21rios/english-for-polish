// utils/validation.js
import { ERROR_MESSAGES } from './constants';

// Validación de información básica
export const validateBasicInfo = (data) => {
  const errors = {};

  // Validación del ID
  if (!data.id?.trim()) {
    errors.id = ERROR_MESSAGES.REQUIRED;
  }

  // Validación del título
  if (!data.titulo?.trim()) {
    errors.titulo = ERROR_MESSAGES.REQUIRED;
  }

  return errors;
};

// Validación de ejercicios (opcional)
export const validateExercise = (exercise) => {
  const errors = {};

  if (!exercise.tipo) {
    errors.tipo = ERROR_MESSAGES.REQUIRED;
  }

  if (!exercise.instrucciones?.trim()) {
    errors.instrucciones = ERROR_MESSAGES.REQUIRED;
  }

  switch (exercise.tipo) {
    case 'multiple_choice':
      if (!exercise.pregunta?.trim()) {
        errors.pregunta = ERROR_MESSAGES.REQUIRED;
      }
      break;

    case 'fill_blank':
      if (!exercise.texto?.trim()) {
        errors.texto = ERROR_MESSAGES.REQUIRED;
      }
      break;

    case 'matching':
      // Validación opcional para ejercicios de relacionar
      break;

    case 'ordering':
      // Validación opcional para ejercicios de ordenar
      break;
  }

  return errors;
};

// Función principal de validación
export const validateForm = (formData) => {
  // Solo validamos la información básica
  const basicInfoErrors = validateBasicInfo(formData);

  // Retornamos un objeto con los errores y el estado de validación
  return {
    errors: basicInfoErrors,
    isValid: Object.keys(basicInfoErrors).length === 0
  };
};

// Función auxiliar para validar campos específicos (opcional)
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'id':
      return value?.trim() ? '' : ERROR_MESSAGES.REQUIRED;
    case 'titulo':
      return value?.trim() ? '' : ERROR_MESSAGES.REQUIRED;
    default:
      return '';
  }
};

// Función para validar si la información básica está completa
export const isBasicInfoComplete = (formData) => {
  const errors = validateBasicInfo(formData);
  return Object.keys(errors).length === 0;
};