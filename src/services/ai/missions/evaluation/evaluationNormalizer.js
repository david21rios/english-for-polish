// src/services/ai/missions/evaluation/evaluationNormalizer.js

import {
  countWords
} from "../missionLimits";

import {
  getMissionLevel,
  getUserMessages
} from "../missionContext";

import {
  normalizeMissionEvaluationJson,
  normalizeMissionStateJson
} from "../missionJson";

import {
  MISSION_EVALUATION_CRITERIA_KEYS
} from "./evaluationConstants";

import {
  clampMissionScore,
  normalizeMissionCriteria
} from "./scoreCalculator";

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

  if (
    typeof value === "string"
  ) {
    const normalizedValue =
      value
        .trim()
        .toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  return fallback;
};

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const normalizeNonNegativeInteger = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return Math.max(
      0,
      Math.round(
        Number(fallback) || 0
      )
    );
  }

  return Math.max(
    0,
    Math.round(
      numericValue
    )
  );
};

/*
|--------------------------------------------------------------------------
| Local conversation metrics
|--------------------------------------------------------------------------
|
| Gemini must not be the source of truth for message and word counts.
|
*/

export const calculateLocalMissionMetrics = (
  conversation = []
) => {
  const userMessages =
    getUserMessages(
      conversation
    );

  const totalWords =
    userMessages.reduce(
      (total, message) => {
        return (
          total +
          countWords(
            message.text || ""
          )
        );
      },
      0
    );

  return {
    totalMessages:
      userMessages.length,

    totalWords
  };
};

/*
|--------------------------------------------------------------------------
| Criteria aliases
|--------------------------------------------------------------------------
|
| Different prompts or model versions may return slightly different keys.
| This adapter converts them to the canonical evaluation criteria.
|
*/

const getCriterionSource = (
  criteria,
  aliases = []
) => {
  if (!isPlainObject(criteria)) {
    return undefined;
  }

  for (const alias of aliases) {
    if (
      criteria[alias] !==
      undefined
    ) {
      return criteria[alias];
    }
  }

  return undefined;
};

const buildCanonicalCriteriaSource = (
  rawEvaluation = {}
) => {
  const rawCriteria =
    isPlainObject(
      rawEvaluation.criteria
    )
      ? rawEvaluation.criteria
      : {};

  return {
    taskAchievement:
      getCriterionSource(
        rawCriteria,
        [
          "taskAchievement",
          "taskCompletion",
          "goalAchievement",
          "missionAchievement"
        ]
      ),

    communication:
      getCriterionSource(
        rawCriteria,
        [
          "communication",
          "communicativeEffectiveness",
          "communicationQuality",
          "communicativeAchievement"
        ]
      ),

    relevance:
      getCriterionSource(
        rawCriteria,
        [
          "relevance",
          "missionRelevance",
          "taskRelevance"
        ]
      ),

    grammar:
      getCriterionSource(
        rawCriteria,
        [
          "grammar",
          "grammarAccuracy",
          "grammaticalControl"
        ]
      ),

    vocabulary:
      getCriterionSource(
        rawCriteria,
        [
          "vocabulary",
          "lexicalResource",
          "vocabularyControl"
        ]
      ),

    coherence:
      getCriterionSource(
        rawCriteria,
        [
          "coherence",
          "coherenceAndCohesion",
          "organization"
        ]
      ),

    interaction:
      getCriterionSource(
        rawCriteria,
        [
          "interaction",
          "interactionQuality",
          "responsiveness"
        ]
      )
  };
};

const hasUsableCriteria = (
  criteriaSource = {}
) => {
  return MISSION_EVALUATION_CRITERIA_KEYS.some(
    (criterionKey) => {
      const criterion =
        criteriaSource[
          criterionKey
        ];

      if (
        typeof criterion ===
          "number" ||
        typeof criterion ===
          "string"
      ) {
        return Number.isFinite(
          Number(criterion)
        );
      }

      if (
        isPlainObject(
          criterion
        )
      ) {
        return Number.isFinite(
          Number(
            criterion.score ??
              criterion.value ??
              criterion.rating
          )
        );
      }

      return false;
    }
  );
};

/*
|--------------------------------------------------------------------------
| Compatibility criteria
|--------------------------------------------------------------------------
|
| The current mission evaluator may return only an overall score.
| Until the prompt is updated to return criterion scores, the external
| score is copied into each criterion to avoid reducing a valid score to
| approximately 15% during the deterministic blend.
|
| This compatibility path must be considered temporary.
|
*/

const buildFallbackCriteriaFromScore = (
  score
) => {
  const normalizedScore =
    clampMissionScore(score);

  return MISSION_EVALUATION_CRITERIA_KEYS.reduce(
    (
      criteria,
      criterionKey
    ) => {
      criteria[
        criterionKey
      ] = {
        score:
          normalizedScore
      };

      return criteria;
    },
    {}
  );
};

export const normalizeEvaluationCriteria = (
  rawEvaluation = {}
) => {
  const canonicalCriteriaSource =
    buildCanonicalCriteriaSource(
      rawEvaluation
    );

  const externalScore =
    rawEvaluation.score ??
    rawEvaluation.totalScore ??
    rawEvaluation.overallScore;

  const usableCriteria =
    hasUsableCriteria(
      canonicalCriteriaSource
    );

  const sourceCriteria =
    usableCriteria
      ? canonicalCriteriaSource
      : buildFallbackCriteriaFromScore(
          externalScore
        );

  return {
    criteria:
      normalizeMissionCriteria(
        sourceCriteria
      ),

    criteriaSource:
      usableCriteria
        ? "gemini_criteria"
        : "external_score_fallback",

    hasExplicitCriteria:
      usableCriteria
  };
};

/*
|--------------------------------------------------------------------------
| Confidence normalization
|--------------------------------------------------------------------------
|
| The current evaluator prompt may not return confidence yet.
| A temporary derived confidence maintains compatibility until the prompt
| contract is updated.
|
*/

const deriveEvaluationConfidence = (
  rawEvaluation = {}
) => {
  const explicitConfidence =
    Number(
      rawEvaluation.confidence
    );

  if (
    Number.isFinite(
      explicitConfidence
    )
  ) {
    return {
      confidence:
        clampMissionScore(
          explicitConfidence
        ),

      confidenceSource:
        "gemini"
    };
  }

  const hasScore =
    Number.isFinite(
      Number(
        rawEvaluation.score ??
          rawEvaluation.totalScore ??
          rawEvaluation.overallScore
      )
    );

  const hasObjectives =
    Array.isArray(
      rawEvaluation
        .objectivesCompleted
    );

  const hasFeedback =
    Array.isArray(
      rawEvaluation.strengths
    ) ||
    Array.isArray(
      rawEvaluation.improvements
    );

  if (
    hasScore &&
    hasObjectives &&
    hasFeedback
  ) {
    return {
      confidence: 70,
      confidenceSource:
        "derived_structured_response"
    };
  }

  if (hasScore) {
    return {
      confidence: 55,
      confidenceSource:
        "derived_score_only"
    };
  }

  return {
    confidence: 0,
    confidenceSource:
      "unavailable"
  };
};

/*
|--------------------------------------------------------------------------
| External integrity signals
|--------------------------------------------------------------------------
*/

export const normalizeEvaluationIntegritySignals =
  (
    rawEvaluation = {}
  ) => {
    return {
      copiedContent:
        normalizeBoolean(
          rawEvaluation
            .copiedContent ??
          rawEvaluation
            .copiedOrRepeated ??
          rawEvaluation
            .possibleCopiedContent,
          false
        ),

      unsupportedLanguage:
        normalizeBoolean(
          rawEvaluation
            .unsupportedLanguage ??
          rawEvaluation
            .containsUnsupportedLanguage,
          false
        ),

      containsNonEnglish:
        normalizeBoolean(
          rawEvaluation
            .containsNonEnglish ??
          rawEvaluation
            .nonEnglishContent,
          false
        ),

      promptInjection:
        normalizeBoolean(
          rawEvaluation
            .promptInjection ??
          rawEvaluation
            .promptInjectionAttempt,
          false
        ),

      excessiveRepetition:
        normalizeBoolean(
          rawEvaluation
            .excessiveRepetition ??
          rawEvaluation
            .repeatedContent,
          false
        ),

      meaninglessContent:
        normalizeBoolean(
          rawEvaluation
            .meaninglessContent ??
          rawEvaluation
            .gibberish ??
          rawEvaluation
            .fillerContent,
          false
        ),

      offTopic:
        normalizeBoolean(
          rawEvaluation
            .offTopic ??
          rawEvaluation
            .isOffTopic,
          false
        )
    };
  };

/*
|--------------------------------------------------------------------------
| Mission-state normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionStateInput = (
  missionState = {}
) => {
  try {
    return normalizeMissionStateJson(
      missionState
    );
  } catch {
    return {
      canComplete: false,
      progressScore: 0,
      meaningfulReplies: 0,
      offTopicReplies: 0,
      nonsenseReplies: 0,
      goalProgress: "none",
      reason:
        "Mission state could not be normalized.",
      nextRequiredAction:
        "Continue the conversation with a relevant and complete answer.",
      confidence: 0,
      requiresReview: true
    };
  }
};

/*
|--------------------------------------------------------------------------
| Complete evaluation normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionEvaluationInput =
  ({
    rawEvaluation = {},
    mission = {},
    conversation = []
  } = {}) => {
    if (
      !isPlainObject(
        rawEvaluation
      )
    ) {
      throw new Error(
        "Mission evaluation must be a valid object."
      );
    }

    const fallbackLevel =
      getMissionLevel({
        mission
      });

    const normalizedJson =
      normalizeMissionEvaluationJson(
        rawEvaluation,
        {
          fallbackLevel
        }
      );

    const localMetrics =
      calculateLocalMissionMetrics(
        conversation
      );

    const {
      criteria,
      criteriaSource,
      hasExplicitCriteria
    } =
      normalizeEvaluationCriteria(
        rawEvaluation
      );

    const {
      confidence,
      confidenceSource
    } =
      deriveEvaluationConfidence(
        rawEvaluation
      );

    const integritySignals =
      normalizeEvaluationIntegritySignals(
        rawEvaluation
      );

    return {
      rawPassed:
        normalizedJson.rawPassed,

      externalScore:
        normalizedJson.score,

      criteria,

      criteriaSource,

      hasExplicitCriteria,

      suggestedLevel:
        normalizedJson.suggestedLevel,

      /*
       * Local metrics override model-provided metrics.
       */
      totalMessages:
        localMetrics.totalMessages,

      totalWords:
        localMetrics.totalWords,

      reportedTotalMessages:
        normalizeNonNegativeInteger(
          rawEvaluation.totalMessages,
          normalizedJson
            .totalMessages
        ),

      reportedTotalWords:
        normalizeNonNegativeInteger(
          rawEvaluation.totalWords,
          normalizedJson
            .totalWords
        ),

      objectivesCompleted:
        normalizedJson
          .objectivesCompleted,

      strengths:
        normalizedJson.strengths,

      improvements:
        normalizedJson.improvements,

      corrections:
        normalizedJson.corrections,

      vocabulary:
        normalizedJson.vocabulary,

      grammarTips:
        normalizedJson.grammarTips,

      nextSteps:
        normalizedJson.nextSteps,

      feedbackPolish:
        normalizeText(
          rawEvaluation
            .feedbackPolish ??
          rawEvaluation.feedback,
          2000
        ),

      confidence,

      confidenceSource,

      requiresReview:
        normalizedJson
          .requiresReview,

      integritySignals,

      rawStars:
        normalizeNonNegativeInteger(
          rawEvaluation.stars,
          0
        ),

      rawXpMultiplier:
        Math.max(
          0,
          Number(
            rawEvaluation
              .xpMultiplier
          ) || 0
        ),

      provider:
        normalizeText(
          rawEvaluation.provider ||
            "gemini",
          50
        ),

      normalizedAt:
        new Date().toISOString()
    };
  };

export default {
  calculateLocalMissionMetrics,
  normalizeEvaluationCriteria,
  normalizeEvaluationIntegritySignals,
  normalizeMissionStateInput,
  normalizeMissionEvaluationInput
};