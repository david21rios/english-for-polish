// src/services/ai/missions/personalization/missionPersonalizationBuilder.js

/*
|--------------------------------------------------------------------------
| Supported personalization options
|--------------------------------------------------------------------------
|
| These values form the stable contract between:
|
| - PersonalizedMissionPage;
| - missionPersonalizationValidator;
| - missionPersonalizationService;
| - prompt builder;
| - generated mission preview.
|
*/

export const PERSONALIZATION_CONVERSATION_TYPES =
  Object.freeze([
    "role_play",
    "job_interview",
    "discussion",
    "negotiation",
    "presentation",
    "phone_call",
    "customer_service",
    "exam_preparation",
    "free_conversation"
  ]);

export const PERSONALIZATION_NPC_STYLES =
  Object.freeze([
    "friendly",
    "professional",
    "supportive",
    "neutral",
    "serious",
    "strict",
    "impatient",
    "demanding",
    "humorous",
    "adaptive"
  ]);

export const PERSONALIZATION_COMPLEXITIES =
  Object.freeze([
    "easy",
    "normal",
    "challenging",
    "adaptive"
  ]);

export const PERSONALIZATION_LENGTHS =
  Object.freeze([
    "short",
    "medium",
    "long",
    "adaptive"
  ]);

export const PERSONALIZATION_VOCABULARY_FOCUSES =
  Object.freeze([
    "no_preference",
    "daily_life",
    "travel",
    "business",
    "job_interview",
    "academic",
    "technology",
    "customer_service",
    "medical",
    "social",
    "custom"
  ]);

export const PERSONALIZATION_GRAMMAR_FOCUSES =
  Object.freeze([
    "no_preference",
    "present_simple",
    "past_tenses",
    "future_forms",
    "questions",
    "prepositions",
    "modal_verbs",
    "conditionals",
    "passive_voice",
    "reported_speech",
    "custom"
  ]);

export const PERSONALIZATION_LEVELS =
  Object.freeze([
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "Adaptive"
  ]);

/*
|--------------------------------------------------------------------------
| Internal limits
|--------------------------------------------------------------------------
*/

const BUILDER_LIMITS =
  Object.freeze({
    situationCharacters: 3000,
    goalCharacters: 1000,
    aiRoleCharacters: 200,
    customVocabularyCharacters: 300,
    customGrammarCharacters: 300,
    additionalInstructionsCharacters: 1000,
    objectiveCharacters: 300,
    maximumObjectives: 8
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

const normalizeOption = ({
  value,
  allowedValues,
  fallback
}) => {
  const normalizedValue =
    normalizeSingleLineText(
      value,
      100
    );

  return allowedValues.includes(
    normalizedValue
  )
    ? normalizedValue
    : fallback;
};

const normalizeLevel = (
  value
) => {
  const normalizedValue =
    normalizeSingleLineText(
      value,
      20
    );

  const exactLevel =
    PERSONALIZATION_LEVELS.find(
      (level) =>
        level.toLowerCase() ===
        normalizedValue.toLowerCase()
    );

  return exactLevel ||
    "Adaptive";
};

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
        BUILDER_LIMITS
          .objectiveCharacters
      );

    return text
      ? {
          id:
            `objective_${index + 1}`,

          text,

          required: true,

          source: "student"
        }
      : null;
  }

  if (
    !isPlainObject(objective)
  ) {
    return null;
  }

  const text =
    normalizeSingleLineText(
      objective.text ||
        objective.title ||
        objective.objective,
      BUILDER_LIMITS
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
      false,

    source:
      normalizeSingleLineText(
        objective.source ||
          "student",
        50
      )
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
      BUILDER_LIMITS
        .maximumObjectives
    );
};

/*
|--------------------------------------------------------------------------
| Length configuration
|--------------------------------------------------------------------------
*/

const LENGTH_CONFIGURATION =
  Object.freeze({
    short: {
      estimatedMinutes: 5,
      minReplies: 4,
      targetTurns: 5
    },

    medium: {
      estimatedMinutes: 10,
      minReplies: 6,
      targetTurns: 8
    },

    long: {
      estimatedMinutes: 18,
      minReplies: 9,
      targetTurns: 12
    },

    adaptive: {
      estimatedMinutes: 10,
      minReplies: 6,
      targetTurns: 8
    }
  });

export const getPersonalizationLengthConfiguration = (
  missionLength
) => {
  const normalizedLength =
    normalizeOption({
      value:
        missionLength,

      allowedValues:
        PERSONALIZATION_LENGTHS,

      fallback:
        "adaptive"
    });

  return {
    missionLength:
      normalizedLength,

    ...LENGTH_CONFIGURATION[
      normalizedLength
    ]
  };
};

/*
|--------------------------------------------------------------------------
| Topic normalization
|--------------------------------------------------------------------------
*/

export const buildPersonalizationTopicContext = (
  topic = {}
) => {
  const topicId =
    normalizeSingleLineText(
      topic.id ||
        topic.topicId,
      150
    );

  return {
    id:
      topicId,

    topicId,

    title:
      normalizeSingleLineText(
        topic.title ||
          topic.titulo ||
          "General",
        180
      ),

    description:
      normalizeText(
        topic.description ||
          topic.descripcion,
        1000
      ),

    icon:
      normalizeSingleLineText(
        topic.icon ||
          "🎯",
        30
      ),

    level:
      normalizeLevel(
        topic.level ||
          "Adaptive"
      ),

    tags:
      Array.isArray(
        topic.tags
      )
        ? topic.tags
            .map((tag) =>
              normalizeSingleLineText(
                tag,
                100
              )
            )
            .filter(Boolean)
            .slice(0, 20)
        : []
  };
};

/*
|--------------------------------------------------------------------------
| Main request builder
|--------------------------------------------------------------------------
|
| This function converts raw UI data into a predictable, bounded and safe
| object. It does not call Gemini and does not decide whether the request is
| valid. Validation belongs to missionPersonalizationValidator.js.
|
*/

export const buildMissionPersonalizationRequest =
  ({
    topic = {},
    formData = {},
    existingObjectives = []
  } = {}) => {
    const normalizedTopic =
      buildPersonalizationTopicContext(
        topic
      );

    const missionLength =
      normalizeOption({
        value:
          formData.missionLength,

        allowedValues:
          PERSONALIZATION_LENGTHS,

        fallback:
          "adaptive"
      });

    const lengthConfiguration =
      getPersonalizationLengthConfiguration(
        missionLength
      );

    const vocabularyFocus =
      normalizeOption({
        value:
          formData.vocabularyFocus,

        allowedValues:
          PERSONALIZATION_VOCABULARY_FOCUSES,

        fallback:
          "no_preference"
      });

    const grammarFocus =
      normalizeOption({
        value:
          formData.grammarFocus,

        allowedValues:
          PERSONALIZATION_GRAMMAR_FOCUSES,

        fallback:
          "no_preference"
      });

    return {
      version: "1.0.0",

      topic:
        normalizedTopic,

      situation:
        normalizeText(
          formData.situation,
          BUILDER_LIMITS
            .situationCharacters
        ),

      goal:
        normalizeText(
          formData.goal,
          BUILDER_LIMITS
            .goalCharacters
        ),

      aiRole:
        normalizeSingleLineText(
          formData.aiRole,
          BUILDER_LIMITS
            .aiRoleCharacters
        ),

      level:
        normalizeLevel(
          formData.level
        ),

      conversationType:
        normalizeOption({
          value:
            formData.conversationType,

          allowedValues:
            PERSONALIZATION_CONVERSATION_TYPES,

          fallback:
            "role_play"
        }),

      npcStyle:
        normalizeOption({
          value:
            formData.npcStyle,

          allowedValues:
            PERSONALIZATION_NPC_STYLES,

          fallback:
            "adaptive"
        }),

      complexity:
        normalizeOption({
          value:
            formData.complexity,

          allowedValues:
            PERSONALIZATION_COMPLEXITIES,

          fallback:
            "adaptive"
        }),

      missionLength,

      estimatedMinutes:
        lengthConfiguration
          .estimatedMinutes,

      minReplies:
        lengthConfiguration
          .minReplies,

      targetTurns:
        lengthConfiguration
          .targetTurns,

      vocabularyFocus,

      customVocabularyFocus:
        vocabularyFocus ===
        "custom"
          ? normalizeSingleLineText(
              formData
                .customVocabularyFocus,
              BUILDER_LIMITS
                .customVocabularyCharacters
            )
          : "",

      grammarFocus,

      customGrammarFocus:
        grammarFocus ===
        "custom"
          ? normalizeSingleLineText(
              formData
                .customGrammarFocus,
              BUILDER_LIMITS
                .customGrammarCharacters
            )
          : "",

      objectives:
        normalizeObjectives(
          existingObjectives.length >
            0
            ? existingObjectives
            : formData.objectives
        ),

      allowPolishSupport:
        formData.allowPolishSupport !==
        false,

      requireObjectiveReview:
        formData.requireObjectiveReview !==
        false,

      additionalInstructions:
        normalizeText(
          formData.additionalInstructions,
          BUILDER_LIMITS
            .additionalInstructionsCharacters
        ),

      metadata: {
        source:
          "personalized_mission_builder",

        language:
          "English",

        supportLanguage:
          "Polish",

        generatedAt:
          new Date().toISOString()
      }
    };
  };

/*
|--------------------------------------------------------------------------
| Prompt-facing context
|--------------------------------------------------------------------------
|
| This returns only the fields necessary for AI generation.
| UI-only or implementation-only values are excluded.
|
*/

export const buildMissionPersonalizationPromptContext =
  (
    request = {}
  ) => {
    const topic =
      isPlainObject(
        request.topic
      )
        ? request.topic
        : {};

    return {
      topicId:
        normalizeSingleLineText(
          topic.topicId ||
            topic.id,
          150
        ),

      topicTitle:
        normalizeSingleLineText(
          topic.title ||
            "General",
          180
        ),

      topicDescription:
        normalizeText(
          topic.description,
          1000
        ),

      situation:
        normalizeText(
          request.situation,
          BUILDER_LIMITS
            .situationCharacters
        ),

      goal:
        normalizeText(
          request.goal,
          BUILDER_LIMITS
            .goalCharacters
        ),

      aiRole:
        normalizeSingleLineText(
          request.aiRole,
          BUILDER_LIMITS
            .aiRoleCharacters
        ),

      level:
        normalizeLevel(
          request.level
        ),

      conversationType:
        normalizeOption({
          value:
            request.conversationType,

          allowedValues:
            PERSONALIZATION_CONVERSATION_TYPES,

          fallback:
            "role_play"
        }),

      npcStyle:
        normalizeOption({
          value:
            request.npcStyle,

          allowedValues:
            PERSONALIZATION_NPC_STYLES,

          fallback:
            "adaptive"
        }),

      complexity:
        normalizeOption({
          value:
            request.complexity,

          allowedValues:
            PERSONALIZATION_COMPLEXITIES,

          fallback:
            "adaptive"
        }),

      missionLength:
        normalizeOption({
          value:
            request.missionLength,

          allowedValues:
            PERSONALIZATION_LENGTHS,

          fallback:
            "adaptive"
        }),

      estimatedMinutes:
        Number(
          request.estimatedMinutes
        ) || 10,

      minReplies:
        Number(
          request.minReplies
        ) || 6,

      targetTurns:
        Number(
          request.targetTurns
        ) || 8,

      vocabularyFocus:
        normalizeSingleLineText(
          request.vocabularyFocus,
          100
        ),

      customVocabularyFocus:
        normalizeSingleLineText(
          request.customVocabularyFocus,
          300
        ),

      grammarFocus:
        normalizeSingleLineText(
          request.grammarFocus,
          100
        ),

      customGrammarFocus:
        normalizeSingleLineText(
          request.customGrammarFocus,
          300
        ),

      objectives:
        normalizeObjectives(
          request.objectives
        ),

      allowPolishSupport:
        request.allowPolishSupport !==
        false,

      additionalInstructions:
        normalizeText(
          request.additionalInstructions,
          BUILDER_LIMITS
            .additionalInstructionsCharacters
        )
    };
  };

export default {
  PERSONALIZATION_CONVERSATION_TYPES,
  PERSONALIZATION_NPC_STYLES,
  PERSONALIZATION_COMPLEXITIES,
  PERSONALIZATION_LENGTHS,
  PERSONALIZATION_VOCABULARY_FOCUSES,
  PERSONALIZATION_GRAMMAR_FOCUSES,
  PERSONALIZATION_LEVELS,

  getPersonalizationLengthConfiguration,
  buildPersonalizationTopicContext,
  buildMissionPersonalizationRequest,
  buildMissionPersonalizationPromptContext
};