// utils/constants.js

// Tabs para la navegación principal
export const tabs = [
  {
    id: 'basic',
    label: 'Información Básica',
    description: 'Datos básicos de la lección'
  },
  {
    id: 'objetivos',
    label: 'Objetivos',
    description: 'Objetivos de aprendizaje'
  },
  {
    id: 'contenidos',
    label: 'Contenidos',
    description: 'Contenido educativo'
  },
  {
    id: 'lectura',
    label: 'Lectura',
    description: 'Material de lectura'
  },
  {
    id: 'practica',
    label: 'Práctica Interactiva',
    description: 'Ejercicios prácticos'
  },
  {
    id: 'produccion_escrita',
    label: 'Producción Escrita',
    description: 'Ejercicios de escritura'
  },
  {
    id: 'produccion_oral',
    label: 'Producción Oral',
    description: 'Ejercicios orales'
  },
  {
    id: 'evaluacion',
    label: 'Evaluación',
    description: 'Evaluación del aprendizaje'
  },
  {
    id: 'recursos',
    label: 'Recursos Adicionales',
    description: 'Material complementario'
  },
  {
    id: 'reflexion',
    label: 'Reflexión Final',
    description: 'Reflexión sobre lo aprendido'
  }
];

// Tipos de ejercicios interactivos
export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  MATCHING: 'matching',
  ORDERING: 'ordering'
};

// Tipos de recursos
export const RESOURCE_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'documento',
  LINK: 'enlace',
  AUDIO: 'audio',
  IMAGE: 'imagen'
};

// Estados de validación
export const VALIDATION_STATES = {
  VALID: 'valid',
  INVALID: 'invalid',
  PENDING: 'pending'
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_FORMAT: 'El formato no es válido',
  MIN_LENGTH: (min) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max) => `No puede exceder los ${max} caracteres`
};

// Configuración de límites
export const LIMITS = {
  MIN_OBJECTIVES: 1,
  MAX_OBJECTIVES: 10,
  MIN_ACTIVITIES: 1,
  MAX_ACTIVITIES: 20,
  MIN_WORDS: 50,
  MAX_WORDS: 1000
};