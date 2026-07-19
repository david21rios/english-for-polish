// src/services/test/testNormalization.js

import {
  DEFAULT_TEST_SECTIONS
} from "./testConstants";

import {
  isPlainObject,
  normalizeArray
} from "./testValidation";

/**
 * Converts a value to a safe string.
 *
 * Null and undefined values become an empty string.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeString = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};

/**
 * Returns the first value that is not null or undefined.
 *
 * Empty strings are preserved intentionally because
 * they may represent a valid explicit value.
 *
 * @param {...unknown} values
 * @returns {unknown}
 */
const getFirstDefinedValue = (
  ...values
) => {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null
  );
};

/**
 * Normalizes an array of text values.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
const normalizeStringArray = (
  value
) => {
  return normalizeArray(value)
    .map(normalizeString);
};

/**
 * Converts a value to a non-negative number.
 *
 * Invalid values become zero.
 *
 * @param {unknown} value
 * @returns {number}
 */
const normalizeNonNegativeNumber = (
  value
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  return Math.max(
    numericValue,
    0
  );
};

/**
 * Normalizes a multiple-choice question.
 *
 * Legacy Spanish and Polish field names are supported
 * to preserve compatibility with existing Firestore data.
 *
 * @param {object} question
 * @param {number} index
 * @returns {object}
 */
export const normalizeMultipleChoiceQuestion = (
  question = {},
  index = 0
) => {
  const source =
    isPlainObject(question)
      ? question
      : {};

  const options =
    normalizeStringArray(
      getFirstDefinedValue(
        source.options,
        source.answerOptions,
        source.opciones
      )
    );

  return {
    ...source,

    id:
      normalizeString(
        getFirstDefinedValue(
          source.id,
          `multiple_choice_${index + 1}`
        )
      ),

    question:
      normalizeString(
        getFirstDefinedValue(
          source.question,
          source.prompt,
          source.pregunta,
          ""
        )
      ),

    instructions:
      normalizeString(
        getFirstDefinedValue(
          source.instructions,
          source.instrucciones,
          ""
        )
      ),

    options,

    correctAnswer:
      getFirstDefinedValue(
        source.correctAnswer,
        source.correct_answer,
        source.answer,
        source.respuestaCorrecta,
        source.respuesta_correcta,
        ""
      )
  };
};

/**
 * Normalizes a writing question.
 *
 * @param {object} question
 * @param {number} index
 * @returns {object}
 */
export const normalizeWritingQuestion = (
  question = {},
  index = 0
) => {
  const source =
    isPlainObject(question)
      ? question
      : {};

  const normalizedQuestion =
    normalizeString(
      getFirstDefinedValue(
        source.question,
        source.prompt,
        source.task,
        source.pregunta,
        ""
      )
    );

  const normalizedPrompt =
    normalizeString(
      getFirstDefinedValue(
        source.prompt,
        source.question,
        source.task,
        ""
      )
    );

  return {
    ...source,

    id:
      normalizeString(
        getFirstDefinedValue(
          source.id,
          `writing_${index + 1}`
        )
      ),

    question:
      normalizedQuestion,

    prompt:
      normalizedPrompt,

    instructions:
      normalizeString(
        getFirstDefinedValue(
          source.instructions,
          source.instrucciones,
          ""
        )
      ),

    example:
      normalizeString(
        getFirstDefinedValue(
          source.example,
          source.expectedAnswer,
          source.expected_answer,
          source.sampleAnswer,
          source.przyklad,
          ""
        )
      ),

    minWords:
      normalizeNonNegativeNumber(
        getFirstDefinedValue(
          source.minWords,
          source.minimumWords,
          source.min_words,
          0
        )
      ),

    maxWords:
      normalizeNonNegativeNumber(
        getFirstDefinedValue(
          source.maxWords,
          source.maximumWords,
          source.max_words,
          0
        )
      ),

    criteria:
      normalizeArray(
        getFirstDefinedValue(
          source.criteria,
          source.assessmentCriteria,
          source.kryteria,
          []
        )
      ),

    keywordCategories:
      normalizeArray(
        getFirstDefinedValue(
          source.keywordCategories,
          source.keyword_categories,
          source.categories,
          []
        )
      )
  };
};

/**
 * Normalizes a reading comprehension question.
 *
 * @param {object} question
 * @param {number} textIndex
 * @param {number} questionIndex
 * @returns {object}
 */
export const normalizeReadingQuestion = (
  question = {},
  textIndex = 0,
  questionIndex = 0
) => {
  const source =
    isPlainObject(question)
      ? question
      : {};

  const options =
    normalizeStringArray(
      getFirstDefinedValue(
        source.options,
        source.answerOptions,
        source.opciones
      )
    );

  return {
    ...source,

    id:
      normalizeString(
        getFirstDefinedValue(
          source.id,
          `reading_${textIndex + 1}_question_${questionIndex + 1}`
        )
      ),

    question:
      normalizeString(
        getFirstDefinedValue(
          source.question,
          source.prompt,
          source.pregunta,
          ""
        )
      ),

    instructions:
      normalizeString(
        getFirstDefinedValue(
          source.instructions,
          source.instrucciones,
          ""
        )
      ),

    options,

    correctAnswer:
      getFirstDefinedValue(
        source.correctAnswer,
        source.correct_answer,
        source.answer,
        source.respuestaCorrecta,
        source.respuesta_correcta,
        ""
      )
  };
};

/**
 * Normalizes a reading text and its questions.
 *
 * @param {object} reading
 * @param {number} textIndex
 * @returns {object}
 */
export const normalizeReadingText = (
  reading = {},
  textIndex = 0
) => {
  const source =
    isPlainObject(reading)
      ? reading
      : {};

  const questions =
    normalizeArray(
      getFirstDefinedValue(
        source.questions,
        source.pytania,
        []
      )
    ).map(
      (
        question,
        questionIndex
      ) =>
        normalizeReadingQuestion(
          question,
          textIndex,
          questionIndex
        )
    );

  return {
    ...source,

    id:
      normalizeString(
        getFirstDefinedValue(
          source.id,
          `reading_${textIndex + 1}`
        )
      ),

    title:
      normalizeString(
        getFirstDefinedValue(
          source.title,
          source.tytul,
          ""
        )
      ),

    author:
      normalizeString(
        getFirstDefinedValue(
          source.author,
          source.autor,
          ""
        )
      ),

    instructions:
      normalizeString(
        getFirstDefinedValue(
          source.instructions,
          source.instrukcje,
          ""
        )
      ),

    text:
      normalizeString(
        getFirstDefinedValue(
          source.text,
          source.content,
          source.tekst,
          source.contenido,
          ""
        )
      ),

    questions
  };
};

/**
 * Normalizes the multiple-choice section.
 *
 * @param {object} section
 * @returns {{questions: object[]}}
 */
export const normalizeMultipleChoiceSection = (
  section = {}
) => {
  const source =
    isPlainObject(section)
      ? section
      : {};

  const questions =
    normalizeArray(
      getFirstDefinedValue(
        source.questions,
        source.pytania,
        []
      )
    ).map(
      (
        question,
        index
      ) =>
        normalizeMultipleChoiceQuestion(
          question,
          index
        )
    );

  return {
    questions
  };
};

/**
 * Normalizes the writing section.
 *
 * @param {object} section
 * @returns {{questions: object[]}}
 */
export const normalizeWritingSection = (
  section = {}
) => {
  const source =
    isPlainObject(section)
      ? section
      : {};

  const questions =
    normalizeArray(
      getFirstDefinedValue(
        source.questions,
        source.tasks,
        source.zadania,
        []
      )
    ).map(
      (
        question,
        index
      ) =>
        normalizeWritingQuestion(
          question,
          index
        )
    );

  return {
    questions
  };
};

/**
 * Normalizes the reading section.
 *
 * @param {object} section
 * @returns {{texts: object[]}}
 */
export const normalizeReadingSection = (
  section = {}
) => {
  const source =
    isPlainObject(section)
      ? section
      : {};

  const texts =
    normalizeArray(
      getFirstDefinedValue(
        source.texts,
        source.readings,
        source.teksty,
        []
      )
    ).map(
      (
        reading,
        index
      ) =>
        normalizeReadingText(
          reading,
          index
        )
    );

  return {
    texts
  };
};

/**
 * Normalizes every supported test section.
 *
 * Missing or invalid sections are replaced
 * with their default empty structures.
 *
 * @param {object} sections
 * @returns {{
 *   multipleChoice: {questions: object[]},
 *   writing: {questions: object[]},
 *   reading: {texts: object[]}
 * }}
 */
export const normalizeTestSections = (
  sections = {}
) => {
  const source =
    isPlainObject(sections)
      ? sections
      : {};

  return {
    multipleChoice:
      normalizeMultipleChoiceSection(
        getFirstDefinedValue(
          source.multipleChoice,
          source.multiple_choice,
          DEFAULT_TEST_SECTIONS
            .multipleChoice
        )
      ),

    writing:
      normalizeWritingSection(
        getFirstDefinedValue(
          source.writing,
          DEFAULT_TEST_SECTIONS
            .writing
        )
      ),

    reading:
      normalizeReadingSection(
        getFirstDefinedValue(
          source.reading,
          DEFAULT_TEST_SECTIONS
            .reading
        )
      )
  };
};

/**
 * Backward-compatible alias.
 *
 * This name matches the original function used
 * in the previous testService implementation.
 */
export const normalizeSections =
  normalizeTestSections;

export default {
  normalizeMultipleChoiceQuestion,
  normalizeWritingQuestion,
  normalizeReadingQuestion,
  normalizeReadingText,
  normalizeMultipleChoiceSection,
  normalizeWritingSection,
  normalizeReadingSection,
  normalizeTestSections,
  normalizeSections
};