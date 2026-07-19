// src/services/ai/missions/evaluation/xpCalculator.js

import {
  MISSION_XP_MULTIPLIERS
} from "./evaluationConstants";

import {
  clampMissionScore
} from "./scoreCalculator";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizePositiveNumber = (
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
      Number(fallback) || 0
    );
  }

  return numericValue;
};

const clampMultiplier = (
  value,
  {
    minimum = 0,
    maximum = 2,
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
    return Math.max(
      minimum,
      Math.min(
        maximum,
        Number(fallback) || 0
      )
    );
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      numericValue
    )
  );
};

/*
|--------------------------------------------------------------------------
| Deterministic XP multiplier
|--------------------------------------------------------------------------
|
| XP multiplier is derived from the final validated result.
|
| Gemini may suggest a score, but it must never control XP directly.
|
*/

export const calculateMissionXpMultiplier =
  ({
    score = 0,
    passed = false,
    isFinal = true,
    requiresReview = false,
    severeIntegrityIssue = false,
    repeatedCompletion = false
  } = {}) => {
    if (
      isFinal !== true ||
      requiresReview === true ||
      passed !== true ||
      severeIntegrityIssue === true ||
      repeatedCompletion === true
    ) {
      return 0;
    }

    const normalizedScore =
      clampMissionScore(
        score
      );

    const matchedThreshold =
      MISSION_XP_MULTIPLIERS.find(
        (threshold) =>
          normalizedScore >=
          threshold.minimumScore
      );

    return clampMultiplier(
      matchedThreshold
        ?.multiplier || 0,
      {
        minimum: 0,
        maximum: 1.2,
        fallback: 0
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Base XP normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionBaseXp = (
  baseXp,
  fallback = 10
) => {
  const numericValue =
    Number(baseXp);

  if (
    !Number.isFinite(
      numericValue
    )
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
    Math.min(
      1000,
      Math.round(
        numericValue
      )
    )
  );
};

/*
|--------------------------------------------------------------------------
| Final XP calculation
|--------------------------------------------------------------------------
*/

export const calculateMissionXp = ({
  baseXp = 10,
  score = 0,
  passed = false,
  isFinal = true,
  requiresReview = false,
  severeIntegrityIssue = false,
  repeatedCompletion = false,
  bonusMultiplier = 1
} = {}) => {
  const normalizedBaseXp =
    normalizeMissionBaseXp(
      baseXp
    );

  const performanceMultiplier =
    calculateMissionXpMultiplier({
      score,
      passed,
      isFinal,
      requiresReview,
      severeIntegrityIssue,
      repeatedCompletion
    });

  /*
   * Future bonuses may include:
   *
   * - daily mission bonus;
   * - premium event bonus;
   * - streak bonus;
   * - campaign multiplier.
   *
   * They are disabled automatically when
   * the mission cannot award XP.
   */
  const normalizedBonusMultiplier =
    performanceMultiplier > 0
      ? clampMultiplier(
          bonusMultiplier,
          {
            minimum: 0,
            maximum: 3,
            fallback: 1
          }
        )
      : 0;

  const effectiveMultiplier =
    clampMultiplier(
      performanceMultiplier *
        normalizedBonusMultiplier,
      {
        minimum: 0,
        maximum: 3,
        fallback: 0
      }
    );

  const xpAwarded =
    Math.max(
      0,
      Math.round(
        normalizedBaseXp *
          effectiveMultiplier
      )
    );

  return {
    baseXp:
      normalizedBaseXp,

    performanceMultiplier,

    bonusMultiplier:
      normalizedBonusMultiplier,

    effectiveMultiplier,

    xpAwarded,

    canAwardXp:
      xpAwarded > 0 &&
      isFinal === true &&
      passed === true &&
      requiresReview !== true &&
      severeIntegrityIssue !== true &&
      repeatedCompletion !== true
  };
};

/*
|--------------------------------------------------------------------------
| XP explanation
|--------------------------------------------------------------------------
*/

export const getMissionXpReason = ({
  passed = false,
  isFinal = true,
  requiresReview = false,
  severeIntegrityIssue = false,
  repeatedCompletion = false,
  xpAwarded = 0
} = {}) => {
  if (isFinal !== true) {
    return "evaluation_pending";
  }

  if (requiresReview === true) {
    return "manual_review_required";
  }

  if (severeIntegrityIssue === true) {
    return "integrity_issue";
  }

  if (repeatedCompletion === true) {
    return "already_completed";
  }

  if (passed !== true) {
    return "mission_not_passed";
  }

  if (
    normalizePositiveNumber(
      xpAwarded
    ) <= 0
  ) {
    return "no_xp_awarded";
  }

  return "xp_awarded";
};

export const getMissionXpResult = ({
  baseXp = 10,
  score = 0,
  passed = false,
  isFinal = true,
  requiresReview = false,
  severeIntegrityIssue = false,
  repeatedCompletion = false,
  bonusMultiplier = 1
} = {}) => {
  const xpResult =
    calculateMissionXp({
      baseXp,
      score,
      passed,
      isFinal,
      requiresReview,
      severeIntegrityIssue,
      repeatedCompletion,
      bonusMultiplier
    });

  return {
    ...xpResult,

    reason:
      getMissionXpReason({
        passed,
        isFinal,
        requiresReview,
        severeIntegrityIssue,
        repeatedCompletion,
        xpAwarded:
          xpResult.xpAwarded
      })
  };
};

export default {
  calculateMissionXpMultiplier,
  normalizeMissionBaseXp,
  calculateMissionXp,
  getMissionXpReason,
  getMissionXpResult
};