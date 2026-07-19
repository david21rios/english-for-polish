// src/services/ai/missions/evaluation/completionValidator.js

import {
  MISSION_COMPLETION_THRESHOLDS,
  MISSION_SCORE_THRESHOLDS,
  getCefrExpectations
} from "./evaluationConstants";

import {
  shouldBlockMissionCompletionForIntegrity
} from "./antiCheatValidator";

import {
  canAutomaticallyFinalizeMission
} from "./reviewValidator";

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
    missionState = {},
    objectiveEvaluation = {},
    integrityEvaluation = {},
    totalMessages = 0,
    totalWords = 0
  } = {}) => {
    const cefrExpectations =
      getCefrExpectations(level);

    const meaningfulReplies =
      Math.max(
        0,
        Math.round(
          Number(
            missionState
              .meaningfulReplies
          ) || 0
        )
      );

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

    const sufficientMeaningfulReplies =
      meaningfulReplies >=
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
      sufficientObjectiveEvidence &&
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

    if (
      missionState.canComplete !==
      true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "MISSION_STATE_NOT_COMPLETE",

          message:
            "The mission-state evaluator did not authorize completion.",

          details: {
            reason:
              missionState.reason ||
              ""
          }
        }
      );
    }

    if (
      progressScore <
      MISSION_COMPLETION_THRESHOLDS
        .minimumProgressScore
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "INSUFFICIENT_PROGRESS",

          message:
            "Mission progress is below the required threshold.",

          details: {
            progressScore,

            minimumProgressScore:
              MISSION_COMPLETION_THRESHOLDS
                .minimumProgressScore
          }
        }
      );
    }

    if (
      evidenceEvaluation
        .sufficientMeaningfulReplies !==
      true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "INSUFFICIENT_MEANINGFUL_REPLIES",

          message:
            "The student did not provide enough meaningful replies.",

          details: {
            meaningfulReplies:
              evidenceEvaluation
                .meaningfulReplies,

            minimumMeaningfulReplies:
              evidenceEvaluation
                .minimumMeaningfulReplies
          }
        }
      );
    }

    if (
      evidenceEvaluation
        .sufficientAverageReplyLength !==
      true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "INSUFFICIENT_REPLY_DETAIL",

          message:
            "The replies are too short for the configured CEFR level.",

          severity: "medium",

          details: {
            averageWordsPerReply:
              evidenceEvaluation
                .averageWordsPerReply,

            minimumAverageWordsPerReply:
              evidenceEvaluation
                .minimumAverageWordsPerReply
          }
        }
      );
    }

    if (
      objectiveEvaluation
        .allRequiredAttempted !== true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "REQUIRED_OBJECTIVES_NOT_ATTEMPTED",

          message:
            "Not all required mission objectives were attempted.",

          details: {
            unattemptedObjectives:
              objectiveEvaluation
                .unattemptedRequiredObjectives ||
              []
          }
        }
      );
    }

    if (
      objectiveEvaluation
        .goalAchieved !== true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "MISSION_GOAL_NOT_ACHIEVED",

          message:
            "The required mission goal was not sufficiently achieved.",

          details: {
            requiredCompletionRatio:
              objectiveEvaluation
                .requiredCompletionRatio,

            minimumRequiredRatio:
              objectiveEvaluation
                .minimumRequiredRatio
          }
        }
      );
    }

    if (
      integrityEvaluation
        .mostlyOffTopic === true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "MOSTLY_OFF_TOPIC",

          message:
            "Most of the conversation was unrelated to the mission."
        }
      );
    }

    if (
      integrityEvaluation
        .mostlyMeaningless === true
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "MOSTLY_MEANINGLESS",

          message:
            "Most of the conversation did not contain meaningful communication."
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

    if (
      !canAutomaticallyFinalizeMission(
        reviewEvaluation
      )
    ) {
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

    if (
      confidence > 0 &&
      confidence <
        MISSION_COMPLETION_THRESHOLDS
          .minimumAutomaticConfidence
    ) {
      addCompletionBlocker(
        blockers,
        {
          code:
            "LOW_STATE_CONFIDENCE",

          message:
            "Mission-state confidence is too low for automatic completion.",

          severity: "medium",

          details: {
            confidence,

            requiredConfidence:
              MISSION_COMPLETION_THRESHOLDS
                .minimumAutomaticConfidence
          }
        }
      );
    }

    const canComplete =
      blockers.length === 0;

    /*
     * Gemini's passed value is retained only
     * as diagnostic information.
     *
     * It never overrides local validation.
     */
    const passed =
      canComplete &&
      normalizedScore >=
        MISSION_SCORE_THRESHOLDS
          .pass;

    const externalDisagreement =
      Boolean(externalPassed) !==
      passed;

    return {
      canComplete,

      passed,

      isFinal:
        canComplete &&
        reviewEvaluation
          ?.requiresReview !== true,

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
        objectiveEvaluation
          .goalAchieved === true,

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