import {
  MISSION_SCORE_THRESHOLDS
} from "./evaluationConstants";

const clampScore = (value) => {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const buildClassification = ({
  key,
  score,
  passed = false,
  stars = 0,
  visualVariant,
  primaryAction,
  titleKey = key,
  subtitleKey = key
}) => ({
  key,
  scoreBand: key,
  score,
  passed,
  stars,
  visualVariant,
  titleKey,
  subtitleKey,
  primaryAction
});

export const classifyMissionResult = (
  evaluation = {}
) => {
  const isEvaluationObject =
    evaluation !== null &&
    typeof evaluation === "object" &&
    !Array.isArray(evaluation);

  const hasEvaluationContract =
    isEvaluationObject &&
    (
      typeof evaluation.isFinal ===
        "boolean" ||
      typeof evaluation.evaluationCompleted ===
        "boolean" ||
      typeof evaluation.status ===
        "string" ||
      evaluation.score !== null &&
        evaluation.score !== undefined
    );

  const score = clampScore(
    evaluation?.score
  );

  if (
    !hasEvaluationContract ||
    evaluation.isFallback === true ||
    evaluation.status === "unavailable"
  ) {
    return buildClassification({
      key: "unavailable",
      score,
      visualVariant: "neutral",
      primaryAction: "retry"
    });
  }

  if (
    evaluation.requiresReview === true ||
    evaluation.status === "manual_review"
  ) {
    return buildClassification({
      key: "review_required",
      score,
      visualVariant: "review",
      primaryAction: "back"
    });
  }

  if (
    evaluation.evaluationCompleted === false ||
    evaluation.isFinal !== true ||
    evaluation.status === "pending_evaluation"
  ) {
    return buildClassification({
      key: "pending",
      score,
      visualVariant: "info",
      primaryAction: "back"
    });
  }

  if (evaluation.passed !== true) {
    if (score >= 50) {
      return buildClassification({
        key: "developing",
        score,
        stars: 2,
        visualVariant: "warning",
        primaryAction: "retry"
      });
    }

    return buildClassification({
      key: "not_passed",
      score,
      stars: 1,
      visualVariant: "danger",
      primaryAction: "retry"
    });
  }

  if (
    score >=
    MISSION_SCORE_THRESHOLDS.excellent
  ) {
    return buildClassification({
      key: "excellent",
      score,
      passed: true,
      stars: 5,
      visualVariant: "excellent",
      primaryAction: "back"
    });
  }

  if (score >= MISSION_SCORE_THRESHOLDS.good) {
    return buildClassification({
      key: "good",
      score,
      passed: true,
      stars: 4,
      visualVariant: "positive",
      primaryAction: "back"
    });
  }

  return buildClassification({
    key: "passed",
    score,
    passed: true,
    stars: 3,
    visualVariant: "success",
    primaryAction: "back"
  });
};

export default {
  classifyMissionResult
};
