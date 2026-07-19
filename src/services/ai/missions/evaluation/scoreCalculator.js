// src/services/ai/missions/evaluation/scoreCalculator.js

import {
  MISSION_EVALUATION_CRITERIA,
  MISSION_EVALUATION_CRITERIA_KEYS,
  MISSION_EVALUATION_TOTAL_WEIGHT,
  MISSION_MAX_TOTAL_PENALTY,
  MISSION_SCORE_BLEND,
  MISSION_SCORE_THRESHOLDS,
  getCriterionWeight
} from "./evaluationConstants";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

export const clampMissionScore = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return Math.max(
      MISSION_SCORE_THRESHOLDS.minimum,
      Math.min(
        MISSION_SCORE_THRESHOLDS.maximum,
        Math.round(
          Number(fallback) || 0
        )
      )
    );
  }

  return Math.max(
    MISSION_SCORE_THRESHOLDS.minimum,
    Math.min(
      MISSION_SCORE_THRESHOLDS.maximum,
      Math.round(numericValue)
    )
  );
};

const normalizeWeight = (
  value,
  fallback
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return fallback;
  }

  return numericValue;
};

const normalizeCriterionInput = (
  criterion,
  criterionKey
) => {
  const defaultWeight =
    getCriterionWeight(
      criterionKey
    );

  if (
    typeof criterion === "number" ||
    typeof criterion === "string"
  ) {
    return {
      score:
        clampMissionScore(
          criterion
        ),

      weight:
        defaultWeight
    };
  }

  if (
    !criterion ||
    typeof criterion !== "object" ||
    Array.isArray(criterion)
  ) {
    return {
      score: 0,
      weight:
        defaultWeight
    };
  }

  return {
    score:
      clampMissionScore(
        criterion.score ??
          criterion.value ??
          criterion.rating
      ),

    weight:
      normalizeWeight(
        criterion.weight,
        defaultWeight
      )
  };
};

/*
|--------------------------------------------------------------------------
| Criteria normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionCriteria = (
  criteria = {}
) => {
  const sourceCriteria =
    criteria &&
    typeof criteria === "object" &&
    !Array.isArray(criteria)
      ? criteria
      : {};

  return MISSION_EVALUATION_CRITERIA_KEYS.reduce(
    (
      normalizedCriteria,
      criterionKey
    ) => {
      normalizedCriteria[
        criterionKey
      ] = normalizeCriterionInput(
        sourceCriteria[
          criterionKey
        ],
        criterionKey
      );

      return normalizedCriteria;
    },
    {}
  );
};

/*
|--------------------------------------------------------------------------
| Weighted criteria score
|--------------------------------------------------------------------------
*/

export const calculateWeightedCriteriaScore =
  (
    criteria = {}
  ) => {
    const normalizedCriteria =
      normalizeMissionCriteria(
        criteria
      );

    const totalConfiguredWeight =
      MISSION_EVALUATION_CRITERIA_KEYS.reduce(
        (
          total,
          criterionKey
        ) => {
          return (
            total +
            normalizedCriteria[
              criterionKey
            ].weight
          );
        },
        0
      );

    const divisor =
      totalConfiguredWeight > 0
        ? totalConfiguredWeight
        : MISSION_EVALUATION_TOTAL_WEIGHT;

    const weightedTotal =
      MISSION_EVALUATION_CRITERIA_KEYS.reduce(
        (
          total,
          criterionKey
        ) => {
          const criterion =
            normalizedCriteria[
              criterionKey
            ];

          return (
            total +
            criterion.score *
              criterion.weight
          );
        },
        0
      );

    return clampMissionScore(
      weightedTotal / divisor
    );
  };

/*
|--------------------------------------------------------------------------
| External overall score blending
|--------------------------------------------------------------------------
*/

export const blendMissionScores = ({
  criteriaScore,
  externalScore = null
} = {}) => {
  const normalizedCriteriaScore =
    clampMissionScore(
      criteriaScore
    );

  const numericExternalScore =
    Number(externalScore);

  if (
    !Number.isFinite(
      numericExternalScore
    )
  ) {
    return normalizedCriteriaScore;
  }

  const normalizedExternalScore =
    clampMissionScore(
      numericExternalScore
    );

  const blendedScore =
    normalizedCriteriaScore *
      MISSION_SCORE_BLEND
        .criteriaWeight +
    normalizedExternalScore *
      MISSION_SCORE_BLEND
        .externalOverallWeight;

  return clampMissionScore(
    blendedScore
  );
};

/*
|--------------------------------------------------------------------------
| Penalty normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionPenalty = (
  value
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue <= 0
  ) {
    return 0;
  }

  return Math.min(
    MISSION_MAX_TOTAL_PENALTY,
    Math.round(numericValue)
  );
};

export const calculateTotalMissionPenalty =
  (
    penalties = []
  ) => {
    if (!Array.isArray(penalties)) {
      return 0;
    }

    const totalPenalty =
      penalties.reduce(
        (
          total,
          penalty
        ) => {
          if (
            typeof penalty ===
            "number"
          ) {
            return (
              total +
              normalizeMissionPenalty(
                penalty
              )
            );
          }

          if (
            penalty &&
            typeof penalty ===
              "object"
          ) {
            return (
              total +
              normalizeMissionPenalty(
                penalty.value ??
                  penalty.points ??
                  penalty.penalty
              )
            );
          }

          return total;
        },
        0
      );

    return Math.min(
      MISSION_MAX_TOTAL_PENALTY,
      totalPenalty
    );
  };

/*
|--------------------------------------------------------------------------
| Score ceilings
|--------------------------------------------------------------------------
|
| A ceiling is a business-rule maximum applied after pedagogical scoring.
|
*/

export const applyMissionScoreCeilings =
  (
    score,
    {
      goalAchieved = true,
      sufficientEvidence = true,
      mostlyOffTopic = false,
      severeIntegrityIssue = false
    } = {}
  ) => {
    let finalScore =
      clampMissionScore(score);

    if (!goalAchieved) {
      finalScore = Math.min(
        finalScore,
        MISSION_SCORE_THRESHOLDS
          .incompleteGoalMaximum
      );
    }

    if (!sufficientEvidence) {
      finalScore = Math.min(
        finalScore,
        MISSION_SCORE_THRESHOLDS
          .insufficientEvidenceMaximum
      );
    }

    if (mostlyOffTopic) {
      finalScore = Math.min(
        finalScore,
        MISSION_SCORE_THRESHOLDS
          .mostlyOffTopicMaximum
      );
    }

    if (severeIntegrityIssue) {
      finalScore = Math.min(
        finalScore,
        MISSION_SCORE_THRESHOLDS
          .severeIntegrityMaximum
      );
    }

    return clampMissionScore(
      finalScore
    );
  };

/*
|--------------------------------------------------------------------------
| Final deterministic score
|--------------------------------------------------------------------------
*/

export const calculateMissionScore = ({
  criteria = {},
  externalScore = null,
  penalties = [],
  goalAchieved = true,
  sufficientEvidence = true,
  mostlyOffTopic = false,
  severeIntegrityIssue = false
} = {}) => {
  const normalizedCriteria =
    normalizeMissionCriteria(
      criteria
    );

  const criteriaScore =
    calculateWeightedCriteriaScore(
      normalizedCriteria
    );

  const blendedScore =
    blendMissionScores({
      criteriaScore,
      externalScore
    });

  const totalPenalty =
    calculateTotalMissionPenalty(
      penalties
    );

  const penalizedScore =
    clampMissionScore(
      blendedScore -
        totalPenalty
    );

  const finalScore =
    applyMissionScoreCeilings(
      penalizedScore,
      {
        goalAchieved,
        sufficientEvidence,
        mostlyOffTopic,
        severeIntegrityIssue
      }
    );

  return {
    score: finalScore,

    criteriaScore,

    externalScore:
      Number.isFinite(
        Number(externalScore)
      )
        ? clampMissionScore(
            externalScore
          )
        : null,

    blendedScore,

    totalPenalty,

    criteria:
      normalizedCriteria,

    appliedCeilings: {
      goalAchieved:
        !goalAchieved,

      sufficientEvidence:
        !sufficientEvidence,

      mostlyOffTopic:
        Boolean(
          mostlyOffTopic
        ),

      severeIntegrityIssue:
        Boolean(
          severeIntegrityIssue
        )
    }
  };
};

/*
|--------------------------------------------------------------------------
| Score classification
|--------------------------------------------------------------------------
*/

export const getMissionScoreBand = (
  score
) => {
  const normalizedScore =
    clampMissionScore(score);

  if (
    normalizedScore >=
    MISSION_SCORE_THRESHOLDS
      .excellent
  ) {
    return "excellent";
  }

  if (
    normalizedScore >=
    MISSION_SCORE_THRESHOLDS.good
  ) {
    return "good";
  }

  if (
    normalizedScore >=
    MISSION_SCORE_THRESHOLDS.pass
  ) {
    return "acceptable";
  }

  if (normalizedScore >= 40) {
    return "basic";
  }

  return "weak";
};

/*
|--------------------------------------------------------------------------
| Criteria utilities
|--------------------------------------------------------------------------
*/

export const getWeakestMissionCriteria =
  (
    criteria = {},
    maximumItems = 3
  ) => {
    const normalizedCriteria =
      normalizeMissionCriteria(
        criteria
      );

    return Object.entries(
      normalizedCriteria
    )
      .map(
        ([
          key,
          criterion
        ]) => ({
          key,

          label:
            MISSION_EVALUATION_CRITERIA[
              key
            ]?.label || key,

          score:
            criterion.score,

          weight:
            criterion.weight
        })
      )
      .sort(
        (first, second) =>
          first.score -
          second.score
      )
      .slice(
        0,
        Math.max(
          0,
          Number(
            maximumItems
          ) || 0
        )
      );
  };

export const getStrongestMissionCriteria =
  (
    criteria = {},
    maximumItems = 3
  ) => {
    const normalizedCriteria =
      normalizeMissionCriteria(
        criteria
      );

    return Object.entries(
      normalizedCriteria
    )
      .map(
        ([
          key,
          criterion
        ]) => ({
          key,

          label:
            MISSION_EVALUATION_CRITERIA[
              key
            ]?.label || key,

          score:
            criterion.score,

          weight:
            criterion.weight
        })
      )
      .sort(
        (first, second) =>
          second.score -
          first.score
      )
      .slice(
        0,
        Math.max(
          0,
          Number(
            maximumItems
          ) || 0
        )
      );
  };

export default {
  clampMissionScore,

  normalizeMissionCriteria,

  calculateWeightedCriteriaScore,

  blendMissionScores,

  normalizeMissionPenalty,

  calculateTotalMissionPenalty,

  applyMissionScoreCeilings,

  calculateMissionScore,

  getMissionScoreBand,

  getWeakestMissionCriteria,

  getStrongestMissionCriteria
};