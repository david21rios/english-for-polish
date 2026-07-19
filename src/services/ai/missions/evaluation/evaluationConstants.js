// src/services/ai/missions/evaluation/evaluationConstants.js

/*
|--------------------------------------------------------------------------
| Mission evaluation constants
|--------------------------------------------------------------------------
|
| Central source of truth for:
|
| - scoring criteria;
| - score thresholds;
| - completion thresholds;
| - integrity penalties;
| - review thresholds;
| - CEFR values;
| - deterministic reward rules.
|
| Gemini may provide pedagogical observations and criterion scores,
| but the application remains responsible for final business decisions.
|
*/

export const VALID_CEFR_LEVELS = Object.freeze([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
]);

export const VALID_CEFR_LEVEL_SET = new Set(
  VALID_CEFR_LEVELS
);

export const MISSION_EVALUATION_STATUS =
  Object.freeze({
    evaluated: "evaluated",
    pending: "pending_evaluation",
    manualReview: "manual_review",
    unavailable: "unavailable",
    rejected: "rejected"
  });

export const GOAL_PROGRESS = Object.freeze({
  none: "none",
  limited: "limited",
  partial: "partial",
  good: "good",
  complete: "complete"
});

export const VALID_GOAL_PROGRESS_SET =
  new Set(
    Object.values(
      GOAL_PROGRESS
    )
  );

/*
|--------------------------------------------------------------------------
| Evaluation criteria
|--------------------------------------------------------------------------
|
| Every criterion is scored from 0 to 100.
| Weights must total exactly 100.
|
*/

export const MISSION_EVALUATION_CRITERIA =
  Object.freeze({
    taskAchievement: {
      key: "taskAchievement",
      label: "Task Achievement",
      weight: 30
    },

    communication: {
      key: "communication",
      label: "Communicative Effectiveness",
      weight: 20
    },

    relevance: {
      key: "relevance",
      label: "Mission Relevance",
      weight: 15
    },

    grammar: {
      key: "grammar",
      label: "Grammar",
      weight: 10
    },

    vocabulary: {
      key: "vocabulary",
      label: "Vocabulary",
      weight: 10
    },

    coherence: {
      key: "coherence",
      label: "Coherence",
      weight: 10
    },

    interaction: {
      key: "interaction",
      label: "Interaction Quality",
      weight: 5
    }
  });

export const MISSION_EVALUATION_CRITERIA_KEYS =
  Object.freeze(
    Object.keys(
      MISSION_EVALUATION_CRITERIA
    )
  );

export const MISSION_EVALUATION_TOTAL_WEIGHT =
  MISSION_EVALUATION_CRITERIA_KEYS.reduce(
    (total, key) => {
      return (
        total +
        MISSION_EVALUATION_CRITERIA[
          key
        ].weight
      );
    },
    0
  );

/*
|--------------------------------------------------------------------------
| Score thresholds
|--------------------------------------------------------------------------
*/

export const MISSION_SCORE_THRESHOLDS =
  Object.freeze({
    minimum: 0,
    maximum: 100,

    /*
     * Minimum final score required for passing.
     */
    pass: 60,

    /*
     * Minimum score for a strong result.
     */
    good: 75,

    /*
     * Minimum score for an excellent result.
     */
    excellent: 90,

    /*
     * Hard ceiling when the mission goal was not achieved.
     */
    incompleteGoalMaximum: 59,

    /*
     * Hard ceiling when the conversation was mostly off-topic.
     */
    mostlyOffTopicMaximum: 39,

    /*
     * Hard ceiling when meaningful evidence is insufficient.
     */
    insufficientEvidenceMaximum: 49,

    /*
     * Hard ceiling when integrity manipulation is severe.
     */
    severeIntegrityMaximum: 25
  });

/*
|--------------------------------------------------------------------------
| Completion requirements
|--------------------------------------------------------------------------
*/

export const MISSION_COMPLETION_THRESHOLDS =
  Object.freeze({
    /*
     * Minimum meaningful student replies.
     */
    minimumMeaningfulReplies: 5,

    /*
     * Minimum percentage of required objectives completed.
     */
    minimumRequiredObjectiveRatio: 0.6,

    /*
     * Minimum progress score reported by the state evaluator.
     */
    minimumProgressScore: 60,

    /*
     * Maximum tolerated off-topic ratio.
     */
    maximumOffTopicRatio: 0.4,

    /*
     * Maximum tolerated nonsense ratio.
     */
    maximumNonsenseRatio: 0.25,

    /*
     * Minimum confidence for automatic finalization.
     */
    minimumAutomaticConfidence: 65,

    /*
     * Minimum confidence to accept an evaluation without review.
     */
    minimumEvaluationConfidence: 60
  });

/*
|--------------------------------------------------------------------------
| Integrity penalties
|--------------------------------------------------------------------------
|
| Penalties are expressed in final score points.
|
*/

export const MISSION_INTEGRITY_PENALTIES =
  Object.freeze({
    repeatedMessages: 10,
    excessiveRepetition: 20,
    offTopicContent: 15,
    mostlyOffTopic: 35,
    nonsenseContent: 20,
    copiedContent: 15,
    unsupportedLanguage: 10,
    promptInjection: 20,
    artificialMessageSplitting: 10,
    emptyOrMinimalReplies: 15
  });

export const MISSION_MAX_TOTAL_PENALTY = 60;

/*
|--------------------------------------------------------------------------
| Reliability and manual review
|--------------------------------------------------------------------------
*/

export const MISSION_REVIEW_THRESHOLDS =
  Object.freeze({
    lowConfidence: 60,
    veryLowConfidence: 40,

    maximumReviewableOffTopicRatio:
      0.4,

    maximumReviewableNonsenseRatio:
      0.25,

    minimumMessagesForReliableEvaluation:
      3,

    minimumWordsForReliableEvaluation:
      12
  });

/*
|--------------------------------------------------------------------------
| Score blending
|--------------------------------------------------------------------------
|
| Gemini may provide:
|
| - criterion scores;
| - an overall score.
|
| The deterministic result prioritizes weighted criteria.
|
*/

export const MISSION_SCORE_BLEND =
  Object.freeze({
    criteriaWeight: 0.85,
    externalOverallWeight: 0.15
  });

/*
|--------------------------------------------------------------------------
| Stars
|--------------------------------------------------------------------------
*/

export const MISSION_STAR_THRESHOLDS =
  Object.freeze([
    {
      minimumScore: 90,
      stars: 5
    },
    {
      minimumScore: 75,
      stars: 4
    },
    {
      minimumScore: 60,
      stars: 3
    },
    {
      minimumScore: 40,
      stars: 2
    },
    {
      minimumScore: 0,
      stars: 1
    }
  ]);

/*
|--------------------------------------------------------------------------
| XP multipliers
|--------------------------------------------------------------------------
*/

export const MISSION_XP_MULTIPLIERS =
  Object.freeze([
    {
      minimumScore: 90,
      multiplier: 1.2
    },
    {
      minimumScore: 75,
      multiplier: 1
    },
    {
      minimumScore: 60,
      multiplier: 0.75
    },
    {
      minimumScore: 40,
      multiplier: 0.5
    },
    {
      minimumScore: 0,
      multiplier: 0
    }
  ]);

/*
|--------------------------------------------------------------------------
| CEFR-specific expectations
|--------------------------------------------------------------------------
|
| These values do not directly determine the score.
| They support validation and future calibration.
|
*/

export const CEFR_EXPECTATIONS =
  Object.freeze({
    A1: {
      minimumMeaningfulReplies: 4,
      minimumAverageWordsPerReply: 2,
      minimumRequiredObjectiveRatio:
        0.5
    },

    A2: {
      minimumMeaningfulReplies: 5,
      minimumAverageWordsPerReply: 3,
      minimumRequiredObjectiveRatio:
        0.6
    },

    B1: {
      minimumMeaningfulReplies: 5,
      minimumAverageWordsPerReply: 5,
      minimumRequiredObjectiveRatio:
        0.6
    },

    B2: {
      minimumMeaningfulReplies: 6,
      minimumAverageWordsPerReply: 7,
      minimumRequiredObjectiveRatio:
        0.7
    },

    C1: {
      minimumMeaningfulReplies: 6,
      minimumAverageWordsPerReply: 9,
      minimumRequiredObjectiveRatio:
        0.75
    },

    C2: {
      minimumMeaningfulReplies: 6,
      minimumAverageWordsPerReply: 10,
      minimumRequiredObjectiveRatio:
        0.8
    }
  });

/*
|--------------------------------------------------------------------------
| Helper accessors
|--------------------------------------------------------------------------
*/

export const getCriterionWeight = (
  criterionKey
) => {
  return (
    MISSION_EVALUATION_CRITERIA[
      criterionKey
    ]?.weight || 0
  );
};

export const getCefrExpectations = (
  level = "A1"
) => {
  const normalizedLevel =
    String(level || "")
      .trim()
      .toUpperCase();

  return (
    CEFR_EXPECTATIONS[
      normalizedLevel
    ] || CEFR_EXPECTATIONS.A1
  );
};

export const isValidCefrLevel = (
  level
) => {
  return VALID_CEFR_LEVEL_SET.has(
    String(level || "")
      .trim()
      .toUpperCase()
  );
};

export default {
  VALID_CEFR_LEVELS,
  VALID_CEFR_LEVEL_SET,

  MISSION_EVALUATION_STATUS,

  GOAL_PROGRESS,
  VALID_GOAL_PROGRESS_SET,

  MISSION_EVALUATION_CRITERIA,
  MISSION_EVALUATION_CRITERIA_KEYS,
  MISSION_EVALUATION_TOTAL_WEIGHT,

  MISSION_SCORE_THRESHOLDS,
  MISSION_COMPLETION_THRESHOLDS,
  MISSION_INTEGRITY_PENALTIES,
  MISSION_MAX_TOTAL_PENALTY,
  MISSION_REVIEW_THRESHOLDS,
  MISSION_SCORE_BLEND,
  MISSION_STAR_THRESHOLDS,
  MISSION_XP_MULTIPLIERS,
  CEFR_EXPECTATIONS,

  getCriterionWeight,
  getCefrExpectations,
  isValidCefrLevel
};