// src/services/ai/missions/missionAiService.js

import {
  generateMissionOpening
} from "./missionOpeningService";

import {
  generateMissionReply,
  generateMissionReplyResult
} from "./missionReplyService";

import {
  analyzeMissionState,
  canRequestMissionCompletion,
  getMissionStateNextAction
} from "./missionStateAnalyzer";

import {
  canAwardEvaluatedMissionXp,
  canCompleteEvaluatedMission,
  evaluateMissionConversation,
  evaluateMissionConversationResult,
  isFinalMissionEvaluation
} from "./missionEvaluationService";

import {
  generatePersonalizedMission,
  generatePersonalizedMissionResult
} from "./missionPersonalizationService";

import {
  buildLocalFallbackFeedback,
  buildLocalFallbackMissionState,
  buildLocalFallbackOpening,
  buildLocalFallbackReply,
  buildPersonalizedMissionFailure,
  canAwardMissionXp,
  canPersistMissionCompletion,
  isFallbackMissionResult
} from "./missionFallbacks";

import {
  MISSION_LIMITS
} from "./missionLimits";

import {
  getGeminiConfiguration
} from "../geminiProvider";

/*
|--------------------------------------------------------------------------
| Mission AI operation identifiers
|--------------------------------------------------------------------------
|
| These identifiers provide a stable vocabulary for logs, diagnostics,
| analytics and future backend endpoints.
|
*/

export const MISSION_AI_OPERATIONS =
  Object.freeze({
    personalizedMission:
      "personalized_mission",

    opening:
      "mission_opening",

    reply:
      "mission_reply",

    stateAnalysis:
      "mission_state_analysis",

    finalEvaluation:
      "mission_final_evaluation"
  });

/*
|--------------------------------------------------------------------------
| Mission AI service version
|--------------------------------------------------------------------------
|
| This version identifies the client-side mission orchestration contract.
| It is independent from prompt versions and Gemini model versions.
|
*/

export const MISSION_AI_SERVICE_VERSION =
  "2.0.0";

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

const normalizeError = (
  error,
  {
    fallbackCode =
      "MISSION_AI_OPERATION_FAILED",

    operation = null
  } = {}
) => {
  return {
    code:
      error?.code ||
      fallbackCode,

    message:
      error instanceof Error
        ? error.message
        : String(
            error ||
              "Mission AI operation failed."
          ),

    retryable:
      error?.retryable !==
      false,

    operation:
      error?.operation ||
      operation,

    details:
      error?.details || null
  };
};

/*
|--------------------------------------------------------------------------
| Operation result wrapper
|--------------------------------------------------------------------------
|
| This helper is optional. Existing components can continue calling the
| individual functions directly.
|
| Future interfaces may use executeMissionAiOperation() to obtain one
| consistent success/error contract.
|
*/

const buildSuccessfulOperationResult = ({
  operation,
  data
}) => {
  return {
    success: true,

    operation,

    serviceVersion:
      MISSION_AI_SERVICE_VERSION,

    data,

    error: null,

    completedAt:
      new Date().toISOString()
  };
};

const buildFailedOperationResult = ({
  operation,
  error
}) => {
  return {
    success: false,

    operation,

    serviceVersion:
      MISSION_AI_SERVICE_VERSION,

    data: null,

    error:
      normalizeError(
        error,
        {
          operation
        }
      ),

    completedAt:
      new Date().toISOString()
  };
};

/*
|--------------------------------------------------------------------------
| Unified operation executor
|--------------------------------------------------------------------------
|
| This function does not replace the explicit service methods.
| It provides a single entry point for future use by:
|
| - Cloud Functions;
| - API controllers;
| - automated tests;
| - observability;
| - analytics;
| - background retries.
|
*/

export const executeMissionAiOperation =
  async ({
    operation,
    parameters = {},
    throwOnError = false
  } = {}) => {
    try {
      let data;

      switch (operation) {
        case MISSION_AI_OPERATIONS
          .personalizedMission:
          data =
            await generatePersonalizedMissionResult(
              parameters
            );
          break;

        case MISSION_AI_OPERATIONS
          .opening:
          data =
            await generateMissionOpening(
              parameters
            );
          break;

        case MISSION_AI_OPERATIONS
          .reply:
          data =
            await generateMissionReplyResult(
              parameters
            );
          break;

        case MISSION_AI_OPERATIONS
          .stateAnalysis:
          data =
            await analyzeMissionState(
              parameters
            );
          break;

        case MISSION_AI_OPERATIONS
          .finalEvaluation:
          data =
            await evaluateMissionConversationResult(
              parameters
            );
          break;

        default:
          {
            const error =
              new Error(
                `Unsupported mission AI operation: ${String(
                  operation || ""
                )}`
              );

            error.code =
              "UNSUPPORTED_MISSION_AI_OPERATION";

            error.retryable =
              false;

            throw error;
          }
      }

      return buildSuccessfulOperationResult({
        operation,
        data
      });
    } catch (error) {
      if (throwOnError) {
        throw error;
      }

      return buildFailedOperationResult({
        operation,
        error
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Mission flow helpers
|--------------------------------------------------------------------------
*/

export const prepareMissionCompletion =
  async ({
    mission = {},
    userContext = {},
    topic = {},
    conversation = []
  } = {}) => {
    const missionState =
      await analyzeMissionState({
        mission,
        userContext,
        topic,
        conversation,
        allowFallback: true
      });

    return {
      missionState,

      canRequestEvaluation:
        canRequestMissionCompletion(
          missionState
        ),

      nextRequiredAction:
        getMissionStateNextAction(
          missionState
        )
    };
  };

export const finalizeMission =
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
    let resolvedMissionState =
      missionState;

    if (
      !isPlainObject(
        resolvedMissionState
      )
    ) {
      resolvedMissionState =
        await analyzeMissionState({
          mission,
          userContext,
          topic,
          conversation,
          allowFallback
        });
    }

    if (
      !canRequestMissionCompletion(
        resolvedMissionState
      )
    ) {
      return {
        status:
          resolvedMissionState
            ?.status ||
          "mission_incomplete",

        provider:
          resolvedMissionState
            ?.provider ||
          "mission_controller",

        isFinal: false,

        passed: false,

        requiresReview:
          resolvedMissionState
            ?.requiresReview ===
            true,

        score: null,

        stars: 0,

        xpMultiplier: 0,

        xpAwarded: 0,

        canAwardXp: false,

        missionState:
          resolvedMissionState,

        nextRequiredAction:
          getMissionStateNextAction(
            resolvedMissionState
          ),

        evaluatedAt:
          new Date().toISOString()
      };
    }

    return evaluateMissionConversationResult({
      mission,
      userContext,
      topic,
      conversation,

      missionState:
        resolvedMissionState,

      externalSignals,
      repeatedCompletion,
      bonusMultiplier,
      allowFallback
    });
  };

/*
|--------------------------------------------------------------------------
| Service diagnostics
|--------------------------------------------------------------------------
*/

export const getMissionAiConfiguration =
  () => {
    const geminiConfiguration =
      getGeminiConfiguration();

    return {
      serviceVersion:
        MISSION_AI_SERVICE_VERSION,

      provider: "gemini",

      model:
        geminiConfiguration.model,

      apiKeyConfigured:
        geminiConfiguration
          .apiKeyConfigured,

      maxRetries:
        geminiConfiguration
          .maxRetries,

      requestTimeout:
        geminiConfiguration
          .requestTimeout,

      limits:
        MISSION_LIMITS,

      operations:
        Object.values(
          MISSION_AI_OPERATIONS
        )
    };
  };

export const isMissionAiConfigured =
  () => {
    return (
      getMissionAiConfiguration()
        .apiKeyConfigured === true
    );
  };

/*
|--------------------------------------------------------------------------
| Named re-exports
|--------------------------------------------------------------------------
|
| These exports preserve the public API expected by existing components.
|
*/

export {
  generatePersonalizedMission,
  generatePersonalizedMissionResult,

  generateMissionOpening,

  generateMissionReply,
  generateMissionReplyResult,

  analyzeMissionState,
  canRequestMissionCompletion,
  getMissionStateNextAction,

  evaluateMissionConversation,
  evaluateMissionConversationResult,
  isFinalMissionEvaluation,
  canCompleteEvaluatedMission,
  canAwardEvaluatedMissionXp,

  buildLocalFallbackOpening,
  buildLocalFallbackReply,
  buildLocalFallbackMissionState,
  buildLocalFallbackFeedback,
  buildPersonalizedMissionFailure,

  isFallbackMissionResult,
  canAwardMissionXp,
  canPersistMissionCompletion
};

/*
|--------------------------------------------------------------------------
| Default service facade
|--------------------------------------------------------------------------
*/

const missionAiService = {
  version:
    MISSION_AI_SERVICE_VERSION,

  operations:
    MISSION_AI_OPERATIONS,

  generatePersonalizedMission,
  generatePersonalizedMissionResult,

  generateMissionOpening,

  generateMissionReply,
  generateMissionReplyResult,

  analyzeMissionState,
  canRequestMissionCompletion,
  getMissionStateNextAction,

  prepareMissionCompletion,

  evaluateMissionConversation,
  evaluateMissionConversationResult,

  finalizeMission,

  isFinalMissionEvaluation,
  canCompleteEvaluatedMission,
  canAwardEvaluatedMissionXp,

  executeMissionAiOperation,

  buildLocalFallbackOpening,
  buildLocalFallbackReply,
  buildLocalFallbackMissionState,
  buildLocalFallbackFeedback,
  buildPersonalizedMissionFailure,

  isFallbackMissionResult,
  canAwardMissionXp,
  canPersistMissionCompletion,

  getMissionAiConfiguration,
  isMissionAiConfigured
};

export default missionAiService;