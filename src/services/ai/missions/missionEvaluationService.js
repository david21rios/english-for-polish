// src/services/ai/missions/missionEvaluationService.js

import {
  sendGeminiMessage
} from "../geminiProvider";

import {
  buildLocalFallbackFeedback
} from "./missionFallbacks";

import {
  normalizeConversation
} from "./missionContext";

import {
  parseMissionJson
} from "./missionJson";

import {
  buildMissionEvaluationPrompt
} from "./missionPromptBuilder";

import {
  analyzeMissionState
} from "./missionStateAnalyzer";

import {
  tryBuildMissionEvaluation
} from "./evaluation/missionEvaluation";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| The evaluation needs limited reasoning, but not unrestricted dynamic
| thinking. The JSON schema is comprehensive but its arrays are intentionally
| short, so 2400 output tokens provide a safe margin.
|
*/

const EVALUATION_MAX_OUTPUT_TOKENS =
  2400;

const EVALUATION_THINKING_BUDGET =
  256;

const EVALUATION_TEMPERATURE =
  0.05;

const EVALUATION_TOP_P =
  0.7;

/*
|--------------------------------------------------------------------------
| Error builder
|--------------------------------------------------------------------------
*/

const buildMissionEvaluationError = ({
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
    "MissionEvaluationError";

  error.code =
    code;

  error.cause =
    cause;

  error.retryable =
    retryable;

  error.status =
    status;

  error.operation =
    "mission_final_evaluation";

  error.details =
    details;

  return error;
};

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const isPlainObject = (
  value
) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;
};

const normalizeNumber = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
};

/*
|--------------------------------------------------------------------------
| Input validation
|--------------------------------------------------------------------------
*/

const validateEvaluationInput = ({
  mission,
  conversation
}) => {
  if (!isPlainObject(mission)) {
    throw buildMissionEvaluationError({
      message:
        "A valid mission is required for final evaluation.",

      code:
        "INVALID_MISSION",

      retryable:
        false
    });
  }

  if (
    !Array.isArray(
      conversation
    )
  ) {
    throw buildMissionEvaluationError({
      message:
        "Mission conversation must be an array.",

      code:
        "INVALID_CONVERSATION",

      retryable:
        false
    });
  }

  const normalizedConversation =
    normalizeConversation(
      conversation
    );

  const studentMessages =
    normalizedConversation.filter(
      (message) =>
        message.sender === "user"
    );

  if (
    studentMessages.length === 0
  ) {
    throw buildMissionEvaluationError({
      message:
        "The mission cannot be evaluated without student replies.",

      code:
        "EMPTY_MISSION_CONVERSATION",

      retryable:
        false
    });
  }

  return normalizedConversation;
};

/*
|--------------------------------------------------------------------------
| Gemini request
|--------------------------------------------------------------------------
*/

const requestMissionEvaluation =
  async ({
    prompt
  }) => {
    try {
      return await sendGeminiMessage({
        systemInstruction:
          [
            "You are a concise CEFR evaluator for English role-play missions.",
            "Return only valid JSON matching the requested schema.",
            "Use evidence from the conversation.",
            "Do not calculate final stars or XP."
          ].join(" "),

        userMessage:
          prompt,

        context:
          "This internal evaluation is validated deterministically by the application before it is shown to the student.",

        forceJson:
          true,

        temperature:
          EVALUATION_TEMPERATURE,

        topP:
          EVALUATION_TOP_P,

        maxOutputTokens:
          EVALUATION_MAX_OUTPUT_TOKENS,

        thinkingBudget:
          EVALUATION_THINKING_BUDGET
      });
    } catch (error) {
      throw buildMissionEvaluationError({
        message:
          error instanceof Error
            ? error.message
            : "Mission evaluation request failed.",

        code:
          error?.code ||
          "MISSION_EVALUATION_REQUEST_FAILED",

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
| Mission-state validation
|--------------------------------------------------------------------------
*/

const isUsableMissionState = (
  missionState
) => {
  return (
    isPlainObject(
      missionState
    ) &&
    missionState.isFallback !==
      true &&
    missionState.requiresReview !==
      true
  );
};

const validateResolvedMissionState = (
  missionState
) => {
  if (!isPlainObject(missionState)) {
    throw buildMissionEvaluationError({
      message:
        "Mission state is unavailable.",

      code:
        "MISSION_STATE_UNAVAILABLE",

      retryable:
        true
    });
  }

  if (
    missionState.isFallback ===
    true
  ) {
    throw buildMissionEvaluationError({
      message:
        "Mission completion could not be verified because the state analysis used a fallback.",

      code:
        "MISSION_STATE_UNAVAILABLE",

      retryable:
        missionState?.error
          ?.retryable !== false,

      details: {
        missionState
      }
    });
  }

  if (
    missionState.requiresReview ===
    true
  ) {
    throw buildMissionEvaluationError({
      message:
        "Mission state requires review before final evaluation.",

      code:
        "MISSION_STATE_REQUIRES_REVIEW",

      retryable:
        false,

      details: {
        missionState
      }
    });
  }

  if (
    missionState.canComplete !==
    true
  ) {
    throw buildMissionEvaluationError({
      message:
        "Mission state does not allow final evaluation yet.",

      code:
        "MISSION_NOT_READY_FOR_EVALUATION",

      retryable:
        false,

      details: {
        progressScore:
          normalizeNumber(
            missionState
              .progressScore,
            0
          ),

        nextRequiredAction:
          missionState
            .nextRequiredAction ||
          ""
      }
    });
  }

  return missionState;
};

/*
|--------------------------------------------------------------------------
| Mission-state resolution
|--------------------------------------------------------------------------
|
| The normal MissionPlayer flow supplies an already calculated mission state.
| A new Gemini state-analysis request is made only when that state is missing
| or unusable.
|
*/

const resolveMissionState =
  async ({
    mission,
    userContext,
    topic,
    conversation,
    missionState
  }) => {
    if (
      isUsableMissionState(
        missionState
      )
    ) {
      return validateResolvedMissionState(
        missionState
      );
    }

    const analyzedState =
      await analyzeMissionState({
        mission,
        userContext,
        topic,
        conversation,
        allowFallback:
          true
      });

    return validateResolvedMissionState(
      analyzedState
    );
  };

/*
|--------------------------------------------------------------------------
| Detailed evaluation result
|--------------------------------------------------------------------------
*/

export const evaluateMissionConversationResult =
  async ({
    mission = {},
    userContext = {},
    topic = {},
    conversation = [],
    missionState = null,
    externalSignals = {},
    repeatedCompletion = false,
    bonusMultiplier = 1,
    allowFallback = true
  } = {}) => {
    let normalizedConversation =
      [];

    try {
      normalizedConversation =
        validateEvaluationInput({
          mission,
          conversation
        });

      const resolvedMissionState =
        await resolveMissionState({
          mission,
          userContext,
          topic,

          conversation:
            normalizedConversation,

          missionState
        });

      const prompt =
        buildMissionEvaluationPrompt({
          mission,
          userContext,
          topic,

          conversation:
            normalizedConversation
        });

      const rawResponse =
        await requestMissionEvaluation({
          prompt
        });

      const parsedEvaluation =
        parseMissionJson(
          rawResponse
        );

      if (
        !isPlainObject(
          parsedEvaluation
        )
      ) {
        throw buildMissionEvaluationError({
          message:
            "Gemini returned an invalid evaluation object.",

          code:
            "INVALID_MISSION_EVALUATION_JSON",

          retryable:
            false
        });
      }

      const buildResult =
        tryBuildMissionEvaluation({
          rawEvaluation:
            parsedEvaluation,

          missionState:
            resolvedMissionState,

          mission,

          conversation:
            normalizedConversation,

          externalSignals:
            isPlainObject(
              externalSignals
            )
              ? externalSignals
              : {},

          repeatedCompletion:
            normalizeBoolean(
              repeatedCompletion,
              false
            ),

          bonusMultiplier:
            normalizeNumber(
              bonusMultiplier,
              1
            )
        });

      if (
        buildResult.success !==
          true ||
        !buildResult.evaluation
      ) {
        throw buildMissionEvaluationError({
          message:
            buildResult.error
              ?.message ||
            "The deterministic mission evaluation could not be completed.",

          code:
            buildResult.error
              ?.code ||
            "MISSION_EVALUATION_NORMALIZATION_FAILED",

          retryable:
            buildResult.error
              ?.retryable ===
            true,

          details: {
            deterministicError:
              buildResult.error ||
              null
          }
        });
      }

      return {
        ...buildResult.evaluation,

        rawEvaluation:
          parsedEvaluation,

        rawResponse,

        missionState:
          resolvedMissionState,

        evaluationMetadata: {
          provider:
            "gemini",

          maxOutputTokens:
            EVALUATION_MAX_OUTPUT_TOKENS,

          thinkingBudget:
            EVALUATION_THINKING_BUDGET,

          conversationMessages:
            normalizedConversation
              .length,

          evaluatedAt:
            new Date()
              .toISOString()
        }
      };
    } catch (error) {
      console.error(
        "Mission final evaluation failed:",
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

          conversationMessages:
            normalizedConversation
              .length,

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

      return buildLocalFallbackFeedback({
        conversation:
          normalizedConversation
            .length > 0
            ? normalizedConversation
            : conversation,

        mission,

        error
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Compatibility service
|--------------------------------------------------------------------------
*/

export const evaluateMissionConversation =
  async (
    parameters = {}
  ) => {
    return evaluateMissionConversationResult(
      parameters
    );
  };

/*
|--------------------------------------------------------------------------
| Result guards
|--------------------------------------------------------------------------
*/

export const isFinalMissionEvaluation = (
  evaluation
) => {
  return (
    evaluation?.isFinal ===
      true &&
    evaluation?.requiresReview !==
      true &&
    evaluation?.isFallback !==
      true
  );
};

export const canCompleteEvaluatedMission = (
  evaluation
) => {
  return (
    isFinalMissionEvaluation(
      evaluation
    ) &&
    evaluation?.passed ===
      true
  );
};

export const canAwardEvaluatedMissionXp = (
  evaluation
) => {
  return (
    canCompleteEvaluatedMission(
      evaluation
    ) &&
    evaluation?.canAwardXp ===
      true &&
    Number(
      evaluation?.xpAwarded
    ) > 0
  );
};

export default {
  evaluateMissionConversation,
  evaluateMissionConversationResult,
  isFinalMissionEvaluation,
  canCompleteEvaluatedMission,
  canAwardEvaluatedMissionXp
};