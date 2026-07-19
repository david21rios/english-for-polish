// src/components/topics/admin/mission/missionFormValidation.js

import {
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

import {
  normalizeComparableText,
  normalizeMissionFormData
} from "./missionFormData";

const validateTextLength = ({
  value,
  label,
  minimum,
  maximum,
  required = true
}) => {
  const length =
    String(value || "").trim().length;

  if (required && length === 0) {
    return `${label} jest wymagany.`;
  }

  if (
    length > 0 &&
    length < minimum
  ) {
    return `${label} musi zawierać co najmniej ${minimum} znaków.`;
  }

  if (length > maximum) {
    return `${label} może zawierać maksymalnie ${maximum} znaków.`;
  }

  return "";
};

const validateIntegerRange = ({
  value,
  label,
  minimum,
  maximum
}) => {
  const numericValue =
    Number(value);

  if (!Number.isInteger(numericValue)) {
    return `${label} musi być liczbą całkowitą.`;
  }

  if (
    numericValue < minimum ||
    numericValue > maximum
  ) {
    return `${label} musi mieścić się w zakresie od ${minimum} do ${maximum}.`;
  }

  return "";
};

export const validateMissionForm = ({
  formData,
  missions = [],
  editingMissionId = null
}) => {
  const mission =
    normalizeMissionFormData(
      formData
    );

  const titleError =
    validateTextLength({
      value: mission.title,
      label: "Tytuł misji",
      minimum:
        MISSION_FIELD_LIMITS.title.min,
      maximum:
        MISSION_FIELD_LIMITS.title.max
    });

  if (titleError) {
    return titleError;
  }

  const aiRoleError =
    validateTextLength({
      value: mission.aiRole,
      label: "Rola AI",
      minimum:
        MISSION_FIELD_LIMITS.aiRole.min,
      maximum:
        MISSION_FIELD_LIMITS.aiRole.max
    });

  if (aiRoleError) {
    return aiRoleError;
  }

  const descriptionError =
    validateTextLength({
      value: mission.description,
      label: "Opis misji",
      minimum:
        MISSION_FIELD_LIMITS.description.min,
      maximum:
        MISSION_FIELD_LIMITS.description.max
    });

  if (descriptionError) {
    return descriptionError;
  }

  const scenarioError =
    validateTextLength({
      value: mission.scenario,
      label: "Scenariusz misji",
      minimum:
        MISSION_FIELD_LIMITS.scenario.min,
      maximum:
        MISSION_FIELD_LIMITS.scenario.max
    });

  if (scenarioError) {
    return scenarioError;
  }

  const instructionsRequired =
    mission.status === "published";

  const instructionsError =
    validateTextLength({
      value:
        mission.aiInstructions,
      label: "Instrukcje dla AI",
      minimum:
        MISSION_FIELD_LIMITS
          .aiInstructions.min,
      maximum:
        MISSION_FIELD_LIMITS
          .aiInstructions.max,
      required:
        instructionsRequired
    });

  if (instructionsError) {
    return instructionsError;
  }

  if (
    mission.objectives.length <
    MISSION_FIELD_LIMITS.objectives.min
  ) {
    return "Dodaj co najmniej jeden cel misji.";
  }

  if (
    mission.objectives.length >
    MISSION_FIELD_LIMITS.objectives.max
  ) {
    return `Misja może zawierać maksymalnie ${MISSION_FIELD_LIMITS.objectives.max} celów.`;
  }

  const duplicatedObjectiveTexts =
    new Set();

  for (
    let index = 0;
    index <
    mission.objectives.length;
    index += 1
  ) {
    const objective =
      mission.objectives[index];

    const objectiveError =
      validateTextLength({
        value: objective.text,
        label: `Cel ${index + 1}`,
        minimum:
          MISSION_FIELD_LIMITS.objective.min,
        maximum:
          MISSION_FIELD_LIMITS.objective.max
      });

    if (objectiveError) {
      return objectiveError;
    }

    const normalizedText =
      normalizeComparableText(
        objective.text
      );

    if (
      duplicatedObjectiveTexts.has(
        normalizedText
      )
    ) {
      return `Cel ${index + 1} jest duplikatem innego celu.`;
    }

    duplicatedObjectiveTexts.add(
      normalizedText
    );
  }

  if (
    mission.status === "published" &&
    !mission.objectives.some(
      (objective) =>
        objective.required === true
    )
  ) {
    return "Opublikowana misja musi zawierać co najmniej jeden wymagany cel.";
  }

  const xpError =
    validateIntegerRange({
      value: mission.xpReward,
      label: "Nagroda XP",
      minimum:
        MISSION_FIELD_LIMITS.xpReward.min,
      maximum:
        MISSION_FIELD_LIMITS.xpReward.max
    });

  if (xpError) {
    return xpError;
  }

  const minutesError =
    validateIntegerRange({
      value:
        mission.estimatedMinutes,
      label: "Szacowany czas",
      minimum:
        MISSION_FIELD_LIMITS
          .estimatedMinutes.min,
      maximum:
        MISSION_FIELD_LIMITS
          .estimatedMinutes.max
    });

  if (minutesError) {
    return minutesError;
  }

  const orderError =
    validateIntegerRange({
      value: mission.order,
      label: "Kolejność",
      minimum:
        MISSION_FIELD_LIMITS.order.min,
      maximum:
        MISSION_FIELD_LIMITS.order.max
    });

  if (orderError) {
    return orderError;
  }

  const duplicatedOrder =
    missions.find(
      (existingMission) =>
        existingMission.id !==
          editingMissionId &&
        Number(
          existingMission.order
        ) === mission.order
    );

  if (duplicatedOrder) {
    return `Kolejność ${mission.order} jest już używana przez misję „${duplicatedOrder.title || "bez tytułu"}”.`;
  }

  const normalizedTitle =
    normalizeComparableText(
      mission.title
    );

  const duplicatedTitle =
    missions.find(
      (existingMission) =>
        existingMission.id !==
          editingMissionId &&
        normalizeComparableText(
          existingMission.title
        ) === normalizedTitle
    );

  if (duplicatedTitle) {
    return `Misja o tytule „${duplicatedTitle.title || mission.title}” już istnieje w tym temacie.`;
  }

  return "";
};