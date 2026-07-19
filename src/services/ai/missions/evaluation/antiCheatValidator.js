// src/services/ai/missions/evaluation/antiCheatValidator.js

import {
  MISSION_INTEGRITY_PENALTIES,
  MISSION_MAX_TOTAL_PENALTY
} from "./evaluationConstants";

import {
  countWords
} from "../missionLimits";

import {
  getUserMessages
} from "../missionContext";

/*
|--------------------------------------------------------------------------
| Detection configuration
|--------------------------------------------------------------------------
*/

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(the\s+)?system\s+prompt/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /show\s+(me\s+)?your\s+instructions/i,
  /developer\s+message/i,
  /hidden\s+instructions/i,
  /act\s+as\s+(an?\s+)?administrator/i,
  /mark\s+(the\s+)?mission\s+as\s+complete/i,
  /give\s+me\s+(the\s+)?maximum\s+(score|xp)/i,
  /do\s+not\s+follow\s+the\s+mission/i
];

const MINIMAL_REPLY_PATTERNS = [
  /^(yes|no|ok|okay|fine|good|please|thanks|thank you)[.!?]*$/i,
  /^(i want|i need|i like)[.!?]*$/i
];

/*
|--------------------------------------------------------------------------
| Generic normalization
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

const calculateRatio = (
  numerator,
  denominator
) => {
  if (
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return 0;
  }

  return numerator / denominator;
};

const createPenalty = ({
  code,
  points,
  severity = "medium",
  evidence = []
}) => {
  return {
    code,
    points:
      Math.max(
        0,
        Math.round(
          Number(points) || 0
        )
      ),

    severity,

    evidence:
      Array.isArray(evidence)
        ? evidence.slice(0, 5)
        : []
  };
};

/*
|--------------------------------------------------------------------------
| Repetition detection
|--------------------------------------------------------------------------
*/

const detectRepeatedMessages = (
  userMessages
) => {
  const frequencyMap =
    new Map();

  userMessages.forEach(
    (message) => {
      const comparableText =
        normalizeComparableText(
          message.text
        );

      if (!comparableText) {
        return;
      }

      frequencyMap.set(
        comparableText,
        (
          frequencyMap.get(
            comparableText
          ) || 0
        ) + 1
      );
    }
  );

  const repeatedEntries =
    Array.from(
      frequencyMap.entries()
    ).filter(
      ([, count]) =>
        count >= 2
    );

  const excessiveEntries =
    repeatedEntries.filter(
      ([, count]) =>
        count >= 3
    );

  return {
    repeatedEntries,
    excessiveEntries
  };
};

/*
|--------------------------------------------------------------------------
| Minimal and split-message detection
|--------------------------------------------------------------------------
*/

const isMinimalReply = (
  text = ""
) => {
  const normalizedText =
    String(text || "").trim();

  if (!normalizedText) {
    return true;
  }

  if (
    countWords(normalizedText) <= 1
  ) {
    return true;
  }

  return MINIMAL_REPLY_PATTERNS.some(
    (pattern) =>
      pattern.test(
        normalizedText
      )
  );
};

const detectArtificialMessageSplitting = (
  userMessages
) => {
  if (
    userMessages.length < 4
  ) {
    return false;
  }

  const recentMessages =
    userMessages.slice(-6);

  const veryShortMessages =
    recentMessages.filter(
      (message) =>
        countWords(
          message.text
        ) <= 2
    );

  return (
    veryShortMessages.length >= 4
  );
};

/*
|--------------------------------------------------------------------------
| Prompt-injection detection
|--------------------------------------------------------------------------
*/

const detectPromptInjection = (
  userMessages
) => {
  const matches = [];

  userMessages.forEach(
    (message) => {
      const matchingPattern =
        PROMPT_INJECTION_PATTERNS.find(
          (pattern) =>
            pattern.test(
              message.text || ""
            )
        );

      if (matchingPattern) {
        matches.push(
          String(
            message.text || ""
          ).slice(0, 200)
        );
      }
    }
  );

  return matches;
};

/*
|--------------------------------------------------------------------------
| Main integrity analysis
|--------------------------------------------------------------------------
*/

export const analyzeMissionIntegrity = ({
  conversation = [],
  missionState = {},
  externalSignals = {}
} = {}) => {
  const userMessages =
    getUserMessages(
      conversation
    );

  const totalUserMessages =
    userMessages.length;

  const {
    repeatedEntries,
    excessiveEntries
  } =
    detectRepeatedMessages(
      userMessages
    );

  const minimalReplies =
    userMessages.filter(
      (message) =>
        isMinimalReply(
          message.text
        )
    );

  const promptInjectionMatches =
    detectPromptInjection(
      userMessages
    );

  const artificialMessageSplitting =
    detectArtificialMessageSplitting(
      userMessages
    );

  const offTopicReplies =
    Math.max(
      0,
      Number(
        missionState.offTopicReplies ??
        externalSignals.offTopicReplies
      ) || 0
    );

  const nonsenseReplies =
    Math.max(
      0,
      Number(
        missionState.nonsenseReplies ??
        externalSignals.nonsenseReplies
      ) || 0
    );

  const copiedContent =
    externalSignals.copiedContent ===
      true ||
    externalSignals
      .copiedOrRepeated === true;

  const unsupportedLanguage =
    externalSignals
      .unsupportedLanguage === true ||
    externalSignals
      .containsUnsupportedLanguage ===
      true;

  const offTopicRatio =
    calculateRatio(
      offTopicReplies,
      totalUserMessages
    );

  const nonsenseRatio =
    calculateRatio(
      nonsenseReplies,
      totalUserMessages
    );

  const minimalReplyRatio =
    calculateRatio(
      minimalReplies.length,
      totalUserMessages
    );

  const penalties = [];

  if (
    repeatedEntries.length > 0
  ) {
    penalties.push(
      createPenalty({
        code:
          "REPEATED_MESSAGES",

        points:
          MISSION_INTEGRITY_PENALTIES
            .repeatedMessages,

        severity: "low",

        evidence:
          repeatedEntries.map(
            ([text, count]) =>
              `${text} (${count}x)`
          )
      })
    );
  }

  if (
    excessiveEntries.length > 0
  ) {
    penalties.push(
      createPenalty({
        code:
          "EXCESSIVE_REPETITION",

        points:
          MISSION_INTEGRITY_PENALTIES
            .excessiveRepetition,

        severity: "high",

        evidence:
          excessiveEntries.map(
            ([text, count]) =>
              `${text} (${count}x)`
          )
      })
    );
  }

  if (offTopicRatio >= 0.2) {
    penalties.push(
      createPenalty({
        code:
          offTopicRatio >= 0.5
            ? "MOSTLY_OFF_TOPIC"
            : "OFF_TOPIC_CONTENT",

        points:
          offTopicRatio >= 0.5
            ? MISSION_INTEGRITY_PENALTIES
                .mostlyOffTopic
            : MISSION_INTEGRITY_PENALTIES
                .offTopicContent,

        severity:
          offTopicRatio >= 0.5
            ? "high"
            : "medium"
      })
    );
  }

  if (nonsenseRatio >= 0.15) {
    penalties.push(
      createPenalty({
        code:
          "NONSENSE_CONTENT",

        points:
          MISSION_INTEGRITY_PENALTIES
            .nonsenseContent,

        severity:
          nonsenseRatio >= 0.4
            ? "high"
            : "medium"
      })
    );
  }

  if (
    minimalReplyRatio >= 0.5 &&
    totalUserMessages >= 3
  ) {
    penalties.push(
      createPenalty({
        code:
          "EMPTY_OR_MINIMAL_REPLIES",

        points:
          MISSION_INTEGRITY_PENALTIES
            .emptyOrMinimalReplies,

        severity: "medium"
      })
    );
  }

  if (
    artificialMessageSplitting
  ) {
    penalties.push(
      createPenalty({
        code:
          "ARTIFICIAL_MESSAGE_SPLITTING",

        points:
          MISSION_INTEGRITY_PENALTIES
            .artificialMessageSplitting,

        severity: "medium"
      })
    );
  }

  if (
    promptInjectionMatches.length > 0
  ) {
    penalties.push(
      createPenalty({
        code:
          "PROMPT_INJECTION_ATTEMPT",

        points:
          MISSION_INTEGRITY_PENALTIES
            .promptInjection,

        severity: "high",

        evidence:
          promptInjectionMatches
      })
    );
  }

  if (copiedContent) {
    penalties.push(
      createPenalty({
        code:
          "COPIED_CONTENT",

        points:
          MISSION_INTEGRITY_PENALTIES
            .copiedContent,

        severity: "medium"
      })
    );
  }

  if (unsupportedLanguage) {
    penalties.push(
      createPenalty({
        code:
          "UNSUPPORTED_LANGUAGE",

        points:
          MISSION_INTEGRITY_PENALTIES
            .unsupportedLanguage,

        severity: "medium"
      })
    );
  }

  const totalPenalty =
    Math.min(
      MISSION_MAX_TOTAL_PENALTY,
      penalties.reduce(
        (total, penalty) =>
          total +
          penalty.points,
        0
      )
    );

  const severeIntegrityIssue =
    penalties.some(
      (penalty) =>
        penalty.severity ===
        "high"
    ) &&
    (
      promptInjectionMatches.length >
        0 ||
      excessiveEntries.length > 0 ||
      offTopicRatio >= 0.5 ||
      nonsenseRatio >= 0.4
    );

  return {
    totalUserMessages,

    repeatedMessages:
      repeatedEntries.length,

    excessiveRepetition:
      excessiveEntries.length > 0,

    minimalReplies:
      minimalReplies.length,

    minimalReplyRatio,

    artificialMessageSplitting,

    promptInjectionAttempts:
      promptInjectionMatches.length,

    copiedContent,

    unsupportedLanguage,

    offTopicReplies,

    offTopicRatio,

    nonsenseReplies,

    nonsenseRatio,

    mostlyOffTopic:
      offTopicRatio >= 0.5,

    mostlyMeaningless:
      nonsenseRatio >= 0.4 ||
      minimalReplyRatio >= 0.7,

    penalties,

    totalPenalty,

    severeIntegrityIssue,

    requiresReview:
      severeIntegrityIssue ||
      totalPenalty >= 30
  };
};

/*
|--------------------------------------------------------------------------
| Convenience helpers
|--------------------------------------------------------------------------
*/

export const hasSevereMissionIntegrityIssue = (
  integrityResult
) => {
  return (
    integrityResult
      ?.severeIntegrityIssue ===
    true
  );
};

export const shouldBlockMissionCompletionForIntegrity = (
  integrityResult
) => {
  return (
    integrityResult
      ?.severeIntegrityIssue ===
      true ||
    integrityResult
      ?.mostlyOffTopic === true ||
    integrityResult
      ?.mostlyMeaningless === true
  );
};

export default {
  analyzeMissionIntegrity,
  hasSevereMissionIntegrityIssue,
  shouldBlockMissionCompletionForIntegrity
};