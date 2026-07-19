// src/services/ai/missions/personalization/missionPersonalizationNormalizer.js

import {
  PERSONALIZATION_COMPLEXITIES,
  PERSONALIZATION_CONVERSATION_TYPES,
  PERSONALIZATION_LENGTHS,
  PERSONALIZATION_LEVELS,
  PERSONALIZATION_NPC_STYLES,
  getPersonalizationLengthConfiguration
} from "./missionPersonalizationBuilder";

/*
|--------------------------------------------------------------------------
| Normalization limits
|--------------------------------------------------------------------------
*/

const NORMALIZATION_LIMITS =
  Object.freeze({
    titleCharacters: 180,
    descriptionCharacters: 800,
    scenarioCharacters: 3000,
    goalCharacters: 1000,
    aiRoleCharacters: 200,

    objectiveCharacters: 300,
    maximumObjectives: 8,

    instructionCharacters: 1500,
    successCriterionCharacters: 400,
    maximumSuccessCriteria: 8,

    maximumTags: 20,
    tagCharacters: 80,

    minimumMinutes: 3,
    maximumMinutes: 30,

    minimumReplies: 3,
    maximumReplies: 15,

    minimumXp: 0,
    maximumXp: 50
  });

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const isPlainObject = (
  value
) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(
      0,
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

const normalizeNumber = (
  value,
  {
    fallback = 0,
    minimum = 0,
    maximum =
      Number.MAX_SAFE_INTEGER
  } = {}
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.round(
        numericValue
      )
    )
  );
};

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;
};

const normalizeAllowedValue = ({
  value,
  allowedValues,
  fallback,
  preserveCase = false
}) => {
  const normalizedValue =
    normalizeSingleLineText(
      value,
      100
    );

  const matchedValue =
    allowedValues.find(
      (allowedValue) =>
        allowedValue.toLowerCase() ===
        normalizedValue.toLowerCase()
    );

  if (!matchedValue) {
    return fallback;
  }

  return preserveCase
    ? matchedValue
    : matchedValue.toLowerCase();
};

const createPersonalizedMissionId =
  () => {
    const randomPart =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `custom_${Date.now()}_${randomPart}`;
  };

/*
|--------------------------------------------------------------------------
| Objective normalization
|--------------------------------------------------------------------------
*/

const normalizeObjective = (
  objective,
  index
) => {
  if (
    typeof objective === "string"
  ) {
    const text =
      normalizeSingleLineText(
        objective,
        NORMALIZATION_LIMITS
          .objectiveCharacters
      );

    return text
      ? {
          id:
            `objective_${index + 1}`,

          text,

          required: true
        }
      : null;
  }

  if (!isPlainObject(objective)) {
    return null;
  }

  const text =
    normalizeSingleLineText(
      objective.text ||
        objective.title ||
        objective.objective,
      NORMALIZATION_LIMITS
        .objectiveCharacters
    );

  if (!text) {
    return null;
  }

  return {
    id:
      normalizeSingleLineText(
        objective.id,
        100
      ) ||
      `objective_${index + 1}`,

    text,

    required:
      objective.required !==
      false
  };
};

const normalizeObjectives = (
  objectives = []
) => {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return objectives
    .map(
      (
        objective,
        index
      ) =>
        normalizeObjective(
          objective,
          index
        )
    )
    .filter(Boolean)
    .slice(
      0,
      NORMALIZATION_LIMITS
        .maximumObjectives
    );
};

/*
|--------------------------------------------------------------------------
| Briefing normalization
|--------------------------------------------------------------------------
*/

const normalizeSuccessCriteria = (
  criteria = []
) => {
  if (!Array.isArray(criteria)) {
    return [];
  }

  return criteria
    .map((criterion) =>
      normalizeSingleLineText(
        typeof criterion ===
          "string"
          ? criterion
          : criterion?.text ||
            criterion?.criterion,
        NORMALIZATION_LIMITS
          .successCriterionCharacters
      )
    )
    .filter(Boolean)
    .slice(
      0,
      NORMALIZATION_LIMITS
        .maximumSuccessCriteria
    );
};

const normalizeBriefing = ({
  briefing = {},
  objectives = [],
  request = {}
}) => {
  const sourceBriefing =
    isPlainObject(briefing)
      ? briefing
      : {};

  const studentInstructions =
    normalizeText(
      sourceBriefing
        .studentInstructions ||
        sourceBriefing.instructions,
      NORMALIZATION_LIMITS
        .instructionCharacters
    ) ||
    "Przeczytaj scenariusz, pozostań w swojej roli i spróbuj zrealizować wszystkie cele rozmowy.";

  const providedCriteria =
    normalizeSuccessCriteria(
      sourceBriefing
        .successCriteria
    );

  const derivedCriteria =
    providedCriteria.length >
    0
      ? providedCriteria
      : objectives.map(
          (objective) =>
            `Zrealizuj cel: ${objective.text}`
        );

  return {
    studentInstructions,

    successCriteria:
      derivedCriteria.slice(
        0,
        NORMALIZATION_LIMITS
          .maximumSuccessCriteria
      ),

    conversationType:
      request.conversationType ||
      "role_play",

    npcStyle:
      request.npcStyle ||
      "adaptive",

    complexity:
      request.complexity ||
      "adaptive"
  };
};

/*
|--------------------------------------------------------------------------
| Tag normalization
|--------------------------------------------------------------------------
*/

const normalizeTags = (
  tags = []
) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) =>
          normalizeSingleLineText(
            tag,
            NORMALIZATION_LIMITS
              .tagCharacters
          ).toLowerCase()
        )
        .filter(Boolean)
    )
  ).slice(
    0,
    NORMALIZATION_LIMITS
      .maximumTags
  );
};

/*
|--------------------------------------------------------------------------
| Main mission normalizer
|--------------------------------------------------------------------------
*/

export const normalizeGeneratedPersonalizedMission =
  ({
    rawMission = {},
    request = {},
    topic = null
  } = {}) => {
    const sourceMission =
      isPlainObject(rawMission)
        ? rawMission
        : {};

    const requestTopic =
      isPlainObject(
        request.topic
      )
        ? request.topic
        : isPlainObject(topic)
          ? topic
          : {};

    const missionLength =
      normalizeAllowedValue({
        value:
          sourceMission
            .missionLength ||
          request.missionLength,

        allowedValues:
          PERSONALIZATION_LENGTHS,

        fallback:
          "adaptive"
      });

    const lengthConfiguration =
      getPersonalizationLengthConfiguration(
        missionLength
      );

    const level =
      normalizeAllowedValue({
        value:
          sourceMission.level ||
          request.level,

        allowedValues:
          PERSONALIZATION_LEVELS,

        fallback:
          "Adaptive",

        preserveCase: true
      });

    const conversationType =
      normalizeAllowedValue({
        value:
          sourceMission
            .conversationType ||
          request.conversationType,

        allowedValues:
          PERSONALIZATION_CONVERSATION_TYPES,

        fallback:
          "role_play"
      });

    const npcStyle =
      normalizeAllowedValue({
        value:
          sourceMission.npcStyle ||
          request.npcStyle,

        allowedValues:
          PERSONALIZATION_NPC_STYLES,

        fallback:
          "adaptive"
      });

    const complexity =
      normalizeAllowedValue({
        value:
          sourceMission.complexity ||
          sourceMission.difficulty ||
          request.complexity,

        allowedValues:
          PERSONALIZATION_COMPLEXITIES,

        fallback:
          "adaptive"
      });

    const requestObjectives =
      normalizeObjectives(
        request.objectives
      );

    const generatedObjectives =
      normalizeObjectives(
        sourceMission.objectives
      );

    const objectives =
      requestObjectives.length >
      0
        ? requestObjectives
        : generatedObjectives;

    const fallbackGoal =
      normalizeText(
        request.goal,
        NORMALIZATION_LIMITS
          .goalCharacters
      );

    const fallbackSituation =
      normalizeText(
        request.situation,
        NORMALIZATION_LIMITS
          .scenarioCharacters
      );

    const now =
      new Date().toISOString();

    return {
      id:
        normalizeSingleLineText(
          sourceMission.id,
          150
        ) ||
        createPersonalizedMissionId(),

      title:
        normalizeSingleLineText(
          sourceMission.title,
          NORMALIZATION_LIMITS
            .titleCharacters
        ) ||
        "Spersonalizowana misja konwersacyjna",

      description:
        normalizeText(
          sourceMission.description,
          NORMALIZATION_LIMITS
            .descriptionCharacters
        ) ||
        "Przećwicz realistyczną rozmowę dopasowaną do Twojej sytuacji i celu.",

      scenario:
        normalizeText(
          sourceMission.scenario,
          NORMALIZATION_LIMITS
            .scenarioCharacters
        ) ||
        fallbackSituation,

      goal:
        normalizeText(
          sourceMission.goal,
          NORMALIZATION_LIMITS
            .goalCharacters
        ) ||
        fallbackGoal,

      aiRole:
        normalizeSingleLineText(
          sourceMission.aiRole ||
          request.aiRole,
          NORMALIZATION_LIMITS
            .aiRoleCharacters
        ) ||
        "Conversation partner",

      level,

      difficulty:
        complexity,

      complexity,

      conversationType,

      npcStyle,

      missionLength,

      estimatedMinutes:
        normalizeNumber(
          sourceMission
            .estimatedMinutes ??
            request
              .estimatedMinutes,
          {
            fallback:
              lengthConfiguration
                .estimatedMinutes,

            minimum:
              NORMALIZATION_LIMITS
                .minimumMinutes,

            maximum:
              NORMALIZATION_LIMITS
                .maximumMinutes
          }
        ),

      minReplies:
        normalizeNumber(
          sourceMission.minReplies ??
            request.minReplies,
          {
            fallback:
              lengthConfiguration
                .minReplies,

            minimum:
              NORMALIZATION_LIMITS
                .minimumReplies,

            maximum:
              NORMALIZATION_LIMITS
                .maximumReplies
          }
        ),

      targetTurns:
        normalizeNumber(
          sourceMission.targetTurns ??
            request.targetTurns,
          {
            fallback:
              lengthConfiguration
                .targetTurns,

            minimum: 3,
            maximum: 20
          }
        ),

      /*
       * Personalized missions do not award XP in the current policy.
       */
      xpReward: 0,

      objectives,

      briefing:
        normalizeBriefing({
          briefing:
            sourceMission.briefing,

          objectives,

          request: {
            conversationType,
            npcStyle,
            complexity
          }
        }),

      vocabularyFocus:
        normalizeSingleLineText(
          sourceMission
            .vocabularyFocus ||
          request.vocabularyFocus ||
          "no_preference",
          100
        ),

      customVocabularyFocus:
        normalizeSingleLineText(
          request
            .customVocabularyFocus,
          300
        ),

      grammarFocus:
        normalizeSingleLineText(
          sourceMission
            .grammarFocus ||
          request.grammarFocus ||
          "no_preference",
          100
        ),

      customGrammarFocus:
        normalizeSingleLineText(
          request
            .customGrammarFocus,
          300
        ),

      tags:
        normalizeTags([
          ...(
            Array.isArray(
              sourceMission.tags
            )
              ? sourceMission.tags
              : []
          ),

          requestTopic.title,
          conversationType,
          npcStyle,
          level
        ]),

      topicId:
        normalizeSingleLineText(
          requestTopic.topicId ||
            requestTopic.id,
          150
        ),

      topicTitle:
        normalizeSingleLineText(
          requestTopic.title ||
            requestTopic.titulo ||
            "General",
          180
        ),

      topicIcon:
        normalizeSingleLineText(
          requestTopic.icon ||
            "🎯",
          30
        ),

      missionType:
        "conversation",

      type:
        "conversation",

      source:
        "student_generated",

      status:
        "custom",

      isCustom: true,

      isCustomMission: true,

      isPublished: false,

      featured: false,

      locked: false,

      feedbackMode:
        "after_mission",

      correctionMode:
        "delayed",

      allowPolishSupport:
        request.allowPolishSupport !==
        false,

      requireObjectiveReview:
        request.requireObjectiveReview !==
        false,

      runtimeValidation: {
        status:
          "normalized",

        requiresReview:
          false
      },

      createdAt: now,
      updatedAt: now
    };
  };

/*
|--------------------------------------------------------------------------
| Mission completeness
|--------------------------------------------------------------------------
*/

export const validateNormalizedPersonalizedMission =
  (
    mission = {}
  ) => {
    const errors = [];

    if (
      !normalizeSingleLineText(
        mission.title
      )
    ) {
      errors.push(
        "missing_title"
      );
    }

    if (
      !normalizeText(
        mission.scenario
      )
    ) {
      errors.push(
        "missing_scenario"
      );
    }

    if (
      !normalizeText(
        mission.goal
      )
    ) {
      errors.push(
        "missing_goal"
      );
    }

    if (
      !normalizeSingleLineText(
        mission.aiRole
      )
    ) {
      errors.push(
        "missing_ai_role"
      );
    }

    if (
      !Array.isArray(
        mission.objectives
      ) ||
      mission.objectives.length ===
        0
    ) {
      errors.push(
        "missing_objectives"
      );
    }

    return {
      isValid:
        errors.length === 0,

      errors
    };
  };

export default {
  normalizeGeneratedPersonalizedMission,
  validateNormalizedPersonalizedMission
};