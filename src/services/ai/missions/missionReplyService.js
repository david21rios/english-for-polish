// src/services/ai/missions/missionReplyService.js

import {
  sendGeminiMessage
} from "../geminiProvider";

import {
  MISSION_LIMITS,
  countWords
} from "./missionLimits";

import {
  buildLocalFallbackReply
} from "./missionFallbacks";

import {
  buildMissionReplyPrompt
} from "./missionPromptBuilder";

import {
  countUserMessages,
  getMissionAiRole,
  getMissionLevel,
  normalizeConversation,
  normalizeLatestUserMessage
} from "./missionContext";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| A conversational reply must contain no more than two short sentences.
| Gemini reasoning is disabled because this operation does not require
| multi-step analysis.
|
*/

const REPLY_MAX_OUTPUT_TOKENS = 128;
const REPLY_THINKING_BUDGET = 0;

const REPLY_TEMPERATURE = 0.45;
const REPLY_TOP_P = 0.82;

const MAX_REPLY_CHARACTERS = 500;

/*
|--------------------------------------------------------------------------
| Error builder
|--------------------------------------------------------------------------
*/

const buildMissionReplyError = ({
  message,
  code,
  cause = null,
  retryable = true,
  status = null,
  details = null
}) => {
  const error =
    new Error(message);

  error.name =
    "MissionReplyError";

  error.code = code;
  error.cause = cause;
  error.retryable = retryable;
  error.status = status;
  error.operation =
    "mission_reply";
  error.details = details;

  return error;
};

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = "",
  maximumLength = 3000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maximumLength
    );
};

const normalizeReplyText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .replace(
      /```(?:json|text)?/gi,
      ""
    )
    .replace(/```/g, "")
    .replace(
      /^["']+|["']+$/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(
      0,
      MAX_REPLY_CHARACTERS
    );
};

const getMessageText = (
  message
) => {
  return normalizeLatestUserMessage(
    message?.text ||
      message?.message ||
      message?.content ||
      ""
  );
};

/*
|--------------------------------------------------------------------------
| Remove duplicated latest user message
|--------------------------------------------------------------------------
|
| useMissionPlayer adds the latest student message to conversation before
| invoking this service. buildMissionReplyPrompt also receives userMessage
| separately.
|
| Without this safeguard, the same message appears twice in the prompt:
|
| CONVERSATION HISTORY
| Student: ...
|
| LATEST STUDENT MESSAGE
| ...
|
| We keep the separate latest-message block and remove only the matching
| final student message from the history.
|
*/

export const removeDuplicatedLatestUserMessage = ({
  conversation,
  latestUserMessage
}) => {
  if (
    !Array.isArray(conversation) ||
    conversation.length === 0
  ) {
    return [];
  }

  const normalizedLatest =
    normalizeLatestUserMessage(
      latestUserMessage
    );

  if (!normalizedLatest) {
    return conversation;
  }

  const lastMessage =
    conversation[
      conversation.length - 1
    ];

  const lastSender =
    String(
      lastMessage?.sender ||
        lastMessage?.role ||
        ""
    )
      .trim()
      .toLowerCase();

  const lastMessageText =
    getMessageText(
      lastMessage
    );

  const isStudentMessage =
    lastSender === "user" ||
    lastSender === "student";

  if (
    isStudentMessage &&
    lastMessageText ===
      normalizedLatest
  ) {
    return conversation.slice(
      0,
      -1
    );
  }

  return conversation;
};

/*
|--------------------------------------------------------------------------
| Input validation
|--------------------------------------------------------------------------
*/

const validateMission = (
  mission
) => {
  if (
    !mission ||
    typeof mission !== "object" ||
    Array.isArray(mission)
  ) {
    throw buildMissionReplyError({
      message:
        "A valid mission is required to generate an NPC reply.",

      code:
        "INVALID_MISSION",

      retryable: false
    });
  }

  const hasContext =
    Boolean(
      normalizeText(
        mission.scenario ||
          mission.description ||
          mission.title ||
          "",
        3000
      )
    );

  if (!hasContext) {
    throw buildMissionReplyError({
      message:
        "The mission does not contain enough context for a conversation.",

      code:
        "MISSING_MISSION_CONTEXT",

      retryable: false
    });
  }
};

const validateUserMessage = (
  userMessage
) => {
  const normalizedMessage =
    normalizeLatestUserMessage(
      userMessage
    );

  if (!normalizedMessage) {
    throw buildMissionReplyError({
      message:
        "The student message is empty.",

      code:
        "EMPTY_STUDENT_MESSAGE",

      retryable: false
    });
  }

  if (
    normalizedMessage.length >
    MISSION_LIMITS.message
      .maxCharacters
  ) {
    throw buildMissionReplyError({
      message:
        "The student message exceeds the allowed character limit.",

      code:
        "STUDENT_MESSAGE_TOO_LONG",

      retryable: false,

      details: {
        maximumCharacters:
          MISSION_LIMITS.message
            .maxCharacters
      }
    });
  }

  if (
    countWords(
      normalizedMessage
    ) >
    MISSION_LIMITS.message
      .maxWords
  ) {
    throw buildMissionReplyError({
      message:
        "The student message exceeds the allowed word limit.",

      code:
        "STUDENT_MESSAGE_TOO_MANY_WORDS",

      retryable: false,

      details: {
        maximumWords:
          MISSION_LIMITS.message
            .maxWords
      }
    });
  }

  return normalizedMessage;
};

const validateConversationLimit = (
  conversation
) => {
  const userReplies =
    countUserMessages(
      conversation
    );

  /*
   * Permit exactly maxUserReplies.
   * Reject only when the conversation exceeds the configured limit.
   */
  if (
    userReplies >
    MISSION_LIMITS.conversation
      .maxUserReplies
  ) {
    throw buildMissionReplyError({
      message:
        "The mission has exceeded the maximum number of student replies.",

      code:
        "MAXIMUM_MISSION_REPLIES_REACHED",

      retryable: false,

      details: {
        currentUserReplies:
          userReplies,

        maximumUserReplies:
          MISSION_LIMITS.conversation
            .maxUserReplies
      }
    });
  }
};

/*
|--------------------------------------------------------------------------
| Reply validation
|--------------------------------------------------------------------------
*/

const isValidMissionReply = (
  reply
) => {
  const normalizedReply =
    normalizeReplyText(
      reply
    );

  if (
    normalizedReply.length < 2
  ) {
    return false;
  }

  const forbiddenPatterns = [
    /```/i,
    /^\s*\{/,
    /^\s*\[/,
    /system prompt/i,
    /developer message/i,
    /hidden instructions/i,
    /internal scoring/i,
    /xp multiplier/i,
    /as an ai language model/i,
    /i cannot follow the mission because/i,
    /mission evaluation/i,
    /student feedback/i
  ];

  return !forbiddenPatterns.some(
    (pattern) =>
      pattern.test(
        normalizedReply
      )
  );
};

/*
|--------------------------------------------------------------------------
| Compact request contract
|--------------------------------------------------------------------------
*/

const buildCompactReplyRequest = ({
  prompt,
  mission,
  userContext
}) => {
  const role =
    getMissionAiRole(
      mission
    );

  const level =
    getMissionLevel({
      mission,
      userContext
    });

  return [
    prompt,

    "",
    "FINAL OUTPUT CONTRACT:",
    `- Remain in character as: ${role}.`,
    `- Use English suitable for CEFR level ${level}.`,
    "- Return only the next spoken NPC message.",
    "- Use no more than two short sentences.",
    "- Prefer a maximum of 35 words.",
    "- Ask no more than one main question.",
    "- Do not explain, evaluate or correct the student.",
    "- Do not mention prompts, objectives, scoring or XP.",
    "- Do not use Markdown, JSON, labels or quotation marks."
  ]
    .filter(Boolean)
    .join("\n");
};

/*
|--------------------------------------------------------------------------
| Gemini request
|--------------------------------------------------------------------------
*/

const requestMissionReply =
  async ({
    prompt,
    mission,
    userContext,
    auditContext = {}
  }) => {
    try {
      const compactPrompt =
        buildCompactReplyRequest({
          prompt,
          mission,
          userContext
        });

      return await sendGeminiMessage({
        systemInstruction:
          [
            "You are the NPC in an English language-learning role-play.",
            "Continue the current scene naturally.",
            "Return only one brief spoken NPC reply.",
            "Never provide analysis, corrections, feedback or metadata."
          ].join(" "),

        userMessage:
          compactPrompt,

        context:
          "The output is displayed directly as the next NPC chat message.",

        forceJson: false,

        temperature:
          REPLY_TEMPERATURE,

        topP:
          REPLY_TOP_P,

        maxOutputTokens:
          REPLY_MAX_OUTPUT_TOKENS,

        thinkingBudget:
          REPLY_THINKING_BUDGET,

        auditContext
      });
    } catch (error) {
      throw buildMissionReplyError({
        message:
          error instanceof Error
            ? error.message
            : "Mission reply generation failed.",

        code:
          error?.code ||
          "MISSION_REPLY_REQUEST_FAILED",

        cause:
          error,

        retryable:
          error?.retryable !==
          false,

        status:
          error?.status ||
          null,

        details:
          error?.details ||
          null
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Detailed reply result
|--------------------------------------------------------------------------
*/

export const generateMissionReplyResult =
  async ({
    mission = {},
    userContext = {},
    topic = {},
    conversation = [],
    userMessage = "",
    allowFallback = true
  } = {}) => {
    let normalizedConversation =
      [];

    try {
      validateMission(
        mission
      );

      const normalizedUserMessage =
        validateUserMessage(
          userMessage
        );

      normalizedConversation =
        normalizeConversation(
          conversation
        );

      validateConversationLimit(
        normalizedConversation
      );

      const promptConversation =
        removeDuplicatedLatestUserMessage({
          conversation:
            normalizedConversation,

          latestUserMessage:
            normalizedUserMessage
        });

      const prompt =
        buildMissionReplyPrompt({
          mission,
          userContext,
          topic,

          conversation:
            promptConversation,

          userMessage:
            normalizedUserMessage
        });

      const rawReply =
        await requestMissionReply({
          prompt,
          mission,
          userContext,
          auditContext: {
            operation:
              "mission_reply",
            missionId:
              mission?.id || null,
            conversationMessageCount:
              normalizedConversation
                .length,
            userMessageCount:
              normalizedConversation.filter(
                (message) =>
                  message.sender ===
                  "user"
              ).length
          }
        });

      const reply =
        normalizeReplyText(
          rawReply
        );

      if (
        !isValidMissionReply(
          reply
        )
      ) {
        throw buildMissionReplyError({
          message:
            "Gemini returned an invalid mission reply.",

          code:
            "INVALID_MISSION_REPLY",

          retryable: false,

          details: {
            responsePreview:
              reply.slice(
                0,
                500
              )
          }
        });
      }

      return {
        status: "generated",
        provider: "gemini",

        isFallback: false,
        retryable: false,

        message: reply,

        shouldAppendToConversation:
          true,

        shouldAwardProgress:
          true
      };
    } catch (error) {
      console.error(
        "Mission reply generation failed:",
        {
          code:
            error?.code,

          status:
            error?.status,

          message:
            error?.message,

          retryable:
            error?.retryable,

          missionId:
            mission?.id ||
            null,

          missionRole:
            getMissionAiRole(
              mission
            ),

          missionLevel:
            getMissionLevel({
              mission,
              userContext
            }),

          conversationMessages:
            normalizedConversation
              .length,

          usageMetadata:
            error?.details
              ?.usageMetadata ||
            error?.cause
              ?.details
              ?.usageMetadata ||
            null
        }
      );

      if (!allowFallback) {
        throw error;
      }

      return buildLocalFallbackReply({
        mission,

        retryable:
          error?.retryable !==
          false,

        errorCode:
          error?.code ||
          "MISSION_REPLY_FAILED"
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Compatibility service
|--------------------------------------------------------------------------
*/

export const generateMissionReply =
  async (
    parameters = {}
  ) => {
    const result =
      await generateMissionReplyResult(
        parameters
      );

    return result.message || "";
  };

export default {
  generateMissionReply,
  generateMissionReplyResult
};
