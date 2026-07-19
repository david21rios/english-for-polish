// src/services/test/testService.js

import {
  serverTimestamp
} from "firebase/firestore";

import {
  DEFAULT_TEST_STATUS,
  VALID_TEST_LEVELS,
  createDefaultTestTitle
} from "./testConstants";

import {
  normalizeLevel,
  validateLevel
} from "./testValidation";

import {
  getAllTestDocuments,
  getTestDocument,
  getTestReference,
  readTestSections,
  saveTestMetadata,
  saveTestSections,
  deleteTestDocument
} from "./testRepository";

/**
 * Converts an unknown error value into a readable message.
 *
 * @param {unknown} error
 * @returns {string}
 */
const getErrorMessage = (
  error
) => {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error.";
};

/**
 * Wraps an internal error while preserving
 * the original Firebase error code when available.
 *
 * @param {string} message
 * @param {unknown} error
 * @returns {Error}
 */
const createTestServiceError = (
  message,
  error
) => {
  const serviceError = new Error(
    `${message}: ${getErrorMessage(error)}`,
    {
      cause: error
    }
  );

  if (
    error &&
    typeof error === "object" &&
    typeof error.code === "string"
  ) {
    serviceError.code = error.code;
  }

  return serviceError;
};

/**
 * Builds the complete application representation
 * of a Firestore test document.
 *
 * @param {import("firebase/firestore").DocumentSnapshot} testDocument
 * @returns {Promise<object>}
 */
const buildTestResponse = async (
  testDocument
) => {
  const testData =
    testDocument.data() || {};

  const level =
    normalizeLevel(
      testData.level ||
      testDocument.id
    );

  const sections =
    await readTestSections(
      testDocument.ref
    );

  return {
    id: testDocument.id,
    ...testData,
    level,
    sections
  };
};

/**
 * Returns the CEFR sorting order.
 *
 * @returns {Record<string, number>}
 */
const createLevelOrder = () => {
  return VALID_TEST_LEVELS.reduce(
    (
      levelOrder,
      level,
      index
    ) => {
      levelOrder[level] = index;

      return levelOrder;
    },
    {}
  );
};

/**
 * Sorts tests according to their CEFR level.
 *
 * @param {object[]} tests
 * @returns {object[]}
 */
const sortTestsByLevel = (
  tests
) => {
  const levelOrder =
    createLevelOrder();

  return [...tests].sort(
    (
      firstTest,
      secondTest
    ) => {
      const firstOrder =
        levelOrder[
          firstTest.level
        ] ?? 999;

      const secondOrder =
        levelOrder[
          secondTest.level
        ] ?? 999;

      return (
        firstOrder -
        secondOrder
      );
    }
  );
};

/**
 * Creates a new CEFR test.
 *
 * @param {object} testData
 * @returns {Promise<object>}
 */
export const createTest = async (
  testData = {}
) => {
  try {
    const level =
      validateLevel(
        testData.level ||
        testData.id
      );

    const existingTest =
      await getTestDocument(
        level
      );

    if (existingTest.exists()) {
      throw new Error(
        `A test for level ${level} already exists.`
      );
    }

    const title =
      testData.title ||
      createDefaultTestTitle(
        level
      );

    const description =
      testData.description ||
      "";

    const status =
      testData.status ||
      DEFAULT_TEST_STATUS;

    const timestamp =
      serverTimestamp();

    await saveTestMetadata(
      level,
      {
        level,
        title,
        description,
        status,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    );

    const sections =
      await saveTestSections(
        getTestReference(level),
        testData.sections
      );

    return {
      id: level,
      level,
      title,
      description,
      status,
      sections
    };
  } catch (error) {
    console.error(
      "Test creation failed:",
      error
    );

    throw createTestServiceError(
      "Could not create the test",
      error
    );
  }
};

/**
 * Retrieves a test by its CEFR level.
 *
 * @param {string} testId
 * @returns {Promise<object>}
 */
export const getTest = async (
  testId
) => {
  try {
    const level =
      validateLevel(testId);

    const testDocument =
      await getTestDocument(
        level
      );

    if (!testDocument.exists()) {
      throw new Error(
        `Test ${level} was not found.`
      );
    }

    return await buildTestResponse(
      testDocument
    );
  } catch (error) {
    console.error(
      "Test retrieval failed:",
      error
    );

    throw createTestServiceError(
      "Could not retrieve the test",
      error
    );
  }
};

/**
 * Retrieves every available CEFR test.
 *
 * @returns {Promise<object[]>}
 */
export const getAllTests = async () => {
  try {
    const testsSnapshot =
      await getAllTestDocuments();

    const tests =
      await Promise.all(
        testsSnapshot.docs.map(
          (
            testDocument
          ) =>
            buildTestResponse(
              testDocument
            )
        )
      );

    return sortTestsByLevel(
      tests
    );
  } catch (error) {
    console.error(
      "Tests retrieval failed:",
      error
    );

    throw createTestServiceError(
      "Could not retrieve the tests",
      error
    );
  }
};

/**
 * Updates an existing CEFR test.
 *
 * Sections are updated only when the sections
 * property is explicitly supplied.
 *
 * @param {string} testId
 * @param {object} testData
 * @returns {Promise<object>}
 */
export const updateTest = async (
  testId,
  testData = {}
) => {
  try {
    const level =
      validateLevel(testId);

    const existingTest =
      await getTestDocument(
        level
      );

    if (!existingTest.exists()) {
      throw new Error(
        `Test ${level} was not found.`
      );
    }

    const currentData =
      existingTest.data() || {};

    const title =
      testData.title ??
      currentData.title ??
      createDefaultTestTitle(
        level
      );

    const description =
      testData.description ??
      currentData.description ??
      "";

    const status =
      testData.status ??
      currentData.status ??
      DEFAULT_TEST_STATUS;

    await saveTestMetadata(
      level,
      {
        level,
        title,
        description,
        status,
        updatedAt:
          serverTimestamp()
      }
    );

    const hasSectionsUpdate =
      Object.prototype.hasOwnProperty.call(
        testData,
        "sections"
      );

    const sections =
      hasSectionsUpdate
        ? await saveTestSections(
            getTestReference(level),
            testData.sections
          )
        : await readTestSections(
            getTestReference(level)
          );

    return {
      id: level,
      level,
      title,
      description,
      status,
      sections
    };
  } catch (error) {
    console.error(
      "Test update failed:",
      error
    );

    throw createTestServiceError(
      "Could not update the test",
      error
    );
  }
};

/**
 * Checks whether a CEFR test exists.
 *
 * @param {string} testId
 * @returns {Promise<boolean>}
 */
export const checkTestExists = async (
  testId
) => {
  try {
    const level =
      validateLevel(testId);

    const testDocument =
      await getTestDocument(
        level
      );

    return testDocument.exists();
  } catch (error) {
    console.error(
      "Test existence check failed:",
      error
    );

    throw createTestServiceError(
      "Could not check whether the test exists",
      error
    );
  }
};

/**
 * Deletes a test and all of its section documents.
 *
 * @param {string} testId
 * @returns {Promise<boolean>}
 */
export const deleteTest = async (
  testId
) => {
  try {
    const level =
      validateLevel(testId);

    const testDocument =
      await getTestDocument(
        level
      );

    if (!testDocument.exists()) {
      throw new Error(
        `Test ${level} was not found.`
      );
    }

    await deleteTestDocument(
      level
    );

    return true;
  } catch (error) {
    console.error(
      "Test deletion failed:",
      error
    );

    throw createTestServiceError(
      "Could not delete the test",
      error
    );
  }
};

/**
 * Retrieves the test associated with a CEFR level.
 *
 * The array response is preserved for compatibility
 * with the original public API.
 *
 * @param {string} level
 * @returns {Promise<object[]>}
 */
export const getTestsByLevel = async (
  level
) => {
  try {
    const normalizedLevel =
      validateLevel(level);

    const testDocument =
      await getTestDocument(
        normalizedLevel
      );

    if (!testDocument.exists()) {
      return [];
    }

    const test =
      await buildTestResponse(
        testDocument
      );

    return [test];
  } catch (error) {
    console.error(
      "Tests by level retrieval failed:",
      error
    );

    throw createTestServiceError(
      `Could not retrieve tests for level ${level}`,
      error
    );
  }
};

const testService = {
  createTest,
  getTest,
  getAllTests,
  updateTest,
  checkTestExists,
  deleteTest,
  getTestsByLevel
};

export default testService;