// src/components/topics/personalization/PersonalizedMissionWizard.jsx

import {
  useCallback,
  useMemo,
  useState
} from "react";

import PersonalizationErrorSummary from "./PersonalizationErrorSummary";
import PersonalizationExamples from "./PersonalizationExamples";
import PersonalizationGenerationStatus from "./PersonalizationGenerationStatus";
import PersonalizationNavigation from "./PersonalizationNavigation";
import PersonalizationObjectiveEditor from "./PersonalizationObjectiveEditor";
import PersonalizationStepIndicator from "./PersonalizationStepIndicator";
import PersonalizedMissionPreview from "./PersonalizedMissionPreview";

import GoalStep from "./steps/GoalStep";
import NpcStep from "./steps/NpcStep";
import ParametersStep from "./steps/ParametersStep";
import SituationStep from "./steps/SituationStep";

import {
  buildMissionPersonalizationRequest
} from "../../../services/ai/missions/personalization/missionPersonalizationBuilder";

import {
  createDefaultPersonalizationForm,
  PERSONALIZATION_WIZARD_STEPS
} from "../../../services/ai/missions/personalization/missionPersonalizationDefaults";

import {
  validateMissionPersonalizationRequest
} from "../../../services/ai/missions/personalization/missionPersonalizationValidator";

import {
  generatePersonalizedMissionResult
} from "../../../services/ai/missions/missionPersonalizationService";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim();
};

const isPlainObject = (
  value
) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const createLocalIssue = ({
  field,
  messagePolish,
  code
}) => {
  return {
    field,
    code,
    severity: "error",
    messagePolish
  };
};

const buildFieldErrors = (
  errors = []
) => {
  if (!Array.isArray(errors)) {
    return {};
  }

  return errors.reduce(
    (
      fieldMap,
      error
    ) => {
      const field =
        normalizeText(
          error?.field
        );

      const message =
        normalizeText(
          error?.messagePolish ||
            error?.message
        );

      if (
        field &&
        message &&
        !fieldMap[field]
      ) {
        fieldMap[field] =
          message;
      }

      return fieldMap;
    },
    {}
  );
};

/*
|--------------------------------------------------------------------------
| Step validation
|--------------------------------------------------------------------------
*/

const validateSituationStep = (
  formData
) => {
  const errors = [];

  const situation =
    normalizeText(
      formData.situation
    );

  const additionalInstructions =
    normalizeText(
      formData
        .additionalInstructions
    );

  if (!situation) {
    errors.push(
      createLocalIssue({
        field: "situation",
        code:
          "MISSING_PERSONALIZATION_SITUATION",
        messagePolish:
          "Opisz sytuację, którą chcesz przećwiczyć."
      })
    );
  } else if (
    situation.length < 15
  ) {
    errors.push(
      createLocalIssue({
        field: "situation",
        code:
          "PERSONALIZATION_SITUATION_TOO_SHORT",
        messagePolish:
          "Opis sytuacji jest zbyt krótki. Dodaj więcej szczegółów."
      })
    );
  }

  if (
    additionalInstructions.length >
    1000
  ) {
    errors.push(
      createLocalIssue({
        field:
          "additionalInstructions",
        code:
          "PERSONALIZATION_ADDITIONAL_INSTRUCTIONS_TOO_LONG",
        messagePolish:
          "Dodatkowe instrukcje są zbyt długie."
      })
    );
  }

  return errors;
};

const validateGoalStep = (
  formData
) => {
  const errors = [];

  const goal =
    normalizeText(
      formData.goal
    );

  if (!goal) {
    errors.push(
      createLocalIssue({
        field: "goal",
        code:
          "MISSING_PERSONALIZATION_GOAL",
        messagePolish:
          "Napisz, jaki cel chcesz osiągnąć podczas rozmowy."
      })
    );
  } else if (
    goal.length < 5
  ) {
    errors.push(
      createLocalIssue({
        field: "goal",
        code:
          "PERSONALIZATION_GOAL_TOO_SHORT",
        messagePolish:
          "Cel rozmowy jest zbyt krótki."
      })
    );
  }

  const objectives =
    Array.isArray(
      formData.objectives
    )
      ? formData.objectives
      : [];

  objectives.forEach(
    (
      objective,
      index
    ) => {
      const objectiveText =
        normalizeText(
          typeof objective ===
            "string"
            ? objective
            : objective?.text
        );

      if (
        objectiveText.length <
        3
      ) {
        errors.push(
          createLocalIssue({
            field:
              `objectives.${index}`,
            code:
              "INVALID_PERSONALIZATION_OBJECTIVE",
            messagePolish:
              `Cel ${
                index + 1
              } jest zbyt krótki.`
          })
        );
      }
    }
  );

  return errors;
};

const validateNpcStep = (
  formData
) => {
  const errors = [];

  const aiRole =
    normalizeText(
      formData.aiRole
    );

  if (!aiRole) {
    errors.push(
      createLocalIssue({
        field: "aiRole",
        code:
          "MISSING_PERSONALIZATION_AI_ROLE",
        messagePolish:
          "Określ, kim ma być rozmówca AI."
      })
    );
  } else if (
    aiRole.length < 2
  ) {
    errors.push(
      createLocalIssue({
        field: "aiRole",
        code:
          "PERSONALIZATION_AI_ROLE_TOO_SHORT",
        messagePolish:
          "Opis roli AI jest zbyt krótki."
      })
    );
  }

  if (
    !normalizeText(
      formData.npcStyle
    )
  ) {
    errors.push(
      createLocalIssue({
        field: "npcStyle",
        code:
          "INVALID_PERSONALIZATION_NPC_STYLE",
        messagePolish:
          "Wybierz styl rozmówcy AI."
      })
    );
  }

  if (
    !normalizeText(
      formData.conversationType
    )
  ) {
    errors.push(
      createLocalIssue({
        field:
          "conversationType",
        code:
          "INVALID_PERSONALIZATION_CONVERSATION_TYPE",
        messagePolish:
          "Wybierz rodzaj rozmowy."
      })
    );
  }

  return errors;
};

const validateParametersStep = (
  formData
) => {
  const errors = [];

  const requiredFields = [
    {
      field: "level",
      message:
        "Wybierz poziom językowy."
    },
    {
      field: "complexity",
      message:
        "Wybierz trudność rozmowy."
    },
    {
      field: "missionLength",
      message:
        "Wybierz długość misji."
    },
    {
      field:
        "vocabularyFocus",
      message:
        "Wybierz zakres słownictwa."
    },
    {
      field: "grammarFocus",
      message:
        "Wybierz zakres gramatyki."
    }
  ];

  requiredFields.forEach(
    ({
      field,
      message
    }) => {
      if (
        !normalizeText(
          formData[field]
        )
      ) {
        errors.push(
          createLocalIssue({
            field,
            code:
              `MISSING_${field.toUpperCase()}`,
            messagePolish:
              message
          })
        );
      }
    }
  );

  if (
    formData.vocabularyFocus ===
      "custom" &&
    normalizeText(
      formData
        .customVocabularyFocus
    ).length < 2
  ) {
    errors.push(
      createLocalIssue({
        field:
          "customVocabularyFocus",
        code:
          "MISSING_CUSTOM_VOCABULARY_FOCUS",
        messagePolish:
          "Napisz, na jakim słownictwie ma koncentrować się misja."
      })
    );
  }

  if (
    formData.grammarFocus ===
      "custom" &&
    normalizeText(
      formData
        .customGrammarFocus
    ).length < 2
  ) {
    errors.push(
      createLocalIssue({
        field:
          "customGrammarFocus",
        code:
          "MISSING_CUSTOM_GRAMMAR_FOCUS",
        messagePolish:
          "Napisz, jaki element gramatyki chcesz przećwiczyć."
      })
    );
  }

  return errors;
};

const validateWizardStep = ({
  stepIndex,
  formData
}) => {
  switch (stepIndex) {
    case 0:
      return validateSituationStep(
        formData
      );

    case 1:
      return validateGoalStep(
        formData
      );

    case 2:
      return validateNpcStep(
        formData
      );

    case 3:
      return validateParametersStep(
        formData
      );

    default:
      return [];
  }
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const PersonalizedMissionWizard = ({
  topic = {},

  initialFormData = {},

  onStartMission,
  onCancel = null
}) => {
  const [
    formData,
    setFormData
  ] = useState(() =>
    createDefaultPersonalizationForm(
      initialFormData
    )
  );

  const [
    currentStepIndex,
    setCurrentStepIndex
  ] = useState(0);

  const [
    highestCompletedStepIndex,
    setHighestCompletedStepIndex
  ] = useState(-1);

  const [
    selectedExampleId,
    setSelectedExampleId
  ] = useState(null);

  const [
    generatedMission,
    setGeneratedMission
  ] = useState(null);

  const [
    missionPreview,
    setMissionPreview
  ] = useState(null);

  const [
    validationErrors,
    setValidationErrors
  ] = useState([]);

  const [
    validationWarnings,
    setValidationWarnings
  ] = useState([]);

  const [
    generationError,
    setGenerationError
  ] = useState("");

  const [
    generationRetryable,
    setGenerationRetryable
  ] = useState(false);

  const [
    generating,
    setGenerating
  ] = useState(false);

  const [
    starting,
    setStarting
  ] = useState(false);

  const steps =
    PERSONALIZATION_WIZARD_STEPS;

  const previewStepIndex =
    steps.length - 1;

  const parametersStepIndex =
    previewStepIndex - 1;

  const fieldErrors =
    useMemo(
      () =>
        buildFieldErrors(
          validationErrors
        ),
      [validationErrors]
    );

  /*
  |--------------------------------------------------------------------------
  | Form changes
  |--------------------------------------------------------------------------
  */

  const handleFieldChange =
    useCallback(
      (
        field,
        value
      ) => {
        setFormData(
          (
            currentForm
          ) => ({
            ...currentForm,
            [field]: value
          })
        );

        setValidationErrors(
          (currentErrors) =>
            currentErrors.filter(
              (error) => {
                const errorField =
                  normalizeText(
                    error?.field
                  );

                return !(
                  errorField === field ||
                  errorField.startsWith(
                    `${field}.`
                  )
                );
              }
            )
        );

        setGenerationError("");
      },
      []
    );

  const handleObjectivesChange =
    useCallback(
      (
        objectives
      ) => {
        handleFieldChange(
          "objectives",
          Array.isArray(
            objectives
          )
            ? objectives
            : []
        );
      },
      [handleFieldChange]
    );

  /*
  |--------------------------------------------------------------------------
  | Examples
  |--------------------------------------------------------------------------
  */

  const handleSelectExample =
    useCallback(
      (
        example
      ) => {
        if (!isPlainObject(example)) {
          return;
        }

        setFormData(
          createDefaultPersonalizationForm({
            ...formData,
            ...example,
            objectives:
              Array.isArray(
                example.objectives
              )
                ? example.objectives
                : []
          })
        );

        setSelectedExampleId(
          example.id ||
            null
        );

        setGeneratedMission(null);
        setMissionPreview(null);
        setValidationErrors([]);
        setValidationWarnings([]);
        setGenerationError("");
      },
      [formData]
    );

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleNext =
    useCallback(() => {
      const stepErrors =
        validateWizardStep({
          stepIndex:
            currentStepIndex,
          formData
        });

      if (
        stepErrors.length > 0
      ) {
        setValidationErrors(
          stepErrors
        );

        setValidationWarnings([]);
        return;
      }

      setValidationErrors([]);
      setValidationWarnings([]);

      setHighestCompletedStepIndex(
        (currentHighest) =>
          Math.max(
            currentHighest,
            currentStepIndex
          )
      );

      setCurrentStepIndex(
        (currentIndex) =>
          Math.min(
            parametersStepIndex,
            currentIndex + 1
          )
      );
    }, [
      currentStepIndex,
      formData,
      parametersStepIndex
    ]);

  const handleBack =
    useCallback(() => {
      setValidationErrors([]);
      setValidationWarnings([]);
      setGenerationError("");

      setCurrentStepIndex(
        (currentIndex) =>
          Math.max(
            0,
            currentIndex - 1
          )
      );
    }, []);

  const handleStepSelect =
    useCallback(
      (
        nextStepIndex
      ) => {
        if (generating) {
          return;
        }

        const normalizedIndex =
          Math.max(
            0,
            Math.min(
              previewStepIndex,
              Number(
                nextStepIndex
              ) || 0
            )
          );

        const maximumAccessible =
          Math.max(
            currentStepIndex,
            highestCompletedStepIndex +
              1
          );

        if (
          normalizedIndex >
          maximumAccessible
        ) {
          return;
        }

        if (
          normalizedIndex ===
            previewStepIndex &&
          !generatedMission
        ) {
          return;
        }

        setValidationErrors([]);
        setValidationWarnings([]);
        setCurrentStepIndex(
          normalizedIndex
        );
      },
      [
        currentStepIndex,
        generatedMission,
        generating,
        highestCompletedStepIndex,
        previewStepIndex
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Full validation
  |--------------------------------------------------------------------------
  */

  const buildAndValidateRequest =
    useCallback(() => {
      const request =
        buildMissionPersonalizationRequest({
          topic,
          formData,
          existingObjectives:
            formData.objectives
        });

      const validation =
        validateMissionPersonalizationRequest(
          request
        );

      setValidationErrors(
        validation.errors ||
          []
      );

      setValidationWarnings(
        validation.warnings ||
          []
      );

      return {
        request,
        validation
      };
    }, [
      formData,
      topic
    ]);

  /*
  |--------------------------------------------------------------------------
  | Generate mission
  |--------------------------------------------------------------------------
  */

  const handleGenerateMission =
    useCallback(async () => {
      if (generating) {
        return;
      }

      const parameterErrors =
        validateWizardStep({
          stepIndex:
            parametersStepIndex,
          formData
        });

      if (
        parameterErrors.length > 0
      ) {
        setValidationErrors(
          parameterErrors
        );

        return;
      }

      const {
        validation
      } =
        buildAndValidateRequest();

      if (
        validation.isValid !==
        true
      ) {
        const firstErrorField =
          validation.errors?.[0]
            ?.field;

        const targetStepMap = {
          situation: 0,
          additionalInstructions:
            0,
          goal: 1,
          objectives: 1,
          aiRole: 2,
          npcStyle: 2,
          conversationType: 2,
          level: 3,
          complexity: 3,
          missionLength: 3,
          vocabularyFocus: 3,
          customVocabularyFocus:
            3,
          grammarFocus: 3,
          customGrammarFocus: 3
        };

        const rootField =
          normalizeText(
            firstErrorField
          ).split(".")[0];

        if (
          Object.prototype.hasOwnProperty.call(
            targetStepMap,
            rootField
          )
        ) {
          setCurrentStepIndex(
            targetStepMap[
              rootField
            ]
          );
        }

        return;
      }

      try {
        setGenerating(true);
        setGenerationError("");
        setGenerationRetryable(
          false
        );

        const result =
          await generatePersonalizedMissionResult({
            topic,
            formData,
            existingObjectives:
              formData.objectives,
            allowFallback: true
          });

        if (
          result
            ?.missionCreated !==
            true ||
          !result?.mission ||
          !result?.preview
        ) {
          const errorMessage =
            result?.messagePolish ||
            result?.error?.message ||
            "Nie udało się utworzyć spersonalizowanej misji.";

          setGenerationError(
            errorMessage
          );

          setGenerationRetryable(
            result?.retryable !==
              false
          );

          if (
            result?.validation
              ?.errors
          ) {
            setValidationErrors(
              result.validation.errors
            );
          }

          return;
        }

        setGeneratedMission(
          result.mission
        );

        setMissionPreview(
          result.preview
        );

        setValidationErrors([]);
        setValidationWarnings([]);

        setHighestCompletedStepIndex(
          parametersStepIndex
        );

        setCurrentStepIndex(
          previewStepIndex
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } catch (error) {
        console.error(
          "Error generating personalized mission:",
          {
            code:
              error?.code,
            field:
              error?.field,
            message:
              error?.message
          }
        );

        setGenerationError(
          error instanceof Error
            ? error.message
            : "Nie udało się utworzyć spersonalizowanej misji."
        );

        setGenerationRetryable(
          error?.retryable !==
          false
        );

        if (
          error?.validation
            ?.errors
        ) {
          setValidationErrors(
            error.validation.errors
          );
        }
      } finally {
        setGenerating(false);
      }
    }, [
      buildAndValidateRequest,
      formData,
      generating,
      parametersStepIndex,
      previewStepIndex,
      topic
    ]);

  /*
  |--------------------------------------------------------------------------
  | Preview actions
  |--------------------------------------------------------------------------
  */

  const handleEditRequest =
    useCallback(() => {
      setCurrentStepIndex(
        0
      );

      setGenerationError("");
      setValidationErrors([]);
      setValidationWarnings([]);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, []);

  const handleRegenerate =
    useCallback(() => {
      handleGenerateMission();
    }, [
      handleGenerateMission
    ]);

  const handleStartMission =
    useCallback(async () => {
      if (
        !generatedMission ||
        !missionPreview
          ?.readyToStart ||
        typeof onStartMission !==
          "function" ||
        starting
      ) {
        return;
      }

      try {
        setStarting(true);

        await onStartMission({
          mission:
            generatedMission,

          preview:
            missionPreview,

          formData,

          topic
        });
      } finally {
        setStarting(false);
      }
    }, [
      formData,
      generatedMission,
      missionPreview,
      onStartMission,
      starting,
      topic
    ]);

  /*
  |--------------------------------------------------------------------------
  | Step view
  |--------------------------------------------------------------------------
  */

  const renderCurrentStep =
    () => {
      switch (
        currentStepIndex
      ) {
        case 0:
          return (
            <div className="space-y-6">
              <PersonalizationExamples
                selectedExampleId={
                  selectedExampleId
                }
                disabled={
                  generating
                }
                onSelect={
                  handleSelectExample
                }
              />

              <SituationStep
                formData={
                  formData
                }
                fieldErrors={
                  fieldErrors
                }
                disabled={
                  generating
                }
                onChange={
                  handleFieldChange
                }
              />
            </div>
          );

        case 1:
          return (
            <div className="space-y-6">
              <GoalStep
                formData={
                  formData
                }
                fieldErrors={
                  fieldErrors
                }
                disabled={
                  generating
                }
                onChange={
                  handleFieldChange
                }
              />

              <PersonalizationObjectiveEditor
                objectives={
                  formData.objectives
                }
                disabled={
                  generating
                }
                errors={
                  fieldErrors
                }
                onChange={
                  handleObjectivesChange
                }
              />
            </div>
          );

        case 2:
          return (
            <NpcStep
              formData={
                formData
              }
              fieldErrors={
                fieldErrors
              }
              disabled={
                generating
              }
              onChange={
                handleFieldChange
              }
            />
          );

        case 3:
          return (
            <ParametersStep
              formData={
                formData
              }
              fieldErrors={
                fieldErrors
              }
              disabled={
                generating
              }
              onChange={
                handleFieldChange
              }
            />
          );

        case 4:
          return (
            <PersonalizedMissionPreview
              preview={
                missionPreview
              }
              mission={
                generatedMission
              }
              generating={
                generating
              }
              starting={
                starting
              }
              onEdit={
                handleEditRequest
              }
              onRegenerate={
                handleRegenerate
              }
              onStart={
                handleStartMission
              }
            />
          );

        default:
          return null;
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Generation state
  |--------------------------------------------------------------------------
  */

  if (generating) {
    return (
      <PersonalizationGenerationStatus
        visible
      />
    );
  }

  return (
    <section className="w-full">
      {currentStepIndex !==
        previewStepIndex && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <PersonalizationStepIndicator
            steps={steps}
            currentStepIndex={
              currentStepIndex
            }
            highestCompletedStepIndex={
              highestCompletedStepIndex
            }
            disabled={
              generating
            }
            onStepSelect={
              handleStepSelect
            }
          />

          <PersonalizationErrorSummary
            errors={
              validationErrors
            }
            warnings={
              validationWarnings
            }
          />

          {generationError && (
            <PersonalizationErrorSummary
              title="Nie udało się utworzyć misji"
              message={
                generationError
              }
              errors={[]}
              onRetry={
                generationRetryable
                  ? handleGenerateMission
                  : null
              }
              retrying={
                generating
              }
              onDismiss={() =>
                setGenerationError(
                  ""
                )
              }
            />
          )}

          {renderCurrentStep()}

          <PersonalizationNavigation
            currentStepIndex={
              currentStepIndex
            }
            totalSteps={
              steps.length
            }
            onBack={
              handleBack
            }
            onNext={
              handleNext
            }
            onGenerate={
              handleGenerateMission
            }
            generating={
              generating
            }
            backDisabled={
              currentStepIndex === 0
            }
            generateDisabled={
              validationErrors
                .length > 0
            }
          />

          {typeof onCancel ===
            "function" && (
            <button
              type="button"
              onClick={onCancel}
              disabled={
                generating
              }
              className="mt-4 w-full text-center text-sm font-medium text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anuluj tworzenie misji
            </button>
          )}
        </div>
      )}

      {currentStepIndex ===
        previewStepIndex && (
        <>
          {generationError && (
            <PersonalizationErrorSummary
              title="Nie udało się utworzyć misji"
              message={
                generationError
              }
              onRetry={
                generationRetryable
                  ? handleGenerateMission
                  : null
              }
              retrying={
                generating
              }
              onDismiss={() =>
                setGenerationError(
                  ""
                )
              }
            />
          )}

          {renderCurrentStep()}
        </>
      )}
    </section>
  );
};

export default PersonalizedMissionWizard;