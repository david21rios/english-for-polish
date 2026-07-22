// src/services/ai/missions/evaluation/completionValidator.js

import {
  MISSION_COMPLETION_THRESHOLDS,
  MISSION_SCORE_THRESHOLDS,
  getCefrExpectations
} from "./evaluationConstants";

import {
  shouldBlockMissionCompletionForIntegrity
} from "./antiCheatValidator";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeNumber = (
  value,
  {
    minimum = 0,
    maximum = 100,
    fallback = 0
  } = {}
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      numericValue
    )
  );
};

const addCompletionBlocker = (
  blockers,
  {
    code,
    message,
    severity = "high",
    details = null
  }
) => {
  blockers.push({
    code,
    message,
    severity,
    details
  });
};

/*
|--------------------------------------------------------------------------
| Evidence validation
|--------------------------------------------------------------------------
*/

export const evaluateCompletionEvidence =
  ({
    level = "A1",
    objectiveEvaluation = {},
    integrityEvaluation = {},
    totalMessages = 0,
    totalWords = 0
  } = {}) => {
    const cefrExpectations =
      getCefrExpectations(level);

    const normalizedTotalMessages =
      Math.max(
        0,
        Math.round(
          Number(totalMessages) || 0
        )
      );

    const normalizedTotalWords =
      Math.max(
        0,
        Math.round(
          Number(totalWords) || 0
        )
      );

    const averageWordsPerReply =
      normalizedTotalMessages > 0
        ? normalizedTotalWords /
          normalizedTotalMessages
        : 0;

    const minimumMeaningfulReplies =
      cefrExpectations
        .minimumMeaningfulReplies ??
      MISSION_COMPLETION_THRESHOLDS
        .minimumMeaningfulReplies;

    const minimumAverageWordsPerReply =
      cefrExpectations
        .minimumAverageWordsPerReply ??
      2;

    const meaningfulReplies =
      normalizedTotalMessages;

    const sufficientMeaningfulReplies =
      normalizedTotalMessages >=
      minimumMeaningfulReplies;

    const sufficientAverageReplyLength =
      averageWordsPerReply >=
      minimumAverageWordsPerReply;

    const sufficientObjectiveEvidence =
      objectiveEvaluation
        .goalAchieved === true;

    const blockedByIntegrity =
      shouldBlockMissionCompletionForIntegrity(
        integrityEvaluation
      );

    const sufficientEvidence =
      sufficientMeaningfulReplies &&
      sufficientAverageReplyLength &&
      !blockedByIntegrity;

    return {
      sufficientEvidence,

      meaningfulReplies,

      minimumMeaningfulReplies,

      totalMessages:
        normalizedTotalMessages,

      totalWords:
        normalizedTotalWords,

      averageWordsPerReply,

      minimumAverageWordsPerReply,

      sufficientMeaningfulReplies,

      sufficientAverageReplyLength,

      sufficientObjectiveEvidence,

      blockedByIntegrity
    };
  };

/*
|--------------------------------------------------------------------------
| Completion validation
|--------------------------------------------------------------------------
*/

export const validateMissionCompletion =
  ({
    score = 0,
    level = "A1",
    missionState = {},
    objectiveEvaluation = {},
    integrityEvaluation = {},
    reviewEvaluation = {},
    totalMessages = 0,
    totalWords = 0,
    externalPassed = false
  } = {}) => {
    const blockers = [];

    const normalizedScore =
      normalizeNumber(
        score,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      );

    const progressScore =
      normalizeNumber(
        missionState
          .progressScore,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      );

    const confidence =
      normalizeNumber(
        missionState
          .confidence,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
      );

    const evidenceEvaluation =
      evaluateCompletionEvidence({
        level,
        missionState,
        objectiveEvaluation,
        integrityEvaluation,
        totalMessages,
        totalWords
      });

    const requiredObjectivesSatisfied =
      objectiveEvaluation
        .requiredObjectives === 0 ||
      objectiveEvaluation
        .requiredCompletionRatio === 1;

    if (!requiredObjectivesSatisfied) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "REQUIRED_OBJECTIVES_NOT_COMPLETED",

          message:
            "Not all required mission objectives were completed.",

          details: {
            requiredCompletionRatio:
              objectiveEvaluation
                .requiredCompletionRatio,

            missingObjectives:
              objectiveEvaluation
                .missingRequiredObjectives ||
              []
          }
        }
      );
    }

    if (
      integrityEvaluation
        .severeIntegrityIssue ===
      true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "SEVERE_INTEGRITY_ISSUE",

          message:
            "A severe conversation-integrity issue prevents completion."
        }
      );
    }

    if (
      normalizedScore <
      MISSION_SCORE_THRESHOLDS
        .pass
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "SCORE_BELOW_PASS_THRESHOLD",

          message:
            "The final score is below the mission pass threshold.",

          details: {
            score:
              normalizedScore,

            passThreshold:
              MISSION_SCORE_THRESHOLDS
                .pass
          }
        }
      );
    }

    if (reviewEvaluation?.requiresReview === true) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "REVIEW_PREVENTS_FINALIZATION",

          message:
            "The mission requires additional review before finalization.",

          details: {
            reviewReasons:
              reviewEvaluation
                .reasonCodes || []
          }
        }
      );
    }

    const canComplete =
      blockers.length === 0;

    /*
     * Reaching this validator means Gemini returned a parseable evaluation
     * and the deterministic evaluation pipeline completed successfully.
     * A pedagogically failed mission is still a completed evaluation.
     */
    const evaluationCompleted =
      reviewEvaluation
        ?.requiresReview !== true;

    /*
     * Gemini's passed value is retained only
     * as diagnostic information.
     *
     * It never overrides local validation.
     */
    const passed =
      evaluationCompleted &&
      canComplete &&
      normalizedScore >=
        MISSION_SCORE_THRESHOLDS
          .pass;

    const externalDisagreement =
      Boolean(externalPassed) !==
      passed;

    return {
      canComplete,

      evaluationCompleted,

      passed,

      isFinal:
        evaluationCompleted,

      score:
        normalizedScore,

      progressScore,

      confidence,

      sufficientEvidence:
        evidenceEvaluation
          .sufficientEvidence,

      evidence:
        evidenceEvaluation,

      goalAchieved:
        requiredObjectivesSatisfied,

      blockers,

      blockerCodes:
        blockers.map(
          (blocker) =>
            blocker.code
        ),

      externalPassed:
        Boolean(
          externalPassed
        ),

      externalDisagreement,

      nextRequiredAction:
        canComplete
          ? ""
          : missionState
              .nextRequiredAction ||
            "Continue the mission and address the remaining objectives."
    };
  };

/*
|--------------------------------------------------------------------------
| Completion helpers
|--------------------------------------------------------------------------
*/

export const canCompleteMission = (
  completionResult
) => {
  return (
    completionResult
      ?.canComplete === true &&
    completionResult
      ?.passed === true &&
    completionResult
      ?.isFinal === true
  );
};

export const getPrimaryCompletionBlocker = (
  completionResult
) => {
  if (
    !Array.isArray(
      completionResult?.blockers
    ) ||
    completionResult.blockers
      .length === 0
  ) {
    return null;
  }

  const severityOrder = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0
  };

  return [
    ...completionResult.blockers
  ].sort(
    (first, second) =>
      (
        severityOrder[
          second.severity
        ] || 0
      ) -
      (
        severityOrder[
          first.severity
        ] || 0
      )
  )[0];
};

export const shouldContinueMission = (
  completionResult
) => {
  return (
    completionResult
      ?.canComplete !== true
  );
};

export default {
  evaluateCompletionEvidence,
  validateMissionCompletion,
  canCompleteMission,
  getPrimaryCompletionBlocker,
  shouldContinueMission
};
