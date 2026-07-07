// src/components/forms/components/utils/helpers.js

// Generates a unique identifier with an optional prefix.
export const generateUniqueId = (prefix = "") => {
  const randomPart = Math.random().toString(36).slice(2, 11);

  return `${prefix}${Date.now()}-${randomPart}`;
};

// Validates an email address.
export const isValidEmail = (email) => {
  if (typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email.trim());
};

// Counts words in a text value.
export const countWords = (text) => {
  if (typeof text !== "string") {
    return 0;
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  return normalizedText.split(/\s+/).length;
};

// Formats a date for the Polish interface.
export const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(parsedDate);
};

// Removes basic angle brackets from text input.
export const sanitizeText = (text) => {
  if (typeof text !== "string") {
    return "";
  }

  return text.trim().replace(/[<>]/g, "");
};

// Validates a URL.
export const isValidUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sorts an array of objects by a specific field.
export const sortByField = (
  array,
  field,
  ascending = true
) => {
  if (!Array.isArray(array)) {
    return [];
  }

  return [...array].sort((a, b) => {
    const valueA = a?.[field];
    const valueB = b?.[field];

    if (valueA === valueB) {
      return 0;
    }

    if (valueA == null) {
      return 1;
    }

    if (valueB == null) {
      return -1;
    }

    const comparison = valueA > valueB ? 1 : -1;

    return ascending ? comparison : -comparison;
  });
};

// Creates a deep clone of JSON-compatible data.
export const deepClone = (obj) => {
  if (obj === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(obj));
};

// Compares JSON-compatible objects.
export const areObjectsEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Handles errors consistently and returns a fallback value.
export const handleError = (error, fallback = null) => {
  console.error("Error:", error);

  return fallback;
};

// Validates required fields in an object.
export const validateRequiredFields = (
  obj,
  requiredFields
) => {
  const errors = {};

  requiredFields.forEach((field) => {
    const value = obj?.[field];

    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim());

    if (isEmpty) {
      errors[field] = "To pole jest wymagane.";
    }
  });

  return errors;
};