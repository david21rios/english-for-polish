// src/services/ai/missions/evaluation/missionEvaluation.js

import {
  getMissionLevel
} from "../missionContext";

import {
  analyzeMissionIntegrity
} from "./antiCheatValidator";

import {
  evaluateCompletionEvidence,
  validateMissionCompletion
} from "./completionValidator";

import {
  MISSION_EVALUATION_STATUS
} from "./evaluationConstants";

import {
  normalizeMissionEvaluationInput,
  normalizeMissionStateInput
} from "./evaluationNormalizer";

import {
  evaluateMissionObjectives
} from "./objectiveEvaluator";

import {
  evaluateMissionReviewRequirement
} from "./reviewValidator";

import {
  calculateMissionScore
} from "./scoreCalculator";

import {
  getMissionStarResult
} from "./starsCalculator";

import {
  getMissionXpResult
} from "./xpCalculator";

/*
|--------------------------------------------------------------------------
| Status calculation
|--------------------------------------------------------------------------
*/

const getEvaluationStatus = ({
  isFinal,
  passed,
  requiresReview
}) => {
  if (requiresReview) {
    return MISSION_EVALUATION_STATUS
      .manualReview;
  }

  if (!isFinal) {
    return MISSION_EVALUATION_STATUS
      .pending;
  }

  if (!passed) {
    return MISSION_EVALUATION_STATUS
      .rejected;
  }

  return MISSION_EVALUATION_STATUS
    .evaluated;
};

/*
|--------------------------------------------------------------------------
| External signal merging
|--------------------------------------------------------------------------
*/

const mergeExternalIntegritySignals = (
  normalizedSignals = {},
  externalSignals = {}
) => {
  return {
    ...normalizedSignals,
    ...externalSignals,

    copiedContent:
      normalizedSignals
        .copiedContent === true ||
      externalSignals
        .copiedContent === true,

    unsupportedLanguage:
      normalizedSignals
        .unsupportedLanguage ===
        true ||
      externalSignals
        .unsupportedLanguage ===
        true,

    containsUnsupportedLanguage:
      normalizedSignals
        .containsNonEnglish ===
        true ||
      externalSignals
        .containsUnsupportedLanguage ===
        true,

    promptInjection:
      normalizedSignals
        .promptInjection === true ||
      externalSignals
        .promptInjection === true,

    excessiveRepetition:
      normalizedSignals
        .excessiveRepetition ===
        true ||
      externalSignals
        .excessiveRepetition ===
        true,

    meaninglessContent:
      normalizedSignals
        .meaninglessContent ===
        true ||
      externalSignals
        .meaninglessContent ===
        true,

    offTopic:
      normalizedSignals
        .offTopic === true ||
      externalSignals
        .offTopic === true
  };
};

/*
|--------------------------------------------------------------------------
| Main deterministic evaluation
|--------------------------------------------------------------------------
*/

export const buildMissionEvaluation =
  ({
    rawEvaluation = {},
    missionState = {},
    mission = {},
    conversation = [],
    externalSignals = {},
    repeatedCompletion = false,
    bonusMultiplier = 1
  } = {}) => {
    const level =
      getMissionLevel({
        mission
      });

    const normalizedEvaluation =
      normalizeMissionEvaluationInput({
        rawEvaluation,
        mission,
        conversation
      });

    const normalizedMissionState =
      normalizeMissionStateInput(
        missionState
      );

    const mergedIntegritySignals =
      mergeExternalIntegritySignals(
        normalizedEvaluation
          .integritySignals,
        externalSignals
      );

    const objectiveEvaluation =
      evaluateMissionObjectives({
        missionObjectives:
          mission.objectives,

        objectiveResults:
          normalizedEvaluation
            .objectivesCompleted,

        level
      });

    const integrityEvaluation =
      analyzeMissionIntegrity({
        conversation,

        /*
         * missionState remains available in the result for diagnostics, but
         * its semantic counters do not decide final approval.
         */
        missionState: {},

        externalSignals:
          mergedIntegritySignals
      });

    /*
     * Preliminary evidence is calculated before the final score so score
     * ceilings can be applied when evidence is insufficient.
     */
    const preliminaryEvidence =
      evaluateCompletionEvidence({
        level,

        missionState:
          normalizedMissionState,

        objectiveEvaluation,

        integrityEvaluation,

        totalMessages:
          normalizedEvaluation
            .totalMessages,

        totalWords:
          normalizedEvaluation
            .totalWords
      });

    const scoreEvaluation =
      calculateMissionScore({
        criteria:
          normalizedEvaluation
            .criteria,

        externalScore:
          normalizedEvaluation
            .externalScore,

        penalties:
          integrityEvaluation
            .penalties,

        goalAchieved:
          objectiveEvaluation
            .goalAchieved,

        sufficientEvidence:
          preliminaryEvidence
            .sufficientEvidence,

        mostlyOffTopic:
          integrityEvaluation
            .mostlyOffTopic,

        severeIntegrityIssue:
          integrityEvaluation
            .severeIntegrityIssue
      });

    const reviewEvaluation =
      evaluateMissionReviewRequirement({
        confidence:
          normalizedEvaluation
            .confidence,

        totalMessages:
          normalizedEvaluation
            .totalMessages,

        totalWords:
          normalizedEvaluation
            .totalWords,

        missionState:
          normalizedMissionState,

        objectiveEvaluation,

        integrityEvaluation,

        externalRequiresReview:
          normalizedEvaluation
            .requiresReview,

        aiUnavailable: false,

        invalidJson: false
      });

    const completionEvaluation =
      validateMissionCompletion({
        score:
          scoreEvaluation.score,

        level,

        missionState:
          normalizedMissionState,

        objectiveEvaluation,

        integrityEvaluation,

        reviewEvaluation,

        totalMessages:
          normalizedEvaluation
            .totalMessages,

        totalWords:
          normalizedEvaluation
            .totalWords,

        externalPassed:
          normalizedEvaluation
            .rawPassed
      });

    const evaluationCompleted =
      completionEvaluation
        .evaluationCompleted === true;

    const isFinal =
      completionEvaluation
        .isFinal === true;

    const passed =
      completionEvaluation
        .passed === true;

    const requiresReview =
      reviewEvaluation
        .requiresReview === true;

    const starResult =
      getMissionStarResult({
        score:
          scoreEvaluation.score,

        passed,

        isFinal,

        requiresReview,

        severeIntegrityIssue:
          integrityEvaluation
            .severeIntegrityIssue
      });

    const xpResult =
      getMissionXpResult({
        baseXp:
          mission.xpReward ??
          mission.xp ??
          10,

        score:
          scoreEvaluation.score,

        passed,

        isFinal,

        requiresReview,

        severeIntegrityIssue:
          integrityEvaluation
            .severeIntegrityIssue,

        repeatedCompletion,

        bonusMultiplier
      });

    const status =
      getEvaluationStatus({
        isFinal,
        passed,
        requiresReview
      });

    return {
      status,

      provider:
        normalizedEvaluation
          .provider,

      evaluationCompleted,

      isFinal,

      passed,

      requiresReview,

      score:
        scoreEvaluation.score,

      stars:
        starResult.stars,

      starLabel:
        starResult.label,

      starDescription:
        starResult.description,

      xpMultiplier:
        xpResult
          .performanceMultiplier,

      xpAwarded:
        xpResult.xpAwarded,

      xpReason:
        xpResult.reason,

      canAwardXp:
        xpResult.canAwardXp,

      suggestedLevel:
        normalizedEvaluation
          .suggestedLevel,

      levelAssessed:
        level,

      totalMessages:
        normalizedEvaluation
          .totalMessages,

      totalWords:
        normalizedEvaluation
          .totalWords,

      criteria:
        scoreEvaluation.criteria,

      criteriaScore:
        scoreEvaluation
          .criteriaScore,

      externalScore:
        scoreEvaluation
          .externalScore,

      blendedScore:
        scoreEvaluation
          .blendedScore,

      totalPenalty:
        scoreEvaluation
          .totalPenalty,

      appliedCeilings:
        scoreEvaluation
          .appliedCeilings,

      objectivesCompleted:
        objectiveEvaluation
          .objectives,

      objectiveEvaluation,

      integrityEvaluation,

      reviewEvaluation,

      completionEvaluation,

      missionState:
        normalizedMissionState,

      confidence:
        normalizedEvaluation
          .confidence,

      confidenceSource:
        normalizedEvaluation
          .confidenceSource,

      criteriaSource:
        normalizedEvaluation
          .criteriaSource,

      strengths:
        normalizedEvaluation
          .strengths,

      improvements:
        normalizedEvaluation
          .improvements,

      corrections:
        normalizedEvaluation
          .corrections,

      vocabulary:
        normalizedEvaluation
          .vocabulary,

      grammarTips:
        normalizedEvaluation
          .grammarTips,

      nextSteps:
        normalizedEvaluation
          .nextSteps,

      feedbackPolish:
        normalizedEvaluation
          .feedbackPolish,

      repeatedCompletion:
        Boolean(
          repeatedCompletion
        ),

      diagnostics: {
        rawPassed:
          normalizedEvaluation
            .rawPassed,

        rawStars:
          normalizedEvaluation
            .rawStars,

        rawXpMultiplier:
          normalizedEvaluation
            .rawXpMultiplier,

        externalPassedDisagreement:
          completionEvaluation
            .externalDisagreement,

        reportedTotalMessages:
          normalizedEvaluation
            .reportedTotalMessages,

        reportedTotalWords:
          normalizedEvaluation
            .reportedTotalWords,

        hasExplicitCriteria:
          normalizedEvaluation
            .hasExplicitCriteria
      },

      evaluatedAt:
        new Date().toISOString()
    };
  };

/*
|--------------------------------------------------------------------------
| Safe evaluation wrapper
|--------------------------------------------------------------------------
|
| This function does not manufacture a fallback grade. It returns an error
| descriptor that missionAiService can transform into pending evaluation.
|
*/

export const tryBuildMissionEvaluation =
  (
    parameters = {}
  ) => {
    try {
      return {
        success: true,

        evaluation:
          buildMissionEvaluation(
            parameters
          ),

        error: null
      };
    } catch (error) {
      return {
        success: false,

        evaluation: null,

        error: {
          code:
            error?.code ||
            "MISSION_EVALUATION_FAILED",

          message:
            error instanceof Error
              ? error.message
              : String(error),

          retryable:
            error?.retryable !==
            false
        }
      };
    }
  };

/*
|--------------------------------------------------------------------------
| Public helpers
|--------------------------------------------------------------------------
*/

export const isMissionEvaluationFinal = (
  evaluation
) => {
  return (
    evaluation?.isFinal ===
      true &&
    evaluation?.requiresReview !==
      true
  );
};

export const isMissionPassed = (
  evaluation
) => {
  return (
    isMissionEvaluationFinal(
      evaluation
    ) &&
    evaluation?.passed === true
  );
};

export const canPersistMissionEvaluation =
  (
    evaluation
  ) => {
    return (
      evaluation &&
      typeof evaluation ===
        "object" &&
      evaluation.status !==
        MISSION_EVALUATION_STATUS
          .unavailable
    );
  };

export default {
  buildMissionEvaluation,
  tryBuildMissionEvaluation,
  isMissionEvaluationFinal,
  isMissionPassed,
  canPersistMissionEvaluation
};
