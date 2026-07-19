// src/services/ai/missions/missionFallbacks.js

import {
  countWords,
  limitArray,
  limitString
} from "./missionLimits";

import {
  getMissionAiRole,
  getMissionLevel,
  getMissionTitle,
  getUserMessages
} from "./missionContext";

/*
|--------------------------------------------------------------------------
| Fallback status constants
|--------------------------------------------------------------------------
*/

export const MISSION_FALLBACK_STATUS = Object.freeze({
  unavailable: "unavailable",
  pendingEvaluation: "pending_evaluation",
  retryRequired: "retry_required"
});

export const MISSION_FALLBACK_PROVIDER =
  "local_fallback";

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return limitString(
    String(value || "")
      .normalize("NFKC")
      .trim(),
    maximumLength
  );
};

const normalizeError = (
  error
) => {
  return {
    code:
      normalizeText(
        error?.code ||
          error?.name ||
          "MISSION_AI_UNAVAILABLE",
        100
      ) ||
      "MISSION_AI_UNAVAILABLE",

    message:
      normalizeText(
        error instanceof Error
          ? error.message
          : error,
        500
      ) ||
      "Mission AI service is currently unavailable.",

    retryable:
      error?.retryable !== false
  };
};

const buildConversationMetrics = (
  conversation = []
) => {
  const userMessages =
    getUserMessages(
      conversation
    );

  const combinedUserText =
    userMessages
      .map(
        (message) =>
          message.text || ""
      )
      .join(" ");

  return {
    totalMessages:
      userMessages.length,

    totalWords:
      countWords(
        combinedUserText
      )
  };
};

/*
|--------------------------------------------------------------------------
| Opening fallback
|--------------------------------------------------------------------------
|
| This fallback does not attempt to simulate complex AI reasoning.
| It only provides a safe, short opening based on the configured NPC role.
|
*/

export const buildLocalFallbackOpening = ({
  mission = {}
} = {}) => {
  const npcRole =
    getMissionAiRole(
      mission
    );

  const missionTitle =
    getMissionTitle(
      mission
    );

  const level =
    getMissionLevel({
      mission
    });

  const role =
    npcRole.toLowerCase();

  if (
    role.includes("waiter") ||
    role.includes("server")
  ) {
    return "Hello! Welcome. What would you like to order?";
  }

  if (
    role.includes("receptionist")
  ) {
    return "Hello! How can I help you today?";
  }

  if (
    role.includes("doctor")
  ) {
    return "Hello. How are you feeling today?";
  }

  if (
    role.includes("teacher")
  ) {
    return "Hello! Are you ready to begin?";
  }

  if (
    role.includes("interviewer")
  ) {
    return "Hello. Thank you for coming today. Could you introduce yourself?";
  }

  if (
    role.includes("manager") ||
    role.includes("team leader")
  ) {
    return "Hello. Let’s discuss the situation. Can you tell me your plan?";
  }

  if (
    role.includes("customer")
  ) {
    return "Hello. I need some help, please.";
  }

  if (
    role.includes("police")
  ) {
    return "Hello. Please explain what happened.";
  }

  if (
    role.includes("friend")
  ) {
    return "Hi! It’s good to see you. How are you?";
  }

  if (
    level === "A1" ||
    level === "A2"
  ) {
    return "Hello! Let’s begin. What would you like to say?";
  }

  return `Hello. Let’s begin the mission: ${missionTitle}.`;
};

/*
|--------------------------------------------------------------------------
| Conversation reply fallback
|--------------------------------------------------------------------------
|
| An intermediate fallback must not pretend to understand the student's
| latest message. It informs the student that the connection failed and
| allows a safe retry.
|
*/

export const buildLocalFallbackReply = ({
  mission = {},
  retryable = true
} = {}) => {
  const npcRole =
    getMissionAiRole(
      mission
    );

  return {
    status:
      MISSION_FALLBACK_STATUS
        .retryRequired,

    provider:
      MISSION_FALLBACK_PROVIDER,

    isFallback: true,

    retryable,

    message:
      retryable
        ? "I’m sorry, I couldn’t continue the conversation right now. Please try sending your message again."
        : "I’m sorry, the conversation service is currently unavailable. Please return to this mission later.",

    npcRole,

    shouldAppendToConversation:
      false,

    shouldAwardProgress:
      false
  };
};

/*
|--------------------------------------------------------------------------
| Mission state fallback
|--------------------------------------------------------------------------
|
| If semantic analysis is unavailable, the platform must never assume that
| the mission can be completed.
|
*/

export const buildLocalFallbackMissionState = ({
  conversation = [],
  error = null
} = {}) => {
  const metrics =
    buildConversationMetrics(
      conversation
    );

  return {
    status:
      MISSION_FALLBACK_STATUS
        .unavailable,

    provider:
      MISSION_FALLBACK_PROVIDER,

    isFallback: true,

    isFinal: false,

    canComplete: false,

    progressScore: 0,

    meaningfulReplies: 0,

    offTopicReplies: 0,

    nonsenseReplies: 0,

    goalProgress: "unknown",

    reason:
      "Mission completion could not be verified because the AI analysis service is unavailable.",

    nextRequiredAction:
      "Spróbuj ponownie za chwilę. Twoja rozmowa nie została uznana za zakończoną.",

    confidence: 0,

    requiresReview: true,

    totalMessages:
      metrics.totalMessages,

    totalWords:
      metrics.totalWords,

    error:
      normalizeError(error)
  };
};

/*
|--------------------------------------------------------------------------
| Evaluation fallback
|--------------------------------------------------------------------------
|
| Important:
| - Never passes the mission.
| - Never grants XP.
| - Never invents corrections or objective completion.
| - Preserves useful local metrics only.
|
*/

export const buildLocalFallbackFeedback = ({
  conversation = [],
  mission = {},
  error = null
} = {}) => {
  const metrics =
    buildConversationMetrics(
      conversation
    );

  const missionLevel =
    getMissionLevel({
      mission
    });

  return {
    status:
      MISSION_FALLBACK_STATUS
        .pendingEvaluation,

    provider:
      MISSION_FALLBACK_PROVIDER,

    isFallback: true,

    isFinal: false,

    passed: false,

    score: null,

    stars: 0,

    xpMultiplier: 0,

    xpAwarded: 0,

    suggestedLevel:
      missionLevel,

    totalMessages:
      metrics.totalMessages,

    totalWords:
      metrics.totalWords,

    objectivesCompleted: [],

    strengths: [],

    improvements:
      limitArray(
        [
          "Ocena nie została zakończona z powodu chwilowej niedostępności usługi AI.",
          "Twoja rozmowa może zostać oceniona ponownie po przywróceniu połączenia."
        ],
        2
      ),

    corrections: [],

    vocabulary: [],

    grammarTips: [],

    nextSteps:
      limitArray(
        [
          "Spróbuj ponownie ocenić misję za chwilę.",
          "Nie rozpoczynaj nowej próby, jeśli chcesz zachować obecną rozmowę."
        ],
        2
      ),

    feedbackPolish:
      "Nie udało się teraz przeprowadzić wiarygodnej oceny. Rozmowa została zachowana, ale wynik, gwiazdki i XP nie są jeszcze ostateczne.",

    confidence: 0,

    requiresReview: true,

    retryable:
      error?.retryable !== false,

    evaluatedAt:
      new Date().toISOString(),

    error:
      normalizeError(error)
  };
};

/*
|--------------------------------------------------------------------------
| Personalized mission fallback
|--------------------------------------------------------------------------
|
| Personalized missions require semantic generation. A local fallback must
| not create an official mission from arbitrary student text.
|
*/

export const buildPersonalizedMissionFailure = ({
  topic = {},
  formData = {},
  error = null
} = {}) => {
  return {
    status:
      MISSION_FALLBACK_STATUS
        .retryRequired,

    provider:
      MISSION_FALLBACK_PROVIDER,

    isFallback: true,

    isFinal: false,

    missionCreated: false,

    retryable:
      error?.retryable !== false,

    topicId:
      normalizeText(
        topic?.id,
        150
      ),

    topicTitle:
      normalizeText(
        topic?.title ||
          topic?.titulo ||
          "General",
        150
      ),

    requestedLevel:
      normalizeText(
        formData?.level ||
          "Adaptive",
        20
      ),

    messagePolish:
      "Nie udało się utworzyć spersonalizowanej misji. Sprawdź połączenie i spróbuj ponownie.",

    error:
      normalizeError(error)
  };
};

/*
|--------------------------------------------------------------------------
| Result guards
|--------------------------------------------------------------------------
*/

export const isFallbackMissionResult = (
  result
) => {
  return (
    result?.isFallback === true ||
    result?.provider ===
      MISSION_FALLBACK_PROVIDER
  );
};

export const canAwardMissionXp = (
  evaluation
) => {
  return (
    evaluation?.isFinal === true &&
    evaluation?.passed === true &&
    evaluation?.requiresReview !==
      true &&
    Number(
      evaluation?.xpMultiplier
    ) > 0
  );
};

export const canPersistMissionCompletion = (
  evaluation
) => {
  return (
    evaluation?.isFinal === true &&
    evaluation?.passed === true &&
    evaluation?.requiresReview !==
      true
  );
};

export default {
  MISSION_FALLBACK_STATUS,
  MISSION_FALLBACK_PROVIDER,

  buildLocalFallbackOpening,
  buildLocalFallbackReply,
  buildLocalFallbackMissionState,
  buildLocalFallbackFeedback,
  buildPersonalizedMissionFailure,

  isFallbackMissionResult,
  canAwardMissionXp,
  canPersistMissionCompletion
};