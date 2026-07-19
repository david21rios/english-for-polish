// src/services/ai/missions/missionJson.js

import {
  MISSION_LIMITS,
  limitArray,
  limitString
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
  "ADAPTIVE"
]);

const VALID_GOAL_PROGRESS_VALUES =
  new Set([
    "none",
    "limited",
    "partial",
    "good",
    "complete"
  ]);

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

  if (
    typeof value === "string"
  ) {
    const normalizedValue =
      value
        .trim()
        .toLowerCase();

    if (
      normalizedValue === "true"
    ) {
      return true;
    }

    if (
      normalizedValue === "false"
    ) {
      return false;
    }
  }

  return fallback;
};

const normalizeNumber = (
  value,
  {
    minimum = 0,
    maximum = 100,
    fallback = 0,
    integer = false
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

  const boundedValue =
    Math.min(
      maximum,
      Math.max(
        minimum,
        numericValue
      )
    );

  return integer
    ? Math.round(boundedValue)
    : boundedValue;
};

const normalizeStringArray = (
  value,
  maximumItems,
  maximumItemLength = 300
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return limitArray(
    value
      .map((item) =>
        normalizeSingleLineText(
          item,
          maximumItemLength
        )
      )
      .filter(Boolean),
    maximumItems
  );
};

/*
|--------------------------------------------------------------------------
| JSON extraction and parsing
|--------------------------------------------------------------------------
*/

export const cleanMissionJsonText = (
  text = ""
) => {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
};

export const extractMissionJsonText = (
  text = ""
) => {
  const cleanedText =
    cleanMissionJsonText(text);

  const firstBrace =
    cleanedText.indexOf("{");

  const lastBrace =
    cleanedText.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      "No valid JSON object was found in the mission AI response."
    );
  }

  return cleanedText
    .slice(
      firstBrace,
      lastBrace + 1
    )
    .replace(
      /,\s*}/g,
      "}"
    )
    .replace(
      /,\s*]/g,
      "]"
    );
};

export const parseMissionJson = (
  text = ""
) => {
  const jsonText =
    extractMissionJsonText(
      text
    );

  let parsedValue;

  try {
    parsedValue =
      JSON.parse(jsonText);
  } catch (error) {
    const parseError =
      new Error(
        "Mission AI returned invalid JSON."
      );

    parseError.code =
      "INVALID_MISSION_JSON";

    parseError.cause =
      error;

    parseError.rawResponse =
      limitString(
        String(text || ""),
        3000
      );

    throw parseError;
  }

  if (
    !isPlainObject(
      parsedValue
    )
  ) {
    throw new Error(
      "Mission AI JSON response must contain one object."
    );
  }

  return parsedValue;
};

export const safeParseMissionJson = (
  text = ""
) => {
  try {
    return parseMissionJson(
      text
    );
  } catch {
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Objective normalization
|--------------------------------------------------------------------------
*/

const normalizeObjectiveId = (
  value,
  index
) => {
  const normalizedId =
    normalizeSingleLineText(
      value,
      100
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

  return (
    normalizedId ||
    `objective_${index + 1}`
  );
};

export const normalizeMissionObjectives = (
  objectives
) => {
  if (
    !Array.isArray(
      objectives
    )
  ) {
    return [];
  }

  return limitArray(
    objectives
      .map(
        (
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
                    `objective_${
                      index + 1
                    }`,

                  text,

                  required:
                    true
                }
              : null;
          }

          if (
            !isPlainObject(
              objective
            )
          ) {
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
              normalizeObjectiveId(
                objective.id,
                index
              ),

            text,

            required:
              normalizeBoolean(
                objective.required,
                true
              )
          };
        }
      )
      .filter(Boolean),
    MISSION_LIMITS.evaluation
      .maxObjectives
  );
};

/*
|--------------------------------------------------------------------------
| Personalized mission normalization
|--------------------------------------------------------------------------
*/

export const normalizePersonalizedMissionJson =
  (
    value = {},
    {
      topic = {},
      formData = {}
    } = {}
  ) => {
    if (!isPlainObject(value)) {
      throw new Error(
        "Invalid personalized mission object."
      );
    }

    const topicTitle =
      normalizeSingleLineText(
        topic?.title ||
          topic?.titulo ||
          "General",
        120
      );

    const requestedLevel =
      normalizeSingleLineText(
        value.level ||
          formData.level ||
          "Adaptive",
        20
      ).toUpperCase();

    const level =
      VALID_CEFR_LEVELS.has(
        requestedLevel
      )
        ? requestedLevel ===
          "ADAPTIVE"
          ? "Adaptive"
          : requestedLevel
        : "Adaptive";

    const objectives =
      normalizeMissionObjectives(
        value.objectives
      );

    const fallbackGoal =
      normalizeText(
        value.goal ||
          formData.goal ||
          "Zrealizuj główny cel rozmowy.",
        500
      );

    return {
      title:
        normalizeSingleLineText(
          value.title,
          120
        ) ||
        `Personalizowana misja: ${topicTitle}`,

      description:
        normalizeText(
          value.description,
          500
        ) ||
        "Personalizowana misja AI utworzona na podstawie sytuacji i celu ucznia.",

      scenario:
        normalizeText(
          value.scenario ||
            formData.situation,
          MISSION_LIMITS.prompt
            .maxScenarioCharacters
        ),

      goal:
        fallbackGoal,

      aiRole:
        normalizeSingleLineText(
          value.aiRole ||
            formData.aiRole ||
            "Conversation partner",
          120
        ),

      level,

      difficulty:
        normalizeSingleLineText(
          value.difficulty ||
            "adaptive",
          30
        ).toLowerCase(),

      xpReward:
        normalizeNumber(
          value.xpReward,
          {
            minimum: 1,
            maximum: 100,
            fallback: 15,
            integer: true
          }
        ),

      estimatedMinutes:
        normalizeNumber(
          value.estimatedMinutes,
          {
            minimum: 1,
            maximum: 60,
            fallback: 8,
            integer: true
          }
        ),

      minReplies:
        normalizeNumber(
          value.minReplies,
          {
            minimum:
              MISSION_LIMITS
                .personalizedMission
                .minimumReplies,

            maximum:
              MISSION_LIMITS
                .personalizedMission
                .maximumReplies,

            fallback:
              MISSION_LIMITS
                .personalizedMission
                .defaultReplies,

            integer: true
          }
        ),

      objectives:
        objectives.length > 0
          ? objectives
          : [
              {
                id:
                  "objective_1",

                text:
                  fallbackGoal,

                required:
                  true
              }
            ],

      briefing: {
        studentInstructions:
          normalizeText(
            value.briefing
              ?.studentInstructions,
            600
          ) ||
          "Ukończ rozmowę naturalnie. Skup się na komunikacji.",

        successCriteria:
          normalizeStringArray(
            value.briefing
              ?.successCriteria,
            5,
            250
          )
      }
    };
  };

/*
|--------------------------------------------------------------------------
| Mission state normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionStateJson =
  (
    value = {}
  ) => {
    if (!isPlainObject(value)) {
      throw new Error(
        "Invalid mission state object."
      );
    }

    const normalizedGoalProgress =
      normalizeSingleLineText(
        value.goalProgress,
        30
      ).toLowerCase();

    const goalProgress =
      VALID_GOAL_PROGRESS_VALUES.has(
        normalizedGoalProgress
      )
        ? normalizedGoalProgress
        : "none";

    const progressScore =
      normalizeNumber(
        value.progressScore,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0,
          integer: true
        }
      );

    const meaningfulReplies =
      normalizeNumber(
        value.meaningfulReplies,
        {
          minimum: 0,
          maximum:
            MISSION_LIMITS
              .conversation
              .maxUserReplies,
          fallback: 0,
          integer: true
        }
      );

    const offTopicReplies =
      normalizeNumber(
        value.offTopicReplies,
        {
          minimum: 0,
          maximum:
            MISSION_LIMITS
              .conversation
              .maxUserReplies,
          fallback: 0,
          integer: true
        }
      );

    const nonsenseReplies =
      normalizeNumber(
        value.nonsenseReplies,
        {
          minimum: 0,
          maximum:
            MISSION_LIMITS
              .conversation
              .maxUserReplies,
          fallback: 0,
          integer: true
        }
      );

    const hasMinimumEvidence =
      meaningfulReplies >=
      MISSION_LIMITS
        .conversation
        .minimumMeaningfulReplies;

    const canComplete =
      normalizeBoolean(
        value.canComplete,
        false
      ) &&
      hasMinimumEvidence &&
      progressScore >= 60 &&
      goalProgress !==
        "none";

    return {
      canComplete,

      progressScore,

      meaningfulReplies,

      offTopicReplies,

      nonsenseReplies,

      goalProgress,

      reason:
        normalizeText(
          value.reason,
          500
        ),

      nextRequiredAction:
        normalizeText(
          value.nextRequiredAction,
          500
        ) ||
        "Continue the conversation with a more complete and relevant answer.",

      confidence:
        normalizeNumber(
          value.confidence,
          {
            minimum: 0,
            maximum: 100,
            fallback: 0,
            integer: true
          }
        ),

      requiresReview:
        normalizeBoolean(
          value.requiresReview ||
            value.requiresManualReview,
          false
        )
    };
  };

/*
|--------------------------------------------------------------------------
| Evaluation array normalization
|--------------------------------------------------------------------------
*/

const normalizeObjectiveEvaluations = (
  value
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return limitArray(
    value
      .map((item) => {
        if (
          !isPlainObject(item)
        ) {
          return null;
        }

        const objective =
          normalizeSingleLineText(
            item.objective ||
              item.text,
            300
          );

        if (!objective) {
          return null;
        }

        return {
          objective,

          completed:
            normalizeBoolean(
              item.completed,
              false
            ),

          evidence:
            normalizeText(
              item.evidence,
              500
            )
        };
      })
      .filter(Boolean),
    MISSION_LIMITS.evaluation
      .maxObjectives
  );
};

const normalizeCorrections = (
  value
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return limitArray(
    value
      .map((item) => {
        if (
          !isPlainObject(item)
        ) {
          return null;
        }

        const original =
          normalizeText(
            item.original,
            400
          );

        const suggested =
          normalizeText(
            item.suggested,
            400
          );

        if (
          !original ||
          !suggested
        ) {
          return null;
        }

        return {
          original,

          suggested,

          explanation:
            normalizeText(
              item.explanation,
              500
            )
        };
      })
      .filter(Boolean),
    MISSION_LIMITS.evaluation
      .maxCorrections
  );
};

const normalizeVocabulary = (
  value
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return limitArray(
    value
      .map((item) => {
        if (
          !isPlainObject(item)
        ) {
          return null;
        }

        const word =
          normalizeSingleLineText(
            item.word ||
              item.phrase,
            150
          );

        if (!word) {
          return null;
        }

        return {
          word,

          meaning:
            normalizeText(
              item.meaning,
              400
            )
        };
      })
      .filter(Boolean),
    MISSION_LIMITS.evaluation
      .maxVocabulary
  );
};

/*
|--------------------------------------------------------------------------
| Final evaluation normalization
|--------------------------------------------------------------------------
*/

export const normalizeMissionEvaluationJson =
  (
    value = {},
    {
      fallbackLevel = "A1"
    } = {}
  ) => {
    if (!isPlainObject(value)) {
      throw new Error(
        "Invalid mission evaluation object."
      );
    }

    const score =
      normalizeNumber(
        value.score,
        {
          minimum: 0,
          maximum: 100,
          fallback: 0,
          integer: true
        }
      );

    const suggestedLevelValue =
      normalizeSingleLineText(
        value.suggestedLevel ||
          fallbackLevel,
        20
      ).toUpperCase();

    const suggestedLevel =
      VALID_CEFR_LEVELS.has(
        suggestedLevelValue
      ) &&
      suggestedLevelValue !==
        "ADAPTIVE"
        ? suggestedLevelValue
        : fallbackLevel;

    return {
      rawPassed:
        normalizeBoolean(
          value.passed,
          false
        ),

      score,

      suggestedLevel,

      totalMessages:
        normalizeNumber(
          value.totalMessages,
          {
            minimum: 0,
            maximum:
              MISSION_LIMITS
                .conversation
                .maxHistoryMessages,
            fallback: 0,
            integer: true
          }
        ),

      totalWords:
        normalizeNumber(
          value.totalWords,
          {
            minimum: 0,
            maximum: 10000,
            fallback: 0,
            integer: true
          }
        ),

      objectivesCompleted:
        normalizeObjectiveEvaluations(
          value.objectivesCompleted
        ),

      strengths:
        normalizeStringArray(
          value.strengths,
          MISSION_LIMITS.evaluation
            .maxStrengths,
          400
        ),

      improvements:
        normalizeStringArray(
          value.improvements,
          MISSION_LIMITS.evaluation
            .maxImprovements,
          400
        ),

      corrections:
        normalizeCorrections(
          value.corrections
        ),

      vocabulary:
        normalizeVocabulary(
          value.vocabulary
        ),

      grammarTips:
        normalizeStringArray(
          value.grammarTips,
          MISSION_LIMITS.evaluation
            .maxGrammarTips,
          400
        ),

      nextSteps:
        normalizeStringArray(
          value.nextSteps,
          MISSION_LIMITS.evaluation
            .maxNextSteps,
          400
        ),

      confidence:
        normalizeNumber(
          value.confidence,
          {
            minimum: 0,
            maximum: 100,
            fallback: 0,
            integer: true
          }
        ),

      requiresReview:
        normalizeBoolean(
          value.requiresReview ||
            value.requiresManualReview,
          false
        )
    };
  };

export default {
  cleanMissionJsonText,
  extractMissionJsonText,
  parseMissionJson,
  safeParseMissionJson,
  normalizeMissionObjectives,
  normalizePersonalizedMissionJson,
  normalizeMissionStateJson,
  normalizeMissionEvaluationJson
};
