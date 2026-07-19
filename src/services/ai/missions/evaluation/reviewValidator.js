// src/services/ai/missions/evaluation/reviewValidator.js

import {
  MISSION_COMPLETION_THRESHOLDS,
  MISSION_REVIEW_THRESHOLDS
} from "./evaluationConstants";

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

const addReviewReason = (
  reasons,
  {
    code,
    severity = "medium",
    message,
    details = null
  }
) => {
  reasons.push({
    code,
    severity,
    message,
    details
  });
};

/*
|--------------------------------------------------------------------------
| Evaluation reliability analysis
|--------------------------------------------------------------------------
*/

export const evaluateMissionReviewRequirement =
  ({
    confidence = 0,
    totalMessages = 0,
    totalWords = 0,
    missionState = {},
    objectiveEvaluation = {},
    integrityEvaluation = {},
    externalRequiresReview = false,
    aiUnavailable = false,
    invalidJson = false
  } = {}) => {
    const reasons = [];

    const normalizedConfidence =
      normalizeNumber(
        confidence,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0
        }
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

    const offTopicRatio =
      normalizeNumber(
        integrityEvaluation
          .offTopicRatio,
        {
          minimum: 0,
          maximum: 1,
          fallback: 0
        }
      );

    const nonsenseRatio =
      normalizeNumber(
        integrityEvaluation
          .nonsenseRatio,
        {
          minimum: 0,
          maximum: 1,
          fallback: 0
        }
      );

    const requiredCompletionRatio =
      normalizeNumber(
        objectiveEvaluation
          .requiredCompletionRatio,
        {
          minimum: 0,
          maximum: 1,
          fallback: 0
        }
      );

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

    if (aiUnavailable) {
      addReviewReason(
        reasons,
        {
          code:
            "AI_SERVICE_UNAVAILABLE",

          severity: "critical",

          message:
            "The AI evaluation service was unavailable."
        }
      );
    }

    if (invalidJson) {
      addReviewReason(
        reasons,
        {
          code:
            "INVALID_AI_RESPONSE",

          severity: "critical",

          message:
            "The AI returned an invalid or incomplete evaluation response."
        }
      );
    }

    if (
      externalRequiresReview ===
      true
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "AI_REQUESTED_REVIEW",

          severity: "medium",

          message:
            "The AI evaluator marked the result for additional review."
        }
      );
    }

    if (
      normalizedConfidence <
      MISSION_REVIEW_THRESHOLDS
        .veryLowConfidence
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "VERY_LOW_CONFIDENCE",

          severity: "high",

          message:
            "Evaluation confidence is too low for automatic finalization.",

          details: {
            confidence:
              normalizedConfidence
          }
        }
      );
    } else if (
      normalizedConfidence <
      MISSION_REVIEW_THRESHOLDS
        .lowConfidence
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "LOW_CONFIDENCE",

          severity: "medium",

          message:
            "Evaluation confidence is below the preferred automatic threshold.",

          details: {
            confidence:
              normalizedConfidence
          }
        }
      );
    }

    if (
      normalizedTotalMessages <
      MISSION_REVIEW_THRESHOLDS
        .minimumMessagesForReliableEvaluation
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "INSUFFICIENT_MESSAGES",

          severity: "high",

          message:
            "There are too few student messages for a reliable evaluation.",

          details: {
            totalMessages:
              normalizedTotalMessages
          }
        }
      );
    }

    if (
      normalizedTotalWords <
      MISSION_REVIEW_THRESHOLDS
        .minimumWordsForReliableEvaluation
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "INSUFFICIENT_WORDS",

          severity: "high",

          message:
            "There is insufficient written evidence for a reliable evaluation.",

          details: {
            totalWords:
              normalizedTotalWords
          }
        }
      );
    }

    if (
      meaningfulReplies <
      MISSION_COMPLETION_THRESHOLDS
        .minimumMeaningfulReplies
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "INSUFFICIENT_MEANINGFUL_REPLIES",

          severity: "high",

          message:
            "The conversation contains too few meaningful replies.",

          details: {
            meaningfulReplies
          }
        }
      );
    }

    if (
      progressScore <
      MISSION_COMPLETION_THRESHOLDS
        .minimumProgressScore
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "LOW_MISSION_PROGRESS",

          severity: "medium",

          message:
            "Mission progress is below the automatic completion threshold.",

          details: {
            progressScore
          }
        }
      );
    }

    if (
      offTopicRatio >
      MISSION_REVIEW_THRESHOLDS
        .maximumReviewableOffTopicRatio
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "EXCESSIVE_OFF_TOPIC_CONTENT",

          severity: "high",

          message:
            "Too much of the conversation was unrelated to the mission.",

          details: {
            offTopicRatio
          }
        }
      );
    }

    if (
      nonsenseRatio >
      MISSION_REVIEW_THRESHOLDS
        .maximumReviewableNonsenseRatio
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "EXCESSIVE_NONSENSE_CONTENT",

          severity: "high",

          message:
            "Too much of the conversation was meaningless or unusable.",

          details: {
            nonsenseRatio
          }
        }
      );
    }

    if (
      integrityEvaluation
        .severeIntegrityIssue ===
      true
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "SEVERE_INTEGRITY_ISSUE",

          severity: "critical",

          message:
            "A severe conversation-integrity issue was detected."
        }
      );
    }

    if (
      integrityEvaluation
        .requiresReview === true
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "INTEGRITY_REVIEW_REQUIRED",

          severity: "high",

          message:
            "Conversation-integrity signals require additional review."
        }
      );
    }

    if (
      objectiveEvaluation
        .totalObjectives > 0 &&
      requiredCompletionRatio <
      objectiveEvaluation
        .minimumRequiredRatio
    ) {
      addReviewReason(
        reasons,
        {
          code:
            "OBJECTIVE_EVIDENCE_INSUFFICIENT",

          severity: "medium",

          message:
            "There is insufficient evidence that the required objectives were completed.",

          details: {
            requiredCompletionRatio,

            minimumRequiredRatio:
              objectiveEvaluation
                .minimumRequiredRatio
          }
        }
      );
    }

    const criticalReasons =
      reasons.filter(
        (reason) =>
          reason.severity ===
          "critical"
      );

    const highSeverityReasons =
      reasons.filter(
        (reason) =>
          reason.severity ===
          "high"
      );

    const mediumSeverityReasons =
      reasons.filter(
        (reason) =>
          reason.severity ===
          "medium"
      );

    const requiresReview =
      criticalReasons.length > 0 ||
      highSeverityReasons.length >
        0 ||
      externalRequiresReview ===
        true;

    const blocksAutomaticFinalization =
      criticalReasons.length > 0 ||
      highSeverityReasons.length >
        0 ||
      normalizedConfidence <
        MISSION_COMPLETION_THRESHOLDS
          .minimumEvaluationConfidence;

    return {
      requiresReview,

      blocksAutomaticFinalization,

      confidence:
        normalizedConfidence,

      reasons,

      criticalReasons,

      highSeverityReasons,

      mediumSeverityReasons,

      reasonCodes:
        reasons.map(
          (reason) =>
            reason.code
        ),

      reliabilityStatus:
        criticalReasons.length > 0
          ? "unreliable"
          : highSeverityReasons.length >
              0
            ? "review_required"
            : mediumSeverityReasons.length >
                0
              ? "limited"
              : "reliable"
    };
  };

/*
|--------------------------------------------------------------------------
| Review helpers
|--------------------------------------------------------------------------
*/

export const shouldRequireMissionReview = (
  reviewResult
) => {
  return (
    reviewResult
      ?.requiresReview === true
  );
};

export const canAutomaticallyFinalizeMission = (
  reviewResult
) => {
  return (
    reviewResult
      ?.requiresReview !== true &&
    reviewResult
      ?.blocksAutomaticFinalization !==
      true
  );
};

export const hasCriticalReviewReason = (
  reviewResult
) => {
  return (
    Array.isArray(
      reviewResult
        ?.criticalReasons
    ) &&
    reviewResult
      .criticalReasons.length > 0
  );
};

export const getPrimaryReviewReason = (
  reviewResult
) => {
  if (
    !Array.isArray(
      reviewResult?.reasons
    ) ||
    reviewResult.reasons.length ===
      0
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
    ...reviewResult.reasons
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

export default {
  evaluateMissionReviewRequirement,
  shouldRequireMissionReview,
  canAutomaticallyFinalizeMission,
  hasCriticalReviewReason,
  getPrimaryReviewReason
};