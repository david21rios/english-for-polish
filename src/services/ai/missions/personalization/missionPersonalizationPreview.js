// src/services/ai/missions/personalization/missionPersonalizationPreview.js

import {
  PERSONALIZATION_COMPLEXITY_OPTIONS,
  PERSONALIZATION_CONVERSATION_TYPE_OPTIONS,
  PERSONALIZATION_GRAMMAR_OPTIONS,
  PERSONALIZATION_LENGTH_OPTIONS,
  PERSONALIZATION_LEVEL_OPTIONS,
  PERSONALIZATION_NPC_STYLE_OPTIONS,
  PERSONALIZATION_VOCABULARY_OPTIONS
} from "./missionPersonalizationDefaults";

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
  maximumLength = 2000
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

const getOption = (
  options,
  value
) => {
  if (!Array.isArray(options)) {
    return null;
  }

  return (
    options.find(
      (option) =>
        option.value === value
    ) ||
    null
  );
};

const getOptionLabel = (
  options,
  value,
  fallback = ""
) => {
  return (
    getOption(
      options,
      value
    )?.label ||
    fallback ||
    normalizeSingleLineText(
      value,
      100
    )
  );
};

const getOptionDescription = (
  options,
  value
) => {
  return (
    getOption(
      options,
      value
    )?.description ||
    ""
  );
};

/*
|--------------------------------------------------------------------------
| Objective normalization
|--------------------------------------------------------------------------
*/

const normalizePreviewObjective = (
  objective,
  index
) => {
  if (
    typeof objective ===
    "string"
  ) {
    const text =
      normalizeSingleLineText(
        objective,
        300
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
      300
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

const normalizePreviewObjectives = (
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
        normalizePreviewObjective(
          objective,
          index
        )
    )
    .filter(Boolean)
    .slice(0, 8);
};

/*
|--------------------------------------------------------------------------
| Success criteria normalization
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
        400
      )
    )
    .filter(Boolean)
    .slice(0, 8);
};

/*
|--------------------------------------------------------------------------
| Preview status
|--------------------------------------------------------------------------
*/

export const PERSONALIZATION_PREVIEW_STATUS =
  Object.freeze({
    ready: "ready",
    incomplete: "incomplete",
    invalid: "invalid"
  });

const getPreviewStatus = (
  mission
) => {
  if (!isPlainObject(mission)) {
    return {
      status:
        PERSONALIZATION_PREVIEW_STATUS
          .invalid,

      readyToStart: false,

      missingFields: [
        "mission"
      ]
    };
  }

  const missingFields = [];

  if (
    !normalizeSingleLineText(
      mission.title
    )
  ) {
    missingFields.push(
      "title"
    );
  }

  if (
    !normalizeText(
      mission.scenario
    )
  ) {
    missingFields.push(
      "scenario"
    );
  }

  if (
    !normalizeSingleLineText(
      mission.aiRole
    )
  ) {
    missingFields.push(
      "aiRole"
    );
  }

  if (
    normalizePreviewObjectives(
      mission.objectives
    ).length === 0
  ) {
    missingFields.push(
      "objectives"
    );
  }

  if (
    missingFields.length > 0
  ) {
    return {
      status:
        PERSONALIZATION_PREVIEW_STATUS
          .incomplete,

      readyToStart: false,

      missingFields
    };
  }

  return {
    status:
      PERSONALIZATION_PREVIEW_STATUS
        .ready,

    readyToStart: true,

    missingFields: []
  };
};

/*
|--------------------------------------------------------------------------
| Preview metric cards
|--------------------------------------------------------------------------
*/

const buildPreviewMetrics = (
  mission
) => {
  const estimatedMinutes =
    normalizeNumber(
      mission.estimatedMinutes,
      {
        fallback: 10,
        minimum: 1,
        maximum: 60
      }
    );

  const targetTurns =
    normalizeNumber(
      mission.targetTurns,
      {
        fallback: 8,
        minimum: 1,
        maximum: 30
      }
    );

  const minimumReplies =
    normalizeNumber(
      mission.minReplies,
      {
        fallback: 6,
        minimum: 1,
        maximum: 30
      }
    );

  return [
    {
      id: "level",

      label:
        "Poziom",

      value:
        getOptionLabel(
          PERSONALIZATION_LEVEL_OPTIONS,
          mission.level,
          mission.level ||
            "Adaptacyjny"
        ),

      helperText:
        getOptionDescription(
          PERSONALIZATION_LEVEL_OPTIONS,
          mission.level
        )
    },

    {
      id: "duration",

      label:
        "Czas",

      value:
        `${estimatedMinutes} min`,

      helperText:
        getOptionDescription(
          PERSONALIZATION_LENGTH_OPTIONS,
          mission.missionLength
        )
    },

    {
      id: "turns",

      label:
        "Przewidywane tury",

      value:
        String(targetTurns),

      helperText:
        `Minimum odpowiedzi studenta: ${minimumReplies}`
    },

    {
      id: "xp",

      label:
        "Punkty XP",

      value: "0 XP",

      helperText:
        "Misje personalizowane obecnie nie przyznają punktów XP."
    }
  ];
};

/*
|--------------------------------------------------------------------------
| Preview parameter cards
|--------------------------------------------------------------------------
*/

const buildPreviewParameters = (
  mission
) => {
  const vocabularyValue =
    mission.vocabularyFocus ===
      "custom"
      ? mission
          .customVocabularyFocus ||
        "Własny zakres"
      : getOptionLabel(
          PERSONALIZATION_VOCABULARY_OPTIONS,
          mission.vocabularyFocus,
          "Bez preferencji"
        );

  const grammarValue =
    mission.grammarFocus ===
      "custom"
      ? mission
          .customGrammarFocus ||
        "Własny zakres"
      : getOptionLabel(
          PERSONALIZATION_GRAMMAR_OPTIONS,
          mission.grammarFocus,
          "Bez preferencji"
        );

  return [
    {
      id:
        "conversationType",

      label:
        "Rodzaj rozmowy",

      value:
        getOptionLabel(
          PERSONALIZATION_CONVERSATION_TYPE_OPTIONS,
          mission.conversationType,
          "Odgrywanie ról"
        ),

      description:
        getOptionDescription(
          PERSONALIZATION_CONVERSATION_TYPE_OPTIONS,
          mission.conversationType
        )
    },

    {
      id:
        "npcStyle",

      label:
        "Styl rozmówcy",

      value:
        getOptionLabel(
          PERSONALIZATION_NPC_STYLE_OPTIONS,
          mission.npcStyle,
          "Adaptacyjny"
        ),

      description:
        getOptionDescription(
          PERSONALIZATION_NPC_STYLE_OPTIONS,
          mission.npcStyle
        )
    },

    {
      id:
        "complexity",

      label:
        "Trudność rozmowy",

      value:
        getOptionLabel(
          PERSONALIZATION_COMPLEXITY_OPTIONS,
          mission.complexity ||
            mission.difficulty,
          "Adaptacyjna"
        ),

      description:
        getOptionDescription(
          PERSONALIZATION_COMPLEXITY_OPTIONS,
          mission.complexity ||
            mission.difficulty
        )
    },

    {
      id:
        "vocabulary",

      label:
        "Słownictwo",

      value:
        vocabularyValue,

      description:
        getOptionDescription(
          PERSONALIZATION_VOCABULARY_OPTIONS,
          mission.vocabularyFocus
        )
    },

    {
      id:
        "grammar",

      label:
        "Gramatyka",

      value:
        grammarValue,

      description:
        getOptionDescription(
          PERSONALIZATION_GRAMMAR_OPTIONS,
          mission.grammarFocus
        )
    }
  ];
};

/*
|--------------------------------------------------------------------------
| Main preview builder
|--------------------------------------------------------------------------
*/

export const buildPersonalizedMissionPreview =
  (
    mission = {}
  ) => {
    const statusData =
      getPreviewStatus(
        mission
      );

    const objectives =
      normalizePreviewObjectives(
        mission.objectives
      );

    const briefing =
      isPlainObject(
        mission.briefing
      )
        ? mission.briefing
        : {};

    const successCriteria =
      normalizeSuccessCriteria(
        briefing.successCriteria
      );

    const topicTitle =
      normalizeSingleLineText(
        mission.topicTitle,
        180
      ) ||
      "Temat ogólny";

    const aiRole =
      normalizeSingleLineText(
        mission.aiRole,
        200
      ) ||
      "Rozmówca AI";

    const npcStyleLabel =
      getOptionLabel(
        PERSONALIZATION_NPC_STYLE_OPTIONS,
        mission.npcStyle,
        "Adaptacyjny"
      );

    return {
      status:
        statusData.status,

      readyToStart:
        statusData.readyToStart,

      missingFields:
        statusData.missingFields,

      id:
        normalizeSingleLineText(
          mission.id,
          150
        ),

      title:
        normalizeSingleLineText(
          mission.title,
          180
        ) ||
        "Spersonalizowana misja konwersacyjna",

      description:
        normalizeText(
          mission.description,
          800
        ) ||
        "Przećwicz realistyczną rozmowę dopasowaną do Twoich potrzeb.",

      topic: {
        id:
          normalizeSingleLineText(
            mission.topicId,
            150
          ),

        title:
          topicTitle,

        icon:
          normalizeSingleLineText(
            mission.topicIcon,
            30
          ) ||
          "🎯"
      },

      npc: {
        role:
          aiRole,

        style:
          mission.npcStyle ||
          "adaptive",

        styleLabel:
          npcStyleLabel,

        displayName:
          normalizeSingleLineText(
            mission.npcName,
            150
          ) ||
          aiRole,

        description:
          `${aiRole} · ${npcStyleLabel}`
      },

      scenario:
        normalizeText(
          mission.scenario,
          3000
        ),

      goal:
        normalizeText(
          mission.goal,
          1000
        ),

      objectives,

      briefing: {
        studentInstructions:
          normalizeText(
            briefing
              .studentInstructions,
            1500
          ) ||
          "Przeczytaj scenariusz i spróbuj zrealizować wszystkie cele rozmowy.",

        successCriteria
      },

      metrics:
        buildPreviewMetrics(
          mission
        ),

      parameters:
        buildPreviewParameters(
          mission
        ),

      policy: {
        xpEnabled: false,

        xpMessage:
          "Misje personalizowane służą do praktyki i obecnie nie przyznają punktów XP.",

        correctionsDuringConversation:
          false,

        feedbackAfterMission:
          true,

        polishSupport:
          mission.allowPolishSupport !==
          false
      },

      actions: {
        canStart:
          statusData
            .readyToStart,

        canRegenerate: true,

        canEditRequest: true,

        requiresObjectiveReview:
          mission
            .requireObjectiveReview !==
          false
      },

      rawMission:
        mission
    };
  };

/*
|--------------------------------------------------------------------------
| Preview summary
|--------------------------------------------------------------------------
|
| Useful for compact cards, logs or analytics without exposing the entire
| generated mission.
|
*/

export const buildPersonalizedMissionPreviewSummary =
  (
    mission = {}
  ) => {
    const preview =
      buildPersonalizedMissionPreview(
        mission
      );

    return {
      id:
        preview.id,

      status:
        preview.status,

      readyToStart:
        preview.readyToStart,

      title:
        preview.title,

      topicId:
        preview.topic.id,

      topicTitle:
        preview.topic.title,

      aiRole:
        preview.npc.role,

      npcStyle:
        preview.npc.style,

      level:
        normalizeSingleLineText(
          mission.level,
          20
        ),

      estimatedMinutes:
        normalizeNumber(
          mission
            .estimatedMinutes,
          {
            fallback: 10,
            minimum: 1,
            maximum: 60
          }
        ),

      objectiveCount:
        preview.objectives.length,

      conversationType:
        normalizeSingleLineText(
          mission
            .conversationType,
          100
        ),

      complexity:
        normalizeSingleLineText(
          mission.complexity ||
            mission.difficulty,
          100
        ),

      xpEnabled: false
    };
  };

export default {
  PERSONALIZATION_PREVIEW_STATUS,

  buildPersonalizedMissionPreview,
  buildPersonalizedMissionPreviewSummary
};