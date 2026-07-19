// src/services/ai/missions/missionContext.js

import {
  MISSION_LIMITS,
  limitArray,
  limitString,
  trimConversationHistory
} from "./missionLimits";

/*
|--------------------------------------------------------------------------
| Allowed values
|--------------------------------------------------------------------------
*/

const VALID_CEFR_LEVELS = new Set([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Adaptive"
]);

const VALID_DIFFICULTIES = new Set([
  "easy",
  "medium",
  "hard",
  "adaptive"
]);

/*
|--------------------------------------------------------------------------
| Generic normalization
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

const normalizeSingleLineText = (
  value = "",
  maximumLength = 1000
) => {
  return normalizeText(
    value,
    maximumLength
  ).replace(/\s+/g, " ");
};

const normalizeMultilineText = (
  value = "",
  maximumLength = 1000
) => {
  return normalizeText(
    value,
    maximumLength
  )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
};

const normalizePositiveInteger = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isInteger(numericValue) ||
    numericValue < 0
  ) {
    return fallback;
  }

  return numericValue;
};

/*
|--------------------------------------------------------------------------
| Mission properties
|--------------------------------------------------------------------------
*/

export const getMissionLevel = ({
  mission = {},
  userContext = {}
} = {}) => {
  const requestedLevel =
    normalizeSingleLineText(
      mission.level ||
        userContext.level ||
        "A1",
      20
    );

  if (
    VALID_CEFR_LEVELS.has(
      requestedLevel
    )
  ) {
    return requestedLevel;
  }

  const upperLevel =
    requestedLevel.toUpperCase();

  if (
    VALID_CEFR_LEVELS.has(
      upperLevel
    )
  ) {
    return upperLevel;
  }

  if (
    upperLevel === "ADAPTIVE"
  ) {
    return "Adaptive";
  }

  return "A1";
};

export const getMissionDifficulty = (
  mission = {}
) => {
  const difficulty =
    normalizeSingleLineText(
      mission.difficulty ||
        "adaptive",
      30
    ).toLowerCase();

  return VALID_DIFFICULTIES.has(
    difficulty
  )
    ? difficulty
    : "adaptive";
};

export const getMissionTitle = (
  mission = {}
) => {
  return (
    normalizeSingleLineText(
      mission.title,
      150
    ) ||
    "Conversation mission"
  );
};

export const getMissionDescription = (
  mission = {}
) => {
  return (
    normalizeMultilineText(
      mission.description,
      600
    ) ||
    "Practice a realistic conversation in English."
  );
};

export const getMissionScenario = ({
  mission = {},
  userContext = {}
} = {}) => {
  return (
    normalizeMultilineText(
      mission.scenario ||
        userContext.situation,
      MISSION_LIMITS.prompt
        .maxScenarioCharacters
    ) ||
    "A realistic everyday situation."
  );
};

export const getMissionGoal = ({
  mission = {},
  userContext = {}
} = {}) => {
  return (
    normalizeMultilineText(
      mission.goal ||
        userContext.goal,
      800
    ) ||
    "Complete the situation through meaningful communication."
  );
};

export const getMissionAiRole = (
  mission = {}
) => {
  return (
    normalizeSingleLineText(
      mission.aiRole,
      150
    ) ||
    "A realistic conversation partner"
  );
};

export const getMissionInstructions = (
  mission = {}
) => {
  return normalizeMultilineText(
    mission.aiInstructions,
    MISSION_LIMITS.prompt
      .maxInstructionsCharacters
  );
};

export const getTopicTitle = ({
  topic = {},
  userContext = {}
} = {}) => {
  return (
    normalizeSingleLineText(
      topic.title ||
        topic.titulo ||
        userContext.topicTitle,
      150
    ) ||
    "General"
  );
};

export const getMinimumMeaningfulReplies = (
  mission = {}
) => {
  const requestedMinimum =
    normalizePositiveInteger(
      mission.minReplies ??
        mission.requiredReplies,
      MISSION_LIMITS.conversation
        .minimumMeaningfulReplies
    );

  return Math.max(
    MISSION_LIMITS.conversation
      .minimumMeaningfulReplies,
    Math.min(
      MISSION_LIMITS.conversation
        .maxUserReplies,
      requestedMinimum
    )
  );
};

/*
|--------------------------------------------------------------------------
| Mission objectives
|--------------------------------------------------------------------------
*/

export const getObjectiveText = (
  objective
) => {
  if (
    typeof objective === "string"
  ) {
    return normalizeSingleLineText(
      objective,
      300
    );
  }

  if (
    !objective ||
    typeof objective !== "object"
  ) {
    return "";
  }

  return normalizeSingleLineText(
    objective.text ||
      objective.title ||
      objective.objective,
    300
  );
};

export const normalizeContextObjectives = (
  objectives = []
) => {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return limitArray(
    objectives
      .map(
        (
          objective,
          index
        ) => {
          const text =
            getObjectiveText(
              objective
            );

          if (!text) {
            return null;
          }

          return {
            id:
              normalizeSingleLineText(
                objective?.id,
                100
              ) ||
              `objective_${
                index + 1
              }`,

            text,

            required:
              typeof objective ===
              "object"
                ? objective.required !==
                  false
                : true
          };
        }
      )
      .filter(Boolean),
    MISSION_LIMITS.evaluation
      .maxObjectives
  );
};

export const buildObjectivesText = (
  objectives = []
) => {
  const normalizedObjectives =
    normalizeContextObjectives(
      objectives
    );

  if (
    normalizedObjectives.length ===
    0
  ) {
    return [
      "1. Keep the conversation relevant.",
      "2. Communicate naturally.",
      "3. Complete the situation."
    ].join("\n");
  }

  return normalizedObjectives
    .map(
      (
        objective,
        index
      ) => {
        const requirementLabel =
          objective.required
            ? "required"
            : "optional";

        return `${index + 1}. ${
          objective.text
        } (${requirementLabel})`;
      }
    )
    .join("\n");
};

/*
|--------------------------------------------------------------------------
| Conversation normalization
|--------------------------------------------------------------------------
*/

const normalizeConversationSender = (
  sender
) => {
  const normalizedSender =
    String(sender || "")
      .trim()
      .toLowerCase();

  if (
    normalizedSender === "user" ||
    normalizedSender === "student"
  ) {
    return "user";
  }

  return "ai";
};

const normalizeConversationMessage = (
  message = {},
  index = 0
) => {
  const text =
    normalizeMultilineText(
      message.text ||
        message.content ||
        message.message,
      MISSION_LIMITS.message
        .maxCharacters
    );

  if (!text) {
    return null;
  }

  return {
    id:
      normalizeSingleLineText(
        message.id,
        100
      ) ||
      `message_${index + 1}`,

    sender:
      normalizeConversationSender(
        message.sender ||
          message.role
      ),

    text
  };
};

export const normalizeConversation = (
  conversation = []
) => {
  if (
    !Array.isArray(
      conversation
    )
  ) {
    return [];
  }

  const normalizedConversation =
    conversation
      .map(
        (
          message,
          index
        ) =>
          normalizeConversationMessage(
            message,
            index
          )
      )
      .filter(Boolean);

  return trimConversationHistory(
    normalizedConversation
  );
};

export const getUserMessages = (
  conversation = []
) => {
  return normalizeConversation(
    conversation
  ).filter(
    (message) =>
      message.sender === "user"
  );
};

export const countUserMessages = (
  conversation = []
) => {
  return getUserMessages(
    conversation
  ).length;
};

export const buildConversationText = (
  conversation = []
) => {
  const normalizedConversation =
    normalizeConversation(
      conversation
    );

  const conversationText =
    normalizedConversation
      .map((message) => {
        const speaker =
          message.sender === "user"
            ? "Student"
            : "NPC";

        return [
          `<message sender="${speaker}">`,
          message.text,
          "</message>"
        ].join("\n");
      })
      .join("\n\n");

  return limitString(
    conversationText,
    MISSION_LIMITS.prompt
      .maxConversationCharacters
  );
};

export const normalizeLatestUserMessage = (
  userMessage = ""
) => {
  return normalizeMultilineText(
    userMessage,
    MISSION_LIMITS.message
      .maxCharacters
  );
};

/*
|--------------------------------------------------------------------------
| Prompt-injection delimiters
|--------------------------------------------------------------------------
*/

export const wrapUntrustedStudentContent = (
  content = ""
) => {
  const normalizedContent =
    normalizeMultilineText(
      content,
      MISSION_LIMITS.message
        .maxCharacters
    );

  return `
<untrusted_student_content>
${normalizedContent}
</untrusted_student_content>
  `.trim();
};

export const wrapConversationContent = (
  conversation = []
) => {
  return `
<untrusted_conversation_history>
${buildConversationText(
  conversation
)}
</untrusted_conversation_history>
  `.trim();
};

export const wrapMissionInstructions = (
  instructions = ""
) => {
  const normalizedInstructions =
    normalizeMultilineText(
      instructions,
      MISSION_LIMITS.prompt
        .maxInstructionsCharacters
    );

  if (!normalizedInstructions) {
    return "";
  }

  return `
<mission_specific_administrator_instructions>
${normalizedInstructions}
</mission_specific_administrator_instructions>
  `.trim();
};

/*
|--------------------------------------------------------------------------
| Main mission context
|--------------------------------------------------------------------------
*/

export const buildMissionContext = ({
  mission = {},
  userContext = {},
  topic = {}
} = {}) => {
  const missionLevel =
    getMissionLevel({
      mission,
      userContext
    });

  const missionInstructions =
    getMissionInstructions(
      mission
    );

  const objectives =
    normalizeContextObjectives(
      mission.objectives
    );

  return `
MISSION CONTEXT

Topic:
${getTopicTitle({
  topic,
  userContext
})}

Mission title:
${getMissionTitle(
  mission
)}

Mission description:
${getMissionDescription(
  mission
)}

Scenario:
${getMissionScenario({
  mission,
  userContext
})}

Goal:
${getMissionGoal({
  mission,
  userContext
})}

NPC role:
${getMissionAiRole(
  mission
)}

Student CEFR level:
${missionLevel}

Difficulty:
${getMissionDifficulty(
  mission
)}

Minimum meaningful replies:
${getMinimumMeaningfulReplies(
  mission
)}

Objectives:
${buildObjectivesText(
  objectives
)}

${
  missionInstructions
    ? wrapMissionInstructions(
        missionInstructions
      )
    : `Mission-specific administrator instructions:
Not provided. Follow the global mission rules and the scenario.`
}
  `.trim();
};

/*
|--------------------------------------------------------------------------
| Public mission snapshot
|--------------------------------------------------------------------------
|
| This structure can later be used when mission documents are separated
| into public data and private AI configuration.
|
*/

export const buildPublicMissionSnapshot = (
  mission = {}
) => {
  return {
    id:
      normalizeSingleLineText(
        mission.id,
        150
      ),

    title:
      getMissionTitle(
        mission
      ),

    description:
      getMissionDescription(
        mission
      ),

    scenario:
      getMissionScenario({
        mission
      }),

    goal:
      getMissionGoal({
        mission
      }),

    aiRole:
      getMissionAiRole(
        mission
      ),

    level:
      getMissionLevel({
        mission
      }),

    difficulty:
      getMissionDifficulty(
        mission
      ),

    minimumMeaningfulReplies:
      getMinimumMeaningfulReplies(
        mission
      ),

    objectives:
      normalizeContextObjectives(
        mission.objectives
      )
  };
};

/*
|--------------------------------------------------------------------------
| Private mission configuration snapshot
|--------------------------------------------------------------------------
|
| This prepares the future Firestore Mission Architecture V2.
|
*/

export const buildPrivateMissionConfigSnapshot = (
  mission = {}
) => {
  return {
    aiInstructions:
      getMissionInstructions(
        mission
      ),

    feedbackMode:
      normalizeSingleLineText(
        mission.feedbackMode ||
          "after_mission",
        50
      ),

    correctionMode:
      normalizeSingleLineText(
        mission.correctionMode ||
          "delayed",
        50
      ),

    debriefTemplate:
      mission.debriefTemplate &&
      typeof mission.debriefTemplate ===
        "object"
        ? mission.debriefTemplate
        : null
  };
};

export default {
  getMissionLevel,
  getMissionDifficulty,
  getMissionTitle,
  getMissionDescription,
  getMissionScenario,
  getMissionGoal,
  getMissionAiRole,
  getMissionInstructions,
  getTopicTitle,
  getMinimumMeaningfulReplies,
  getObjectiveText,
  normalizeContextObjectives,
  buildObjectivesText,
  normalizeConversation,
  getUserMessages,
  countUserMessages,
  buildConversationText,
  normalizeLatestUserMessage,
  wrapUntrustedStudentContent,
  wrapConversationContent,
  wrapMissionInstructions,
  buildMissionContext,
  buildPublicMissionSnapshot,
  buildPrivateMissionConfigSnapshot
};