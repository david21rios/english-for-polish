// src/components/topics/player/missionPlayerUtils.js

import {
  MISSION_LIMITS,
  countWords
} from "../../../services/ai/missions/missionLimits";

/*
|--------------------------------------------------------------------------
| Generic normalization
|--------------------------------------------------------------------------
*/

export const normalizePlayerText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
};

export const normalizeMissionMessage = (
  value = ""
) => {
  return normalizePlayerText(
    value
  ).slice(
    0,
    MISSION_LIMITS.message
      .maxCharacters
  );
};

export const createMissionMessageId = (
  sender = "message"
) => {
  const normalizedSender =
    normalizePlayerText(
      sender
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]/g,
        ""
      ) ||
    "message";

  const randomSuffix =
    Math.random()
      .toString(36)
      .slice(2, 9);

  return `${normalizedSender}-${Date.now()}-${randomSuffix}`;
};

/*
|--------------------------------------------------------------------------
| Mission configuration
|--------------------------------------------------------------------------
*/

export const getMinimumMissionReplies = (
  mission = {}
) => {
  const configuredMinimum =
    Number(
      mission?.minReplies ??
        mission?.requiredReplies
    );

  const fallbackMinimum =
    MISSION_LIMITS.conversation
      .minimumMeaningfulReplies;

  if (
    !Number.isFinite(
      configuredMinimum
    ) ||
    configuredMinimum <= 0
  ) {
    return fallbackMinimum;
  }

  return Math.max(
    fallbackMinimum,
    Math.min(
      MISSION_LIMITS.conversation
        .maxUserReplies,
      Math.round(
        configuredMinimum
      )
    )
  );
};

/*
|--------------------------------------------------------------------------
| Conversation helpers
|--------------------------------------------------------------------------
*/

export const getPlayerUserMessages = (
  messages = []
) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.filter(
    (item) =>
      String(
        item?.sender || ""
      )
        .trim()
        .toLowerCase() ===
      "user"
  );
};

export const countPlayerUserMessages = (
  messages = []
) => {
  return getPlayerUserMessages(
    messages
  ).length;
};

export const buildMissionFullAnswer = (
  messages = []
) => {
  return getPlayerUserMessages(
    messages
  )
    .map((item) =>
      normalizePlayerText(
        item?.text
      )
    )
    .filter(Boolean)
    .join("\n");
};

export const getRemainingMissionReplies = ({
  messages = [],
  minimumReplies = 0
} = {}) => {
  return Math.max(
    Number(minimumReplies) -
      countPlayerUserMessages(
        messages
      ),
    0
  );
};

export const calculateLocalMissionProgress =
  ({
    messages = [],
    minimumReplies = 0
  } = {}) => {
    const userMessagesCount =
      countPlayerUserMessages(
        messages
      );

    const normalizedMinimum =
      Math.max(
        1,
        Number(
          minimumReplies
        ) || 1
      );

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (
            userMessagesCount /
            normalizedMinimum
          ) *
            100
        )
      )
    );
  };

/*
|--------------------------------------------------------------------------
| Duplicate and low-quality detection
|--------------------------------------------------------------------------
*/

const normalizeComparableMessage = (
  value = ""
) => {
  return normalizePlayerText(
    value
  ).toLocaleLowerCase(
    "en-US"
  );
};

const isRepeatedCharacterSequence = (
  text = ""
) => {
  const compactText =
    String(text || "")
      .replace(/\s+/g, "");

  if (
    compactText.length < 6
  ) {
    return false;
  }

  return /^(.{1,3})\1{2,}$/i.test(
    compactText
  );
};

const hasEnoughAlphabeticContent = (
  text = ""
) => {
  const alphabeticCharacters =
    String(text || "").match(
      /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g
    ) || [];

  return (
    alphabeticCharacters.length >=
    6
  );
};

const isDuplicateUserMessage = ({
  text = "",
  messages = []
} = {}) => {
  const normalizedText =
    normalizeComparableMessage(
      text
    );

  if (!normalizedText) {
    return false;
  }

  return getPlayerUserMessages(
    messages
  ).some(
    (item) =>
      normalizeComparableMessage(
        item?.text
      ) === normalizedText
  );
};

/*
|--------------------------------------------------------------------------
| Student-message validation
|--------------------------------------------------------------------------
|
| This is only a fast local validation.
| Semantic relevance is evaluated later by the mission AI controller.
|
*/

export const validateMissionUserMessage =
  ({
    text = "",
    messages = []
  } = {}) => {
    const cleanedText =
      normalizePlayerText(
        text
      );

    if (!cleanedText) {
      return {
        isValid: false,

        code:
          "EMPTY_MESSAGE",

        message:
          "Napisz odpowiedź przed jej wysłaniem."
      };
    }

    if (
      cleanedText.length >
      MISSION_LIMITS.message
        .maxCharacters
    ) {
      return {
        isValid: false,

        code:
          "MESSAGE_TOO_LONG",

        message:
          `Odpowiedź może zawierać maksymalnie ${
            MISSION_LIMITS.message
              .maxCharacters
          } znaków.`
      };
    }

    const wordCount =
      countWords(
        cleanedText
      );

    if (
      wordCount >
      MISSION_LIMITS.message
        .maxWords
    ) {
      return {
        isValid: false,

        code:
          "TOO_MANY_WORDS",

        message:
          `Odpowiedź może zawierać maksymalnie ${
            MISSION_LIMITS.message
              .maxWords
          } słów.`
      };
    }

    if (
      !hasEnoughAlphabeticContent(
        cleanedText
      )
    ) {
      return {
        isValid: false,

        code:
          "INSUFFICIENT_CONTENT",

        message:
          "Napisz pełniejszą i zrozumiałą odpowiedź po angielsku."
      };
    }

    if (
      isRepeatedCharacterSequence(
        cleanedText
      )
    ) {
      return {
        isValid: false,

        code:
          "REPEATED_CHARACTERS",

        message:
          "Odpowiedź wygląda na przypadkowy lub powtarzający się tekst."
      };
    }

    if (
      isDuplicateUserMessage({
        text:
          cleanedText,

        messages
      })
    ) {
      return {
        isValid: false,

        code:
          "DUPLICATE_MESSAGE",

        message:
          "Ta sama odpowiedź została już wysłana. Spróbuj rozwinąć rozmowę."
      };
    }

    /*
     * A1 students may legitimately use two-word replies.
     * We avoid requiring three or more words locally.
     */
    if (
      wordCount <
      MISSION_LIMITS.message
        .minimumWords
    ) {
      return {
        isValid: false,

        code:
          "TOO_FEW_WORDS",

        message:
          "Napisz nieco pełniejszą odpowiedź, używając co najmniej dwóch słów."
      };
    }

    return {
      isValid: true,

      code: "VALID",

      message: "",

      normalizedText:
        cleanedText,

      wordCount
    };
  };

/*
|--------------------------------------------------------------------------
| Evaluation helpers
|--------------------------------------------------------------------------
*/

export const isPendingMissionEvaluation = (
  evaluation
) => {
  return (
    evaluation?.isFinal !== true ||
    evaluation
      ?.requiresReview === true ||
    evaluation?.isFallback === true
  );
};

export const getMissionEvaluationMessage = (
  evaluation
) => {
  if (!evaluation) {
    return "";
  }

  if (
    evaluation?.isFallback ===
    true
  ) {
    return (
      evaluation
        ?.feedbackPolish ||
      "Ocena AI jest chwilowo niedostępna. Rozmowa nie została uznana za ukończoną."
    );
  }

  if (
    evaluation
      ?.requiresReview === true
  ) {
    return (
      evaluation
        ?.feedbackPolish ||
      "Ta rozmowa wymaga dodatkowej weryfikacji. XP nie zostały jeszcze przyznane."
    );
  }

  if (
    evaluation?.passed !== true
  ) {
    return (
      evaluation
        ?.completionEvaluation
        ?.nextRequiredAction ||
      evaluation
        ?.missionState
        ?.nextRequiredAction ||
      "Kontynuuj rozmowę i spróbuj lepiej zrealizować cele misji."
    );
  }

  return "";
};

export default {
  normalizePlayerText,
  normalizeMissionMessage,
  createMissionMessageId,
  getMinimumMissionReplies,
  getPlayerUserMessages,
  countPlayerUserMessages,
  buildMissionFullAnswer,
  getRemainingMissionReplies,
  calculateLocalMissionProgress,
  validateMissionUserMessage,
  isPendingMissionEvaluation,
  getMissionEvaluationMessage
};