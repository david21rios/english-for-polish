// src/services/ai/missions/evaluation/objectiveEvaluator.js

import {
  MISSION_COMPLETION_THRESHOLDS,
  getCefrExpectations
} from "./evaluationConstants";

import {
  normalizeContextObjectives
} from "../missionContext";

import {
  normalizeMissionConfidence
} from "../missionJson";

/*
|--------------------------------------------------------------------------
| Text normalization
|--------------------------------------------------------------------------
*/

const normalizeComparableText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
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

const normalizeEvidence = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, 600);
};

/*
|--------------------------------------------------------------------------
| Evaluation-result normalization
|--------------------------------------------------------------------------
*/

const normalizeObjectiveResult = (
  result = {},
  index = 0
) => {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return null;
  }

  const objectiveText =
    String(
      result.objective ||
      result.text ||
      result.title ||
      ""
    )
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 300);

  const objectiveId =
    String(
      result.id ||
      result.objectiveId ||
      ""
    ).trim();

  if (
    !objectiveText &&
    !objectiveId
  ) {
    return null;
  }

  return {
    id:
      objectiveId ||
      `evaluated_objective_${index + 1}`,

    objective:
      objectiveText,

    completed:
      normalizeBoolean(
        result.completed,
        false
      ),

    attempted:
      normalizeBoolean(
        result.attempted,
        result.completed === true
      ),

    evidence:
      normalizeEvidence(
        result.evidence
      ),

    confidence:
      normalizeMissionConfidence(
        result.confidence
      )
  };
};

export const normalizeObjectiveResults = (
  objectiveResults = []
) => {
  if (
    !Array.isArray(
      objectiveResults
    )
  ) {
    return [];
  }

  return objectiveResults
    .map(normalizeObjectiveResult)
    .filter(Boolean);
};

/*
|--------------------------------------------------------------------------
| Result matching
|--------------------------------------------------------------------------
*/

const findObjectiveResult = ({
  objective,
  objectiveResults
}) => {
  const byId =
    objectiveResults.find(
      (result) =>
        result.id ===
        objective.id
    );

  if (byId) {
    return byId;
  }

  const normalizedObjectiveText =
    normalizeComparableText(
      objective.text
    );

  return objectiveResults.find(
    (result) =>
      normalizeComparableText(
        result.objective
      ) ===
      normalizedObjectiveText
  );
};

/*
|--------------------------------------------------------------------------
| Objective evaluation
|--------------------------------------------------------------------------
*/

export const evaluateMissionObjectives = ({
  missionObjectives = [],
  objectiveResults = [],
  level = "A1"
} = {}) => {
  const normalizedObjectives =
    normalizeContextObjectives(
      missionObjectives
    );

  const normalizedResults =
    normalizeObjectiveResults(
      objectiveResults
    );

  const evaluatedObjectives =
    normalizedObjectives.map(
      (objective) => {
        const matchedResult =
          findObjectiveResult({
            objective,
            objectiveResults:
              normalizedResults
          });

        return {
          id: objective.id,

          objective:
            objective.text,

          required:
            objective.required !==
            false,

          attempted:
            matchedResult
              ?.attempted === true ||
            matchedResult
              ?.completed === true,

          completed:
            matchedResult
              ?.completed === true,

          evidence:
            matchedResult
              ?.evidence || "",

          confidence:
            matchedResult
              ?.confidence ?? null
        };
      }
    );

  const requiredObjectives =
    evaluatedObjectives.filter(
      (objective) =>
        objective.required
    );

  const optionalObjectives =
    evaluatedObjectives.filter(
      (objective) =>
        !objective.required
    );

  const requiredCompleted =
    requiredObjectives.filter(
      (objective) =>
        objective.completed
    ).length;

  const requiredAttempted =
    requiredObjectives.filter(
      (objective) =>
        objective.attempted
    ).length;

  const optionalCompleted =
    optionalObjectives.filter(
      (objective) =>
        objective.completed
    ).length;

  const totalCompleted =
    evaluatedObjectives.filter(
      (objective) =>
        objective.completed
    ).length;

  const requiredCompletionRatio =
    requiredObjectives.length > 0
      ? requiredCompleted /
        requiredObjectives.length
      : 1;

  const requiredAttemptRatio =
    requiredObjectives.length > 0
      ? requiredAttempted /
        requiredObjectives.length
      : 1;

  const overallCompletionRatio =
    evaluatedObjectives.length > 0
      ? totalCompleted /
        evaluatedObjectives.length
      : 1;

  const cefrExpectations =
    getCefrExpectations(level);

  const minimumRequiredRatio =
    cefrExpectations
      .minimumRequiredObjectiveRatio ??
    MISSION_COMPLETION_THRESHOLDS
      .minimumRequiredObjectiveRatio;

  const allRequiredAttempted =
    requiredAttemptRatio >= 1;

  const sufficientRequiredCompletion =
    requiredCompletionRatio >=
    minimumRequiredRatio;

  const goalAchieved =
    allRequiredAttempted &&
    sufficientRequiredCompletion;

  return {
    objectives:
      evaluatedObjectives,

    totalObjectives:
      evaluatedObjectives.length,

    requiredObjectives:
      requiredObjectives.length,

    optionalObjectives:
      optionalObjectives.length,

    requiredCompleted,

    requiredAttempted,

    optionalCompleted,

    totalCompleted,

    requiredCompletionRatio,

    requiredAttemptRatio,

    overallCompletionRatio,

    minimumRequiredRatio,

    allRequiredAttempted,

    sufficientRequiredCompletion,

    goalAchieved,

    missingRequiredObjectives:
      requiredObjectives.filter(
        (objective) =>
          !objective.completed
      ),

    unattemptedRequiredObjectives:
      requiredObjectives.filter(
        (objective) =>
          !objective.attempted
      )
  };
};

/*
|--------------------------------------------------------------------------
| Helper methods
|--------------------------------------------------------------------------
*/

export const hasCompletedAllRequiredObjectives = (
  objectiveEvaluation
) => {
  return (
    objectiveEvaluation
      ?.requiredCompletionRatio === 1
  );
};

export const hasAttemptedAllRequiredObjectives = (
  objectiveEvaluation
) => {
  return (
    objectiveEvaluation
      ?.requiredAttemptRatio === 1
  );
};

export const getObjectiveProgressPercentage = (
  objectiveEvaluation
) => {
  const ratio = Number(
    objectiveEvaluation
      ?.overallCompletionRatio
  );

  if (!Number.isFinite(ratio)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(ratio * 100)
    )
  );
};

export default {
  normalizeObjectiveResults,
  evaluateMissionObjectives,
  hasCompletedAllRequiredObjectives,
  hasAttemptedAllRequiredObjectives,
  getObjectiveProgressPercentage
};
