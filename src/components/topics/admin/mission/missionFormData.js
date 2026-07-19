// src/components/topics/admin/mission/missionFormData.js

import {
  ALLOWED_AGE_GROUPS,
  ALLOWED_CEFR_LEVELS,
  ALLOWED_DIFFICULTIES,
  ALLOWED_MISSION_STATUSES,
  MISSION_FIELD_LIMITS
} from "./missionFormConfig";

const normalizeWhitespace = (
  value = ""
) => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
};

const normalizeMultilineText = (
  value = ""
) => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\r\n/g, "\n");
};

export const createObjectiveId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `objective_${crypto.randomUUID()}`;
  }

  return `objective_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const createEmptyObjective = () => {
  return {
    id: createObjectiveId(),
    text: "",
    required: true
  };
};

export const INITIAL_MISSION_FORM = {
  title: "",
  description: "",
  scenario: "",
  aiRole: "",
  aiInstructions: "",

  difficulty: "easy",
  level: "A1",
  ageGroup: "all",

  estimatedMinutes: 5,
  xpReward: 10,
  order: 1,

  status: "draft",
  missionType: "conversation",
  feedbackMode: "after_mission",
  correctionMode: "delayed",

  objectives: [
    createEmptyObjective()
  ],

  tags: ""
};

const normalizeObjective = (
  objective = {}
) => {
  return {
    id:
      String(objective.id || "").trim() ||
      createObjectiveId(),

    text:
      normalizeWhitespace(
        objective.text
      ),

    required:
      objective.required !== false
  };
};

const normalizeTagsArray = (
  tags
) => {
  const sourceTags = Array.isArray(tags)
    ? tags
    : String(tags || "").split(",");

  const uniqueTags = new Map();

  sourceTags.forEach((tag) => {
    const normalizedTag =
      normalizeWhitespace(tag)
        .toLocaleLowerCase("en-US")
        .slice(
          0,
          MISSION_FIELD_LIMITS.tags.maxLength
        );

    if (normalizedTag) {
      uniqueTags.set(
        normalizedTag,
        normalizedTag
      );
    }
  });

  return Array.from(
    uniqueTags.values()
  ).slice(
    0,
    MISSION_FIELD_LIMITS.tags.maxItems
  );
};

export const hydrateMissionForm = (
  initialData = null
) => {
  if (!initialData) {
    return {
      ...INITIAL_MISSION_FORM,
      objectives: [
        createEmptyObjective()
      ]
    };
  }

  const objectives =
    Array.isArray(initialData.objectives) &&
    initialData.objectives.length > 0
      ? initialData.objectives.map(
          normalizeObjective
        )
      : [
          createEmptyObjective()
        ];

  return {
    title:
      String(
        initialData.title || ""
      ),

    description:
      String(
        initialData.description || ""
      ),

    scenario:
      String(
        initialData.scenario || ""
      ),

    aiRole:
      String(
        initialData.aiRole || ""
      ),

    aiInstructions:
      String(
        initialData.aiInstructions || ""
      ),

    difficulty:
      ALLOWED_DIFFICULTIES.has(
        initialData.difficulty
      )
        ? initialData.difficulty
        : "easy",

    level:
      ALLOWED_CEFR_LEVELS.has(
        initialData.level
      )
        ? initialData.level
        : "A1",

    ageGroup:
      ALLOWED_AGE_GROUPS.has(
        initialData.ageGroup
      )
        ? initialData.ageGroup
        : "all",

    estimatedMinutes:
      Number(
        initialData.estimatedMinutes
      ) || 5,

    xpReward:
      Number(
        initialData.xpReward
      ) || 10,

    order:
      Number(
        initialData.order
      ) || 1,

    status:
      ALLOWED_MISSION_STATUSES.has(
        initialData.status
      )
        ? initialData.status
        : "draft",

    missionType:
      initialData.missionType ||
      "conversation",

    feedbackMode:
      initialData.feedbackMode ||
      "after_mission",

    correctionMode:
      initialData.correctionMode ||
      "delayed",

    objectives,

    tags:
      normalizeTagsArray(
        initialData.tags
      ).join(", ")
  };
};

export const normalizeMissionFormData = (
  formData = {}
) => {
  const objectives = Array.isArray(
    formData.objectives
  )
    ? formData.objectives
        .map(normalizeObjective)
        .filter(
          (objective) =>
            objective.text
        )
    : [];

  return {
    title:
      normalizeWhitespace(
        formData.title
      ),

    description:
      normalizeMultilineText(
        formData.description
      ),

    scenario:
      normalizeMultilineText(
        formData.scenario
      ),

    aiRole:
      normalizeWhitespace(
        formData.aiRole
      ),

    aiInstructions:
      normalizeMultilineText(
        formData.aiInstructions
      ),

    difficulty:
      ALLOWED_DIFFICULTIES.has(
        formData.difficulty
      )
        ? formData.difficulty
        : "easy",

    level:
      ALLOWED_CEFR_LEVELS.has(
        formData.level
      )
        ? formData.level
        : "A1",

    ageGroup:
      ALLOWED_AGE_GROUPS.has(
        formData.ageGroup
      )
        ? formData.ageGroup
        : "all",

    estimatedMinutes:
      Number(
        formData.estimatedMinutes
      ),

    xpReward:
      Number(
        formData.xpReward
      ),

    order:
      Number(
        formData.order
      ),

    status:
      ALLOWED_MISSION_STATUSES.has(
        formData.status
      )
        ? formData.status
        : "draft",

    missionType:
      "conversation",

    feedbackMode:
      "after_mission",

    correctionMode:
      "delayed",

    objectives,

    tags:
      normalizeTagsArray(
        formData.tags
      )
  };
};

export const normalizeComparableText = (
  value = ""
) => {
  return normalizeWhitespace(value)
    .toLocaleLowerCase("en-US");
};