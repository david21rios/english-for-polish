// src/services/ai/missions/evaluation/starsCalculator.js

import {
  classifyMissionResult
} from "./missionResultClassifier";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const clampStars = (
  value,
  fallback = 1
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return Math.max(
      0,
      Math.min(
        5,
        Math.round(
          Number(fallback) || 0
        )
      )
    );
  }

  return Math.max(
    0,
    Math.min(
      5,
      Math.round(
        numericValue
      )
    )
  );
};

/*
|--------------------------------------------------------------------------
| Deterministic stars calculation
|--------------------------------------------------------------------------
|
| Stars are calculated locally from the final score.
|
| Gemini must never be trusted as the source of truth for stars.
|
*/

export const calculateMissionStars = ({
  score = 0,
  passed = false,
  isFinal = true,
  requiresReview = false,
  severeIntegrityIssue = false
} = {}) => {
  if (
    isFinal !== true ||
    requiresReview === true
  ) {
    return 0;
  }

  if (
    severeIntegrityIssue === true
  ) {
    return 1;
  }

  return classifyMissionResult({
    score,
    passed,
    evaluationCompleted: isFinal,
    isFinal,
    requiresReview,
    isFallback: false
  }).stars;
};

/*
|--------------------------------------------------------------------------
| Star metadata
|--------------------------------------------------------------------------
*/

export const getMissionStarLabel = (
  stars
) => {
  const normalizedStars =
    clampStars(stars, 0);

  const labels = {
    0: "Pending",
    1: "Weak",
    2: "Basic",
    3: "Acceptable",
    4: "Good",
    5: "Excellent"
  };

  return (
    labels[normalizedStars] ||
    labels[0]
  );
};

export const getMissionStarDescription = (
  stars
) => {
  const normalizedStars =
    clampStars(stars, 0);

  const descriptions = {
    0:
      "The mission evaluation is not final.",

    1:
      "The conversation was insufficient, mostly irrelevant or did not achieve the mission goal.",

    2:
      "The student made a basic attempt, but important communication goals remain incomplete.",

    3:
      "The student communicated successfully enough to complete the mission.",

    4:
      "The student completed the mission with good communication and clear progress.",

    5:
      "The student demonstrated excellent communication for the configured CEFR level."
  };

  return (
    descriptions[
      normalizedStars
    ] || descriptions[0]
  );
};

export const getMissionStarResult = ({
  score = 0,
  passed = false,
  isFinal = true,
  requiresReview = false,
  severeIntegrityIssue = false
} = {}) => {
  const stars =
    calculateMissionStars({
      score,
      passed,
      isFinal,
      requiresReview,
      severeIntegrityIssue
    });

  return {
    stars,

    label:
      getMissionStarLabel(
        stars
      ),

    description:
      getMissionStarDescription(
        stars
      )
  };
};

export default {
  calculateMissionStars,
  getMissionStarLabel,
  getMissionStarDescription,
  getMissionStarResult
};
