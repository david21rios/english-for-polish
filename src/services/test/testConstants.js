// src/services/test/testConstants.js

/**
 * Supported CEFR levels.
 *
 * CEFR: Common European Framework of Reference for Languages.
 */
export const VALID_TEST_LEVELS = Object.freeze([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

/**
 * Firestore document identifiers used by test sections.
 */
export const TEST_SECTION_IDS = Object.freeze({
  multipleChoice: "multipleChoice",
  writing: "writing",
  reading: "reading"
});

/**
 * Default empty structure for every supported test section.
 *
 * Use createDefaultTestSections() when a new mutable copy is required.
 */
export const DEFAULT_TEST_SECTIONS = Object.freeze({
  multipleChoice: Object.freeze({
    questions: Object.freeze([])
  }),

  writing: Object.freeze({
    questions: Object.freeze([])
  }),

  reading: Object.freeze({
    texts: Object.freeze([])
  })
});

/**
 * Default test publication status.
 */
export const DEFAULT_TEST_STATUS = "published";

/**
 * Returns a new mutable copy of the default test sections.
 *
 * This prevents accidental mutation of the shared constants.
 *
 * @returns {{
 *   multipleChoice: { questions: Array },
 *   writing: { questions: Array },
 *   reading: { texts: Array }
 * }}
 */
export const createDefaultTestSections = () => {
  return {
    multipleChoice: {
      questions: []
    },

    writing: {
      questions: []
    },

    reading: {
      texts: []
    }
  };
};

/**
 * Returns the default title for a CEFR test.
 *
 * @param {string} level
 * @returns {string}
 */
export const createDefaultTestTitle = (
  level
) => {
  return `Test ${level}`;
};

export default {
  VALID_TEST_LEVELS,
  TEST_SECTION_IDS,
  DEFAULT_TEST_SECTIONS,
  DEFAULT_TEST_STATUS,
  createDefaultTestSections,
  createDefaultTestTitle
};