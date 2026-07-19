// src/components/topics/admin/mission/missionFormConfig.js

export const MISSION_FIELD_LIMITS = {
  title: {
    min: 5,
    max: 100
  },

  aiRole: {
    min: 3,
    max: 100
  },

  description: {
    min: 20,
    max: 300
  },

  scenario: {
    min: 50,
    max: 2000
  },

  aiInstructions: {
    min: 30,
    max: 2000
  },

  objective: {
    min: 5,
    max: 200
  },

  objectives: {
    min: 1,
    max: 10
  },

  tags: {
    maxItems: 15,
    maxLength: 40
  },

  xpReward: {
    min: 1,
    max: 1000
  },

  estimatedMinutes: {
    min: 1,
    max: 120
  },

  order: {
    min: 1,
    max: 9999
  }
};

export const CEFR_LEVEL_OPTIONS = [
  {
    value: "A1",
    label: "A1"
  },
  {
    value: "A2",
    label: "A2"
  },
  {
    value: "B1",
    label: "B1"
  },
  {
    value: "B2",
    label: "B2"
  },
  {
    value: "C1",
    label: "C1"
  },
  {
    value: "C2",
    label: "C2"
  }
];

export const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Łatwa"
  },
  {
    value: "medium",
    label: "Średnia"
  },
  {
    value: "hard",
    label: "Trudna"
  },
  {
    value: "adaptive",
    label: "Adaptacyjna"
  }
];

export const AGE_GROUP_OPTIONS = [
  {
    value: "all",
    label: "Wszystkie grupy"
  },
  {
    value: "children",
    label: "Dzieci"
  },
  {
    value: "teen",
    label: "Nastolatki"
  },
  {
    value: "adult",
    label: "Dorośli"
  },
  {
    value: "senior",
    label: "Seniorzy"
  }
];

export const MISSION_STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Szkic"
  },
  {
    value: "published",
    label: "Opublikowana"
  },
  {
    value: "archived",
    label: "Zarchiwizowana"
  }
];

export const ALLOWED_CEFR_LEVELS = new Set(
  CEFR_LEVEL_OPTIONS.map(
    (option) => option.value
  )
);

export const ALLOWED_DIFFICULTIES = new Set(
  DIFFICULTY_OPTIONS.map(
    (option) => option.value
  )
);

export const ALLOWED_AGE_GROUPS = new Set(
  AGE_GROUP_OPTIONS.map(
    (option) => option.value
  )
);

export const ALLOWED_MISSION_STATUSES = new Set(
  MISSION_STATUS_OPTIONS.map(
    (option) => option.value
  )
);