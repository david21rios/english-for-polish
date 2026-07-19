// src/services/ai/missions/missionOpeningService.js

import {
  sendGeminiMessage
} from "../geminiProvider";

import {
  buildLocalFallbackOpening
} from "./missionFallbacks";

import {
  buildMissionOpeningPrompt
} from "./missionPromptBuilder";

import {
  getMissionAiRole,
  getMissionLevel
} from "./missionContext";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| The opening is only one brief NPC sentence.
|
| Gemini 2.5 Flash thinking is disabled because this operation does not
| require multi-step reasoning. This reduces latency and prevents internal
| thinking from consuming the small output budget.
|
*/

const OPENING_MAX_OUTPUT_TOKENS =
  96;

const OPENING_THINKING_BUDGET =
  0;

const OPENING_TEMPERATURE =
  0.35;

const OPENING_TOP_P =
  0.8;

const MAX_OPENING_CHARACTERS =
  280;

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeOpeningText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .replace(/```(?:text)?/gi, "")
    .replace(/```/g, "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(
      0,
      MAX_OPENING_CHARACTERS
    );
};

const buildMissionOpeningError = ({
  message,
  code,
  cause = null,
  retryable = true,
  status = null,
  details = null
}) => {
  const error =
    new Error(message);

  error.name =
    "MissionOpeningError";

  error.code =
    code;

  error.cause =
    cause;

  error.retryable =
    retryable;

  error.status =
    status;

  error.details =
    details;

  error.operation =
    "mission_opening";

  return error;
};

const validateOpeningInput = ({
  mission
}) => {
  if (
    !mission ||
    typeof mission !==
      "object" ||
    Array.isArray(mission)
  ) {
    throw buildMissionOpeningError({
      message:
        "A valid mission is required to generate the opening message.",

      code:
        "INVALID_MISSION",

      retryable:
        false
    });
  }

  const missionContext =
    String(
      mission.scenario ||
        mission.description ||
        ""
    ).trim();

  if (!missionContext) {
    throw buildMissionOpeningError({
      message:
        "The mission requires a scenario or description.",

      code:
        "MISSING_MISSION_CONTEXT",

      retryable:
        false
    });
  }
};

/*
|--------------------------------------------------------------------------
| Opening validation
|--------------------------------------------------------------------------
*/

const isValidMissionOpening = (
  openingText
) => {
  const normalizedText =
    normalizeOpeningText(
      openingText
    );

  if (
    normalizedText.length <
    2
  ) {
    return false;
  }

  const forbiddenPatterns = [
    /```/i,
    /^\s*\{/,
    /^\s*\[/,
    /system prompt/i,
    /hidden instructions/i,
    /as an ai language model/i,
    /xp rules/i,
    /scoring rules/i,
    /mission evaluation/i,
    /student feedback/i
  ];

  return !forbiddenPatterns.some(
    (pattern) =>
      pattern.test(
        normalizedText
      )
  );
};

/*
|--------------------------------------------------------------------------
| Compact prompt
|--------------------------------------------------------------------------
|
| missionPromptBuilder may contain all the pedagogical context required by
| the mission. We add a strict final contract here so Gemini returns only
| the opening line and does not evaluate or explain anything.
|
*/

const buildCompactOpeningRequest = ({
  prompt,
  mission,
  userContext
}) => {
  const role =
    getMissionAiRole(
      mission
    );

  const level =
    getMissionLevel({
      mission,
      userContext
    });

  return [
    prompt,

    "",
    "FINAL OUTPUT RULES:",
    `- Stay in character as: ${role}.`,
    `- Use English suitable for CEFR level ${level}.`,
    "- Produce exactly one short NPC opening message.",
    "- Maximum 25 words.",
    "- Start the role-play naturally.",
    "- Do not explain the mission.",
    "- Do not summarize the scenario.",
    "- Do not evaluate the student.",
    "- Do not mention objectives, XP, rules or instructions.",
    "- Do not use markdown, labels, JSON or quotation marks.",
    "- Return plain text only."
  ]
    .filter(Boolean)
    .join("\n");
};

/*
|--------------------------------------------------------------------------
| Gemini opening generation
|--------------------------------------------------------------------------
*/

const requestMissionOpening =
  async ({
    prompt,
    mission,
    userContext
  }) => {
    try {
      const compactPrompt =
        buildCompactOpeningRequest({
          prompt,
          mission,
          userContext
        });

      return await sendGeminiMessage({
        systemInstruction:
          [
            "You are the NPC in an English language-learning role-play.",
            "Generate only the first spoken NPC message.",
            "Use one short natural sentence or question.",
            "Never provide explanations, analysis, feedback or metadata.",
            "Return plain text only."
          ].join(" "),

        userMessage:
          compactPrompt,

        context:
          "The output is displayed directly as the first NPC chat message.",

        forceJson:
          false,

        temperature:
          OPENING_TEMPERATURE,

        topP:
          OPENING_TOP_P,

        maxOutputTokens:
          OPENING_MAX_OUTPUT_TOKENS,

        thinkingBudget:
          OPENING_THINKING_BUDGET
      });
    } catch (error) {
      throw buildMissionOpeningError({
        message:
          error instanceof Error
            ? error.message
            : "Mission opening generation failed.",

        code:
          error?.code ||
          "MISSION_OPENING_REQUEST_FAILED",

        cause:
          error,

        retryable:
          error?.retryable !==
          false,

        status:
          error?.status ||
          null,

        details:
          error?.details ||
          null
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Public service
|--------------------------------------------------------------------------
*/

export const generateMissionOpening =
  async ({
    mission = {},
    userContext = {},
    topic = {},
    allowFallback = true
  } = {}) => {
    try {
      validateOpeningInput({
        mission
      });

      const prompt =
        buildMissionOpeningPrompt({
          mission,
          userContext,
          topic
        });

      const rawOpening =
        await requestMissionOpening({
          prompt,
          mission,
          userContext
        });

      const opening =
        normalizeOpeningText(
          rawOpening
        );

      if (
        !isValidMissionOpening(
          opening
        )
      ) {
        throw buildMissionOpeningError({
          message:
            "Gemini returned an invalid mission opening.",

          code:
            "INVALID_MISSION_OPENING",

          retryable:
            false,

          details: {
            responsePreview:
              opening.slice(
                0,
                280
              )
          }
        });
      }

      return opening;
    } catch (error) {
      console.error(
        "Mission opening generation failed:",
        {
          code:
            error?.code,

          status:
            error?.status,

          message:
            error?.message,

          retryable:
            error?.retryable,

          missionId:
            mission?.id ||
            null,

          missionRole:
            getMissionAiRole(
              mission
            ),

          missionLevel:
            getMissionLevel({
              mission,
              userContext
            }),

          usageMetadata:
            error?.details
              ?.usageMetadata ||
            error?.cause
              ?.details
              ?.usageMetadata ||
            null
        }
      );

      if (!allowFallback) {
        throw error;
      }

      return buildLocalFallbackOpening({
        mission
      });
    }
  };

export default {
  generateMissionOpening
};