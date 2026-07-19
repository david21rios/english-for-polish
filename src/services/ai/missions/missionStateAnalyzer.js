// src/services/ai/missions/missionStateAnalyzer.js

import {
  sendGeminiMessage
} from "../geminiProvider";

import {
  MISSION_LIMITS
} from "./missionLimits";

import {
  buildLocalFallbackMissionState
} from "./missionFallbacks";

import {
  parseMissionJson,
  normalizeMissionStateJson
} from "./missionJson";

import {
  buildMissionStatePrompt
} from "./missionPromptBuilder";

import {
  countUserMessages,
  getMissionLevel,
  normalizeConversation
} from "./missionContext";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| State analysis is a constrained classification task.
| It does not need free-form reasoning or a large response.
|
*/

const STATE_MAX_OUTPUT_TOKENS = 512;
const STATE_THINKING_BUDGET = 0;

const STATE_TEMPERATURE = 0.05;
const STATE_TOP_P = 0.7;

/*
|--------------------------------------------------------------------------
| Error builder
|--------------------------------------------------------------------------
*/

const buildMissionStateError = ({
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
    "MissionStateError";

  error.code = code;
  error.cause = cause;
  error.retryable = retryable;
  error.status = status;
  error.operation =
    "mission_state_analysis";
  error.details = details;

  return error;
};

/*
|--------------------------------------------------------------------------
| Input validation
|--------------------------------------------------------------------------
*/

const validateMissionStateInput = ({
  mission,
  conversation
}) => {
  if (
    !mission ||
    typeof mission !== "object" ||
    Array.isArray(mission)
  ) {
    throw buildMissionStateError({
      message:
        "A valid mission is required for mission-state analysis.",

      code:
        "INVALID_MISSION",

      retryable: false
    });
  }

  if (
    !Array.isArray(
      conversation
    )
  ) {
    throw buildMissionStateError({
      message:
        "Mission conversation must be an array.",

      code:
        "INVALID_CONVERSATION",

      retryable: false
    });
  }

  const userMessageCount =
    countUserMessages(
      conversation
    );

  if (
    userMessageCount === 0
  ) {
    throw buildMissionStateError({
      message:
        "The mission cannot be analyzed before the student responds.",

      code:
        "EMPTY_MISSION_CONVERSATION",

      retryable: false
    });
  }

  if (
    userMessageCount >
    MISSION_LIMITS.conversation
      .maxUserReplies
  ) {
    throw buildMissionStateError({
      message:
        "The mission conversation exceeds the supported reply limit.",

      code:
        "MISSION_CONVERSATION_LIMIT_EXCEEDED",

      retryable: false,

      details: {
        currentUserReplies:
          userMessageCount,

        maximumUserReplies:
          MISSION_LIMITS.conversation
            .maxUserReplies
      }
    });
  }
};

/*
|--------------------------------------------------------------------------
| Gemini request
|--------------------------------------------------------------------------
*/

const requestMissionState =
  async ({
    prompt
  }) => {
    try {
      return await sendGeminiMessage({
        systemInstruction:
          [
            "Analyze the internal state of an English language-learning mission.",
            "Return only valid JSON matching the requested schema.",
            "Do not continue the role-play.",
            "Do not address the student."
          ].join(" "),

        userMessage:
          prompt,

        context:
          "This is an internal controller response and is never shown directly to the student.",

        forceJson: true,

        temperature:
          STATE_TEMPERATURE,

        topP:
          STATE_TOP_P,

        maxOutputTokens:
          STATE_MAX_OUTPUT_TOKENS,

        thinkingBudget:
          STATE_THINKING_BUDGET
      });
    } catch (error) {
      throw buildMissionStateError({
        message:
          error instanceof Error
            ? error.message
            : "Mission-state analysis request failed.",

        code:
          error?.code ||
          "MISSION_STATE_REQUEST_FAILED",

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
| Local safeguards
|--------------------------------------------------------------------------
*/

const applyLocalMissionStateGuards = ({
  state,
  conversation
}) => {
  const userMessageCount =
    countUserMessages(
      conversation
    );

  const hasMinimumReplyCount =
    userMessageCount >=
    MISSION_LIMITS.conversation
      .minimumMeaningfulReplies;

  const meaningfulReplies =
    Math.min(
      Math.max(
        Number(
          state.meaningfulReplies
        ) || 0,
        0
      ),
      userMessageCount
    );

  const offTopicReplies =
    Math.min(
      Math.max(
        Number(
          state.offTopicReplies
        ) || 0,
        0
      ),
      userMessageCount
    );

  const nonsenseReplies =
    Math.min(
      Math.max(
        Number(
          state.nonsenseReplies
        ) || 0,
        0
      ),
      userMessageCount
    );

  const progressScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          state.progressScore
        ) || 0
      )
    );

  const confidence =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          state.confidence
        ) || 0
      )
    );

  const completionAllowed =
    state.canComplete === true &&
    hasMinimumReplyCount &&
    meaningfulReplies >=
      MISSION_LIMITS.conversation
        .minimumMeaningfulReplies &&
    progressScore >= 60 &&
    confidence >= 50 &&
    state.requiresReview !== true;

  return {
    ...state,

    canComplete:
      completionAllowed,

    progressScore,
    confidence,

    meaningfulReplies,
    offTopicReplies,
    nonsenseReplies,

    totalUserReplies:
      userMessageCount,

    localMinimumReplyCountMet:
      hasMinimumReplyCount,

    analyzedAt:
      new Date().toISOString()
  };
};

/*
|--------------------------------------------------------------------------
| Public service
|--------------------------------------------------------------------------
*/

export const analyzeMissionState =
  async ({
    mission = {},
    userContext = {},
    topic = {},
    conversation = [],
    allowFallback = true
  } = {}) => {
    const normalizedConversation =
      normalizeConversation(
        conversation
      );

    try {
      validateMissionStateInput({
        mission,

        conversation:
          normalizedConversation
      });

      const prompt =
        buildMissionStatePrompt({
          mission,
          userContext,
          topic,

          conversation:
            normalizedConversation
        });

      const rawResponse =
        await requestMissionState({
          prompt
        });

      const parsedResponse =
        parseMissionJson(
          rawResponse
        );

      const normalizedState =
        normalizeMissionStateJson(
          parsedResponse
        );

      return applyLocalMissionStateGuards({
        state:
          normalizedState,

        conversation:
          normalizedConversation
      });
    } catch (error) {
      console.error(
        "Mission-state analysis failed:",
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

          missionLevel:
            getMissionLevel({
              mission,
              userContext
            }),

          userReplies:
            countUserMessages(
              normalizedConversation
            ),

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

      return buildLocalFallbackMissionState({
        conversation:
          normalizedConversation,

        error
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Completion precheck
|--------------------------------------------------------------------------
*/

export const canRequestMissionCompletion =
  (
    missionState
  ) => {
    return (
      missionState
        ?.canComplete === true &&
      missionState
        ?.requiresReview !== true &&
      missionState
        ?.isFallback !== true &&
      Number(
        missionState
          ?.progressScore
      ) >= 60 &&
      Number(
        missionState
          ?.confidence
      ) >= 50
    );
  };

export const getMissionStateNextAction =
  (
    missionState
  ) => {
    return (
      String(
        missionState
          ?.nextRequiredAction ||
          ""
      ).trim() ||
      "Continue the conversation and address the remaining mission objectives."
    );
  };

export default {
  analyzeMissionState,
  canRequestMissionCompletion,
  getMissionStateNextAction
};