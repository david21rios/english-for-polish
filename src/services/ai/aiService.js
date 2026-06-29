// src/services/ai/aiService.js

import { sendGeminiMessage } from "./geminiProvider";
import { getLanguageTutorPrompt } from "./prompts/languageTutorPrompts";
import { getLessonTutorPrompt } from "./prompts/lessonTutorPrompt";
import { getTestHelperPrompt } from "./prompts/testHelperPrompt";

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "gemini";

const buildSystemInstruction = ({
  mode = "language_tutor",
  currentLevel = "A1-A2",
  targetLanguage = "Spanish",
  baseLanguage = "English",
  lessonTitle = ""
}) => {
  if (mode === "lesson_tutor") {
    return getLessonTutorPrompt({
      currentLevel,
      targetLanguage,
      baseLanguage,
      lessonTitle
    });
  }

  if (mode === "test_helper") {
    return getTestHelperPrompt({
      currentLevel,
      targetLanguage,
      baseLanguage
    });
  }

  if (mode === "lesson_generator") {
   return `
  You are an AI agent inside a lesson generation pipeline.
  You must return only valid JSON.
  Do not use Markdown.
  Do not include comments.
  Do not include explanations outside JSON.
  Do not include trailing commas.
  All property names must use double quotes.
  All string values must use double quotes.
  `;
  }

  return getLanguageTutorPrompt({
    currentLevel,
    targetLanguage,
    baseLanguage
  });
};

export const sendAIMessage = async ({
  userMessage,
  context = "",
  mode = "language_tutor",
  currentLevel = "A1-A2",
  targetLanguage = "Spanish",
  baseLanguage = "English",
  lessonTitle = ""
}) => {
  const systemInstruction = buildSystemInstruction({
    mode,
    currentLevel,
    targetLanguage,
    baseLanguage,
    lessonTitle
  });

  if (AI_PROVIDER === "gemini") {
    return await sendGeminiMessage({
      systemInstruction,
      userMessage,
      context,
      forceJson: mode === "lesson_generator"
    });
  }

  throw new Error(`Proveedor IA no soportado: ${AI_PROVIDER}`);
};

export default {
  sendAIMessage
};