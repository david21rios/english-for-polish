// src/services/test/index.js

// Main service
export {
  default,
  createTest,
  getTest,
  getAllTests,
  updateTest,
  checkTestExists,
  deleteTest,
  getTestsByLevel
} from "./testService";

// Constants
export {
  VALID_TEST_LEVELS,
  TEST_SECTION_IDS,
  DEFAULT_TEST_SECTIONS,
  DEFAULT_TEST_STATUS,
  createDefaultTestSections,
  createDefaultTestTitle
} from "./testConstants";

// Validation
export {
  isPlainObject,
  normalizeLevel,
  isValidLevel,
  validateLevel,
  normalizeArray,
  createTestTitle
} from "./testValidation";

// Normalization
export {
  normalizeMultipleChoiceQuestion,
  normalizeWritingQuestion,
  normalizeReadingQuestion,
  normalizeReadingText,
  normalizeMultipleChoiceSection,
  normalizeWritingSection,
  normalizeReadingSection,
  normalizeTestSections,
  normalizeSections
} from "./testNormalization";

// Repository
export {
  getTestReference,
  getSectionsCollectionReference,
  getTestDocument,
  getAllTestDocuments,
  saveTestMetadata,
  saveTestSections,
  readTestSections,
  deleteTestDocument
} from "./testRepository";