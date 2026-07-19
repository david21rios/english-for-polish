// src/services/ai/missions/personalization/missionPersonalizationValidator.js

import {
  PERSONALIZATION_COMPLEXITIES,
  PERSONALIZATION_CONVERSATION_TYPES,
  PERSONALIZATION_GRAMMAR_FOCUSES,
  PERSONALIZATION_LENGTHS,
  PERSONALIZATION_LEVELS,
  PERSONALIZATION_NPC_STYLES,
  PERSONALIZATION_VOCABULARY_FOCUSES
} from "./missionPersonalizationBuilder";

/*
|--------------------------------------------------------------------------
| Validation limits
|--------------------------------------------------------------------------
*/

const VALIDATION_LIMITS =
  Object.freeze({
    situationMinimumCharacters: 15,
    situationMaximumCharacters: 3000,

    goalMinimumCharacters: 5,
    goalMaximumCharacters: 1000,

    aiRoleMinimumCharacters: 2,
    aiRoleMaximumCharacters: 200,

    customFocusMinimumCharacters: 2,
    customFocusMaximumCharacters: 300,

    additionalInstructionsMaximumCharacters: 1000,

    minimumObjectives: 0,
    maximumObjectives: 8,

    objectiveMinimumCharacters: 3,
    objectiveMaximumCharacters: 300
  });

/*
|--------------------------------------------------------------------------
| Error codes
|--------------------------------------------------------------------------
*/

export const PERSONALIZATION_VALIDATION_CODES =
  Object.freeze({
    invalidRequest:
      "INVALID_PERSONALIZATION_REQUEST",

    invalidTopic:
      "INVALID_PERSONALIZATION_TOPIC",

    missingSituation:
      "MISSING_PERSONALIZATION_SITUATION",

    shortSituation:
      "PERSONALIZATION_SITUATION_TOO_SHORT",

    longSituation:
      "PERSONALIZATION_SITUATION_TOO_LONG",

    missingGoal:
      "MISSING_PERSONALIZATION_GOAL",

    shortGoal:
      "PERSONALIZATION_GOAL_TOO_SHORT",

    longGoal:
      "PERSONALIZATION_GOAL_TOO_LONG",

    missingAiRole:
      "MISSING_PERSONALIZATION_AI_ROLE",

    shortAiRole:
      "PERSONALIZATION_AI_ROLE_TOO_SHORT",

    longAiRole:
      "PERSONALIZATION_AI_ROLE_TOO_LONG",

    invalidLevel:
      "INVALID_PERSONALIZATION_LEVEL",

    invalidConversationType:
      "INVALID_PERSONALIZATION_CONVERSATION_TYPE",

    invalidNpcStyle:
      "INVALID_PERSONALIZATION_NPC_STYLE",

    invalidComplexity:
      "INVALID_PERSONALIZATION_COMPLEXITY",

    invalidMissionLength:
      "INVALID_PERSONALIZATION_LENGTH",

    invalidVocabularyFocus:
      "INVALID_PERSONALIZATION_VOCABULARY_FOCUS",

    missingCustomVocabulary:
      "MISSING_CUSTOM_VOCABULARY_FOCUS",

    invalidGrammarFocus:
      "INVALID_PERSONALIZATION_GRAMMAR_FOCUS",

    missingCustomGrammar:
      "MISSING_CUSTOM_GRAMMAR_FOCUS",

    tooManyObjectives:
      "TOO_MANY_PERSONALIZATION_OBJECTIVES",

    invalidObjective:
      "INVALID_PERSONALIZATION_OBJECTIVE",

    additionalInstructionsTooLong:
      "PERSONALIZATION_ADDITIONAL_INSTRUCTIONS_TOO_LONG"
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
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim();
};

const createValidationIssue = ({
  field,
  code,
  messagePolish,
  messageEnglish,
  severity = "error"
}) => {
  return {
    field,
    code,
    severity,

    messagePolish,
    messageEnglish
  };
};

const validateTextLength = ({
  value,
  field,
  minimum,
  maximum,
  missingCode,
  shortCode,
  longCode,
  missingPolish,
  shortPolish,
  longPolish
}) => {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return createValidationIssue({
      field,

      code:
        missingCode,

      messagePolish:
        missingPolish,

      messageEnglish:
        `${field} is required.`
    });
  }

  if (
    normalizedValue.length <
    minimum
  ) {
    return createValidationIssue({
      field,

      code:
        shortCode,

      messagePolish:
        shortPolish,

      messageEnglish:
        `${field} is too short.`
    });
  }

  if (
    normalizedValue.length >
    maximum
  ) {
    return createValidationIssue({
      field,

      code:
        longCode,

      messagePolish:
        longPolish,

      messageEnglish:
        `${field} is too long.`
    });
  }

  return null;
};

const validateAllowedValue = ({
  value,
  field,
  allowedValues,
  code,
  messagePolish
}) => {
  if (
    !allowedValues.includes(
      value
    )
  ) {
    return createValidationIssue({
      field,
      code,

      messagePolish,

      messageEnglish:
        `${field} contains an unsupported value.`
    });
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Objective validation
|--------------------------------------------------------------------------
*/

const validateObjectives = (
  objectives = []
) => {
  const issues = [];

  if (!Array.isArray(objectives)) {
    return issues;
  }

  if (
    objectives.length >
    VALIDATION_LIMITS
      .maximumObjectives
  ) {
    issues.push(
      createValidationIssue({
        field:
          "objectives",

        code:
          PERSONALIZATION_VALIDATION_CODES
            .tooManyObjectives,

        messagePolish:
          `Możesz dodać maksymalnie ${
            VALIDATION_LIMITS
              .maximumObjectives
          } celów misji.`,

        messageEnglish:
          "Too many mission objectives were provided."
      })
    );
  }

  objectives
    .slice(
      0,
      VALIDATION_LIMITS
        .maximumObjectives
    )
    .forEach(
      (
        objective,
        index
      ) => {
        const text =
          typeof objective ===
          "string"
            ? objective
            : objective?.text ||
              objective?.title ||
              objective?.objective;

        const normalizedText =
          normalizeText(text);

        if (
          normalizedText.length <
            VALIDATION_LIMITS
              .objectiveMinimumCharacters ||
          normalizedText.length >
            VALIDATION_LIMITS
              .objectiveMaximumCharacters
        ) {
          issues.push(
            createValidationIssue({
              field:
                `objectives.${index}`,

              code:
                PERSONALIZATION_VALIDATION_CODES
                  .invalidObjective,

              messagePolish:
                `Cel ${
                  index + 1
                } powinien zawierać od ${
                  VALIDATION_LIMITS
                    .objectiveMinimumCharacters
                } do ${
                  VALIDATION_LIMITS
                    .objectiveMaximumCharacters
                } znaków.`,

              messageEnglish:
                `Objective ${
                  index + 1
                } has an invalid length.`
            })
          );
        }
      }
    );

  return issues;
};

/*
|--------------------------------------------------------------------------
| Main validation
|--------------------------------------------------------------------------
*/

export const validateMissionPersonalizationRequest =
  (
    request = {}
  ) => {
    if (!isPlainObject(request)) {
      return {
        isValid: false,

        errors: [
          createValidationIssue({
            field:
              "request",

            code:
              PERSONALIZATION_VALIDATION_CODES
                .invalidRequest,

            messagePolish:
              "Dane formularza misji są nieprawidłowe.",

            messageEnglish:
              "Personalized mission request is invalid."
          })
        ],

        warnings: []
      };
    }

    const errors = [];
    const warnings = [];

    if (
      !isPlainObject(
        request.topic
      ) ||
      !normalizeText(
        request.topic.id ||
          request.topic.topicId
      )
    ) {
      errors.push(
        createValidationIssue({
          field:
            "topic",

          code:
            PERSONALIZATION_VALIDATION_CODES
              .invalidTopic,

          messagePolish:
            "Nie można określić tematu dla tej misji.",

          messageEnglish:
            "A valid topic is required."
        })
      );
    }

    const situationIssue =
      validateTextLength({
        value:
          request.situation,

        field:
          "situation",

        minimum:
          VALIDATION_LIMITS
            .situationMinimumCharacters,

        maximum:
          VALIDATION_LIMITS
            .situationMaximumCharacters,

        missingCode:
          PERSONALIZATION_VALIDATION_CODES
            .missingSituation,

        shortCode:
          PERSONALIZATION_VALIDATION_CODES
            .shortSituation,

        longCode:
          PERSONALIZATION_VALIDATION_CODES
            .longSituation,

        missingPolish:
          "Opisz sytuację, którą chcesz przećwiczyć.",

        shortPolish:
          "Opis sytuacji jest zbyt krótki. Dodaj więcej szczegółów.",

        longPolish:
          "Opis sytuacji jest zbyt długi."
      });

    if (situationIssue) {
      errors.push(
        situationIssue
      );
    }

    const goalIssue =
      validateTextLength({
        value:
          request.goal,

        field:
          "goal",

        minimum:
          VALIDATION_LIMITS
            .goalMinimumCharacters,

        maximum:
          VALIDATION_LIMITS
            .goalMaximumCharacters,

        missingCode:
          PERSONALIZATION_VALIDATION_CODES
            .missingGoal,

        shortCode:
          PERSONALIZATION_VALIDATION_CODES
            .shortGoal,

        longCode:
          PERSONALIZATION_VALIDATION_CODES
            .longGoal,

        missingPolish:
          "Napisz, jaki cel chcesz osiągnąć podczas rozmowy.",

        shortPolish:
          "Cel rozmowy jest zbyt krótki.",

        longPolish:
          "Cel rozmowy jest zbyt długi."
      });

    if (goalIssue) {
      errors.push(
        goalIssue
      );
    }

    const aiRoleIssue =
      validateTextLength({
        value:
          request.aiRole,

        field:
          "aiRole",

        minimum:
          VALIDATION_LIMITS
            .aiRoleMinimumCharacters,

        maximum:
          VALIDATION_LIMITS
            .aiRoleMaximumCharacters,

        missingCode:
          PERSONALIZATION_VALIDATION_CODES
            .missingAiRole,

        shortCode:
          PERSONALIZATION_VALIDATION_CODES
            .shortAiRole,

        longCode:
          PERSONALIZATION_VALIDATION_CODES
            .longAiRole,

        missingPolish:
          "Określ, kim ma być rozmówca AI.",

        shortPolish:
          "Rola AI jest zbyt krótka.",

        longPolish:
          "Opis roli AI jest zbyt długi."
      });

    if (aiRoleIssue) {
      errors.push(
        aiRoleIssue
      );
    }

    const allowedValueChecks = [
      {
        value:
          request.level,

        field:
          "level",

        allowedValues:
          PERSONALIZATION_LEVELS,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidLevel,

        messagePolish:
          "Wybrany poziom językowy jest nieprawidłowy."
      },

      {
        value:
          request.conversationType,

        field:
          "conversationType",

        allowedValues:
          PERSONALIZATION_CONVERSATION_TYPES,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidConversationType,

        messagePolish:
          "Wybrany rodzaj rozmowy jest nieprawidłowy."
      },

      {
        value:
          request.npcStyle,

        field:
          "npcStyle",

        allowedValues:
          PERSONALIZATION_NPC_STYLES,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidNpcStyle,

        messagePolish:
          "Wybrany styl rozmówcy AI jest nieprawidłowy."
      },

      {
        value:
          request.complexity,

        field:
          "complexity",

        allowedValues:
          PERSONALIZATION_COMPLEXITIES,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidComplexity,

        messagePolish:
          "Wybrany poziom trudności rozmowy jest nieprawidłowy."
      },

      {
        value:
          request.missionLength,

        field:
          "missionLength",

        allowedValues:
          PERSONALIZATION_LENGTHS,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidMissionLength,

        messagePolish:
          "Wybrana długość misji jest nieprawidłowa."
      },

      {
        value:
          request.vocabularyFocus,

        field:
          "vocabularyFocus",

        allowedValues:
          PERSONALIZATION_VOCABULARY_FOCUSES,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidVocabularyFocus,

        messagePolish:
          "Wybrany zakres słownictwa jest nieprawidłowy."
      },

      {
        value:
          request.grammarFocus,

        field:
          "grammarFocus",

        allowedValues:
          PERSONALIZATION_GRAMMAR_FOCUSES,

        code:
          PERSONALIZATION_VALIDATION_CODES
            .invalidGrammarFocus,

        messagePolish:
          "Wybrany zakres gramatyki jest nieprawidłowy."
      }
    ];

    allowedValueChecks.forEach(
      (check) => {
        const issue =
          validateAllowedValue(
            check
          );

        if (issue) {
          errors.push(
            issue
          );
        }
      }
    );

    if (
      request.vocabularyFocus ===
        "custom" &&
      normalizeText(
        request
          .customVocabularyFocus
      ).length <
        VALIDATION_LIMITS
          .customFocusMinimumCharacters
    ) {
      errors.push(
        createValidationIssue({
          field:
            "customVocabularyFocus",

          code:
            PERSONALIZATION_VALIDATION_CODES
              .missingCustomVocabulary,

          messagePolish:
            "Napisz, na jakim słownictwie ma koncentrować się misja.",

          messageEnglish:
            "Custom vocabulary focus is required."
        })
      );
    }

    if (
      request.grammarFocus ===
        "custom" &&
      normalizeText(
        request
          .customGrammarFocus
      ).length <
        VALIDATION_LIMITS
          .customFocusMinimumCharacters
    ) {
      errors.push(
        createValidationIssue({
          field:
            "customGrammarFocus",

          code:
            PERSONALIZATION_VALIDATION_CODES
              .missingCustomGrammar,

          messagePolish:
            "Napisz, jaki element gramatyki chcesz przećwiczyć.",

          messageEnglish:
            "Custom grammar focus is required."
        })
      );
    }

    if (
      normalizeText(
        request.additionalInstructions
      ).length >
      VALIDATION_LIMITS
        .additionalInstructionsMaximumCharacters
    ) {
      errors.push(
        createValidationIssue({
          field:
            "additionalInstructions",

          code:
            PERSONALIZATION_VALIDATION_CODES
              .additionalInstructionsTooLong,

          messagePolish:
            "Dodatkowe instrukcje są zbyt długie.",

          messageEnglish:
            "Additional instructions are too long."
        })
      );
    }

    errors.push(
      ...validateObjectives(
        request.objectives
      )
    );

    if (
      normalizeText(
        request.situation
      ).length < 40 &&
      !situationIssue
    ) {
      warnings.push(
        createValidationIssue({
          field:
            "situation",

          code:
            "PERSONALIZATION_SITUATION_COULD_BE_MORE_DETAILED",

          severity:
            "warning",

          messagePolish:
            "Bardziej szczegółowy opis sytuacji może poprawić jakość wygenerowanej misji.",

          messageEnglish:
            "A more detailed situation may improve generation quality."
        })
      );
    }

    return {
      isValid:
        errors.length === 0,

      errors,
      warnings,

      firstError:
        errors[0] ||
        null,

      fieldErrors:
        errors.reduce(
          (
            fieldMap,
            issue
          ) => {
            if (
              !fieldMap[
                issue.field
              ]
            ) {
              fieldMap[
                issue.field
              ] =
                issue.messagePolish;
            }

            return fieldMap;
          },
          {}
        )
    };
  };

/*
|--------------------------------------------------------------------------
| Throwing validator
|--------------------------------------------------------------------------
*/

export const assertValidMissionPersonalizationRequest =
  (
    request
  ) => {
    const validation =
      validateMissionPersonalizationRequest(
        request
      );

    if (validation.isValid) {
      return validation;
    }

    const error =
      new Error(
        validation.firstError
          ?.messagePolish ||
          "Dane misji personalizowanej są nieprawidłowe."
      );

    error.code =
      validation.firstError
        ?.code ||
      PERSONALIZATION_VALIDATION_CODES
        .invalidRequest;

    error.field =
      validation.firstError
        ?.field ||
      null;

    error.validation =
      validation;

    error.retryable = false;

    throw error;
  };

export default {
  PERSONALIZATION_VALIDATION_CODES,

  validateMissionPersonalizationRequest,
  assertValidMissionPersonalizationRequest
};