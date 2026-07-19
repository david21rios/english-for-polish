// src/services/test/testValidation.js

import {
  VALID_TEST_LEVELS
} from "./testConstants";

/**
 * Determines whether a value is a plain JavaScript object.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

/**
 * Normalizes a CEFR level.
 *
 * Examples:
 * "a1" -> "A1"
 * " b2 " -> "B2"
 *
 * @param {string} level
 * @returns {string}
 */
export const normalizeLevel = (
  level = ""
) => {
  return String(level)
    .trim()
    .toUpperCase();
};

/**
 * Returns true if the supplied level
 * is a supported CEFR level.
 *
 * @param {string} level
 * @returns {boolean}
 */
export const isValidLevel = (
  level
) => {
  return VALID_TEST_LEVELS.includes(
    normalizeLevel(level)
  );
};

/**
 * Validates a CEFR level.
 *
 * Throws an exception if the level
 * is missing or invalid.
 *
 * @param {string} level
 * @returns {string}
 */
export const validateLevel = (
  level
) => {

  const normalizedLevel =
    normalizeLevel(level);

  if (!normalizedLevel) {
    throw new Error(
      "A CEFR level is required."
    );
  }

  if (
    !VALID_TEST_LEVELS.includes(
      normalizedLevel
    )
  ) {
    throw new Error(
      `Invalid CEFR level "${normalizedLevel}". ` +
      `Supported levels: ${VALID_TEST_LEVELS.join(", ")}.`
    );
  }

  return normalizedLevel;
};

/**
 * Returns a normalized array.
 *
 * Undefined, null and non-array values
 * become an empty array.
 *
 * Empty values are removed.
 *
 * @param {unknown} value
 * @returns {Array}
 */
export const normalizeArray = (
  value
) => {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : [];
};

/**
 * Generates a default test title.
 *
 * @param {string} level
 * @returns {string}
 */
export const createTestTitle = (
  level
) => {
  return `Test ${normalizeLevel(level)}`;
};

export default {
  isPlainObject,
  normalizeLevel,
  isValidLevel,
  validateLevel,
  normalizeArray,
  createTestTitle
};