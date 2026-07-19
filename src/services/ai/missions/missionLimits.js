// src/services/ai/missions/missionLimits.js

/*
|--------------------------------------------------------------------------
| Mission AI Limits
|--------------------------------------------------------------------------
|
| Centralized configuration for all AI conversation limits.
| These values are intentionally independent from the UI so they can be
| reused by MissionPlayer, missionAiService, Cloud Functions and future
| backend services.
|
*/

export const MISSION_LIMITS = Object.freeze({
  conversation: {
    /*
     * Maximum number of conversation messages (user + NPC)
     * that will be sent to Gemini.
     */
    maxHistoryMessages: 30,

    /*
     * If the history grows beyond this amount,
     * only the newest messages are kept.
     */
    keepLatestMessages: 20,

    /*
     * Maximum user messages accepted during one mission.
     */
    maxUserReplies: 20,

    /*
     * Minimum meaningful replies before the AI
     * is even allowed to consider completion.
     */
    minimumMeaningfulReplies: 5
  },

  message: {
    /*
     * Maximum characters accepted from the student
     * in a single message.
     */
    maxCharacters: 1200,

    /*
     * Maximum words accepted from the student.
     */
    maxWords: 220,

    /*
     * Minimum words required to consider a reply
     * potentially meaningful.
     */
    minimumWords: 2
  },

  prompt: {
    /*
     * Maximum conversation characters inserted
     * into a Gemini prompt.
     */
    maxConversationCharacters: 12000,

    /*
     * Maximum scenario size.
     */
    maxScenarioCharacters: 2500,

    /*
     * Maximum AI instructions size.
     */
    maxInstructionsCharacters: 2500
  },

  evaluation: {
    /*
     * Maximum number of strengths returned.
     */
    maxStrengths: 5,

    /*
     * Maximum number of improvements returned.
     */
    maxImprovements: 5,

    /*
     * Maximum grammar tips.
     */
    maxGrammarTips: 5,

    /*
     * Maximum vocabulary entries.
     */
    maxVocabulary: 8,

    /*
     * Maximum corrections.
     */
    maxCorrections: 8,

    /*
     * Maximum next steps.
     */
    maxNextSteps: 5,

    /*
     * Maximum objectives evaluated.
     */
    maxObjectives: 10
  },

  retries: {
    /*
     * Gemini retries.
     */
    maxAttempts: 3,

    /*
     * Delay multiplier.
     */
    retryDelayMs: 800
  },

  personalizedMission: {
    minimumReplies: 5,

    maximumReplies: 10,

    defaultReplies: 6
  }
});

/*
|--------------------------------------------------------------------------
| Utility helpers
|--------------------------------------------------------------------------
*/

export const limitArray = (
  array = [],
  max = 10
) => {
  if (!Array.isArray(array)) {
    return [];
  }

  return array.slice(0, max);
};

export const limitString = (
  text = "",
  maxCharacters = 1000
) => {
  if (typeof text !== "string") {
    return "";
  }

  return text.substring(0, maxCharacters);
};

export const trimConversationHistory = (
  conversation = []
) => {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation.slice(
    -MISSION_LIMITS.conversation.keepLatestMessages
  );
};

export const countWords = (
  text = ""
) => {
  if (!text?.trim()) {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

export const isMeaningfulLength = (
  text = ""
) => {
  return (
    countWords(text) >=
    MISSION_LIMITS.message.minimumWords
  );
};

export default MISSION_LIMITS;