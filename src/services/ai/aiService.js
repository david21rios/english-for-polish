// src/services/ai/aiService.js

import { sendGeminiMessage } from "./geminiProvider";

import { getLanguageTutorPrompt } from "./prompts/languageTutorPrompts";
import { getLessonTutorPrompt } from "./prompts/lessonTutorPrompt";
import { getTestHelperPrompt } from "./prompts/testHelperPrompt";
import { getWritingEvaluatorPrompt } from "./prompts/writingEvaluatorPrompt";

const DEFAULT_AI_PROVIDER = "gemini";
const DEFAULT_MODE = "language_tutor";
const DEFAULT_CEFR_LEVEL = "A1";
const DEFAULT_TARGET_LANGUAGE = "English";
const DEFAULT_BASE_LANGUAGE = "Polish";

const AI_PROVIDER = String(
  import.meta.env.VITE_AI_PROVIDER ||
    DEFAULT_AI_PROVIDER
)
  .trim()
  .toLowerCase();

const SUPPORTED_MODES = new Set([
  "language_tutor",
  "lesson_tutor",
  "test_helper",
  "lesson_generator",
  "writing_evaluator"
]);

const VALID_CEFR_LEVELS = new Set([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

const normalizeText = (value = "") => {
  return String(value)
    .replace(/\r\n/g, "\n")
    .trim();
};

const normalizeMode = (
  mode = DEFAULT_MODE
) => {
  const normalizedMode = String(mode)
    .trim()
    .toLowerCase();

  return SUPPORTED_MODES.has(
    normalizedMode
  )
    ? normalizedMode
    : DEFAULT_MODE;
};

const normalizeLevel = (
  level = DEFAULT_CEFR_LEVEL
) => {
  const normalizedLevel = String(level)
    .trim()
    .toUpperCase();

  return VALID_CEFR_LEVELS.has(
    normalizedLevel
  )
    ? normalizedLevel
    : DEFAULT_CEFR_LEVEL;
};

const normalizeLanguage = (
  language,
  fallback
) => {
  const normalizedLanguage =
    normalizeText(language);

  return normalizedLanguage || fallback;
};

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const normalizeWritingTask = (
  writingTask = {}
) => {
  return isPlainObject(writingTask)
    ? writingTask
    : {};
};

const normalizeRubric = (
  rubric = {}
) => {
  return isPlainObject(rubric)
    ? rubric
    : {};
};

const buildLessonGeneratorInstruction =
  () => {
    return `
You are an AI agent inside a lesson generation pipeline.

Return exactly one valid JSON object.

Mandatory rules:

- Do not use Markdown.
- Do not use code fences.
- Do not include comments.
- Do not include explanations outside JSON.
- Do not include trailing commas.
- Use double quotes for all property names.
- Use double quotes for all string values.
- Do not return multiple JSON objects.
- Do not truncate the JSON response.
- Ensure that the final response can be parsed directly with JSON.parse().
    `.trim();
  };

const buildSystemInstruction = ({
  mode = DEFAULT_MODE,
  currentLevel = DEFAULT_CEFR_LEVEL,
  targetLanguage =
    DEFAULT_TARGET_LANGUAGE,
  baseLanguage =
    DEFAULT_BASE_LANGUAGE,
  lessonTitle = "",
  writingTask = {},
  rubric = {}
}) => {
  const normalizedMode =
    normalizeMode(mode);

  const normalizedLevel =
    normalizeLevel(currentLevel);

  const normalizedTargetLanguage =
    normalizeLanguage(
      targetLanguage,
      DEFAULT_TARGET_LANGUAGE
    );

  const normalizedBaseLanguage =
    normalizeLanguage(
      baseLanguage,
      DEFAULT_BASE_LANGUAGE
    );

  if (
    normalizedMode ===
    "lesson_tutor"
  ) {
    return getLessonTutorPrompt({
      currentLevel:
        normalizedLevel,

      targetLanguage:
        normalizedTargetLanguage,

      baseLanguage:
        normalizedBaseLanguage,

      lessonTitle:
        normalizeText(lessonTitle)
    });
  }

  if (
    normalizedMode ===
    "test_helper"
  ) {
    return getTestHelperPrompt({
      currentLevel:
        normalizedLevel,

      targetLanguage:
        normalizedTargetLanguage,

      baseLanguage:
        normalizedBaseLanguage
    });
  }

  if (
    normalizedMode ===
    "lesson_generator"
  ) {
    return buildLessonGeneratorInstruction();
  }

  if (
    normalizedMode ===
    "writing_evaluator"
  ) {
    return getWritingEvaluatorPrompt({
      currentLevel:
        normalizedLevel,

      targetLanguage:
        normalizedTargetLanguage,

      baseLanguage:
        normalizedBaseLanguage,

      writingTask:
        normalizeWritingTask(
          writingTask
        ),

      rubric:
        normalizeRubric(rubric)
    });
  }

  return getLanguageTutorPrompt({
    currentLevel:
      normalizedLevel,

    targetLanguage:
      normalizedTargetLanguage,

    baseLanguage:
      normalizedBaseLanguage
  });
};

const getModeConfiguration = ({
  mode = DEFAULT_MODE,
  forceJson = false
}) => {
  const normalizedMode =
    normalizeMode(mode);

  if (
    normalizedMode ===
    "writing_evaluator"
  ) {
    return {
      forceJson: true,
      temperature: 0.05,
      topP: 0.7,
      maxOutputTokens: 5000
    };
  }

  if (
    normalizedMode ===
    "lesson_generator"
  ) {
    return {
      forceJson: true,
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 30000
    };
  }

  if (
    normalizedMode ===
    "test_helper"
  ) {
    return {
      forceJson:
        Boolean(forceJson),
      temperature: 0.3,
      topP: 0.85,
      maxOutputTokens: 5000
    };
  }

  if (
    normalizedMode ===
    "lesson_tutor"
  ) {
    return {
      forceJson:
        Boolean(forceJson),
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 4000
    };
  }

  return {
    forceJson:
      Boolean(forceJson),
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 3000
  };
};

export const sendAIMessage =
  async ({
    userMessage = "",
    context = "",
    mode = DEFAULT_MODE,
    currentLevel =
      DEFAULT_CEFR_LEVEL,
    targetLanguage =
      DEFAULT_TARGET_LANGUAGE,
    baseLanguage =
      DEFAULT_BASE_LANGUAGE,
    lessonTitle = "",
    writingTask = {},
    rubric = {},
    forceJson = false
  } = {}) => {
    const normalizedMode =
      normalizeMode(mode);

    const normalizedLevel =
      normalizeLevel(currentLevel);

    const normalizedTargetLanguage =
      normalizeLanguage(
        targetLanguage,
        DEFAULT_TARGET_LANGUAGE
      );

    const normalizedBaseLanguage =
      normalizeLanguage(
        baseLanguage,
        DEFAULT_BASE_LANGUAGE
      );

    const normalizedUserMessage =
      normalizeText(userMessage);

    const normalizedContext =
      normalizeText(context);

    if (!normalizedUserMessage) {
      throw new Error(
        "AI user message cannot be empty."
      );
    }

    const systemInstruction =
      buildSystemInstruction({
        mode:
          normalizedMode,

        currentLevel:
          normalizedLevel,

        targetLanguage:
          normalizedTargetLanguage,

        baseLanguage:
          normalizedBaseLanguage,

        lessonTitle,

        writingTask,

        rubric
      });

    if (!systemInstruction) {
      throw new Error(
        `No system instruction was generated for mode: ${normalizedMode}`
      );
    }

    const modeConfiguration =
      getModeConfiguration({
        mode:
          normalizedMode,

        forceJson
      });

    if (
      AI_PROVIDER === "gemini"
    ) {
      return sendGeminiMessage({
        systemInstruction,
        userMessage:
          normalizedUserMessage,
        context:
          normalizedContext,
        ...modeConfiguration
      });
    }

    throw new Error(
      `Unsupported AI provider: ${AI_PROVIDER}`
    );
  };

export const getConfiguredAIProvider =
  () => {
    return AI_PROVIDER;
  };

export const getSupportedAIModes =
  () => {
    return [
      ...SUPPORTED_MODES
    ];
  };

export const isAIModeSupported =
  (mode) => {
    return SUPPORTED_MODES.has(
      String(mode)
        .trim()
        .toLowerCase()
    );
  };

const aiService = {
  sendAIMessage,
  getConfiguredAIProvider,
  getSupportedAIModes,
  isAIModeSupported
};

export default aiService;