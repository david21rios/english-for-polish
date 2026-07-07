// src/components/forms/components/utils/constants.js

// Main lesson form navigation tabs.
// Internal identifiers remain in English.
// Visible labels and descriptions are shown in Polish.
export const tabs = [
  {
    id: "basic",
    label: "Informacje podstawowe",
    description: "Podstawowe dane lekcji"
  },
  {
    id: "objectives",
    label: "Cele",
    description: "Cele edukacyjne lekcji"
  },
  {
    id: "contents",
    label: "Treści",
    description: "Treści edukacyjne"
  },
  {
    id: "reading",
    label: "Czytanie",
    description: "Materiały do czytania"
  },
  {
    id: "practice",
    label: "Ćwiczenia interaktywne",
    description: "Interaktywne ćwiczenia praktyczne"
  },
  {
    id: "writing",
    label: "Pisanie",
    description: "Ćwiczenia rozwijające umiejętność pisania"
  },
  {
    id: "speaking",
    label: "Mówienie",
    description: "Ćwiczenia rozwijające umiejętność mówienia"
  },
  {
    id: "evaluation",
    label: "Ocena",
    description: "Ocena efektów uczenia się"
  },
  {
    id: "resources",
    label: "Materiały dodatkowe",
    description: "Materiały uzupełniające"
  },
  {
    id: "reflection",
    label: "Refleksja końcowa",
    description: "Refleksja nad zdobytą wiedzą"
  }
];

// Interactive exercise types.
// These values are part of the internal data model.
export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  FILL_BLANK: "fill_blank",
  MATCHING: "matching",
  ORDERING: "ordering"
};

// Resource types.
// These values are part of the internal data model.
export const RESOURCE_TYPES = {
  VIDEO: "video",
  DOCUMENT: "document",
  LINK: "link",
  AUDIO: "audio",
  IMAGE: "image",
  ACTIVITY: "activity",
  OFFLINE: "offline"
};

// Validation states.
export const VALIDATION_STATES = {
  VALID: "valid",
  INVALID: "invalid",
  PENDING: "pending"
};

// Common validation messages shown in the Polish interface.
export const ERROR_MESSAGES = {
  REQUIRED: "To pole jest wymagane.",
  INVALID_FORMAT: "Format jest nieprawidłowy.",
  MIN_LENGTH: (min) => `Pole musi zawierać co najmniej ${min} znaków.`,
  MAX_LENGTH: (max) => `Pole nie może przekraczać ${max} znaków.`
};

// Form limits.
export const LIMITS = {
  MIN_OBJECTIVES: 1,
  MAX_OBJECTIVES: 10,
  MIN_ACTIVITIES: 1,
  MAX_ACTIVITIES: 20,
  MIN_WORDS: 50,
  MAX_WORDS: 1000
};