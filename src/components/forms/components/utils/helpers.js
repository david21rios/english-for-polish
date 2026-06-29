// utils/helpers.js

// Función para generar IDs únicos
export const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Función para validar formato de email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para contar palabras
export const countWords = (text) => {
  return text.trim().split(/\s+/).length;
};

// Función para formatear fecha
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// Función para sanitizar texto
export const sanitizeText = (text) => {
  return text.trim().replace(/[<>]/g, '');
};

// Función para validar URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Función para ordenar array de objetos por campo
export const sortByField = (array, field, ascending = true) => {
  return [...array].sort((a, b) => {
    if (ascending) {
      return a[field] > b[field] ? 1 : -1;
    }
    return a[field] < b[field] ? 1 : -1;
  });
};

// Función para deep clone de objetos
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Función para comparar objetos
export const areObjectsEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Función para manejar errores de forma consistente
export const handleError = (error, fallback = null) => {
  console.error('Error:', error);
  return fallback;
};

// Función para validar campos requeridos en un objeto
export const validateRequiredFields = (obj, requiredFields) => {
  const errors = {};
  requiredFields.forEach(field => {
    if (!obj[field]) {
      errors[field] = 'Este campo es requerido';
    }
  });
  return errors;
};